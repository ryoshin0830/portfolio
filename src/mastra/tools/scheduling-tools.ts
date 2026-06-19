import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { findSlotsInRange, createBooking, DEFAULT_CONFIG } from "@/lib/scheduling";

/**
 * 日程調整エージェント用ツール。
 *
 * ★セキュリティ境界: 予定名・場所等はサーバー内部の移動判定 LLM にだけ渡す。
 *   エージェント（DeepSeek）とブラウザに返すのは、移動パディング適用後の unavailable
 *   時間帯と空き枠のみ。予定名・場所・説明・参加者等は返さない。
 */

const busySchema = z.object({
  start: z.string().describe("ISO8601 +09:00"),
  end: z.string().describe("ISO8601 +09:00"),
});

const slotSchema = z.object({
  start: z.string().describe("ISO8601 +09:00"),
  end: z.string().describe("ISO8601 +09:00"),
  label: z.string().describe("開始時刻 HH:mm"),
});

export const findSlotsTool = createTool({
  id: "find-slots",
  description:
    "Get the owner's privacy-safe unavailable intervals and all open meeting slots for a date range. " +
    "Unavailable intervals already include travel padding around existing events that require movement. " +
    "They contain only start/end times, no event titles, locations, attendees, or details. " +
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
    busy: z.array(busySchema).describe("移動パディング込みの unavailable 時間帯。タイトル・場所等は含まない"),
    slots: z.array(slotSchema),
  }),
  execute: async (inputData) => {
    const { rangeStartDate, rangeEndDate, durationMin, partOfDay } = inputData;
    return findSlotsInRange(
      rangeStartDate,
      rangeEndDate,
      DEFAULT_CONFIG,
      new Date(),
      { durationMinutes: durationMin, partOfDay },
    );
  },
});

export const bookSlotTool = createTool({
  id: "book-slot",
  description:
    "Book one of the previously offered open slots. Re-checks availability and creates the event with a Meet link and email invite.",
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
