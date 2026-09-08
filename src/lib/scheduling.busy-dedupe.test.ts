import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SchedulingConfig } from "@/types/scheduling";

/**
 * エージェントは 1 メッセージで find-slots を複数本（枠長 30 分用と 60 分用など）
 * 同時に呼ぶ。移動パディング判定は枠長に依存しないので、同じ範囲の
 * カレンダー取得を並列で二重に走らせるのは純粋な無駄だった。
 *
 * ただしキャッシュはしない（in-flight の共有だけ）。`createBooking` は確定直前に
 * 空き状況を取り直して二重予約を防いでいるため、完了済みの結果を再利用すると
 * その再検証が意味を失う。
 */

vi.mock("@/lib/google-calendar", () => ({
  fetchBusy: vi.fn(),
  fetchCalendarEventContexts: vi.fn(),
  insertEvent: vi.fn(),
}));

import { fetchBusy, fetchCalendarEventContexts } from "@/lib/google-calendar";
import { findSlotsInRange } from "./scheduling";

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

const NOW = new Date("2026-06-22T00:00:00+09:00");

describe("同一範囲の busy 取得の重複排除", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 即時解決だと並列性が生まれないので、マイクロタスクを跨いで解決させる。
    mockFetchBusy.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 5)),
    );
    mockFetchEventContexts.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 5)),
    );
  });

  it("同時に同じ範囲を要求したら Google 取得は 1 回にまとめる", async () => {
    await Promise.all([
      findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW, { durationMinutes: 30 }),
      findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW, { durationMinutes: 60 }),
    ]);

    expect(mockFetchBusy).toHaveBeenCalledTimes(1);
    expect(mockFetchEventContexts).toHaveBeenCalledTimes(1);
  });

  it("枠長が違っても同時要求ならそれぞれ正しい枠長の結果を受け取る", async () => {
    const [thirty, sixty] = await Promise.all([
      findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW, { durationMinutes: 30 }),
      findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW, { durationMinutes: 60 }),
    ]);

    // 10:00-15:00 / 30分刻み。30分枠は 10 本、60分枠は 9 本。
    expect(thirty.slots).toHaveLength(10);
    expect(sixty.slots).toHaveLength(9);
  });

  it("まとめた取得でも呼び出し元ごとに独立した busy 配列を返す", async () => {
    // in-flight を共有すると、同じ配列インスタンスが両方の呼び出し元へ渡る。
    // `busy` は FindSlotsResult としてモジュール外に出るので、片方が破壊的に
    // 触るともう片方のリクエストが壊れる。防御的にコピーして切り離す。
    mockFetchBusy.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve([{ start: "2026-06-22T11:00:00+09:00", end: "2026-06-22T11:30:00+09:00" }]),
            5,
          ),
        ),
    );

    const [first, second] = await Promise.all([
      findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW, { durationMinutes: 30 }),
      findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW, { durationMinutes: 60 }),
    ]);

    expect(first.busy).not.toBe(second.busy);
    first.busy.length = 0;
    expect(second.busy).toHaveLength(1);
  });

  it("範囲が違えばまとめない", async () => {
    await Promise.all([
      findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW),
      findSlotsInRange("2026-06-23", "2026-06-23", cfg(), NOW),
    ]);

    expect(mockFetchBusy).toHaveBeenCalledTimes(2);
  });

  it("同時でない連続要求では取り直す（予約直前の再検証を古い結果で通さない）", async () => {
    await findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW);
    await findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW);

    expect(mockFetchBusy).toHaveBeenCalledTimes(2);
  });

  it("取得が失敗しても次の要求は新しく取り直す", async () => {
    mockFetchBusy.mockRejectedValueOnce(new Error("calendar unavailable"));

    await expect(
      findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW),
    ).rejects.toThrow("calendar unavailable");

    mockFetchBusy.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 5)),
    );
    const retry = await findSlotsInRange("2026-06-22", "2026-06-22", cfg(), NOW);

    expect(retry.slots.length).toBeGreaterThan(0);
    expect(mockFetchBusy).toHaveBeenCalledTimes(2);
  });
});
