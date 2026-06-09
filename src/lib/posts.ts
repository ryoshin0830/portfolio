import type { XPost } from "@/types/articles";

// Server-side fetch of the user's own recent X (Twitter) posts via the X API v2
// (app-only Bearer auth). This must run on the server: the Bearer token is a
// secret (process.env.X_BEARER_TOKEN, never shipped to the client) and the X
// API sends no CORS headers. The result is passed to client components as props.
//
// Cost control: the X API is pay-per-use (billed per post returned). We cap each
// fetch at 20 posts and cache the response for 60s via Next's native fetch cache
// (`next: { revalidate }`), keeping the page on ISR (visitors get static HTML)
// while new posts surface within ~1 min. Cost stays negligible: these are
// "owned reads" ($0.001/post) and the X API charges each post resource at most
// once per 24h UTC window (dedup), so re-fetching the same 20 posts is ~$0.02/day.
//
// We deliberately do NOT use `unstable_cache` here: wrapping this request in it
// caused the X API to reject it with 400 (a bare fetch of the same URL returns
// 200), so we rely on the fetch-level cache instead.
//
// User ID is hardcoded to skip a lookup request (one fewer billed call). It is
// the stable numeric ID for @ryoshin0830.
const X_USER_ID = "1153976011";
const X_USERNAME = "ryoshin0830";
const MAX_POSTS = 20;
const CACHE_TTL_SECONDS = 60; // revalidate every 60s

export async function getPosts(): Promise<XPost[]> {
  const token = process.env.X_BEARER_TOKEN;
  // No token configured (e.g. local dev without secrets) — degrade to empty.
  if (!token) return [];

  const params = new URLSearchParams({
    max_results: String(MAX_POSTS),
    exclude: "retweets,replies",
    "tweet.fields": "created_at",
  });
  const url = `https://api.x.com/2/users/${X_USER_ID}/tweets?${params}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: CACHE_TTL_SECONDS },
  });
  // Throw on failure so a bad response isn't cached; the caller (page.tsx)
  // catches and degrades to an empty list, and the next request retries.
  if (!res.ok) {
    throw new Error(`X API responded ${res.status}`);
  }

  const data = (await res.json()) as {
    data?: { id: string; text: string; created_at: string }[];
  };
  if (!data.data?.length) return [];

  return data.data.map((t) => {
    // Strip t.co short-links (X auto-appends one per attached media/quote/URL)
    // and collapse whitespace — the card itself links to the post, so the raw
    // link is just noise. Fall back to the original text if cleaning empties it.
    const cleaned = t.text
      .replace(/https:\/\/t\.co\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return {
      id: t.id,
      text: cleaned || t.text.trim(),
      date: t.created_at,
      url: `https://x.com/${X_USERNAME}/status/${t.id}`,
    };
  });
}

export { X_USERNAME };
