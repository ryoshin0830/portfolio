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
