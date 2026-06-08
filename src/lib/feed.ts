import type { FeedItem, FeedSource, MergedArticle, XPost } from "@/types/articles";

// Merge the (already-deduplicated) Zenn/Qiita articles with the X posts into one
// date-sorted feed. Pure function — the upstream fetches are cached separately
// (articles hourly, posts daily) in their own modules; this just combines their
// outputs for the Hero and the activity section.
export function buildFeed(
  articles: MergedArticle[],
  posts: XPost[],
): FeedItem[] {
  const items: FeedItem[] = [];

  for (const a of articles) {
    const sources: FeedSource[] = [];
    if (a.zennUrl) sources.push("zenn");
    if (a.qiitaUrl) sources.push("qiita");
    items.push({
      id: a.zennUrl ?? a.qiitaUrl ?? a.title,
      kind: "article",
      text: a.title,
      date: a.date,
      url: a.zennUrl ?? a.qiitaUrl ?? "#",
      sources,
      zennUrl: a.zennUrl,
      qiitaUrl: a.qiitaUrl,
    });
  }

  for (const p of posts) {
    items.push({
      id: p.id,
      kind: "post",
      text: p.text,
      date: p.date,
      url: p.url,
      sources: ["x"],
    });
  }

  // Most recent first. Parse timestamps — Zenn is UTC ("Z"), Qiita "+09:00",
  // X also ISO-Z; string comparison would mis-order across sources.
  return items.sort((x, y) => Date.parse(y.date) - Date.parse(x.date));
}
