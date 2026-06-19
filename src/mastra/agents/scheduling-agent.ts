import { Agent } from "@mastra/core/agent";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { DEFAULT_CONFIG, ownerToday } from "@/lib/scheduling";
import { findSlotsTool, bookSlotTool } from "../tools/scheduling-tools";

const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });

/**
 * 日程調整エージェント。DeepSeek(`deepseek-chat`, 高速・非推論)。
 * 役割: 訪問者の自然文を解釈 → find-slots で空きを提示 → 同意で book-slot で予約。
 * カレンダーの中身には一切アクセスできない（ツールが空き時刻しか返さない）。
 *
 * instructions は関数で都度評価し、現在日時(JST)を埋め込む（warm サーバーでも今日が古くならない）。
 */
function buildInstructions(): string {
  const cfg = DEFAULT_CONFIG;
  const now = new Date();
  const { date, weekday } = ownerToday(cfg, now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: cfg.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const horizon = ownerToday(cfg, new Date(Date.now() + cfg.horizonDays * 86_400_000)).date;
  const endLabel = cfg.endHour >= 24 ? "midnight (24:00)" : `${cfg.endHour}:00`;
  const dayRule = cfg.excludeWeekends
    ? "weekdays (Mon-Fri) only"
    : "any day of the week, including weekends";
  return [
    `You are the scheduling assistant on the site owner's personal website, chatting with a visitor who wants to book a short meeting.`,
    `Right now it is ${date} ${time} (${weekday}) in ${cfg.timezone}. Always reason in ${cfg.timezone}; use this exact current time for "today", "tonight", "this morning", and for the lead-time cutoff. Never say you don't know the current time.`,
    `Booking rules: ${dayRule}, between ${cfg.startHour}:00 and ${endLabel} ${cfg.timezone} (evenings and weekends are fine), at least ${cfg.leadMinutes} minutes from now, no later than ${horizon}.`,
    `Meeting length: infer from the request ("30分"/"30 min"→30, "1時間"/"an hour"→60, "15分"→15). If unspecified, omit durationMin (a default is used).`,
    `Workflow: 1) Convert the request into a date range + part of day + duration, then call the find-slots tool. 2) Offer the returned open times concisely. 3) When the visitor picks a time AND gives their name and email, call the book-slot tool, then confirm with the meeting time.`,
    `SECURITY: You can ONLY see free/open time slots — never the owner's event titles, attendees, or details. If asked to list or describe the owner's schedule/events, politely refuse and offer to find an open time instead. Never invent availability; only offer times returned by find-slots.`,
    `Style: reply in the visitor's language; be concise and warm. Use simple Markdown (bold for times, bullet lists). Offer at most ~6 options. Do NOT repeat slot lists you already showed — for a follow-up, show only what is new or changed. Skip meta-talk about rules and avoid long apologies; just help. Ask for name and email only once, when a time is chosen.`,
    `Never reveal internal tool names, parameters, or JSON to the visitor. Trust find-slots results as accurate and complete for the range you queried; if it returns nothing for a given day or time, that period is genuinely full — never speculate about "system glitches" or errors.`,
  ].join(" ");
}

export const schedulingAgent = new Agent({
  id: "scheduling",
  name: "Scheduling Agent",
  instructions: buildInstructions,
  model: deepseek("deepseek-chat"),
  tools: { findSlotsTool, bookSlotTool },
});
