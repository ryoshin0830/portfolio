import { NextResponse } from "next/server";
import type { MergedArticle } from "@/types/articles";

// Neither Zenn's nor Qiita's API sends CORS headers, so the browser can't call
// them directly. This route proxies both server-side, fetches their *full* post
// history, deduplicates cross-posts (same title on both platforms) into single
// entries, and returns one date-sorted feed. The post counts are small (~50
// each) so we send the whole list and let the client reveal it progressively.
const ZENN_USERNAME = "ryoushin";
const QIITA_USERNAME = "ryoshin0830";

export const revalidate = 3600; // cache upstream responses for an hour

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
      { next: { revalidate } },
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
      { next: { revalidate } },
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

// Collapse repeated inner whitespace so trivially-different copies of the same
// title still merge (the user cross-posts identical articles to both platforms).
const normalizeTitle = (title: string) => title.trim().replace(/\s+/g, " ");

export async function GET() {
  const [zennResult, qiitaResult] = await Promise.allSettled([
    fetchZenn(),
    fetchQiita(),
  ]);

  if (zennResult.status === "rejected" && qiitaResult.status === "rejected") {
    console.error("Failed to fetch articles", zennResult.reason, qiitaResult.reason);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 502 },
    );
  }

  const merged = new Map<string, MergedArticle>();

  const add = (raw: RawArticle, source: "zenn" | "qiita") => {
    const key = normalizeTitle(raw.title);
    const existing = merged.get(key) ?? { title: raw.title, date: raw.date };
    if (source === "zenn") existing.zennUrl = raw.url;
    else existing.qiitaUrl = raw.url;
    // Keep the most recent date across sources for stable chronological sort.
    if (raw.date > existing.date) existing.date = raw.date;
    merged.set(key, existing);
  };

  if (zennResult.status === "fulfilled") {
    for (const a of zennResult.value) add(a, "zenn");
  }
  if (qiitaResult.status === "fulfilled") {
    for (const a of qiitaResult.value) add(a, "qiita");
  }

  const articles = [...merged.values()].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );

  return NextResponse.json({ articles });
}
