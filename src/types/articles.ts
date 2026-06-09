// A single piece of writing in the merged Zenn + Qiita + note feed. The same
// article is sometimes cross-posted to several platforms; those are deduplicated
// by title into one entry that carries every URL (so a source filter still works
// and we can show which platforms it lives on).
export interface MergedArticle {
  title: string;
  date: string; // ISO 8601 — the most recent publish date across sources
  zennUrl?: string;
  qiitaUrl?: string;
  noteUrl?: string;
}

export type ArticleSource = "zenn" | "qiita" | "note";

// A platform a feed item lives on. Articles come from Zenn/Qiita/note; posts from X.
export type FeedSource = "zenn" | "qiita" | "note" | "x";

// One row in the unified feed (Hero + the activity section). Articles and X
// posts are merged into a single date-sorted stream. `kind` distinguishes them
// because the two render slightly differently (an article's `text` is its title;
// a post's `text` is its body). `sources` drives which logos show and the source
// filter. Articles cross-posted to both platforms keep both URLs so a
// source-specific filter can still deep-link to the right copy.
export interface FeedItem {
  id: string;
  kind: "article" | "post";
  text: string;
  date: string; // ISO 8601
  url: string; // primary link
  sources: FeedSource[];
  zennUrl?: string;
  qiitaUrl?: string;
  noteUrl?: string;
}

// A single X (Twitter) post. Posts have no title — just body text — so they are
// NOT merged into the title-deduplicated article feed; they render as their own
// block. Fetched server-side from the X API (app-only Bearer auth).
export interface XPost {
  id: string;
  text: string;
  date: string; // ISO 8601 (created_at)
  url: string; // https://x.com/<username>/status/<id>
}
