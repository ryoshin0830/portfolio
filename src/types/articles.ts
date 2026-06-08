// A single piece of writing in the merged Zenn + Qiita feed. The same article
// is sometimes cross-posted to both platforms; those are deduplicated by title
// into one entry that carries both URLs (so a source filter still works and we
// can show which platforms it lives on).
export interface MergedArticle {
  title: string;
  date: string; // ISO 8601 — the most recent publish date across sources
  zennUrl?: string;
  qiitaUrl?: string;
}

export type ArticleSource = "zenn" | "qiita";

// A single X (Twitter) post. Posts have no title — just body text — so they are
// NOT merged into the title-deduplicated article feed; they render as their own
// block. Fetched server-side from the X API (app-only Bearer auth).
export interface XPost {
  id: string;
  text: string;
  date: string; // ISO 8601 (created_at)
  url: string; // https://x.com/<username>/status/<id>
}
