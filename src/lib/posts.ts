import { unstable_cache } from "next/cache";
import type { XPost } from "@/types/articles";

// Server-side fetch of the user's own recent X (Twitter) posts via the X API v2
// (app-only Bearer auth). This must run on the server: the Bearer token is a
// secret (process.env.X_BEARER_TOKEN, never shipped to the client) and the X
// API sends no CORS headers. The result is passed to client components as props.
//
// Cost control: the X API is pay-per-use (billed per post returned). We cap each
// fetch at 10 posts and memoize for a full day with unstable_cache, so upstream
// is hit at most once per 24h regardless of traffic — ~10 reads/day.
//
// User ID is hardcoded to skip a lookup request (one fewer billed call). It is
// the stable numeric ID for @ryoshin0830.
const X_USER_ID = "1153976011";
const X_USERNAME = "ryoshin0830";
const MAX_POSTS = 10;
const CACHE_TTL_SECONDS = 86_400; // once per day

async function buildPosts(): Promise<XPost[]> {
  const token = process.env.X_BEARER_TOKEN;
  // No token configured (e.g. local dev without secrets, or unset in prod) —
  // degrade silently; the posts block just won't render.
  if (!token) return [];

  try {
    const url =
      `https://api.x.com/2/users/${X_USER_ID}/tweets` +
      `?max_results=${MAX_POSTS}&exclude=retweets,replies&tweet.fields=created_at`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      data?: { id: string; text: string; created_at: string }[];
    };
    if (!data.data?.length) return [];

    return data.data.map((t) => {
      // Strip t.co short-links (X auto-appends one per attached media/quote/URL)
      // and collapse whitespace — the card itself links to the post, so the raw
      // link is just noise. Fall back to the original text if cleaning empties it
      // (e.g. a post that was only a link).
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
  } catch {
    // Network error / malformed response — never let X take down the page.
    return [];
  }
}

export const getPosts = unstable_cache(buildPosts, ["x-posts"], {
  revalidate: CACHE_TTL_SECONDS,
});

export { X_USERNAME };
