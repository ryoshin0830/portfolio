import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { findSlotsInRange, createBooking, DEFAULT_CONFIG } from "@/lib/scheduling";

/**
 * 日程調整エージェント用ツール。
 *
 * ★セキュリティ境界: これらのツールが返すのは「空き時刻」と「予約結果」だけ。エージェント
 *   （DeepSeek）にカレンダーの中身（予定名・参加者等）は一切渡らないので、プロンプト
 *   インジェクションされても漏洩しない。カレンダー読み取りは freebusy のみ（src/lib）。
 */

const slotSchema = z.object({
  start: z.string().describe("ISO8601 +09:00"),
  end: z.string().describe("ISO8601 +09:00"),
  label: z.string().describe("開始時刻 HH:mm"),
});

export const findSlotsTool = createTool({
  id: "find-slots",
  description:
    "Find OPEN meeting slots in the owner's calendar for a date range. Returns only free time slots (no event details). " +
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
  outputSchema: z.object({ slots: z.array(slotSchema) }),
  execute: async (inputData) => {
    const { rangeStartDate, rangeEndDate, durationMin, partOfDay } = inputData;
    const { slots } = await findSlotsInRange(
      rangeStartDate,
      rangeEndDate,
      DEFAULT_CONFIG,
      new Date(),
      { durationMinutes: durationMin, partOfDay },
    );
    return { slots };
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
    email: z.string().describe("予約者のメール"),
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
