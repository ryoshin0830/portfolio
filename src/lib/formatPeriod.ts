type Locale = "ja" | "en" | "zh";

const monthEN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseYM(ym: string): { y: number; m: number } {
  const [y, m] = ym.split("-").map(Number);
  return { y, m };
}

function presentLabel(locale: Locale): string {
  if (locale === "en") return "Present";
  if (locale === "zh") return "至今";
  return "現在";
}

function formatYM(ym: string, locale: Locale): string {
  const { y, m } = parseYM(ym);
  if (locale === "en") return `${monthEN[m - 1]} ${y}`;
  return `${y}年${m}月`;
}

export function formatPeriod(
  start: string,
  end: string | null,
  locale: Locale,
): string {
  const left = formatYM(start, locale);
  const right = end ? formatYM(end, locale) : presentLabel(locale);
  const sep = locale === "en" ? " — " : " — ";
  return `${left}${sep}${right}`;
}

export function durationMonths(start: string, end: string | null): number {
  const s = parseYM(start);
  const e = end ? parseYM(end) : (() => {
    const now = new Date();
    return { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1 };
  })();
  return Math.max(1, (e.y - s.y) * 12 + (e.m - s.m) + 1);
}

export function formatDuration(months: number, locale: Locale): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (locale === "en") {
    const yPart = y > 0 ? `${y} yr${y > 1 ? "s" : ""}` : "";
    const mPart = m > 0 ? `${m} mo` : "";
    return [yPart, mPart].filter(Boolean).join(" ") || "1 mo";
  }
  if (locale === "zh") {
    const yPart = y > 0 ? `${y}年` : "";
    const mPart = m > 0 ? `${m}个月` : "";
    return `${yPart}${mPart}` || "1个月";
  }
  const yPart = y > 0 ? `${y}年` : "";
  const mPart = m > 0 ? `${m}ヶ月` : "";
  return `${yPart}${mPart}` || "1ヶ月";
}

export function formatYearShort(ym: string): string {
  return ym.split("-")[0];
}

export function isLocale(s: string): s is Locale {
  return s === "ja" || s === "en" || s === "zh";
}
