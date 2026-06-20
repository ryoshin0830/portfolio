import { describe, it, expect } from "vitest";
import { slimSlotsForAgent, MAX_AGENT_SLOTS } from "./scheduling-tools";
import type { FindSlotsResult } from "@/lib/scheduling";
import type { Slot } from "@/types/scheduling";

/**
 * slimSlotsForAgent は純関数（カレンダー I/O 不要）。
 * find-slots の結果をエージェント向けに軽量化する:
 *  - `busy`（unavailable 区間）を落とす（漏洩・トークン削減）
 *  - `slots` を limit 件に切り詰め、超過時 truncated=true
 *  - 先頭（最も早い順）を保持
 */

function makeSlots(n: number): Slot[] {
  return Array.from({ length: n }, (_, i) => {
    const h = 9 + Math.floor(i / 2);
    const min = i % 2 === 0 ? "00" : "30";
    const start = `2026-06-25T${String(h).padStart(2, "0")}:${min}:00+09:00`;
    return {
      start,
      end: start,
      label: `${String(h).padStart(2, "0")}:${min}`,
    };
  });
}

function makeResult(slots: Slot[]): FindSlotsResult {
  return {
    timezone: "Asia/Tokyo",
    busy: [
      { start: "2026-06-25T10:00:00+09:00", end: "2026-06-25T11:00:00+09:00" },
      { start: "2026-06-25T14:00:00+09:00", end: "2026-06-25T15:00:00+09:00" },
    ],
    slots,
  };
}

describe("slimSlotsForAgent", () => {
  it("戻り値に busy を含めない（漏洩・トークン削減）", () => {
    const out = slimSlotsForAgent(makeResult(makeSlots(3)));
    // busy が一切含まれていないこと（キーとして存在しない）
    expect(out).not.toHaveProperty("busy");
    expect(Object.keys(out).sort()).toEqual(["slots", "timezone", "truncated"]);
    expect(out.timezone).toBe("Asia/Tokyo");
  });

  it("slots <= limit のとき全件保持・truncated=false", () => {
    const slots = makeSlots(5);
    const out = slimSlotsForAgent(makeResult(slots), 10);
    expect(out.slots).toHaveLength(5);
    expect(out.truncated).toBe(false);
    expect(out.slots).toEqual(slots);
  });

  it("slots == limit（ちょうど）のとき truncated=false", () => {
    const slots = makeSlots(10);
    const out = slimSlotsForAgent(makeResult(slots), 10);
    expect(out.slots).toHaveLength(10);
    expect(out.truncated).toBe(false);
  });

  it("slots > limit のとき limit 件に切り詰め truncated=true", () => {
    const slots = makeSlots(50);
    const out = slimSlotsForAgent(makeResult(slots), 10);
    expect(out.slots).toHaveLength(10);
    expect(out.truncated).toBe(true);
  });

  it("切り詰め時、先頭（最も早い順）が保持される", () => {
    const slots = makeSlots(50);
    const out = slimSlotsForAgent(makeResult(slots), 10);
    // 先頭 10 件がそのまま（並び順を変えない）
    expect(out.slots).toEqual(slots.slice(0, 10));
    expect(out.slots[0]).toEqual(slots[0]);
    expect(out.slots.at(-1)).toEqual(slots[9]);
  });

  it("既定 limit は MAX_AGENT_SLOTS (40)", () => {
    expect(MAX_AGENT_SLOTS).toBe(40);
    const slots = makeSlots(41);
    const out = slimSlotsForAgent(makeResult(slots)); // limit 省略
    expect(out.slots).toHaveLength(40);
    expect(out.truncated).toBe(true);
    expect(out.slots).toEqual(slots.slice(0, 40));
  });

  it("limit を超えない件数では既定 limit でも全件・truncated=false", () => {
    const slots = makeSlots(40);
    const out = slimSlotsForAgent(makeResult(slots));
    expect(out.slots).toHaveLength(40);
    expect(out.truncated).toBe(false);
  });
});
