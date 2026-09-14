# Notion 発信フィード統合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `https://ryoshin.notion.site/` の公開データベースを取得し、既存の発信フィード（`#blog`）の 5 番目のソースとして表示する。

**Architecture:** Notion の非公式 JSON API を server-side で叩く独立モジュール `src/lib/notion.ts` を新設する。ID をハードコードせず、ドメイン名だけから `getPublicPageDataForDomain` → `loadCachedPageChunkV2` → `queryCollection` の 3 ステップで行を取得する。取得結果を `NotionNote[]` に正規化し、`buildFeed()` で既存の記事・X ポストと日付順にマージして `WritingFeed` に渡す。

**Tech Stack:** Next.js 15 (App Router, ISR) / React 19 / TypeScript 5 / next-intl / Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-09-14-notion-feed-design.md`

## Global Constraints

- コンテンツ文字列は `messages/{ja,en,zh}.json` が単一ソース。**3 言語を必ず同時に編集する**（`tests/messages.test.ts` がキー構造の一致を強制する）。
- このコードベースで `note` は **note.com** を指す。Notion は `notion` とすること。両者を混同しない。
- `FeedSource` に `"notion"` を追加する。`FeedItem.kind` に `"notion"` を追加する。
- Notion サイトのドメインは `ryoshin`、サイト URL は `https://ryoshin.notion.site`。
- キャッシュは `unstable_cache` で `revalidate: 3600`（`src/lib/articles.ts` と同じ 1 時間）。
- テストから実ネットワークを叩かない。`global.fetch` を fixture でモックする。
- 新セクションは作らない。`src/lib/sections.ts` / `next.config.ts` / `src/components/Navigation.tsx` は変更しない。
- 各タスクの最後に commit する。commit メッセージ末尾に以下 2 行を付ける:
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01EPZd6GQV5NqYANLwv6XGRy
  ```

## 検証済みの API 事実（実装の前提）

```
POST https://ryoshin.notion.site/api/v3/getPublicPageDataForDomain
  → { pageId, spaceId, publicAccessRole: "reader", ... }
POST https://ryoshin.notion.site/api/v3/loadCachedPageChunkV2
  → recordMap: { block, collection_view, collection }   ← collection(schema) を含む
POST https://ryoshin.notion.site/api/v3/queryCollection?src=initial_load
  → { result.reducerResults.collection_group_results.blockIds, recordMap: { block, collection } }
```

- **レコードは二重に包まれている**: `recordMap.block[id]` は `{ spaceId, value: { value: {...}, role } }`。
  実体は `record.value.value`。古い形（`record.value` が実体）にも耐えるよう unwrap ヘルパーを使う。
- **schema は chunk の時点で取れる**ので、`queryCollection` に渡すソートキーを追加リクエストなしで決定できる。
- 実 DB のスキーマ: `"title"=Name(title)`, `"RSOE"=Summary(text)`, `"lt::"=Created time(created_time)`, `"iGmN"=Last edited time(last_edited_time)`, `"qqUX"=Status(status)`
- `created_time` / `last_edited_time` 型は**値が `properties` に入らない**。実体は `block.created_time` / `block.last_edited_time`（ミリ秒 epoch）。
- 行の公開 URL は `https://ryoshin.notion.site/<block.id からハイフンを除去>`。

## File Structure

| ファイル | 役割 |
|---|---|
| `src/types/articles.ts` | 変更。`FeedSource` に `notion`、`FeedItem` に `kind: "notion"` と `summary?`、`NotionNote` を追加 |
| `src/components/icons/BrandIcons.tsx` | 変更。`NotionIcon` 追加、`BRAND_LABEL` / `SourceIcon` に配線 |
| `src/lib/notion.ts` | **新規**。Notion 取得・パース。純粋関数と I/O を分離 |
| `src/lib/notion.test.ts` | **新規**。fixture ベースのパース／フェッチ検証 |
| `src/lib/feed.ts` | 変更。`buildFeed` に第 3 引数 `notes` |
| `src/lib/feed.test.ts` | **新規**。マージと日付ソート |
| `messages/{ja,en,zh}.json` | 変更。`writingFeed.viewOnNotion` 追加、`subtitle` 更新 |
| `src/components/WritingFeed.tsx` | 変更。Notion フィルタ、`summary` 描画、要約を含む検索、Notion への入口リンク |
| `src/components/WritingFeed.test.tsx` | 変更。Notion 関連のテストを追加 |
| `src/app/[locale]/page.tsx` | 変更。`getNotionNotes()` を並列取得して `buildFeed` に渡す |

---

### Task 1: 型定義と Notion ブランドアイコン

**Files:**
- Modify: `src/types/articles.ts`
- Modify: `src/components/icons/BrandIcons.tsx`
- Test: `src/components/icons/BrandIcons.test.tsx`（新規）

**Interfaces:**
- Consumes: なし（最初のタスク）
- Produces:
  - `type FeedSource = "zenn" | "qiita" | "note" | "x" | "notion"`
  - `interface FeedItem { id: string; kind: "article" | "post" | "notion"; text: string; summary?: string; date: string; url: string; sources: FeedSource[]; zennUrl?: string; qiitaUrl?: string; noteUrl?: string }`
  - `interface NotionNote { id: string; title: string; summary?: string; date: string; url: string }`
  - `BRAND_LABEL.notion === "Notion"`、`SourceIcon` が `source="notion"` を描画できる

- [ ] **Step 1: 失敗するテストを書く**

`src/components/icons/BrandIcons.test.tsx` を新規作成:

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { BRAND_LABEL, SourceIcon } from "./BrandIcons";
import type { FeedSource } from "@/types/articles";

/**
 * ブランドアイコンの網羅性テスト。FeedSource を増やしたときに
 * ラベルとアイコンの配線漏れをコミット前に検出する。
 */
const ALL_SOURCES: FeedSource[] = ["zenn", "qiita", "note", "x", "notion"];

describe("BrandIcons", () => {
  afterEach(cleanup);

  it("すべての FeedSource にラベルがある", () => {
    for (const source of ALL_SOURCES) {
      expect(BRAND_LABEL[source]).toBeTruthy();
    }
    expect(BRAND_LABEL.notion).toBe("Notion");
  });

  it("すべての FeedSource が svg を描画する", () => {
    for (const source of ALL_SOURCES) {
      const { container } = render(<SourceIcon source={source} />);
      const svg = container.querySelector("svg");
      expect(svg, `${source} のアイコンが無い`).toBeTruthy();
      expect(svg?.querySelector("path"), `${source} の path が無い`).toBeTruthy();
      cleanup();
    }
  });

  it("notion と note は別のアイコンを描画する（名前衝突の回帰防止）", () => {
    const { container: a } = render(<SourceIcon source="notion" />);
    const notionPath = a.querySelector("path")?.getAttribute("d");
    cleanup();
    const { container: b } = render(<SourceIcon source="note" />);
    const notePath = b.querySelector("path")?.getAttribute("d");
    expect(notionPath).toBeTruthy();
    expect(notionPath).not.toBe(notePath);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/components/icons/BrandIcons.test.tsx`
Expected: FAIL（`BRAND_LABEL.notion` が undefined、`FeedSource` に `"notion"` が無く型エラー）

- [ ] **Step 3: 型を追加**

`src/types/articles.ts` を編集する。

`ArticleSource` は **変更しない**（Zenn/Qiita/note のクロスポスト重複排除専用で、Notion は対象外）。

`FeedSource` を変更:

```ts
// A platform a feed item lives on. Articles come from Zenn/Qiita/note; posts from
// X; notes from the Notion site. NOTE: "note" is note.com — "notion" is the Notion
// site. They are different platforms; do not conflate them.
export type FeedSource = "zenn" | "qiita" | "note" | "x" | "notion";
```

`FeedItem` を変更（`kind` に `"notion"`、`summary` を追加）:

```ts
export interface FeedItem {
  id: string;
  kind: "article" | "post" | "notion";
  text: string;
  // Notion notes carry a short summary alongside the title; articles and posts
  // don't. Rendered as a 2-line clamp under the title and included in search.
  summary?: string;
  date: string; // ISO 8601
  url: string; // primary link
  sources: FeedSource[];
  zennUrl?: string;
  qiitaUrl?: string;
  noteUrl?: string;
}
```

ファイル末尾に `NotionNote` を追加:

```ts
// One row of the public Notion database (ryoshin.notion.site). Fetched
// server-side from Notion's internal JSON API — see src/lib/notion.ts for why
// the HTML cannot be used. `date` is the row's creation time: Notion's
// created_time/last_edited_time are auto-computed properties whose values live
// on the block itself, not in `properties`, and there is no hand-editable Date
// property to override the publish date with.
export interface NotionNote {
  id: string;
  title: string;
  summary?: string;
  date: string; // ISO 8601 (created_time)
  url: string; // https://ryoshin.notion.site/<id without dashes>
}
```

- [ ] **Step 4: Notion アイコンを追加**

`src/components/icons/BrandIcons.tsx` の `NoteIcon` の直後に追加する:

```tsx
// Notion（notion.site）。note.com の NoteIcon とは別物なので混同しないこと。
export function NotionIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
    </svg>
  );
}
```

`BRAND_LABEL` を変更:

```tsx
export const BRAND_LABEL: Record<FeedSource, string> = {
  zenn: "Zenn",
  qiita: "Qiita",
  note: "note",
  x: "X",
  notion: "Notion",
};
```

`SourceIcon` を変更（`notion` の分岐を `x` のフォールバックより**前**に置くこと）:

```tsx
export function SourceIcon({
  source,
  className,
}: {
  source: FeedSource;
  className?: string;
}) {
  if (source === "zenn") return <ZennIcon className={className} />;
  if (source === "qiita") return <QiitaIcon className={className} />;
  if (source === "note") return <NoteIcon className={className} />;
  if (source === "notion") return <NotionIcon className={className} />;
  return <XIcon className={className} />;
}
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx vitest run src/components/icons/BrandIcons.test.tsx && npx tsc --noEmit`
Expected: 3 tests PASS、型エラーなし

- [ ] **Step 6: Commit**

```bash
git add src/types/articles.ts src/components/icons/BrandIcons.tsx src/components/icons/BrandIcons.test.tsx
git commit -m "$(cat <<'EOF'
feat(notion): FeedSource に notion を追加しブランドアイコンを用意する

note.com を指す既存の "note" と衝突しないよう "notion" を新設し、
FeedSource の網羅性をテストで固定する。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EPZd6GQV5NqYANLwv6XGRy
EOF
)"
```

---

### Task 2: `src/lib/notion.ts` — 取得とパース

**Files:**
- Create: `src/lib/notion.ts`
- Test: `src/lib/notion.test.ts`

**Interfaces:**
- Consumes: `NotionNote`（Task 1）
- Produces:
  - `export const NOTION_SITE_URL = "https://ryoshin.notion.site"`
  - `export function parseNotionNotes(query: unknown): NotionNote[]`
  - `export function findCreatedTimeKey(schema: unknown): string | null`
  - `export async function buildNotionNotes(): Promise<NotionNote[]>` — キャッシュなし。テスト対象
  - `export const getNotionNotes: () => Promise<NotionNote[]>` — `unstable_cache` 版。`page.tsx` が使う

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/notion.test.ts` を新規作成:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  parseNotionNotes,
  findCreatedTimeKey,
  buildNotionNotes,
  NOTION_SITE_URL,
} from "./notion";

/**
 * Notion 取得のテスト。実 API は叩かず、実レスポンスの形を写した fixture を使う。
 *
 * 実 API で確認済みの形:
 *  - recordMap のレコードは二重に包まれる: { value: { value: {...}, role } }
 *  - created_time / last_edited_time 型は properties に値を持たず、
 *    実体は block.created_time（ミリ秒 epoch）
 */

const SCHEMA = {
  title: { name: "Name", type: "title" },
  RSOE: { name: "Summary", type: "text" },
  "lt::": { name: "Created time", type: "created_time" },
  iGmN: { name: "Last edited time", type: "last_edited_time" },
  qqUX: { name: "Status", type: "status" },
};

const row = (
  id: string,
  title: string,
  summary: string | null,
  createdMs: number,
) => ({
  spaceId: "space-1",
  value: {
    role: "reader",
    value: {
      id,
      type: "page",
      properties: {
        title: [[title]],
        ...(summary === null ? {} : { RSOE: [[summary]] }),
      },
      created_time: createdMs,
      last_edited_time: createdMs + 1000,
    },
  },
});

const queryResponse = (rows: ReturnType<typeof row>[]) => ({
  result: {
    reducerResults: {
      collection_group_results: { blockIds: rows.map((r) => r.value.value.id) },
    },
  },
  recordMap: {
    collection: {
      "col-1": { value: { value: { id: "col-1", name: [["memory"]], schema: SCHEMA } } },
    },
    block: Object.fromEntries(rows.map((r) => [r.value.value.id, r])),
  },
});

describe("findCreatedTimeKey", () => {
  it("created_time 型のプロパティキーを返す", () => {
    expect(findCreatedTimeKey(SCHEMA)).toBe("lt::");
  });

  it("created_time 型が無ければ null を返す", () => {
    expect(findCreatedTimeKey({ title: { name: "Name", type: "title" } })).toBeNull();
  });

  it("壊れた入力でも落ちない", () => {
    expect(findCreatedTimeKey(null)).toBeNull();
    expect(findCreatedTimeKey("nope")).toBeNull();
  });
});

describe("parseNotionNotes", () => {
  it("タイトル・要約・日付・URL を取り出す", () => {
    const notes = parseNotionNotes(
      queryResponse([row("3dbf2fa3-0d97-80af-995d-ecd9e6acea68", "codex cliのリモート接続", "codex CLI を使う手順。", 1789382893200)]),
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toEqual({
      id: "3dbf2fa3-0d97-80af-995d-ecd9e6acea68",
      title: "codex cliのリモート接続",
      summary: "codex CLI を使う手順。",
      date: new Date(1789382893200).toISOString(),
      url: `${NOTION_SITE_URL}/3dbf2fa30d9780af995decd9e6acea68`,
    });
  });

  it("Summary が無い行は summary を undefined にする", () => {
    const notes = parseNotionNotes(queryResponse([row("a-b", "タイトルのみ", null, 1000)]));
    expect(notes[0].summary).toBeUndefined();
  });

  it("新しい順に並べる", () => {
    const notes = parseNotionNotes(
      queryResponse([
        row("old-1", "古い", null, 1000),
        row("new-1", "新しい", null, 9000),
      ]),
    );
    expect(notes.map((n) => n.title)).toEqual(["新しい", "古い"]);
  });

  it("タイトルが空の行は捨てる", () => {
    const notes = parseNotionNotes(queryResponse([row("x-1", "   ", null, 1000)]));
    expect(notes).toEqual([]);
  });

  it("空の DB では空配列を返す", () => {
    expect(parseNotionNotes(queryResponse([]))).toEqual([]);
  });

  it("想定外の形でも投げずに空配列を返す", () => {
    expect(parseNotionNotes({})).toEqual([]);
    expect(parseNotionNotes(null)).toEqual([]);
  });
});

describe("buildNotionNotes", () => {
  afterEach(() => vi.unstubAllGlobals());

  const chunkResponse = {
    recordMap: {
      block: {
        "view-block": {
          value: {
            value: {
              id: "view-block",
              type: "collection_view",
              collection_id: "col-1",
              view_ids: ["v-1"],
            },
          },
        },
      },
      collection: {
        "col-1": { value: { value: { id: "col-1", schema: SCHEMA } } },
      },
    },
  };

  const stubFetch = (handlers: Record<string, unknown>) => {
    const calls: { url: string; body: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: { body: string }) => {
        calls.push({ url, body: JSON.parse(init.body) });
        const key = Object.keys(handlers).find((k) => url.includes(k));
        if (!key) throw new Error(`unexpected fetch: ${url}`);
        return { ok: true, status: 200, json: async () => handlers[key] };
      }),
    );
    return calls;
  };

  it("3 ステップを辿って行を返す", async () => {
    stubFetch({
      getPublicPageDataForDomain: { pageId: "page-1", spaceId: "space-1", publicAccessRole: "reader" },
      loadCachedPageChunkV2: chunkResponse,
      queryCollection: queryResponse([row("n-1", "メモ", "要約", 5000)]),
    });
    const notes = await buildNotionNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("メモ");
  });

  it("schema から見つけた created_time キーでソートを指定する", async () => {
    const calls = stubFetch({
      getPublicPageDataForDomain: { pageId: "page-1", spaceId: "space-1", publicAccessRole: "reader" },
      loadCachedPageChunkV2: chunkResponse,
      queryCollection: queryResponse([]),
    });
    await buildNotionNotes();
    const query = calls.find((c) => c.url.includes("queryCollection"))!
      .body as { loader: { sort: { property: string; direction: string }[] } };
    expect(query.loader.sort).toEqual([{ property: "lt::", direction: "descending" }]);
  });

  it("created_time プロパティが無ければソートを空にする（クライアント側で並べ替える）", async () => {
    const noDateSchema = { title: { name: "Name", type: "title" } };
    const calls = stubFetch({
      getPublicPageDataForDomain: { pageId: "page-1", spaceId: "space-1", publicAccessRole: "reader" },
      loadCachedPageChunkV2: {
        recordMap: {
          block: chunkResponse.recordMap.block,
          collection: { "col-1": { value: { value: { id: "col-1", schema: noDateSchema } } } },
        },
      },
      queryCollection: queryResponse([]),
    });
    await buildNotionNotes();
    const query = calls.find((c) => c.url.includes("queryCollection"))!
      .body as { loader: { sort: unknown[] } };
    expect(query.loader.sort).toEqual([]);
  });

  it("非公開になったら投げる（空配列をキャッシュさせない）", async () => {
    stubFetch({
      getPublicPageDataForDomain: { pageId: null, spaceId: "space-1", publicAccessRole: "none" },
    });
    await expect(buildNotionNotes()).rejects.toThrow(/publicAccessRole/);
  });

  it("DB ブロックが見つからなければ投げる", async () => {
    stubFetch({
      getPublicPageDataForDomain: { pageId: "page-1", spaceId: "space-1", publicAccessRole: "reader" },
      loadCachedPageChunkV2: { recordMap: { block: {}, collection: {} } },
    });
    await expect(buildNotionNotes()).rejects.toThrow(/database block/i);
  });

  it("HTTP エラーは投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })),
    );
    await expect(buildNotionNotes()).rejects.toThrow(/503/);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/notion.test.ts`
Expected: FAIL（`./notion` が存在しない）

- [ ] **Step 3: `src/lib/notion.ts` を実装**

```ts
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
  const titleKey =
    entries.find(([, s]) => s.type === "title")?.[0] ?? "title";
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
    source: { type: "collection", id: view.collection_id, spaceId: site.spaceId },
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
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/notion.test.ts && npx tsc --noEmit`
Expected: 全 PASS、型エラーなし

- [ ] **Step 5: Commit**

```bash
git add src/lib/notion.ts src/lib/notion.test.ts
git commit -m "$(cat <<'EOF'
feat(notion): 公開 Notion サイトから記事を取得するモジュールを追加する

notion.site は完全クライアント描画で HTML から中身が取れないため、
内部 JSON API を 3 ステップで辿る。ID はハードコードせずドメイン名
だけから探索するので、ページやビューを作り直しても壊れない。

非公開化・DB ブロック消失・HTTP エラーは throw し、空配列が 1 時間
キャッシュされるのを防ぐ。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EPZd6GQV5NqYANLwv6XGRy
EOF
)"
```

---

### Task 3: `buildFeed` に Notion を合流させる

**Files:**
- Modify: `src/lib/feed.ts`
- Test: `src/lib/feed.test.ts`（新規）

**Interfaces:**
- Consumes: `FeedItem`, `NotionNote`（Task 1）
- Produces: `buildFeed(articles: MergedArticle[], posts: XPost[], notes?: NotionNote[]): FeedItem[]`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/feed.test.ts` を新規作成:

```ts
import { describe, it, expect } from "vitest";
import { buildFeed } from "./feed";
import type { MergedArticle, NotionNote, XPost } from "@/types/articles";

/**
 * buildFeed のテスト。記事・X ポスト・Notion メモを 1 本の日付降順ストリームに
 * まとめる純粋関数。日付は UTC("Z") と "+09:00" が混在するため、文字列比較では
 * なく Date.parse で比較していることを固定する。
 */

const articles: MergedArticle[] = [
  { title: "Zenn 記事", date: "2026-05-01T00:00:00.000Z", zennUrl: "https://zenn.dev/a" },
  { title: "クロスポスト記事", date: "2026-03-01T00:00:00.000Z", zennUrl: "https://zenn.dev/b", qiitaUrl: "https://qiita.com/b" },
];

const posts: XPost[] = [
  { id: "p1", text: "ポスト", date: "2026-04-01T00:00:00.000Z", url: "https://x.com/u/status/p1" },
];

const notes: NotionNote[] = [
  { id: "n1", title: "Notion メモ", summary: "要約テキスト", date: "2026-06-01T00:00:00.000Z", url: "https://ryoshin.notion.site/n1" },
  { id: "n2", title: "要約なしメモ", date: "2026-02-01T00:00:00.000Z", url: "https://ryoshin.notion.site/n2" },
];

describe("buildFeed", () => {
  it("notes を省略しても従来どおり動く", () => {
    const feed = buildFeed(articles, posts);
    expect(feed.map((i) => i.text)).toEqual(["Zenn 記事", "ポスト", "クロスポスト記事"]);
  });

  it("3 種類を日付降順に 1 本化する", () => {
    const feed = buildFeed(articles, posts, notes);
    expect(feed.map((i) => i.text)).toEqual([
      "Notion メモ",
      "Zenn 記事",
      "ポスト",
      "クロスポスト記事",
      "要約なしメモ",
    ]);
  });

  it("Notion は kind:notion / sources:[notion] になる", () => {
    const feed = buildFeed([], [], notes);
    expect(feed[0].kind).toBe("notion");
    expect(feed[0].sources).toEqual(["notion"]);
    expect(feed[0].url).toBe("https://ryoshin.notion.site/n1");
    expect(feed[0].id).toBe("n1");
  });

  it("summary を引き継ぎ、無い場合は undefined のままにする", () => {
    const feed = buildFeed([], [], notes);
    expect(feed[0].summary).toBe("要約テキスト");
    expect(feed[1].summary).toBeUndefined();
  });

  it("記事と X ポストには summary を付けない", () => {
    const feed = buildFeed(articles, posts);
    expect(feed.every((i) => i.summary === undefined)).toBe(true);
  });

  it("Notion は kind:article ではないので Hero のフィルタから外れる", () => {
    // page.tsx の Hero ティーザーは kind === "article" で絞っている。
    const feed = buildFeed(articles, posts, notes);
    const heroItems = feed.filter((i) => i.kind === "article");
    expect(heroItems.map((i) => i.text)).toEqual(["Zenn 記事", "クロスポスト記事"]);
  });

  it("タイムゾーン表記が混在しても正しく並べる", () => {
    const feed = buildFeed(
      [{ title: "JST 記事", date: "2026-01-01T09:00:00+09:00" }], // = 00:00Z
      [{ id: "p", text: "UTC ポスト", date: "2026-01-01T01:00:00.000Z", url: "u" }],
      [],
    );
    expect(feed.map((i) => i.text)).toEqual(["UTC ポスト", "JST 記事"]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/feed.test.ts`
Expected: FAIL（`buildFeed` が第 3 引数を受け取らない / Notion 項目が出ない）

- [ ] **Step 3: `src/lib/feed.ts` を実装**

先頭の import に `NotionNote` を追加し、シグネチャと本体を変更する。

```ts
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
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/feed.test.ts && npx tsc --noEmit`
Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/feed.ts src/lib/feed.test.ts
git commit -m "$(cat <<'EOF'
feat(notion): buildFeed に Notion メモを合流させる

kind を "article" と分けることで、page.tsx の Hero ティーザー
(kind === "article") から追加コードなしで除外される。
テストの無かった buildFeed にテストを用意した。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EPZd6GQV5NqYANLwv6XGRy
EOF
)"
```

---

### Task 4: i18n メッセージ（3 言語）

**Files:**
- Modify: `messages/ja.json`
- Modify: `messages/en.json`
- Modify: `messages/zh.json`

**Interfaces:**
- Consumes: なし
- Produces: `writingFeed.viewOnNotion`（3 言語）、更新された `writingFeed.subtitle`

- [ ] **Step 1: テストが現状通ることを確認（基準取り）**

Run: `npx vitest run tests/messages.test.ts`
Expected: PASS（この時点では 3 言語のキー構造が一致している）

- [ ] **Step 2: 3 言語すべてを編集**

各ファイルの `writingFeed` オブジェクト内で、`subtitle` を差し替え、`viewOnX` の**直後**に `viewOnNotion` を追加する。

`messages/ja.json`:
```json
"subtitle": "Zenn・Qiita・note での記事と、X でのポスト、Notion でのメモ。",
```
```json
"viewOnNotion": "Notionで見る",
```

`messages/en.json`:
```json
"subtitle": "Articles on Zenn, Qiita and note, posts on X, and notes on Notion.",
```
```json
"viewOnNotion": "View on Notion",
```

`messages/zh.json`:
```json
"subtitle": "在 Zenn・Qiita・note 的文章，X 上的动态，以及 Notion 的随手记。",
```
```json
"viewOnNotion": "在 Notion 查看",
```

- [ ] **Step 3: キー構造の一致を確認**

Run: `npx vitest run tests/messages.test.ts`
Expected: PASS（3 言語とも同じキーを持つ）

片方だけ編集して失敗した場合は、抜けている言語に同じキーを足す。

- [ ] **Step 4: Commit**

```bash
git add messages/ja.json messages/en.json messages/zh.json
git commit -m "$(cat <<'EOF'
feat(notion): 発信セクションの文言に Notion を追加する

ja/en/zh の 3 言語に viewOnNotion を追加し、subtitle を Notion 込みに
更新する。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EPZd6GQV5NqYANLwv6XGRy
EOF
)"
```

---

### Task 5: `WritingFeed` の表示・フィルタ・検索

**Files:**
- Modify: `src/components/WritingFeed.tsx`
- Test: `src/components/WritingFeed.test.tsx`

**Interfaces:**
- Consumes: `FeedItem.summary`, `FeedSource "notion"`（Task 1）、`writingFeed.viewOnNotion`（Task 4）
- Produces: UI のみ（他タスクが依存する関数は無い）

- [ ] **Step 1: 失敗するテストを書く**

`src/components/WritingFeed.test.tsx` の `items` 配列の末尾に Notion 項目を 1 件足す:

```tsx
  {
    id: "4",
    kind: "notion",
    text: "codex cli のリモート接続",
    summary: "codex CLI を使って WebSocket アドレスへ接続する手順。",
    date: "2026-02-01T00:00:00.000Z",
    url: "https://ryoshin.notion.site/4",
    sources: ["notion"],
  },
```

既存の「初期状態では全件表示」テストの期待値を `3` → `4` に、「該当なしのときは…クリアで全件に戻る」の期待値を `3` → `4` に変更する。

ファイル末尾に新しい describe を追加:

```tsx
describe("WritingFeed の Notion 対応", () => {
  afterEach(cleanup);

  it("Notion フィルタで Notion の項目だけに絞れる", () => {
    renderFeed();
    fireEvent.click(screen.getByRole("button", { name: "Notion" }));
    const list = screen.getByRole("list");
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(within(list).getByText(/codex cli のリモート接続/)).toBeTruthy();
  });

  it("Notion 項目は要約を表示する", () => {
    renderFeed();
    expect(
      screen.getByText(/WebSocket アドレスへ接続する手順/),
    ).toBeTruthy();
  });

  it("要約の語でも検索にヒットする", () => {
    renderFeed();
    fireEvent.change(searchBox(), { target: { value: "WebSocket" } });
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(within(list).getByText(/codex cli のリモート接続/)).toBeTruthy();
  });

  it("タイトルと要約にまたがる複数語検索も AND で効く", () => {
    renderFeed();
    fireEvent.change(searchBox(), { target: { value: "codex WebSocket" } });
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
  });

  it("要約を持たない項目では要約行を描画しない", () => {
    renderFeed();
    // X ポスト（id:3）には summary が無い
    fireEvent.click(screen.getByRole("button", { name: "X" }));
    const list = screen.getByRole("list");
    expect(list.querySelectorAll("[data-testid='feed-summary']")).toHaveLength(0);
  });

  it("Notion サイトへの入口リンクがある", () => {
    renderFeed();
    const link = screen.getByRole("link", { name: new RegExp(ja.writingFeed.viewOnNotion) });
    expect(link.getAttribute("href")).toBe("https://ryoshin.notion.site/");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/components/WritingFeed.test.tsx`
Expected: FAIL（Notion ボタンが無い、要約が描画されない、入口リンクが無い）

- [ ] **Step 3: 検索が要約も対象にするよう変更**

`src/components/WritingFeed.tsx` の `filtered` を変更する:

```tsx
  const filtered = useMemo(() => {
    const bySource =
      filter === "all" ? items : items.filter((i) => i.sources.includes(filter));
    if (terms.length === 0) return bySource;
    return bySource.filter((i) => {
      // Notion notes carry a summary; searching only the title would miss the
      // part of the note that actually describes it.
      const haystack = `${i.text} ${i.summary ?? ""}`.toLocaleLowerCase(locale);
      return terms.every((term) => haystack.includes(term));
    });
  }, [items, filter, terms, locale]);
```

- [ ] **Step 4: フィルタボタンに Notion を追加**

```tsx
  const filters: { key: Filter; label: string; source?: FeedSource }[] = [
    { key: "all", label: t("filterAll") },
    { key: "zenn", label: "Zenn", source: "zenn" },
    { key: "qiita", label: "Qiita", source: "qiita" },
    { key: "note", label: "note", source: "note" },
    { key: "x", label: "X", source: "x" },
    { key: "notion", label: "Notion", source: "notion" },
  ];
```

- [ ] **Step 5: 要約を描画する**

行の `<span className="flex-1 ...">` ブロックを、タイトルと要約を縦に積む形へ変更する。既存の `<span className="flex items-start gap-2.5">` の中身を次に差し替える:

```tsx
                  <span className="flex items-start gap-2.5">
                    <span className="flex shrink-0 items-center gap-1.5 text-lg translate-y-0.5 md:text-xl">
                      {i.sources.map((s) => (
                        <SourceMark key={s} source={s} />
                      ))}
                    </span>
                    <span className="flex flex-1 flex-col gap-1">
                      <span
                        className={`font-semibold tracking-tight text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] transition-colors ${
                          i.kind === "post"
                            ? "text-base leading-relaxed line-clamp-2 font-medium"
                            : "text-lg md:text-xl"
                        }`}
                      >
                        {highlight(i.text)}
                        <span className="sr-only"> — {tc("opensInNewTab")}</span>
                      </span>
                      {/* Notion notes ship a short summary; it is what makes a
                          terse note title legible in the list. */}
                      {i.summary && (
                        <span
                          data-testid="feed-summary"
                          className="prose-body line-clamp-2 text-sm text-[color:var(--color-ink-soft)]"
                        >
                          {highlight(i.summary)}
                        </span>
                      )}
                    </span>
                    <ArrowUpRight
                      size={16}
                      aria-hidden
                      className="mt-1 shrink-0 self-start text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-accent)] transition-colors md:mt-0"
                    />
                  </span>
```

- [ ] **Step 6: Notion サイトへの入口リンクを追加**

ファイル冒頭の import に追加:

```tsx
import { NOTION_SITE_URL } from "@/lib/notion";
```

プロフィールリンク行の「Xで見る」の `</Link>` の**直後**に追加する:

```tsx
          <Link
            href={`${NOTION_SITE_URL}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent text-base"
          >
            {t("viewOnNotion")}
            <ArrowUpRight size={16} aria-hidden />
            <span className="sr-only"> — {tc("opensInNewTab")}</span>
          </Link>
```

> **注意:** `src/lib/notion.ts` は `next/cache` を import している。`WritingFeed` は
> `"use client"` なので、定数 1 個のためにサーバー専用モジュールを巻き込むのは避ける。
> ビルドが通らない、またはクライアントバンドルに `next/cache` が入る場合は、
> `NOTION_SITE_URL` をハードコードした文字列 `"https://ryoshin.notion.site/"` に
> 置き換え、import を削除すること。Step 7 のビルドで判定する。

- [ ] **Step 7: テストとビルドが通ることを確認**

Run: `npx vitest run src/components/WritingFeed.test.tsx && npx tsc --noEmit && npm run build`
Expected: 全 PASS、ビルド成功

ビルドが `next/cache` 関連で失敗したら Step 6 の注意書きに従って修正し、再実行する。

- [ ] **Step 8: Commit**

```bash
git add src/components/WritingFeed.tsx src/components/WritingFeed.test.tsx
git commit -m "$(cat <<'EOF'
feat(notion): 発信フィードに Notion のフィルタ・要約・入口を追加する

Notion の行はタイトル下に要約を 2 行クランプで表示し、検索も要約を
対象に含める。一覧下部に Notion サイトへの入口リンクを置く。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EPZd6GQV5NqYANLwv6XGRy
EOF
)"
```

---

### Task 6: `page.tsx` の配線と全体検証

**Files:**
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `getNotionNotes()`（Task 2）、`buildFeed(articles, posts, notes)`（Task 3）
- Produces: 完成した機能

- [ ] **Step 1: `page.tsx` を配線**

import に追加:

```tsx
import { getNotionNotes } from "@/lib/notion";
```

`Promise.all` を 3 本に拡張し、`buildFeed` に渡す:

```tsx
  const [articles, posts, notes] = await Promise.all([
    getArticles().catch((err) => {
      console.error("[feed] articles fetch failed:", err);
      return [];
    }),
    getPosts().catch((err) => {
      console.error("[feed] X posts fetch failed:", err);
      return [];
    }),
    // Notion is an undocumented API behind Cloudflare; a failure must not take
    // the page down, so it degrades to an empty list like the other sources.
    getNotionNotes().catch((err) => {
      console.error("[feed] Notion notes fetch failed:", err);
      return [];
    }),
  ]);
  const feed = buildFeed(articles, posts, notes);
```

`heroLatest` 周辺のコメントを実態に合わせる:

```tsx
  // Hero teaser: surface the latest substantial writing (Zenn/Qiita/note
  // articles); fall back to X posts only when there are no articles. Notion
  // notes are deliberately excluded — they use kind "notion", so this filter
  // leaves them out. The full date-sorted archive lives in WritingFeed (#blog).
```

- [ ] **Step 2: 全テスト・型・lint・ビルドを通す**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: すべて成功

- [ ] **Step 3: 実データで動作確認**

Run: `npm run dev`

別ターミナルまたはブラウザで `http://localhost:3000/ja` を開き、次を目視確認する:

1. `#blog`（発信）セクションに `Notion` フィルタボタンがある
2. `Notion` を押すと Notion のメモだけが残る
3. Notion の行にタイトルと要約の 2 行が出ている
4. Hero の「最新の発信」3 件に Notion が**入っていない**
5. 一覧下部に「Notionで見る ↗」があり、`https://ryoshin.notion.site/` を開く
6. ダークモードでアイコンと要約の色が破綻していない

`/en` と `/zh` でも subtitle と「View on Notion」「在 Notion 查看」を確認する。

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "$(cat <<'EOF'
feat(notion): ページで Notion メモを取得してフィードに流す

他ソースと同じく失敗時は空配列に degrade し、Function Logs に残す。

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EPZd6GQV5NqYANLwv6XGRy
EOF
)"
```

- [ ] **Step 5: PR を作成**

```bash
git push -u origin feat/notion-feed
```

PR 本文にコードブロックや表を含めるため、`gh-pr-body` スキルの手順に従って
ファイル経由で本文を渡すこと（シェルのエスケープでコードフェンスが壊れるため）。

---

## Self-Review

**1. Spec coverage**

| spec の項目 | 対応タスク |
|---|---|
| `src/lib/notion.ts` 独立モジュール・3 ステップ探索・ID 非ハードコード | Task 2 |
| ソートキーをスキーマから発見、無ければクライアント側ソート | Task 2（`findCreatedTimeKey` + `parseNotionNotes` の sort） |
| `unstable_cache` 1 時間 | Task 2 |
| `publicAccessRole !== "reader"` で throw | Task 2 |
| `FeedSource`/`FeedItem.kind`/`summary`/`NotionNote` 型 | Task 1 |
| `note` と `notion` の名前衝突回避 | Task 1（型コメント + アイコン差分テスト） |
| `buildFeed` 第 3 引数 | Task 3 |
| Hero から除外 | Task 3 のテスト + Task 6 のコメント（`kind` 分離により追加コード不要） |
| フィルタ・要約 2 行・要約を含む検索 | Task 5 |
| 入口リンク | Task 5 |
| Notion アイコン | Task 1 |
| i18n 3 言語 | Task 4 |
| `sections.ts`/`next.config.ts`/`Navigation.tsx` 不変更 | 全タスクで触れていない |
| テスト 3 本（notion / feed / WritingFeed） | Task 2, 3, 5 |
| ネットワークを叩かない | Task 2（`vi.stubGlobal("fetch")`） |

**2. Placeholder scan:** 「適切にエラーハンドリング」等の曖昧な指示なし。全コードブロックが実コード。

**3. Type consistency:** `buildNotionNotes` / `parseNotionNotes` / `findCreatedTimeKey` / `NOTION_SITE_URL` / `getNotionNotes` の名前は Task 2 の定義と Task 5・6 の利用で一致。`NotionNote` のフィールド名（`id`/`title`/`summary`/`date`/`url`）は Task 1 の定義、Task 2 のテスト期待値、Task 3 のマージで一致。`FeedItem.kind` の `"notion"` は Task 1・3・5 で一致。

**4. 既知の判断保留:** Task 5 Step 6 の `NOTION_SITE_URL` import は、クライアントコンポーネントがサーバー専用モジュール（`next/cache`）を参照する形になる。ビルドで判定し、問題があればハードコード文字列に落とす手順を明記済み。
