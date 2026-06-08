import { unstable_cache } from "next/cache";
import type { MergedArticle } from "@/types/articles";

// Server-side aggregation of the Zenn + Qiita feeds. Neither API sends CORS
// headers, so this must run on the server; the result is fetched once here and
// passed to client components as props (no duplicate client requests).
//
// Caching: the merged result (~12KB) is memoized with unstable_cache for an
// hour. We deliberately do NOT rely on the per-fetch Data Cache — Qiita's raw
// response is ~3MB (full article bodies) and exceeds the 2MB Data Cache limit,
// so caching the small merged output instead is both correct and cheap. Upstream
// is therefore hit at most once per hour.
const ZENN_USERNAME = "ryoushin";
const QIITA_USERNAME = "ryoshin0830";
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

// Normalize so trivially-different copies of the same title still merge: the
// user cross-posts identical articles to both platforms, and those copies can
// differ in case or full-/half-width punctuation (common in Japanese). NFKC
// folds full-width → half-width; lower-case folds case.
const normalizeTitle = (title: string) =>
  title.trim().replace(/\s+/g, " ").normalize("NFKC").toLowerCase();

async function buildArticles(): Promise<MergedArticle[]> {
  const [zennResult, qiitaResult] = await Promise.allSettled([
    fetchZenn(),
    fetchQiita(),
  ]);

  // Don't cache a total failure (unstable_cache won't store a thrown rejection),
  // so a transient outage retries on the next request instead of blanking the
  // feed for an hour.
  if (zennResult.status === "rejected" && qiitaResult.status === "rejected") {
    throw new Error("Both Zenn and Qiita failed");
  }

  const merged = new Map<string, MergedArticle>();

  const add = (raw: RawArticle, source: "zenn" | "qiita") => {
    const key = normalizeTitle(raw.title);
    const existing = merged.get(key) ?? { title: raw.title, date: raw.date };
    if (source === "zenn") existing.zennUrl = raw.url;
    else existing.qiitaUrl = raw.url;
    // Keep the most recent instant across sources. Compare parsed timestamps —
    // Zenn dates are UTC ("Z") while Qiita carries "+09:00", so lexicographic
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

  return [...merged.values()].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
}

export const getArticles = unstable_cache(buildArticles, ["zenn-qiita-articles"], {
  revalidate: CACHE_TTL_SECONDS,
});
