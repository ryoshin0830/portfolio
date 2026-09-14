import type {
  FeedItem,
  FeedSource,
  MergedArticle,
  NotionNote,
  XPost,
} from "@/types/articles";

// Merge the (already-deduplicated) Zenn/Qiita articles, the X posts and the
// Notion notes into one date-sorted feed. Pure function — the upstream fetches
// are cached separately in their own modules; this just combines their outputs
// for the Hero and the activity section.
//
// Notion notes get their own kind ("notion") rather than reusing "article".
// That is load-bearing: the Hero teaser in page.tsx selects kind === "article",
// so a distinct kind keeps casual notes out of the Hero with no extra filter.
export function buildFeed(
  articles: MergedArticle[],
  posts: XPost[],
  notes: NotionNote[] = [],
): FeedItem[] {
  const items: FeedItem[] = [];

  for (const a of articles) {
    const sources: FeedSource[] = [];
    if (a.zennUrl) sources.push("zenn");
    if (a.qiitaUrl) sources.push("qiita");
    if (a.noteUrl) sources.push("note");
    items.push({
      id: a.zennUrl ?? a.qiitaUrl ?? a.noteUrl ?? a.title,
      kind: "article",
      text: a.title,
      date: a.date,
      url: a.zennUrl ?? a.qiitaUrl ?? a.noteUrl ?? "#",
      sources,
      zennUrl: a.zennUrl,
      qiitaUrl: a.qiitaUrl,
      noteUrl: a.noteUrl,
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

  for (const n of notes) {
    items.push({
      id: n.id,
      kind: "notion",
      text: n.title,
      summary: n.summary,
      date: n.date,
      url: n.url,
      sources: ["notion"],
    });
  }

  // Most recent first. Parse timestamps — Zenn is UTC ("Z"), Qiita "+09:00",
  // X also ISO-Z, Notion ISO-Z; string comparison would mis-order across sources.
  return items.sort((x, y) => Date.parse(y.date) - Date.parse(x.date));
}
