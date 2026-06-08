import { NextResponse } from "next/server";

// Zenn's public articles API has no CORS headers, so the browser can't call it
// directly. This route proxies it server-side: it paginates the *full* post
// history (the RSS feed only exposes recent entries) so the client's infinite
// scroll can reach every article.
const ZENN_USERNAME = "ryoushin";
const PER_PAGE = 24;

interface ZennApiArticle {
  title: string;
  path: string;
  published_at: string;
}

export const revalidate = 3600; // cache upstream response for an hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  try {
    const res = await fetch(
      `https://zenn.dev/api/articles?username=${ZENN_USERNAME}&order=latest&count=${PER_PAGE}&page=${page}`,
      { next: { revalidate } },
    );
    if (!res.ok) throw new Error(`Zenn API responded ${res.status}`);
    const data = (await res.json()) as {
      articles: ZennApiArticle[];
      next_page: number | null;
    };
    return NextResponse.json({
      articles: data.articles.map((a) => ({
        title: a.title,
        link: `https://zenn.dev${a.path}`,
        pubDate: a.published_at,
      })),
      nextPage: data.next_page ?? null,
    });
  } catch (e) {
    console.error("Failed to fetch Zenn articles", e);
    return NextResponse.json(
      { error: "Failed to fetch Zenn articles" },
      { status: 502 },
    );
  }
}
