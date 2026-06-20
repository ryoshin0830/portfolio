import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  findSlotsInRange,
  createBooking,
  DEFAULT_CONFIG,
  type FindSlotsResult,
} from "@/lib/scheduling";
import type { Slot } from "@/types/scheduling";

/**
 * 日程調整エージェント用ツール。
 *
 * ★セキュリティ境界: 予定名・場所等はサーバー内部の移動判定 LLM にだけ渡す。
 *   エージェント（DeepSeek）とブラウザに返すのは、移動パディング適用後の空き枠のみ。
 *   予定名・場所・説明・参加者等は返さない。
 */

/**
 * find-slots の結果をエージェント向けに軽量化する純関数（トークン削減）。
 *  - `busy`（unavailable 区間）はエージェントの提示判断に不要なので落とす。
 *    空き枠 `slots` は既に busy/移動パディングを差し引き済みで、これだけで十分。
 *  - `slots` は先頭（＝最も早い日時順）から `limit` 件までに制限する。エージェントは
 *    ~6 件しか提示しないため、数百件を文脈に載せるのは純粋な無駄。
 */
export const MAX_AGENT_SLOTS = 40;

export function slimSlotsForAgent(
  result: FindSlotsResult,
  limit: number = MAX_AGENT_SLOTS,
): { timezone: string; slots: Slot[]; truncated: boolean } {
  const slots = result.slots.slice(0, Math.max(0, limit));
  return {
    timezone: result.timezone,
    slots,
    truncated: result.slots.length > slots.length,
  };
}

const slotSchema = z.object({
  start: z.string().describe("ISO8601 +09:00"),
  end: z.string().describe("ISO8601 +09:00"),
  label: z.string().describe("開始時刻 HH:mm"),
});

export const findSlotsTool = createTool({
  id: "find-slots",
  description:
    "Get the owner's privacy-safe open meeting slots for a date range. " +
    "Slots already exclude calendar conflicts and travel padding around existing events. " +
    "They contain only start/end times and a label, no event titles, locations, attendees, or details. " +
    "If 'truncated' is true, more slots exist than were returned; narrow the range or part of day. " +
    "Convert the visitor's natural-language request into a concrete date range, duration, and part of day before calling.",
  inputSchema: z.object({
    rangeStartDate: z.string().describe("検索開始日 YYYY-MM-DD（オーナーTZ）"),
    rangeEndDate: z.string().describe("検索終了日 YYYY-MM-DD（両端含む）"),
    durationMin: z
      .number()
      .int()
      .optional()
      .describe("会議の長さ(分)。要望から推定。未指定なら既定値。"),
    partOfDay: z
      .enum(["morning", "afternoon", "evening", "any"])
      .optional()
      .describe("時間帯フィルタ"),
  }),
  outputSchema: z.object({
    timezone: z.string(),
    slots: z.array(slotSchema),
    truncated: z.boolean().describe("上限件数で切り詰められたか（さらに空きがある）"),
  }),
  execute: async (inputData) => {
    const { rangeStartDate, rangeEndDate, durationMin, partOfDay } = inputData;
    const result = await findSlotsInRange(
      rangeStartDate,
      rangeEndDate,
      DEFAULT_CONFIG,
      new Date(),
      { durationMinutes: durationMin, partOfDay },
    );
    return slimSlotsForAgent(result);
  },
});

export const bookSlotTool = createTool({
  id: "book-slot",
  description:
    "Book one of the previously offered open slots. Re-checks availability and creates the event with a Meet link.",
  inputSchema: z.object({
    start: z.string().describe("ISO8601 +09:00"),
    end: z.string().describe("ISO8601 +09:00"),
    name: z.string().describe("予約者の名前"),
    note: z.string().optional().describe("用件（任意）"),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    htmlLink: z.string().optional(),
    meetUrl: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async (inputData) => {
    return createBooking(inputData, DEFAULT_CONFIG, new Date());
  },
});
