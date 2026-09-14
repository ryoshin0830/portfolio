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
      "col-1": {
        value: { value: { id: "col-1", name: [["memory"]], schema: SCHEMA } },
      },
    },
    block: Object.fromEntries(rows.map((r) => [r.value.value.id, r])),
  },
});

describe("findCreatedTimeKey", () => {
  it("created_time 型のプロパティキーを返す", () => {
    expect(findCreatedTimeKey(SCHEMA)).toBe("lt::");
  });

  it("created_time 型が無ければ null を返す", () => {
    expect(
      findCreatedTimeKey({ title: { name: "Name", type: "title" } }),
    ).toBeNull();
  });

  it("壊れた入力でも落ちない", () => {
    expect(findCreatedTimeKey(null)).toBeNull();
    expect(findCreatedTimeKey("nope")).toBeNull();
  });
});

describe("parseNotionNotes", () => {
  it("タイトル・要約・日付・URL を取り出す", () => {
    const notes = parseNotionNotes(
      queryResponse([
        row(
          "3dbf2fa3-0d97-80af-995d-ecd9e6acea68",
          "codex cliのリモート接続",
          "codex CLI を使う手順。",
          1789382893200,
        ),
      ]),
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
    const notes = parseNotionNotes(
      queryResponse([row("a-b", "タイトルのみ", null, 1000)]),
    );
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
    const notes = parseNotionNotes(
      queryResponse([row("x-1", "   ", null, 1000)]),
    );
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
      getPublicPageDataForDomain: {
        pageId: "page-1",
        spaceId: "space-1",
        publicAccessRole: "reader",
      },
      loadCachedPageChunkV2: chunkResponse,
      queryCollection: queryResponse([row("n-1", "メモ", "要約", 5000)]),
    });
    const notes = await buildNotionNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("メモ");
  });

  it("schema から見つけた created_time キーでソートを指定する", async () => {
    const calls = stubFetch({
      getPublicPageDataForDomain: {
        pageId: "page-1",
        spaceId: "space-1",
        publicAccessRole: "reader",
      },
      loadCachedPageChunkV2: chunkResponse,
      queryCollection: queryResponse([]),
    });
    await buildNotionNotes();
    const query = calls.find((c) => c.url.includes("queryCollection"))!
      .body as { loader: { sort: { property: string; direction: string }[] } };
    expect(query.loader.sort).toEqual([
      { property: "lt::", direction: "descending" },
    ]);
  });

  it("created_time プロパティが無ければソートを空にする（クライアント側で並べ替える）", async () => {
    const noDateSchema = { title: { name: "Name", type: "title" } };
    const calls = stubFetch({
      getPublicPageDataForDomain: {
        pageId: "page-1",
        spaceId: "space-1",
        publicAccessRole: "reader",
      },
      loadCachedPageChunkV2: {
        recordMap: {
          block: chunkResponse.recordMap.block,
          collection: {
            "col-1": { value: { value: { id: "col-1", schema: noDateSchema } } },
          },
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
      getPublicPageDataForDomain: {
        pageId: null,
        spaceId: "space-1",
        publicAccessRole: "none",
      },
    });
    await expect(buildNotionNotes()).rejects.toThrow(/publicAccessRole/);
  });

  it("DB ブロックが見つからなければ投げる", async () => {
    stubFetch({
      getPublicPageDataForDomain: {
        pageId: "page-1",
        spaceId: "space-1",
        publicAccessRole: "reader",
      },
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
