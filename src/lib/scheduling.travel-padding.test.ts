import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CalendarEventContext, SchedulingConfig } from "@/types/scheduling";

/**
 * 移動パディング判定は「決定論的なルール」であることを固定するテスト。
 *
 * かつてはここで OpenRouter の LLM に予定を分類させていたが、実測で 1 回
 * 18.9〜20.6 秒かかり `/api/schedule/chat` が Vercel の 60 秒制限で無言に
 * 切れる主因になっていた。しかも判定結果は `needsTravel || heuristic` の
 * 上書きでほぼ捨てられており、LLM が実際に効いていたのは「物理的な場所と
 * オンライン会議リンクが併存する予定を移動あり扱いに格上げする」1 ケース
 * だけだった。それをルールとして書き下し、LLM をホットパスから外した。
 */

const { createSchedulingModelMock } = vi.hoisted(() => ({
  createSchedulingModelMock: vi.fn(() => ({ modelId: "test-model" })),
}));

vi.mock("@/lib/scheduling-model", () => ({
  createSchedulingModel: createSchedulingModelMock,
}));

vi.mock("@/lib/google-calendar", () => ({
  fetchBusy: vi.fn(),
  fetchCalendarEventContexts: vi.fn(),
  insertEvent: vi.fn(),
}));

import { fetchBusy, fetchCalendarEventContexts } from "@/lib/google-calendar";
import { findSlotsInRange, needsTravelPadding } from "./scheduling";

const mockFetchBusy = vi.mocked(fetchBusy);
const mockFetchEventContexts = vi.mocked(fetchCalendarEventContexts);

function cfg(overrides: Partial<SchedulingConfig> = {}): SchedulingConfig {
  return {
    timezone: "Asia/Tokyo",
    utcOffset: "+09:00",
    startHour: 10,
    endHour: 15,
    slotMinutes: 60,
    leadMinutes: 120,
    travelPaddingBeforeMinutes: 60,
    travelPaddingAfterMinutes: 60,
    excludeWeekends: false,
    horizonDays: 30,
    ...overrides,
  };
}

function event(overrides: Partial<CalendarEventContext> = {}): CalendarEventContext {
  return {
    id: "event-1",
    start: "2026-06-22T11:00:00+09:00",
    end: "2026-06-22T11:30:00+09:00",
    hasConference: false,
    ...overrides,
  };
}

describe("needsTravelPadding — 決定論的な移動要否ルール", () => {
  it("実在の場所が入っていれば移動あり", () => {
    expect(needsTravelPadding(event({ summary: "Client visit", location: "Tokyo office" }))).toBe(
      true,
    );
  });

  it("実在の場所とオンライン会議リンクが併存する場合も移動あり（安全側）", () => {
    expect(
      needsTravelPadding(
        event({
          summary: "Remote conference at an offsite venue",
          location: "Tokyo office",
          hasConference: true,
        }),
      ),
    ).toBe(true);
  });

  it("オンライン会議リンクだけで場所が無ければ移動なし", () => {
    expect(needsTravelPadding(event({ summary: "1on1", location: "", hasConference: true }))).toBe(
      false,
    );
  });

  it("場所が会議 URL だけ（sanitize 済みの [url]）なら移動なし", () => {
    expect(
      needsTravelPadding(event({ summary: "Sync", location: "[url]", hasConference: true })),
    ).toBe(false);
  });

  it("場所自体がオンラインを意味するなら移動なし", () => {
    expect(needsTravelPadding(event({ summary: "Sync", location: "Zoom" }))).toBe(false);
  });

  it("予定名にオンライン語彙があれば移動なし", () => {
    expect(needsTravelPadding(event({ summary: "オンライン面談", location: "" }))).toBe(false);
  });

  it("場所もオンライン語彙も無い予定は安全側で移動あり", () => {
    expect(needsTravelPadding(event({ summary: "作業", location: "" }))).toBe(true);
  });
});

describe("findSlotsInRange の移動パディング", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
    mockFetchBusy.mockResolvedValue([
      { start: "2026-06-22T11:00:00+09:00", end: "2026-06-22T11:30:00+09:00" },
    ]);
  });

  it("LLM を一切呼ばずに空き枠を返す", async () => {
    mockFetchEventContexts.mockResolvedValue([
      event({ summary: "Client visit", location: "Tokyo office" }),
    ]);

    await findSlotsInRange("2026-06-22", "2026-06-22", cfg(), new Date("2026-06-22T00:00:00+09:00"));

    expect(createSchedulingModelMock).not.toHaveBeenCalled();
  });

  it("移動ありの予定の前後をパディングで潰す", async () => {
    mockFetchEventContexts.mockResolvedValue([
      event({ summary: "Client visit", location: "Tokyo office" }),
    ]);

    const result = await findSlotsInRange(
      "2026-06-22",
      "2026-06-22",
      cfg(),
      new Date("2026-06-22T00:00:00+09:00"),
    );

    expect(result.slots.map((slot) => slot.label)).not.toContain("11:30");
    expect(result.slots.map((slot) => slot.label)).toContain("12:30");
  });

  it("場所とオンライン会議リンクが併存する予定にもパディングを付ける", async () => {
    mockFetchEventContexts.mockResolvedValue([
      event({
        summary: "Remote conference at an offsite venue",
        location: "Tokyo office",
        hasConference: true,
      }),
    ]);

    const result = await findSlotsInRange(
      "2026-06-22",
      "2026-06-22",
      cfg(),
      new Date("2026-06-22T00:00:00+09:00"),
    );

    expect(result.slots.map((slot) => slot.label)).not.toContain("11:30");
    expect(result.slots.map((slot) => slot.label)).toContain("12:30");
  });

  it("オンライン会議リンクだけの予定にはパディングを付けない", async () => {
    mockFetchEventContexts.mockResolvedValue([
      event({ summary: "1on1", location: "", hasConference: true }),
    ]);

    const result = await findSlotsInRange(
      "2026-06-22",
      "2026-06-22",
      cfg(),
      new Date("2026-06-22T00:00:00+09:00"),
    );

    expect(result.slots.map((slot) => slot.label)).toContain("11:30");
  });
});
