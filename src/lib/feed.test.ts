import { describe, it, expect } from "vitest";
import { buildFeed } from "./feed";
import type { MergedArticle, NotionNote, XPost } from "@/types/articles";

/**
 * buildFeed のテスト。記事・X ポスト・Notion メモを 1 本の日付降順ストリームに
 * まとめる純粋関数。日付は UTC("Z") と "+09:00" が混在するため、文字列比較では
 * なく Date.parse で比較していることを固定する。
 */

const articles: MergedArticle[] = [
  {
    title: "Zenn 記事",
    date: "2026-05-01T00:00:00.000Z",
    zennUrl: "https://zenn.dev/a",
  },
  {
    title: "クロスポスト記事",
    date: "2026-03-01T00:00:00.000Z",
    zennUrl: "https://zenn.dev/b",
    qiitaUrl: "https://qiita.com/b",
  },
];

const posts: XPost[] = [
  {
    id: "p1",
    text: "ポスト",
    date: "2026-04-01T00:00:00.000Z",
    url: "https://x.com/u/status/p1",
  },
];

const notes: NotionNote[] = [
  {
    id: "n1",
    title: "Notion メモ",
    summary: "要約テキスト",
    date: "2026-06-01T00:00:00.000Z",
    url: "https://ryoshin.notion.site/n1",
  },
  {
    id: "n2",
    title: "要約なしメモ",
    date: "2026-02-01T00:00:00.000Z",
    url: "https://ryoshin.notion.site/n2",
  },
];

describe("buildFeed", () => {
  it("notes を省略しても従来どおり動く", () => {
    const feed = buildFeed(articles, posts);
    expect(feed.map((i) => i.text)).toEqual([
      "Zenn 記事",
      "ポスト",
      "クロスポスト記事",
    ]);
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
    expect(heroItems.map((i) => i.text)).toEqual([
      "Zenn 記事",
      "クロスポスト記事",
    ]);
  });

  it("タイムゾーン表記が混在しても正しく並べる", () => {
    const feed = buildFeed(
      [{ title: "JST 記事", date: "2026-01-01T09:00:00+09:00" }], // = 00:00Z
      [
        {
          id: "p",
          text: "UTC ポスト",
          date: "2026-01-01T01:00:00.000Z",
          url: "u",
        },
      ],
      [],
    );
    expect(feed.map((i) => i.text)).toEqual(["UTC ポスト", "JST 記事"]);
  });
});
