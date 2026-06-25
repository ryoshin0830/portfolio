import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SchedulingConfig } from "@/types/scheduling";

// Google Calendar 層はモック（ネットワーク無しで純粋にロジックを検証する）。
vi.mock("@/lib/google-calendar", () => ({
  fetchBusy: vi.fn(),
  fetchCalendarEventContexts: vi.fn(),
  insertEvent: vi.fn(),
  isGoogleConfigured: vi.fn(() => true),
  getCalendarId: vi.fn(() => "primary"),
}));

import { fetchBusy, fetchCalendarEventContexts, insertEvent } from "@/lib/google-calendar";
import {
  isOfferableSlot,
  createBooking,
  computeOpenSlots,
  findSlotsInRange,
  DEFAULT_CONFIG,
} from "./scheduling";

const mockFetchBusy = vi.mocked(fetchBusy);
const mockFetchEventContexts = vi.mocked(fetchCalendarEventContexts);
const mockInsert = vi.mocked(insertEvent);

/**
 * 検証用設定。DEFAULT_CONFIG と同値（JST 固定 +09:00, startHour=9, endHour=24,
 * slotMinutes=60, leadMinutes=120, excludeWeekends=false, horizonDays=30）を採用し、
 * isOfferableSlot / createBooking のサーバー検証を実生成枠に対して厳密に表明する。
 */
function cfg(overrides: Partial<SchedulingConfig> = {}): SchedulingConfig {
  return {
    timezone: "Asia/Tokyo",
    utcOffset: "+09:00",
    startHour: 9,
    endHour: 24,
    slotMinutes: 60,
    leadMinutes: 120,
    travelPaddingBeforeMinutes: 60,
    travelPaddingAfterMinutes: 60,
    excludeWeekends: false,
    horizonDays: 30,
    ...overrides,
  };
}

// 固定 now（JST）。当日 09:00 → lead 120分後 = 11:00 以降が予約可能。
const NOW = new Date("2026-06-20T09:00:00+09:00");

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DEEPSEEK_API_KEY", "");
  mockFetchEventContexts.mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isOfferableSlot — 受理（実際に生成される枠は true）", () => {
  it("computeOpenSlots が当日生成する全枠は isOfferableSlot で true（60分）", () => {
    const generated = computeOpenSlots("2026-06-20", [], cfg(), NOW, { durationMinutes: 60 });
    expect(generated.length).toBeGreaterThan(0);
    for (const s of generated) {
      expect(isOfferableSlot(s.start, s.end, cfg(), NOW)).toBe(true);
    }
  });

  it("当日の lead 直後の枠（13:00–14:00 等）は true", () => {
    // now 09:00 + lead 120分 = 11:00。13:00 開始は余裕で受理。
    const generated = computeOpenSlots("2026-06-20", [], cfg(), NOW, { durationMinutes: 60 });
    const target = generated.find((s) => s.start === "2026-06-20T13:00:00+09:00");
    expect(target).toBeTruthy();
    expect(isOfferableSlot(target!.start, target!.end, cfg(), NOW)).toBe(true);
  });

  it("30分枠（durationMinutes=30）も生成枠ならすべて true", () => {
    const generated = computeOpenSlots("2026-06-21", [], cfg(), NOW, { durationMinutes: 30 });
    expect(generated.length).toBeGreaterThan(0);
    for (const s of generated) {
      expect(isOfferableSlot(s.start, s.end, cfg(), NOW)).toBe(true);
    }
  });

  it("horizon 内（数日後）の生成枠も true", () => {
    const generated = computeOpenSlots("2026-06-25", [], cfg(), NOW, { durationMinutes: 60 });
    expect(generated.length).toBeGreaterThan(0);
    expect(isOfferableSlot(generated[0].start, generated[0].end, cfg(), NOW)).toBe(true);
  });
});

describe("isOfferableSlot — 拒否（提示されない時刻は false）", () => {
  it("グリッド外開始（13:07）は false", () => {
    expect(
      isOfferableSlot("2026-06-20T13:07:00+09:00", "2026-06-20T14:07:00+09:00", cfg(), NOW),
    ).toBe(false);
  });

  it("営業時間外（03:00 開始, startHour=9 より前）は false", () => {
    expect(
      isOfferableSlot("2026-06-20T03:00:00+09:00", "2026-06-20T04:00:00+09:00", cfg(), NOW),
    ).toBe(false);
  });

  it("リードタイム内（now 直後 09:30 開始 < now+120分）は false", () => {
    expect(
      isOfferableSlot("2026-06-20T09:30:00+09:00", "2026-06-20T10:30:00+09:00", cfg(), NOW),
    ).toBe(false);
  });

  it("枠長 > 720分 は false", () => {
    // 13:00 開始だが 13時間（780分）は MAX_SLOT_MINUTES 超え
    expect(
      isOfferableSlot("2026-06-20T13:00:00+09:00", "2026-06-21T02:00:00+09:00", cfg(), NOW),
    ).toBe(false);
  });

  it("horizon 超（60日後, horizonDays=30）は false", () => {
    // NOW=6/20 → horizon は約 7/20。60日後 ~8/19 は範囲外。
    expect(
      isOfferableSlot("2026-08-19T13:00:00+09:00", "2026-08-19T14:00:00+09:00", cfg(), NOW),
    ).toBe(false);
  });

  it("過去日は false", () => {
    expect(
      isOfferableSlot("2026-06-10T13:00:00+09:00", "2026-06-10T14:00:00+09:00", cfg(), NOW),
    ).toBe(false);
  });

  it("不正な ISO / end<=start は false", () => {
    expect(isOfferableSlot("not-a-date", "2026-06-20T14:00:00+09:00", cfg(), NOW)).toBe(false);
    expect(
      isOfferableSlot("2026-06-20T13:00:00+09:00", "2026-06-20T13:00:00+09:00", cfg(), NOW),
    ).toBe(false);
  });
});

describe("createBooking — slot_not_offered（提示されない時刻は insert しない）", () => {
  // 注: createBooking はリードタイム検証(slot_in_past)を isOfferableSlot より先に行う。
  // 「営業時間外/グリッド外だが lead は通過している」ことを確実にするため、当日(6/20)では
  // なく将来日(6/22)を使う（6/22 の深夜/グリッド外は now+lead=6/20 11:00 より十分未来）。
  it("深夜枠（将来日 03:00–03:30, 営業時間外）→ slot_not_offered、insert 未呼び出し", async () => {
    // busy 無し（空きあり）でも、提示されない枠は isOfferableSlot で弾かれる。
    mockFetchBusy.mockResolvedValue([]);
    const res = await createBooking(
      { start: "2026-06-22T03:00:00+09:00", end: "2026-06-22T03:30:00+09:00", name: "山田太郎" },
      cfg(),
      NOW,
    );
    expect(res).toEqual({ ok: false, error: "slot_not_offered" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("グリッド外（将来日 13:07–13:37）→ slot_not_offered、insert 未呼び出し", async () => {
    mockFetchBusy.mockResolvedValue([]);
    const res = await createBooking(
      { start: "2026-06-22T13:07:00+09:00", end: "2026-06-22T13:37:00+09:00", name: "山田太郎" },
      cfg(),
      NOW,
    );
    expect(res).toEqual({ ok: false, error: "slot_not_offered" });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("createBooking — 入力検証（insert を呼ばない）", () => {
  const good = {
    start: "2026-06-20T13:00:00+09:00",
    end: "2026-06-20T13:30:00+09:00",
    name: "山田太郎",
  };

  it("name 欠落 → name_required、insert 未呼び出し", async () => {
    mockFetchBusy.mockResolvedValue([]);
    // name を欠落させる（route の zod を通らない経路を想定し as any）
    const res = await createBooking(
      { start: good.start, end: good.end } as never,
      cfg(),
      NOW,
    );
    expect(res).toEqual({ ok: false, error: "name_required" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("空白名 → name_required、insert 未呼び出し", async () => {
    mockFetchBusy.mockResolvedValue([]);
    const res = await createBooking({ ...good, name: "   " }, cfg(), NOW);
    expect(res).toEqual({ ok: false, error: "name_required" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("start が非文字列 → invalid_slot、insert 未呼び出し", async () => {
    mockFetchBusy.mockResolvedValue([]);
    const res = await createBooking(
      { start: 123 as never, end: good.end, name: "山田太郎" } as never,
      cfg(),
      NOW,
    );
    expect(res).toEqual({ ok: false, error: "invalid_slot" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("end が非文字列 → invalid_slot、insert 未呼び出し", async () => {
    mockFetchBusy.mockResolvedValue([]);
    const res = await createBooking(
      { start: good.start, end: null as never, name: "山田太郎" } as never,
      cfg(),
      NOW,
    );
    expect(res).toEqual({ ok: false, error: "invalid_slot" });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("createBooking — 正常系（検証強化が壊していないことの担保）", () => {
  it("提示枠 ＋ 空きあり → insertEvent を1回呼び ok:true", async () => {
    mockFetchBusy.mockResolvedValue([]); // busy 無し＝空きあり
    mockInsert.mockResolvedValue({ htmlLink: "https://cal/x", meetUrl: "https://meet/y" });

    // computeOpenSlots が実際に生成する枠を使う（提示されうる枠であることを保証）。
    const generated = computeOpenSlots("2026-06-20", [], cfg(), NOW, { durationMinutes: 60 });
    const offered = generated.find((s) => s.start === "2026-06-20T13:00:00+09:00")!;
    expect(offered).toBeTruthy();

    const res = await createBooking(
      { start: offered.start, end: offered.end, name: "山田太郎", note: "相談" },
      cfg(),
      NOW,
    );

    expect(res).toEqual({ ok: true, htmlLink: "https://cal/x", meetUrl: "https://meet/y" });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith({
      summary: "[ryosh.in] Meeting with 山田太郎",
      startIso: offered.start,
      endIso: offered.end,
      timeZone: "Asia/Tokyo",
      description: "相談\n---\nCreated via ryosh.in scheduling",
    });
  });

  it("findSlotsInRange が返す枠は createBooking で受理される（経路の整合）", async () => {
    mockFetchBusy.mockResolvedValue([]);
    mockInsert.mockResolvedValue({ htmlLink: "https://cal/z" });

    const range = await findSlotsInRange("2026-06-20", "2026-06-20", cfg(), NOW, {
      durationMinutes: 60,
    });
    const offered = range.slots[0];
    expect(offered).toBeTruthy();

    const res = await createBooking(
      { start: offered.start, end: offered.end, name: "佐藤" },
      cfg(),
      NOW,
    );
    expect(res.ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: `[ryosh.in] Meeting with 佐藤`,
        description: "Created via ryosh.in scheduling",
      }),
    );
  });
});

describe("DEFAULT_CONFIG の前提確認", () => {
  it("テストが前提とする既定値", () => {
    expect(DEFAULT_CONFIG.startHour).toBe(9);
    expect(DEFAULT_CONFIG.endHour).toBe(24);
    expect(DEFAULT_CONFIG.slotMinutes).toBe(60);
    expect(DEFAULT_CONFIG.leadMinutes).toBe(120);
    expect(DEFAULT_CONFIG.excludeWeekends).toBe(false);
    expect(DEFAULT_CONFIG.horizonDays).toBe(30);
  });
});
