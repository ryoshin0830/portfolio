import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { findSlotsInRange, createBooking, DEFAULT_CONFIG } from "@/lib/scheduling";

/**
 * 日程調整エージェント用ツール。
 *
 * ★セキュリティ境界: エージェント（DeepSeek）に渡すカレンダー情報は Google Calendar
 *   freebusy の busy 時間帯のみ。予定名・説明・参加者等は取得しない。
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
    "Get the owner's title-free calendar busy intervals and all open meeting slots for a date range. " +
    "Busy intervals come from Google Calendar freebusy and contain only start/end times, no event titles or details. " +
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
    busy: z.array(busySchema).describe("Google Calendar freebusy の予定あり時間帯。タイトル等は含まない"),
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
