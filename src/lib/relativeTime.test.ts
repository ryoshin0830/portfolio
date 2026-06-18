import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "./relativeTime";

// 固定の基準時刻（now）を渡して決定的にテストする。
const NOW = new Date("2026-06-18T12:00:00Z").getTime();
const ago = (sec: number) => new Date(NOW - sec * 1000).toISOString();

const DAY = 60 * 60 * 24;

describe("formatRelativeTime", () => {
  it("最大の単位を選ぶ（日 / 週 / 月 / 年）", () => {
    expect(formatRelativeTime(ago(3 * DAY), "ja", NOW)).toContain("3");
    expect(formatRelativeTime(ago(3 * DAY), "ja", NOW)).toContain("日");
    // 2 週間前 → 週単位
    expect(formatRelativeTime(ago(14 * DAY), "en", NOW)).toBe("2 weeks ago");
    // 約 2 か月前
    expect(formatRelativeTime(ago(60 * DAY), "en", NOW)).toBe("2 months ago");
    // 約 1 年前
    expect(formatRelativeTime(ago(365 * DAY), "en", NOW)).toBe("last year");
  });

  it("numeric:auto の特例（昨日 / yesterday / 昨天）", () => {
    expect(formatRelativeTime(ago(DAY), "en", NOW)).toBe("yesterday");
    expect(formatRelativeTime(ago(DAY), "zh", NOW)).toBe("昨天");
  });

  it("ロケールごとに語形が変わる", () => {
    expect(formatRelativeTime(ago(3 * DAY), "en", NOW)).toBe("3 days ago");
    expect(formatRelativeTime(ago(3 * DAY), "zh", NOW)).toBe("3天前");
  });

  it("1 分未満は just now 相当（second の 0 表現）", () => {
    expect(formatRelativeTime(ago(10), "en", NOW)).toBe("now");
  });

  it("不正な日付は空文字を返す", () => {
    expect(formatRelativeTime("not-a-date", "ja", NOW)).toBe("");
  });
});
