import { describe, it, expect } from "vitest";
import { computeOpenSlots, isValidDateString } from "./scheduling";
import type { SchedulingConfig } from "@/types/scheduling";

/**
 * 空き枠算出の回帰テスト。LLM ではなくサーバー側の純関数で決定論的に計算する
 * という設計の心臓部なので、busy 重なり・過去/リードタイム・土日・営業時間境界を
 * 固定の now で検証する。
 */

const CFG: SchedulingConfig = {
  timezone: "Asia/Tokyo",
  utcOffset: "+09:00",
  startHour: 10,
  endHour: 12, // 10:00,10:30,11:00,11:30 の 4 枠（11:30-12:00 が最終）
  slotMinutes: 30,
  leadMinutes: 120,
  excludeWeekends: true,
  horizonDays: 30,
};

// 2026-06-25 は木曜（平日）。十分前の now でリードタイムに引っかからないようにする。
const FAR_PAST_NOW = new Date("2026-06-20T00:00:00+09:00");

describe("isValidDateString", () => {
  it("正しい日付を受理する", () => {
    expect(isValidDateString("2026-06-25")).toBe(true);
  });
  it("実在しない日付を弾く", () => {
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
  });
  it("形式違いを弾く", () => {
    expect(isValidDateString("2026/06/25")).toBe(false);
    expect(isValidDateString("26-6-5")).toBe(false);
    expect(isValidDateString("")).toBe(false);
  });
});

describe("computeOpenSlots", () => {
  it("予定が無ければ営業時間ぶんの枠を全部返す", () => {
    const slots = computeOpenSlots("2026-06-25", [], CFG, FAR_PAST_NOW);
    expect(slots.map((s) => s.label)).toEqual(["10:00", "10:30", "11:00", "11:30"]);
    expect(slots[0].start).toBe("2026-06-25T10:00:00+09:00");
    expect(slots[0].end).toBe("2026-06-25T10:30:00+09:00");
  });

  it("busy と重なる枠を除外する（半開区間）", () => {
    // 10:30-11:00 をブロック → その枠だけ消える。隣接する 10:00-10:30 と 11:00-11:30 は残る。
    const busy = [
      { start: "2026-06-25T10:30:00+09:00", end: "2026-06-25T11:00:00+09:00" },
    ];
    const slots = computeOpenSlots("2026-06-25", busy, CFG, FAR_PAST_NOW);
    expect(slots.map((s) => s.label)).toEqual(["10:00", "11:00", "11:30"]);
  });

  it("枠をまたぐ busy は重なる全枠を除外する", () => {
    const busy = [
      { start: "2026-06-25T10:15:00+09:00", end: "2026-06-25T11:15:00+09:00" },
    ];
    const slots = computeOpenSlots("2026-06-25", busy, CFG, FAR_PAST_NOW);
    // 10:00-10:30, 10:30-11:00, 11:00-11:30 が重なる → 11:30 のみ残る
    expect(slots.map((s) => s.label)).toEqual(["11:30"]);
  });

  it("リードタイム内の枠を除外する", () => {
    // now=当日 10:00 JST、リードタイム 120 分 → 12:00 以降のみ。営業終了 12:00 なので空。
    const now = new Date("2026-06-25T10:00:00+09:00");
    const slots = computeOpenSlots("2026-06-25", [], CFG, now);
    expect(slots).toEqual([]);
  });

  it("土日は空にする", () => {
    // 2026-06-27 は土曜
    const slots = computeOpenSlots("2026-06-27", [], CFG, FAR_PAST_NOW);
    expect(slots).toEqual([]);
  });
});
