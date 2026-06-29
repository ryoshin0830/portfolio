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
  computeOpenSlots,
  isValidDateString,
  isOfferableSlot,
  findSlotsInRange,
  createBooking,
  ownerToday,
} from "./scheduling";

const mockFetchBusy = vi.mocked(fetchBusy);
const mockFetchEventContexts = vi.mocked(fetchCalendarEventContexts);
const mockInsert = vi.mocked(insertEvent);

/** ベース設定（テストごとに必要なら上書き）。JST 固定 +09:00。 */
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

const labels = (slots: { label: string }[]) => slots.map((s) => s.label);
// 十分過去の now（リードタイムに引っかからないように）
const FAR_PAST = new Date("2026-06-01T00:00:00+09:00");

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DEEPSEEK_API_KEY", "");
  mockFetchEventContexts.mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isValidDateString", () => {
  it.each([
    ["2026-06-25", true],
    ["2026-02-28", true],
    ["2026-02-29", false], // 2026 は非閏年
    ["2026-02-30", false],
    ["2026-13-01", false],
    ["2026-00-10", false],
    ["2026-06-31", false],
    ["2026/06/25", false],
    ["26-6-5", false],
    ["2026-6-5", false],
    ["", false],
    ["abcd-ef-gh", false],
  ])("%s → %s", (input, expected) => {
    expect(isValidDateString(input)).toBe(expected);
  });
});

describe("computeOpenSlots — 基本", () => {
  it("予定無しなら営業時間ぶんの60分枠を30分刻みで全部返す（10-12時）", () => {
    const slots = computeOpenSlots("2026-06-25", [], cfg({ startHour: 10, endHour: 12 }), FAR_PAST);
    expect(labels(slots)).toEqual(["10:00", "10:30", "11:00"]);
    expect(slots[0].start).toBe("2026-06-25T10:00:00+09:00");
    expect(slots[0].end).toBe("2026-06-25T11:00:00+09:00");
  });

  it("busy と重なる枠だけ除外（半開区間: 端の一致は重ならない）", () => {
    const busy = [{ start: "2026-06-25T10:30:00+09:00", end: "2026-06-25T11:00:00+09:00" }];
    const slots = computeOpenSlots("2026-06-25", busy, cfg({ startHour: 10, endHour: 12 }), FAR_PAST);
    // 10:00-11:00 は重なり、11:00-12:00 は端一致で残る
    expect(labels(slots)).toEqual(["11:00"]);
  });

  it("枠をまたぐ busy は重なる全枠を除外", () => {
    const busy = [{ start: "2026-06-25T10:15:00+09:00", end: "2026-06-25T11:15:00+09:00" }];
    const slots = computeOpenSlots("2026-06-25", busy, cfg({ startHour: 10, endHour: 12 }), FAR_PAST);
    expect(labels(slots)).toEqual([]);
  });

  it("リードタイム内（now+lead 未満）の枠を除外", () => {
    // now=当日 10:00、lead 120分 → 12:00 以降のみ。10-12時窓なので空。
    const now = new Date("2026-06-25T10:00:00+09:00");
    const slots = computeOpenSlots("2026-06-25", [], cfg({ startHour: 10, endHour: 12 }), now);
    expect(slots).toEqual([]);
  });
});

describe("computeOpenSlots — 週末", () => {
  it("excludeWeekends=true なら土日は空", () => {
    expect(computeOpenSlots("2026-06-27", [], cfg({ excludeWeekends: true }), FAR_PAST)).toEqual([]); // 土
    expect(computeOpenSlots("2026-06-28", [], cfg({ excludeWeekends: true }), FAR_PAST)).toEqual([]); // 日
  });

  it("excludeWeekends=false なら土曜も枠を返す", () => {
    const slots = computeOpenSlots("2026-06-27", [], cfg({ startHour: 10, endHour: 11 }), FAR_PAST);
    expect(labels(slots)).toEqual(["10:00"]);
  });
});

describe("computeOpenSlots — 可変長(duration)", () => {
  it("既定では 60分枠を30分刻みで返す", () => {
    const slots = computeOpenSlots("2026-06-25", [], cfg({ startHour: 10, endHour: 12 }), FAR_PAST);
    // 10:00-11:00, 10:30-11:30, 11:00-12:00
    expect(labels(slots)).toEqual(["10:00", "10:30", "11:00"]);
    expect(slots[0].end).toBe("2026-06-25T11:00:00+09:00");
    slots.forEach((s) => expect(Date.parse(s.end) - Date.parse(s.start)).toBe(60 * 60_000));
  });

  it("duration は MAX(720分) にクランプされる", () => {
    const slots = computeOpenSlots("2026-06-25", [], cfg(), FAR_PAST, { durationMinutes: 9999 });
    expect(slots.length).toBeGreaterThan(0);
    slots.forEach((s) => expect(Date.parse(s.end) - Date.parse(s.start)).toBeLessThanOrEqual(720 * 60_000));
  });
});

describe("computeOpenSlots — 時間帯(partOfDay)", () => {
  const base = cfg({ startHour: 9, endHour: 24 });
  it("morning は <12:00 の開始だけ", () => {
    const slots = computeOpenSlots("2026-06-25", [], base, FAR_PAST, { partOfDay: "morning" });
    expect(slots.every((s) => Number(s.label.slice(0, 2)) < 12)).toBe(true);
    expect(labels(slots)[0]).toBe("09:00");
    expect(labels(slots).at(-1)).toBe("11:30");
  });
  it("afternoon は 12:00〜16:59 開始", () => {
    const slots = computeOpenSlots("2026-06-25", [], base, FAR_PAST, { partOfDay: "afternoon" });
    expect(labels(slots)[0]).toBe("12:00");
    expect(labels(slots).at(-1)).toBe("16:30");
  });
  it("evening は 17:00 以降", () => {
    const slots = computeOpenSlots("2026-06-25", [], base, FAR_PAST, { partOfDay: "evening" });
    expect(labels(slots)[0]).toBe("17:00");
    expect(slots.every((s) => Number(s.label.slice(0, 2)) >= 17)).toBe(true);
  });
});

describe("computeOpenSlots — 深夜0時跨ぎ（endHour=24）", () => {
  it("最終枠は 23:00 開始で終了は翌日 00:00（月跨ぎも正しい）", () => {
    const slots = computeOpenSlots("2026-06-30", [], cfg({ startHour: 23, endHour: 24 }), FAR_PAST);
    expect(labels(slots)).toEqual(["23:00"]);
    const lastSlot = slots.at(-1)!;
    expect(lastSlot.start).toBe("2026-06-30T23:00:00+09:00");
    // 6/30 の翌日は 7/1（月跨ぎ）
    expect(lastSlot.end).toBe("2026-07-01T00:00:00+09:00");
  });
});

describe("findSlotsInRange", () => {
  it("範囲内を1回の freebusy 取得で集計し、複数日から集める", async () => {
    mockFetchBusy.mockResolvedValue([]);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange(
      "2026-06-22",
      "2026-06-23",
      cfg({ startHour: 10, endHour: 11 }),
      now,
    );
    expect(mockFetchBusy).toHaveBeenCalledTimes(1);
    // 月・火の 10:00 が並ぶ（日付は start に出る）
    expect(res.slots.map((s) => s.start)).toEqual([
      "2026-06-22T10:00:00+09:00",
      "2026-06-23T10:00:00+09:00",
    ]);
  });

  it("空き枠は代表サンプルではなく全件返す", async () => {
    mockFetchBusy.mockResolvedValue([]);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange(
      "2026-06-22",
      "2026-06-23",
      cfg({ startHour: 10, endHour: 12 }),
      now,
    );
    expect(labels(res.slots)).toEqual([
      "10:00",
      "10:30",
      "11:00",
      "10:00",
      "10:30",
      "11:00",
    ]);
  });

  it("LLM の判断材料として busy 時間帯も返す（タイトル等は含まない）", async () => {
    const busy = [{ start: "2026-06-22T10:30:00+09:00", end: "2026-06-22T11:00:00+09:00" }];
    mockFetchBusy.mockResolvedValue(busy);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange(
      "2026-06-22",
      "2026-06-22",
      cfg({ startHour: 10, endHour: 12 }),
      now,
    );
    expect(res.busy).toEqual(busy);
    expect(labels(res.slots)).toEqual(["11:00"]);
  });

  it("移動が必要そうな予定は前後のパディング時間も除外する", async () => {
    mockFetchBusy.mockResolvedValue([
      { start: "2026-06-22T10:30:00+09:00", end: "2026-06-22T11:00:00+09:00" },
    ]);
    mockFetchEventContexts.mockResolvedValue([
      {
        id: "physical-1",
        start: "2026-06-22T10:30:00+09:00",
        end: "2026-06-22T11:00:00+09:00",
        summary: "外出",
        location: "Tokyo Station",
        hasConference: false,
      },
    ]);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange(
      "2026-06-22",
      "2026-06-22",
      cfg({ startHour: 9, endHour: 12 }),
      now,
    );
    expect(labels(res.slots)).toEqual([]);
    expect(res.busy).toEqual([
      { start: "2026-06-22T09:30:00+09:00", end: "2026-06-22T12:00:00+09:00" },
    ]);
  });

  it("オンライン予定は移動パディングを追加しない", async () => {
    const busy = [{ start: "2026-06-22T10:30:00+09:00", end: "2026-06-22T11:00:00+09:00" }];
    mockFetchBusy.mockResolvedValue(busy);
    mockFetchEventContexts.mockResolvedValue([
      {
        id: "online-1",
        start: "2026-06-22T10:30:00+09:00",
        end: "2026-06-22T11:00:00+09:00",
        summary: "Zoom call",
        location: "Google Meet",
        hasConference: true,
      },
    ]);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange(
      "2026-06-22",
      "2026-06-22",
      cfg({ startHour: 9, endHour: 12 }),
      now,
    );
    expect(res.busy).toEqual(busy);
    expect(labels(res.slots)).toEqual(["09:00", "09:30", "11:00"]);
  });

  it("範囲を [今日, 今日+horizon] にクランプ（過去開始は今日に）", async () => {
    mockFetchBusy.mockResolvedValue([]);
    const now = new Date("2026-06-22T08:00:00+09:00");
    await findSlotsInRange("2026-01-01", "2026-06-22", cfg(), now);
    // fetchBusy の timeMin は今日(6/22)から移動パディング分だけ広げるが、過去リクエスト範囲ではない
    const [timeMin] = mockFetchBusy.mock.calls[0];
    expect(timeMin).toBe("2026-06-21T23:00:00+09:00");
  });

  it("end < start（不正な範囲）は空＋ fetch しない", async () => {
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange("2026-06-25", "2026-06-23", cfg(), now);
    expect(res.slots).toEqual([]);
    expect(mockFetchBusy).not.toHaveBeenCalled();
  });

  it("opts(duration/partOfDay) が計算に反映される", async () => {
    mockFetchBusy.mockResolvedValue([]);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange("2026-06-22", "2026-06-22", cfg(), now, {
      durationMinutes: 60,
      partOfDay: "evening",
    });
    expect(res.slots.length).toBeGreaterThan(0);
    res.slots.forEach((s) => {
      expect(Date.parse(s.end) - Date.parse(s.start)).toBe(60 * 60_000);
      expect(Number(s.label.slice(0, 2))).toBeGreaterThanOrEqual(17);
    });
  });

  it("【回帰】初日で打ち切られず、範囲内の全日が代表される（週末バグ）", async () => {
    // 旧実装は土曜の先頭から limit 件で埋まり日曜が消えていた。
    mockFetchBusy.mockResolvedValue([]);
    const now = new Date("2026-06-19T00:00:00+09:00"); // 金
    const res = await findSlotsInRange("2026-06-20", "2026-06-21", cfg(), now, {
      durationMinutes: 60,
    });
    const days = new Set(res.slots.map((s) => s.start.slice(0, 10)));
    expect(days.has("2026-06-20")).toBe(true); // 土
    expect(days.has("2026-06-21")).toBe(true); // 日
  });

  it("【回帰】1日内も朝だけに偏らず、夜の枠まで代表される", async () => {
    mockFetchBusy.mockResolvedValue([]);
    const now = new Date("2026-06-19T00:00:00+09:00");
    const res = await findSlotsInRange("2026-06-22", "2026-06-22", cfg(), now, {});
    const hours = res.slots.map((s) => Number(s.label.slice(0, 2)));
    expect(Math.min(...hours)).toBe(9); // 朝
    expect(Math.max(...hours)).toBeGreaterThanOrEqual(17); // 夜も含む（先頭偏りでない）
  });
});

describe("createBooking — 入力検証（insert を呼ばない）", () => {
  const now = new Date("2026-06-22T09:00:00+09:00");
  const good = {
    start: "2026-06-22T13:00:00+09:00",
    end: "2026-06-22T13:30:00+09:00",
    name: "山田太郎",
  };

  it.each([
    ["ハニーポット", { ...good, company: "bot" }, "spam_detected"],
    ["名前なし", { ...good, name: "  " }, "name_required"],
    ["end<=start", { ...good, end: good.start }, "invalid_slot"],
    ["長すぎ(>720分)", { ...good, end: "2026-06-23T02:00:00+09:00" }, "invalid_slot"],
    ["リード内", { start: "2026-06-22T10:00:00+09:00", end: "2026-06-22T10:30:00+09:00", name: "A" }, "slot_in_past"],
  ])("%s → %s", async (_label, req, expected) => {
    const res = await createBooking(req, cfg(), now);
    expect(res.ok).toBe(false);
    expect(res.error).toBe(expected);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("createBooking — 競合・作成・失敗", () => {
  const now = new Date("2026-06-22T09:00:00+09:00");
  const good = {
    start: "2026-06-22T13:00:00+09:00",
    end: "2026-06-22T13:30:00+09:00",
    name: "山田太郎",
    note: "相談",
  };

  it("確定直前の再チェックで競合 → slot_taken（insert しない）", async () => {
    mockFetchBusy.mockResolvedValue([{ start: "2026-06-22T13:00:00+09:00", end: "2026-06-22T13:30:00+09:00" }]);
    const res = await createBooking(good, cfg(), now);
    expect(res).toEqual({ ok: false, error: "slot_taken" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("確定直前の再チェックで移動パディングに重なる枠も slot_taken", async () => {
    mockFetchBusy.mockResolvedValue([
      { start: "2026-06-22T13:30:00+09:00", end: "2026-06-22T14:00:00+09:00" },
    ]);
    mockFetchEventContexts.mockResolvedValue([
      {
        id: "physical-1",
        start: "2026-06-22T13:30:00+09:00",
        end: "2026-06-22T14:00:00+09:00",
        summary: "訪問",
        location: "Shibuya",
        hasConference: false,
      },
    ]);
    const res = await createBooking(
      {
        ...good,
        start: "2026-06-22T13:00:00+09:00",
        end: "2026-06-22T13:30:00+09:00",
      },
      cfg(),
      now,
    );
    expect(res).toEqual({ ok: false, error: "slot_taken" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("空きなら insertEvent を正しい引数で1回呼び、結果を返す", async () => {
    mockFetchBusy.mockResolvedValue([]);
    mockInsert.mockResolvedValue({ htmlLink: "https://cal/x", meetUrl: "https://meet/y" });
    const res = await createBooking(good, cfg(), now);
    expect(res).toEqual({ ok: true, htmlLink: "https://cal/x", meetUrl: "https://meet/y" });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith({
      summary: "[ryosh.in] Meeting with 山田太郎",
      startIso: good.start,
      endIso: good.end,
      timeZone: "Asia/Tokyo",
      description: "相談\n---\nCreated via ryosh.in scheduling",
    });
  });

  it("insertEvent が例外 → creation_failed", async () => {
    mockFetchBusy.mockResolvedValue([]);
    mockInsert.mockRejectedValue(new Error("api down"));
    const res = await createBooking(good, cfg(), now);
    expect(res).toEqual({ ok: false, error: "creation_failed" });
  });
});

describe("ownerToday", () => {
  it("UTC 深夜でも JST の日付・曜日を返す（日付境界）", () => {
    // 2026-06-21T16:00:00Z = 2026-06-22T01:00 JST(月)
    const { date, weekday } = ownerToday(cfg(), new Date("2026-06-21T16:00:00Z"));
    expect(date).toBe("2026-06-22");
    expect(weekday).toBe("Monday");
  });

  it("月境界を正しく跨ぐ（1/31 23:30 UTC → JST 2/1）", () => {
    const { date, weekday } = ownerToday(cfg(), new Date("2026-01-31T23:30:00Z"));
    // 2026-01-31T23:30Z = 2026-02-01T08:30 JST(日)
    expect(date).toBe("2026-02-01");
    expect(weekday).toBe("Sunday");
  });
});

describe("computeOpenSlots — 最小duration(5分)", () => {
  it("slotMinutes=5 なら5分枠を30分刻みで返す", () => {
    const slots = computeOpenSlots("2026-06-25", [], cfg({ slotMinutes: 5, startHour: 10, endHour: 11 }), FAR_PAST);
    expect(labels(slots)).toEqual(["10:00", "10:30"]);
    // 各枠は5分間
    slots.forEach((s) => expect(Date.parse(s.end) - Date.parse(s.start)).toBe(5 * 60_000));
  });
});

describe("computeOpenSlots — MAX_SLOT_MINUTES(720分)", () => {
  it("slotMinutes=720(12時間) で 0-24 時なら枠を返す", () => {
    const slots = computeOpenSlots("2026-06-25", [], cfg({ slotMinutes: 720, startHour: 0, endHour: 24 }), FAR_PAST);
    expect(slots.length).toBeGreaterThan(0);
    slots.forEach((s) => expect(Date.parse(s.end) - Date.parse(s.start)).toBe(720 * 60_000));
  });
});

describe("computeOpenSlots — startHour=0", () => {
  it("startHour=0 なら 00:00 始まりの枠を返す", () => {
    const slots = computeOpenSlots("2026-06-25", [], cfg({ startHour: 0, endHour: 3, slotMinutes: 60 }), FAR_PAST);
    expect(labels(slots)).toEqual(["00:00", "00:30", "01:00", "01:30", "02:00"]);
    expect(slots[0].start).toBe("2026-06-25T00:00:00+09:00");
  });
});

describe("findSlotsInRange — horizonDays=1", () => {
  it("horizonDays=1 なら今日は含むが明後日は含まない", async () => {
    mockFetchBusy.mockResolvedValue([]);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const config = cfg({ horizonDays: 1, startHour: 10, endHour: 11 });

    // 今日 (6/22) を含むリクエスト → 枠あり
    const res1 = await findSlotsInRange("2026-06-22", "2026-06-22", config, now);
    expect(res1.slots.length).toBeGreaterThan(0);

    // 明後日 (6/24) だけリクエスト → horizon(6/23) を超えるので枠なし
    const res2 = await findSlotsInRange("2026-06-24", "2026-06-24", config, now);
    expect(res2.slots).toEqual([]);
  });
});

describe("isOfferableSlot — excludeWeekends=true", () => {
  it("土曜の枠は false を返す", () => {
    const now = new Date("2026-06-22T00:00:00+09:00");
    // 2026-06-27 は土曜
    const result = isOfferableSlot(
      "2026-06-27T10:00:00+09:00",
      "2026-06-27T11:00:00+09:00",
      cfg({ excludeWeekends: true }),
      now,
    );
    expect(result).toBe(false);
  });
});

describe("createBooking — excludeWeekends=true", () => {
  it("土曜の枠は slot_not_offered を返す", async () => {
    const now = new Date("2026-06-22T09:00:00+09:00");
    // 2026-06-27 は土曜
    const res = await createBooking(
      {
        start: "2026-06-27T13:00:00+09:00",
        end: "2026-06-27T14:00:00+09:00",
        name: "Test User",
      },
      cfg({ excludeWeekends: true }),
      now,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toBe("slot_not_offered");
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("heuristicNeedsTravel — 日本語/中国語オンラインキーワード（間接テスト）", () => {
  // heuristicNeedsTravel は export されていないため、findSlotsInRange 経由で検証する。
  // DEEPSEEK_API_KEY='' (beforeEach で設定済み) なので fallback ヒューリスティックが使われる。
  // オンラインキーワードを含む予定は移動パディングが付かない＝前後の枠が空く。
  // 物理的な予定は移動パディングが付く＝前後の枠が埋まる。

  it("'オンライン' を含む予定は移動パディングなし", async () => {
    mockFetchBusy.mockResolvedValue([
      { start: "2026-06-22T11:00:00+09:00", end: "2026-06-22T11:30:00+09:00" },
    ]);
    mockFetchEventContexts.mockResolvedValue([
      {
        id: "online-ja",
        start: "2026-06-22T11:00:00+09:00",
        end: "2026-06-22T11:30:00+09:00",
        summary: "オンライン面談",
        location: "",
        hasConference: false,
      },
    ]);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange("2026-06-22", "2026-06-22", cfg({ startHour: 10, endHour: 13 }), now);
    // パディングなし → 10:00 と 11:30 以降の枠が残る
    expect(labels(res.slots)).toContain("10:00");
    expect(labels(res.slots)).toContain("11:30");
  });

  it("'在宅' を含む予定は移動パディングなし", async () => {
    mockFetchBusy.mockResolvedValue([
      { start: "2026-06-22T11:00:00+09:00", end: "2026-06-22T11:30:00+09:00" },
    ]);
    mockFetchEventContexts.mockResolvedValue([
      {
        id: "remote-ja",
        start: "2026-06-22T11:00:00+09:00",
        end: "2026-06-22T11:30:00+09:00",
        summary: "在宅勤務",
        location: "",
        hasConference: false,
      },
    ]);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange("2026-06-22", "2026-06-22", cfg({ startHour: 10, endHour: 13 }), now);
    expect(labels(res.slots)).toContain("10:00");
    expect(labels(res.slots)).toContain("11:30");
  });

  it("'线上' を含む予定は移動パディングなし", async () => {
    mockFetchBusy.mockResolvedValue([
      { start: "2026-06-22T11:00:00+09:00", end: "2026-06-22T11:30:00+09:00" },
    ]);
    mockFetchEventContexts.mockResolvedValue([
      {
        id: "online-zh",
        start: "2026-06-22T11:00:00+09:00",
        end: "2026-06-22T11:30:00+09:00",
        summary: "线上会议",
        location: "",
        hasConference: false,
      },
    ]);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange("2026-06-22", "2026-06-22", cfg({ startHour: 10, endHour: 13 }), now);
    expect(labels(res.slots)).toContain("10:00");
    expect(labels(res.slots)).toContain("11:30");
  });

  it("'歯医者' は移動パディングあり（前後の枠が潰れる）", async () => {
    mockFetchBusy.mockResolvedValue([
      { start: "2026-06-22T11:00:00+09:00", end: "2026-06-22T11:30:00+09:00" },
    ]);
    mockFetchEventContexts.mockResolvedValue([
      {
        id: "dentist",
        start: "2026-06-22T11:00:00+09:00",
        end: "2026-06-22T11:30:00+09:00",
        summary: "歯医者",
        location: "渋谷デンタルクリニック",
        hasConference: false,
      },
    ]);
    const now = new Date("2026-06-22T00:00:00+09:00");
    const res = await findSlotsInRange("2026-06-22", "2026-06-22", cfg({ startHour: 9, endHour: 14 }), now);
    // 60分パディング前 (10:00-11:00) + 本体 (11:00-11:30) + 60分パディング後 (11:30-12:30)
    // → busy は 10:00-12:30。9:00-10:00 の枠と 12:30 以降の枠のみ。
    expect(labels(res.slots)).toContain("09:00");
    expect(labels(res.slots)).not.toContain("10:00");
    expect(labels(res.slots)).not.toContain("10:30");
    expect(labels(res.slots)).not.toContain("11:00");
    expect(labels(res.slots)).not.toContain("11:30");
    expect(labels(res.slots)).not.toContain("12:00");
    expect(labels(res.slots)).toContain("12:30");
  });
});

describe("【回帰】findSlotsInRange と createBooking の移動パディング整合性", () => {
  it("22:00 に移動ありの予定 → 20:30-21:30 は提示されない", async () => {
    mockFetchBusy.mockResolvedValue([
      { start: "2026-06-30T22:00:00+09:00", end: "2026-06-30T23:00:00+09:00" },
    ]);
    mockFetchEventContexts.mockResolvedValue([
      {
        id: "dinner-1",
        start: "2026-06-30T22:00:00+09:00",
        end: "2026-06-30T23:00:00+09:00",
        summary: "ディナー",
        location: "渋谷",
        hasConference: false,
      },
    ]);
    const now = new Date("2026-06-30T00:00:00+09:00");
    const res = await findSlotsInRange("2026-06-30", "2026-06-30", cfg(), now);
    // 60分パディング前 (21:00-22:00) + 本体 (22:00-23:00) + 60分パディング後 (23:00-24:00)
    // → busy は 21:00-24:00。20:30-21:30 は busy[21:00, 24:00] と重なるため提示されない。
    expect(labels(res.slots)).not.toContain("20:30");
    // 20:00-21:00 も busy の 21:00 と端で接するだけなので半開区間では残る
    expect(labels(res.slots)).toContain("20:00");
  });

  it("findSlotsInRange が提示した枠は createBooking で slot_taken にならない", async () => {
    const busyIntervals = [
      { start: "2026-06-30T22:00:00+09:00", end: "2026-06-30T23:00:00+09:00" },
    ];
    const eventContexts = [
      {
        id: "dinner-1",
        start: "2026-06-30T22:00:00+09:00",
        end: "2026-06-30T23:00:00+09:00",
        summary: "ディナー",
        location: "渋谷",
        hasConference: false,
      },
    ];
    mockFetchBusy.mockResolvedValue(busyIntervals);
    mockFetchEventContexts.mockResolvedValue(eventContexts);
    mockInsert.mockResolvedValue({ htmlLink: "https://cal/ok" });

    const now = new Date("2026-06-30T00:00:00+09:00");
    const res = await findSlotsInRange("2026-06-30", "2026-06-30", cfg(), now);
    expect(res.slots.length).toBeGreaterThan(0);

    // findSlotsInRange が提示した全枠で createBooking が slot_taken を返さないことを確認
    for (const slot of res.slots) {
      // 各 book 呼び出しで同じモックを再設定
      mockFetchBusy.mockResolvedValue(busyIntervals);
      mockFetchEventContexts.mockResolvedValue(eventContexts);
      const booking = await createBooking(
        { start: slot.start, end: slot.end, name: "テスト" },
        cfg(),
        now,
      );
      expect(booking.error).not.toBe("slot_taken");
    }
  });

  it("createBooking のクエリ範囲が日単位（findSlotsInRange と同一）", async () => {
    mockFetchBusy.mockResolvedValue([]);
    mockFetchEventContexts.mockResolvedValue([]);
    mockInsert.mockResolvedValue({ htmlLink: "https://cal/ok" });

    const now = new Date("2026-06-30T00:00:00+09:00");
    await createBooking(
      { start: "2026-06-30T13:00:00+09:00", end: "2026-06-30T14:00:00+09:00", name: "テスト" },
      cfg(),
      now,
    );

    // fetchBusy の呼び出し引数を検証: 日単位の範囲であること
    const [timeMin, timeMax] = mockFetchBusy.mock.calls[0];
    // 日の開始 - afterPadding(60min) = 前日23:00
    expect(timeMin).toBe("2026-06-29T23:00:00+09:00");
    // 日の終了 + beforePadding(60min) = 翌日01:00
    expect(timeMax).toBe("2026-07-01T01:00:00+09:00");
  });
});
