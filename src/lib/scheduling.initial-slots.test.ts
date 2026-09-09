import { describe, expect, it } from "vitest";
import { pickInitialSlots } from "./scheduling";
import type { Slot } from "@/types/scheduling";

/**
 * 初回表示は LLM を使わない。以前は "PROPOSE_INITIAL_SLOTS_IN_XX" を
 * エージェントに投げて「30分と60分を混ぜて朝昼夜に散らして早い日を優先」を
 * 毎回 LLM に判断させていたが、内容は決定論的なのでルールに落とす。
 *
 * ルール: 空きのある日を早い順に最大 maxDays 日拾い、各日で 朝(<12)/昼(12-17)/
 * 夜(17-) ごとに最初の 1 枠だけ採る。全体で maxSlots 件まで。出力は時刻順。
 */

function slot(start: string, end: string): Slot {
  return { start, end, label: start.slice(11, 16) };
}

describe("pickInitialSlots", () => {
  it("空き枠が無ければ空を返す", () => {
    expect(pickInitialSlots([])).toEqual([]);
  });

  it("1 日の中では朝・昼・夜からそれぞれ最初の 1 枠だけ採る", () => {
    const slots = [
      slot("2026-09-09T09:00:00+09:00", "2026-09-09T10:00:00+09:00"), // 朝 ← 採用
      slot("2026-09-09T09:30:00+09:00", "2026-09-09T10:30:00+09:00"), // 朝
      slot("2026-09-09T11:00:00+09:00", "2026-09-09T12:00:00+09:00"), // 朝
      slot("2026-09-09T13:00:00+09:00", "2026-09-09T14:00:00+09:00"), // 昼 ← 採用
      slot("2026-09-09T15:00:00+09:00", "2026-09-09T16:00:00+09:00"), // 昼
      slot("2026-09-09T18:00:00+09:00", "2026-09-09T19:00:00+09:00"), // 夜 ← 採用
      slot("2026-09-09T21:00:00+09:00", "2026-09-09T22:00:00+09:00"), // 夜
    ];

    expect(pickInitialSlots(slots).map((s) => s.label)).toEqual(["09:00", "13:00", "18:00"]);
  });

  it("その日に夜しか空きが無ければ夜の 1 枠だけ返す", () => {
    const slots = [
      slot("2026-09-08T23:00:00+09:00", "2026-09-09T00:00:00+09:00"),
      slot("2026-09-08T23:30:00+09:00", "2026-09-09T00:30:00+09:00"),
    ];

    expect(pickInitialSlots(slots).map((s) => s.label)).toEqual(["23:00"]);
  });

  it("空きのある日を早い順に最大 4 日ぶんまで拾う", () => {
    const slots = ["09-09", "09-10", "09-11", "09-12", "09-13"].map((d) =>
      slot(`2026-${d}T10:00:00+09:00`, `2026-${d}T11:00:00+09:00`),
    );

    const picked = pickInitialSlots(slots);

    expect(picked).toHaveLength(4);
    expect(picked.map((s) => s.start.slice(0, 10))).toEqual([
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
    ]);
  });

  it("空きの無い日は飛ばして次の空きのある日を数える", () => {
    // 9/10 と 9/11 に空きが無い（＝配列に存在しない）ケース
    const slots = ["09-09", "09-12", "09-13", "09-15"].map((d) =>
      slot(`2026-${d}T10:00:00+09:00`, `2026-${d}T11:00:00+09:00`),
    );

    expect(pickInitialSlots(slots).map((s) => s.start.slice(0, 10))).toEqual([
      "2026-09-09",
      "2026-09-12",
      "2026-09-13",
      "2026-09-15",
    ]);
  });

  it("全体で 8 件を超えない", () => {
    const slots = ["09-09", "09-10", "09-11", "09-12"].flatMap((d) => [
      slot(`2026-${d}T09:00:00+09:00`, `2026-${d}T10:00:00+09:00`),
      slot(`2026-${d}T13:00:00+09:00`, `2026-${d}T14:00:00+09:00`),
      slot(`2026-${d}T18:00:00+09:00`, `2026-${d}T19:00:00+09:00`),
    ]);

    // 4 日 × 3 枠 = 12 件あるが 8 件で打ち切る
    expect(pickInitialSlots(slots)).toHaveLength(8);
  });

  it("入力の順序を保つ（findSlotsInRange の時刻順出力をそのまま間引く）", () => {
    const slots = ["09-09", "09-10"].flatMap((d) => [
      slot(`2026-${d}T09:00:00+09:00`, `2026-${d}T10:00:00+09:00`),
      slot(`2026-${d}T09:30:00+09:00`, `2026-${d}T10:30:00+09:00`),
      slot(`2026-${d}T13:00:00+09:00`, `2026-${d}T14:00:00+09:00`),
      slot(`2026-${d}T18:00:00+09:00`, `2026-${d}T19:00:00+09:00`),
    ]);

    const picked = pickInitialSlots(slots);

    // 出力は入力の部分列（間引くだけで並べ替えはしない）
    let cursor = 0;
    for (const s of picked) {
      cursor = slots.indexOf(s, cursor) + 1;
      expect(cursor).toBeGreaterThan(0);
    }
    // 結果として時刻順にもなっている
    const times = picked.map((s) => Date.parse(s.start));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it("上限は引数で変えられる", () => {
    const slots = ["09-09", "09-10", "09-11"].map((d) =>
      slot(`2026-${d}T10:00:00+09:00`, `2026-${d}T11:00:00+09:00`),
    );

    expect(pickInitialSlots(slots, { maxDays: 2 })).toHaveLength(2);
    expect(pickInitialSlots(slots, { maxSlots: 1 })).toHaveLength(1);
  });
});
