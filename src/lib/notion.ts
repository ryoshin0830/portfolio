import { unstable_cache } from "next/cache";
import type { NotionNote } from "@/types/articles";

// Server-side fetch of the public Notion site (ryoshin.notion.site).
//
// Why not the HTML: notion.site renders entirely on the client. A plain request
// returns the same ~20KB empty shell for every Notion site (title "Notion",
// generic description, window.__notion_boot_data=null); the real title only
// appears after the client-side app runs. Sending a crawler User-Agent gets a
// Cloudflare 403. So scraping the page is not an option.
//
// What we use instead: Notion's internal JSON API, which answers without
// cookies, User-Agent or credentials for a publicly-shared site. This is an
// undocumented API and could change shape without notice — the same bet already
// taken for note.com in articles.ts. Failures are logged and degrade to an empty
// feed rather than breaking the page.
//
// No IDs are hardcoded: only the site's domain. Page/collection/view IDs are
// discovered each time, so re-creating the page or its view does not break this.
//
// If this route stops working, the durable replacement is the official API
// (api.notion.com, requires an internal-integration token in the personal
// workspace) wired up the way posts.ts handles X_BEARER_TOKEN.
const NOTION_DOMAIN = "ryoshin";
export const NOTION_SITE_URL = `https://${NOTION_DOMAIN}.notion.site`;
const API_BASE = `${NOTION_SITE_URL}/api/v3`;
const MAX_NOTES = 50;
const CACHE_TTL_SECONDS = 3600;

// Notion rich text is [[plainText, ...annotations], ...].
type RichText = unknown[][];

interface NotionBlock {
  id: string;
  type: string;
  properties?: Record<string, RichText>;
  created_time?: number;
  last_edited_time?: number;
  collection_id?: string;
  view_ids?: string[];
}

interface SchemaEntry {
  name?: string;
  type?: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

// recordMap entries are wrapped as { value: { value: {...}, role } } in the
// current API, and were { value: {...} } historically. Handle both.
function unwrap<T>(record: unknown): T | null {
  if (!isRecord(record)) return null;
  const outer = record.value;
  if (!isRecord(outer)) return null;
  const inner = outer.value;
  return (isRecord(inner) ? (inner as T) : (outer as T)) ?? null;
}

function plainText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((segment) => (Array.isArray(segment) ? String(segment[0] ?? "") : ""))
    .join("");
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Notion ${path} responded ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Find the schema key of the database's "created time" property. Notion keys
 * are opaque (e.g. "lt::"), so it must be discovered by type rather than named.
 * Returns null when the database has no such property — the caller then skips
 * server-side sorting and orders the rows itself.
 */
export function findCreatedTimeKey(schema: unknown): string | null {
  if (!isRecord(schema)) return null;
  for (const [key, entry] of Object.entries(schema)) {
    if (isRecord(entry) && (entry as SchemaEntry).type === "created_time") {
      return key;
    }
  }
  return null;
}

function firstCollectionSchema(recordMap: unknown): Record<string, SchemaEntry> {
  if (!isRecord(recordMap) || !isRecord(recordMap.collection)) return {};
  for (const record of Object.values(recordMap.collection)) {
    const collection = unwrap<{ schema?: Record<string, SchemaEntry> }>(record);
    if (collection?.schema) return collection.schema;
  }
  return {};
}

/**
 * Turn a queryCollection response into notes. Defensive by design: the upstream
 * is undocumented, so anything unrecognised is skipped rather than thrown.
 */
export function parseNotionNotes(query: unknown): NotionNote[] {
  if (!isRecord(query)) return [];
  const recordMap = query.recordMap;
  if (!isRecord(recordMap) || !isRecord(recordMap.block)) return [];

  const schema = firstCollectionSchema(recordMap);
  const entries = Object.entries(schema);
  const titleKey = entries.find(([, s]) => s.type === "title")?.[0] ?? "title";
  // Prefer a property actually named "Summary"; fall back to the first text
  // property so a rename doesn't silently drop the summary.
  const summaryKey =
    entries.find(([, s]) => s.type === "text" && s.name === "Summary")?.[0] ??
    entries.find(([, s]) => s.type === "text")?.[0];

  const result = isRecord(query.result) ? query.result : {};
  const reducers = isRecord(result.reducerResults) ? result.reducerResults : {};
  const group = isRecord(reducers.collection_group_results)
    ? reducers.collection_group_results
    : {};
  const blockIds = Array.isArray(group.blockIds) ? group.blockIds : [];

  const notes: NotionNote[] = [];
  for (const blockId of blockIds) {
    const block = unwrap<NotionBlock>(
      (recordMap.block as Record<string, unknown>)[String(blockId)],
    );
    if (!block || block.type !== "page" || !block.id) continue;

    const title = plainText(block.properties?.[titleKey]).trim();
    if (!title) continue;

    const summary = summaryKey
      ? plainText(block.properties?.[summaryKey]).trim()
      : "";

    notes.push({
      id: block.id,
      title,
      summary: summary || undefined,
      date: new Date(block.created_time ?? 0).toISOString(),
      // Notion site row URLs use the block id with dashes stripped.
      url: `${NOTION_SITE_URL}/${block.id.replace(/-/g, "")}`,
    });
  }

  // Sort here too: the server-side sort is skipped when the database has no
  // created-time property, and this keeps the contract the same either way.
  return notes.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/**
 * Fetch the notes. Uncached — getNotionNotes() is the cached entry point. This
 * is exported so tests can drive it with a stubbed fetch.
 */
export async function buildNotionNotes(): Promise<NotionNote[]> {
  // 1. Resolve the domain to its published home page.
  const site = await post<{
    pageId: string | null;
    spaceId: string;
    publicAccessRole: string;
  }>("getPublicPageDataForDomain", {
    type: "block-space",
    name: "page",
    slug: "",
    spaceDomain: NOTION_DOMAIN,
    requestedOnPublicDomain: true,
    requestedOnExternalDomain: false,
    requestedOnAlternateDomain: false,
    embedded: false,
    showMoveTo: false,
    saveParent: false,
    shouldDuplicate: false,
    projectManagementLaunch: false,
    configureOpenInDesktopApp: false,
    mobileData: { isPush: false },
    demoWorkspaceMode: false,
  });

  if (site.publicAccessRole !== "reader" || !site.pageId) {
    // Sharing was turned off (or the page was deleted). Throw so the empty
    // result is not cached for an hour and the cause is visible in the logs.
    throw new Error(
      `Notion site is not publicly readable (publicAccessRole=${site.publicAccessRole})`,
    );
  }

  // 2. Load the page and find the database block inside it.
  const chunk = await post<{ recordMap: unknown }>("loadCachedPageChunkV2", {
    page: { id: site.pageId },
    cursor: { stack: [] },
    verticalColumns: false,
  });

  const recordMap = isRecord(chunk.recordMap) ? chunk.recordMap : {};
  const blocks = isRecord(recordMap.block) ? Object.values(recordMap.block) : [];
  const view = blocks
    .map((b) => unwrap<NotionBlock>(b))
    .find(
      (b): b is NotionBlock =>
        !!b &&
        (b.type === "collection_view" || b.type === "collection_view_page") &&
        !!b.collection_id &&
        !!b.view_ids?.length,
    );

  if (!view) throw new Error("No Notion database block found on the page");

  // 3. Query the rows. The schema travels with the page chunk, so the
  // created-time sort key is known without an extra round trip.
  const createdKey = findCreatedTimeKey(firstCollectionSchema(recordMap));
  const query = await post<unknown>("queryCollection?src=initial_load", {
    clientType: "notion_app",
    source: {
      type: "collection",
      id: view.collection_id,
      spaceId: site.spaceId,
    },
    collectionView: { id: view.view_ids![0], spaceId: site.spaceId },
    loader: {
      reducers: {
        collection_group_results: { type: "results", limit: MAX_NOTES },
      },
      sort: createdKey
        ? [{ property: createdKey, direction: "descending" }]
        : [],
      searchQuery: "",
      archiveStatus: "NON_ARCHIVED",
      userTimeZone: "Asia/Tokyo",
    },
  });

  return parseNotionNotes(query);
}

// Cached entry point. Mirrors getArticles(): memoize the small normalized
// output (not the raw response) for an hour, so upstream is hit at most once
// per hour regardless of traffic.
export const getNotionNotes = unstable_cache(
  buildNotionNotes,
  ["notion-site-notes"],
  { revalidate: CACHE_TTL_SECONDS },
);
