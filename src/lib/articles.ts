import { unstable_cache } from "next/cache";
import type { ArticleSource, MergedArticle } from "@/types/articles";

// Server-side aggregation of the Zenn + Qiita + note feeds. None of these APIs
// send CORS headers, so this must run on the server; the result is fetched once
// here and passed to client components as props (no duplicate client requests).
//
// Caching: the merged result (~12KB) is memoized with unstable_cache for an
// hour. We deliberately do NOT rely on the per-fetch Data Cache — Qiita's raw
// response is ~3MB (full article bodies) and exceeds the 2MB Data Cache limit,
// so caching the small merged output instead is both correct and cheap. Upstream
// is therefore hit at most once per hour.
//
// note.com has no official API; we read the public (unauthenticated) creator
// contents endpoint, which needs no session cookie and is safe to call from the
// server. It requires the X-Requested-With header or it is rejected.
const ZENN_USERNAME = "ryoushin";
const QIITA_USERNAME = "ryoshin0830";
const NOTE_USERNAME = "ryoshin0830";
const CACHE_TTL_SECONDS = 3600;

interface RawArticle {
  title: string;
  url: string;
  date: string;
}

async function fetchZenn(): Promise<RawArticle[]> {
  const out: RawArticle[] = [];
  let page: number | null = 1;
  while (page !== null) {
    const res = await fetch(
      `https://zenn.dev/api/articles?username=${ZENN_USERNAME}&order=latest&count=48&page=${page}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`Zenn API responded ${res.status}`);
    const data = (await res.json()) as {
      articles: { title: string; path: string; published_at: string }[];
      next_page: number | null;
    };
    for (const a of data.articles) {
      out.push({
        title: a.title,
        url: `https://zenn.dev${a.path}`,
        date: a.published_at,
      });
    }
    page = data.next_page ?? null;
  }
  return out;
}

async function fetchQiita(): Promise<RawArticle[]> {
  const out: RawArticle[] = [];
  const perPage = 100;
  for (let page = 1; ; page++) {
    const res = await fetch(
      `https://qiita.com/api/v2/users/${QIITA_USERNAME}/items?page=${page}&per_page=${perPage}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`Qiita API responded ${res.status}`);
    const data = (await res.json()) as {
      title: string;
      url: string;
      created_at: string;
    }[];
    for (const a of data) {
      out.push({ title: a.title, url: a.url, date: a.created_at });
    }
    if (data.length < perPage) break;
  }
  return out;
}

async function fetchNote(): Promise<RawArticle[]> {
  const out: RawArticle[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(
      `https://note.com/api/v2/creators/${NOTE_USERNAME}/contents?kind=note&page=${page}`,
      { headers: { "X-Requested-With": "XMLHttpRequest" }, cache: "no-store" },
    );
    if (!res.ok) throw new Error(`note API responded ${res.status}`);
    const { data } = (await res.json()) as {
      data: {
        contents: {
          name: string;
          key: string;
          publishAt: string;
          status: string;
        }[];
        isLastPage: boolean;
      };
    };
    for (const c of data.contents) {
      if (c.status !== "published") continue;
      out.push({
        title: c.name,
        url: `https://note.com/${NOTE_USERNAME}/n/${c.key}`,
        date: c.publishAt,
      });
    }
    if (data.isLastPage || data.contents.length === 0) break;
  }
  return out;
}

// Normalize so trivially-different copies of the same title still merge: the
// user cross-posts identical articles to both platforms, and those copies can
// differ in case or full-/half-width punctuation (common in Japanese). NFKC
// folds full-width → half-width; lower-case folds case.
const normalizeTitle = (title: string) =>
  title.trim().replace(/\s+/g, " ").normalize("NFKC").toLowerCase();

async function buildArticles(): Promise<MergedArticle[]> {
  const [zennResult, qiitaResult, noteResult] = await Promise.allSettled([
    fetchZenn(),
    fetchQiita(),
    fetchNote(),
  ]);

  // A failing source is tolerated but must not fail silently: note.com in
  // particular is an undocumented API that could change shape without notice,
  // and these logs (Vercel Function Logs) are the only way to notice.
  const results: [string, PromiseSettledResult<RawArticle[]>][] = [
    ["Zenn", zennResult],
    ["Qiita", qiitaResult],
    ["note", noteResult],
  ];
  for (const [name, result] of results) {
    if (result.status === "rejected") {
      console.error(`[articles] ${name} fetch failed:`, result.reason);
    }
  }

  // Don't cache a total failure (unstable_cache won't store a thrown rejection),
  // so a transient outage retries on the next request instead of blanking the
  // feed for an hour. A single source failing is tolerated — the others still
  // render.
  if (
    zennResult.status === "rejected" &&
    qiitaResult.status === "rejected" &&
    noteResult.status === "rejected"
  ) {
    throw new Error("Zenn, Qiita and note all failed");
  }

  const merged = new Map<string, MergedArticle>();

  const add = (raw: RawArticle, source: ArticleSource) => {
    const key = normalizeTitle(raw.title);
    const existing = merged.get(key) ?? { title: raw.title, date: raw.date };
    if (source === "zenn") existing.zennUrl = raw.url;
    else if (source === "qiita") existing.qiitaUrl = raw.url;
    else existing.noteUrl = raw.url;
    // Keep the most recent instant across sources. Compare parsed timestamps —
    // Zenn dates are UTC ("Z") while Qiita/note carry "+09:00", so lexicographic
    // string comparison would mis-order them.
    if (Date.parse(raw.date) > Date.parse(existing.date)) existing.date = raw.date;
    merged.set(key, existing);
  };

  if (zennResult.status === "fulfilled") {
    for (const a of zennResult.value) add(a, "zenn");
  }
  if (qiitaResult.status === "fulfilled") {
    for (const a of qiitaResult.value) add(a, "qiita");
  }
  if (noteResult.status === "fulfilled") {
    for (const a of noteResult.value) add(a, "note");
  }

  return [...merged.values()].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
}

export const getArticles = unstable_cache(
  buildArticles,
  ["zenn-qiita-note-articles"],
  { revalidate: CACHE_TTL_SECONDS },
);
