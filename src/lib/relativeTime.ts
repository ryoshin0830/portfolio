/**
 * ロケール対応の相対時間表記（例: ja「3 日前」/ en「3 days ago」/ zh「3天前」）。
 *
 * Intl.RelativeTimeFormat に委ねるので各言語の語形・「昨日/yesterday/昨天」等の
 * 特例（numeric: "auto"）も自動で扱える。最大の単位（年→月→週→日→時→分）を選ぶ。
 *
 * Server Component から呼ぶ前提。`now` を引数で受けられるのはテストのため
 * （本番は既定の Date.now()。ページは revalidate=60 なので最大 60 秒の鮮度差は許容）。
 */
export function formatRelativeTime(
  dateStr: string,
  locale: string,
  now: number = Date.now(),
): string {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";

  const diffSec = Math.round((then - now) / 1000); // 過去は負
  const abs = Math.abs(diffSec);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, secs] of units) {
    if (abs >= secs) {
      return rtf.format(Math.round(diffSec / secs), unit);
    }
  }
  // 1 分未満は「たった今 / just now」相当（second + numeric:auto の 0 表現）
  return rtf.format(0, "second");
}
