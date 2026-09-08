import { describe, it, expect } from "vitest";
import { buildInstructions } from "./scheduling-agent";
import { DEFAULT_CONFIG } from "@/lib/scheduling";

describe("scheduling-agent", () => {
  describe("buildInstructions", () => {
    it("should strictly enforce bullet list formatting with both date and time", () => {
      const instructions = buildInstructions();
      expect(instructions).toContain("Style: be concise, warm, and highly engaging");
      expect(instructions).toContain("EACH bullet point MUST contain BOTH the date and the time");
      // 日付+時刻の書式例が含まれている
      expect(instructions).toContain("6/21 (");
      expect(instructions).toContain("17:00 - 18:00");
    });

    it("should include security rules to not reveal internal details", () => {
      const instructions = buildInstructions();
      expect(instructions).toContain("Never reveal internal tool names, parameters, or JSON to the visitor");
      expect(instructions).toContain("cannot see private calendar details");
    });

    it("should contain the current timezone", () => {
      const instructions = buildInstructions();
      expect(instructions).toContain("Asia/Tokyo");
    });

    it("should contain SECURITY section keyword", () => {
      const instructions = buildInstructions();
      expect(instructions).toContain("SECURITY");
      expect(instructions).toContain("never event titles");
    });

    it("asks for a one-line acknowledgement before the find-slots call", () => {
      // 1 メッセージで LLM を 2 回呼ぶ構造なので、1 回目が黙って終わると最初の
      // 文字が出るまで 2 回目の応答を待つことになる。1 回目に一言返させると
      // 体感の待ち時間がツール実行前まで前倒しになる。
      const instructions = buildInstructions();
      expect(instructions).toContain("before calling find-slots");
    });

    it("does not embed quick-reply chip HTML in the prompt", () => {
      // チップは静的なので、毎ターン LLM に ~700 トークンの Tailwind 付き HTML を
      // 出力させるのは prefill も decode も無駄だった。クライアント描画に移した。
      const instructions = buildInstructions();
      expect(instructions).not.toContain("action:suggest");
      expect(instructions).not.toContain("px-4 py-2 rounded-full");
      expect(instructions).not.toContain("<div class=");
    });

    it("keeps the prompt small enough to stay cheap to prefill", () => {
      // 削減前は 6,846 文字（≈2,000 トークン）。チップ HTML を外した分を固定する。
      expect(buildInstructions().length).toBeLessThan(3500);
    });

    it("should contain booking rules with config startHour and endHour", () => {
      const instructions = buildInstructions();
      expect(instructions).toContain(`${DEFAULT_CONFIG.startHour}:00`);
      // endHour=24 は "midnight (24:00)" として表現される
      if (DEFAULT_CONFIG.endHour >= 24) {
        expect(instructions).toContain("midnight (24:00)");
      } else {
        expect(instructions).toContain(`${DEFAULT_CONFIG.endHour}:00`);
      }
    });
  });
});
