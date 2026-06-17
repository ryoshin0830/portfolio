import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import WritingFeed from "./WritingFeed";
import type { FeedItem } from "@/types/articles";
import ja from "../../messages/ja.json";

/**
 * WritingFeed（発信フィード）の検索機能のテスト。
 *
 * 検索はサーバーで取得済みの FeedItem[] をクライアント側で絞り込む（追加フェッチ
 * なし）。タイトル/本文の部分一致・複数語 AND・大文字小文字非依存・ソースフィルタ
 * との併用・クリア・該当なし表示を検証する。
 */

const items: FeedItem[] = [
  {
    id: "1",
    kind: "article",
    text: "Next.js 15 で作るポートフォリオ",
    date: "2026-05-01T00:00:00.000Z",
    url: "https://example.com/1",
    sources: ["zenn"],
    zennUrl: "https://example.com/1",
  },
  {
    id: "2",
    kind: "article",
    text: "TypeScript の型テスト入門",
    date: "2026-04-01T00:00:00.000Z",
    url: "https://example.com/2",
    sources: ["qiita"],
    qiitaUrl: "https://example.com/2",
  },
  {
    id: "3",
    kind: "post",
    text: "今日は LangGraph を触っていた",
    date: "2026-03-01T00:00:00.000Z",
    url: "https://example.com/3",
    sources: ["x"],
  },
];

function renderFeed() {
  return render(
    <NextIntlClientProvider locale="ja" messages={ja}>
      <WritingFeed items={items} />
    </NextIntlClientProvider>,
  );
}

function searchBox() {
  return screen.getByRole("searchbox") as HTMLInputElement;
}

describe("WritingFeed search", () => {
  afterEach(cleanup);


  it("初期状態では全件表示し、検索ボックスを備える", () => {
    renderFeed();
    expect(searchBox()).toBeTruthy();
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("入力でタイトル/本文を部分一致フィルタする", () => {
    renderFeed();
    fireEvent.change(searchBox(), { target: { value: "TypeScript" } });
    const list = screen.getByRole("list");
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(within(list).getByText(/型テスト入門/)).toBeTruthy();
  });

  it("大文字小文字を区別しない", () => {
    renderFeed();
    fireEvent.change(searchBox(), { target: { value: "typescript" } });
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
  });

  it("複数語はすべて含む項目だけに絞る（AND）", () => {
    renderFeed();
    fireEvent.change(searchBox(), { target: { value: "Next ポートフォリオ" } });
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
    // 片方しか含まない検索は 0 件
    fireEvent.change(searchBox(), { target: { value: "Next 入門" } });
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("該当なしのときは noResults を表示し、クリアで全件に戻る", () => {
    renderFeed();
    fireEvent.change(searchBox(), { target: { value: "存在しない語" } });
    expect(screen.queryByRole("list")).toBeNull();
    // クリアボタン（空状態のリンク or 入力横の×）で全件復帰
    const clear = screen.getAllByRole("button", {
      name: ja.writingFeed.clearSearch,
    })[0];
    fireEvent.click(clear);
    expect(searchBox().value).toBe("");
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(3);
  });

  it("ソースフィルタと検索を併用できる", () => {
    renderFeed();
    // X だけに絞る
    fireEvent.click(screen.getByRole("button", { name: "X" }));
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
    // さらに検索で X 投稿に一致しない語 → 0 件
    fireEvent.change(searchBox(), { target: { value: "TypeScript" } });
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("一致語をハイライト（mark）する", () => {
    renderFeed();
    fireEvent.change(searchBox(), { target: { value: "TypeScript" } });
    const list = screen.getByRole("list");
    const mark = list.querySelector("mark");
    expect(mark?.textContent).toBe("TypeScript");
  });
});
