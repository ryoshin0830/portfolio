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

    it("no longer handles the initial proposal (the UI renders it without an LLM)", () => {
      // 初回表示は /api/schedule/initial-slots + pickInitialSlots で決定論的に描画する。
      // エージェントに投げていた頃は LLM 2 回で実測 15 秒かかっていた。
      const instructions = buildInstructions();
      expect(instructions).not.toContain("PROPOSE_INITIAL_SLOTS");
    });

    it("detects the visitor language from their own message, not a locale suffix", () => {
      const instructions = buildInstructions();
      expect(instructions).toContain("language of the visitor's own message");
    });

    it("asks for a compact SUGGEST line instead of chip HTML", () => {
      // 旧実装は Tailwind 付き <a href="action:suggest"> を毎ターン ~700 トークン
      // 生成させていた（しかも内容は固定）。~25 トークンの 1 行に置き換える。
      const instructions = buildInstructions();
      expect(instructions).toContain("SUGGEST:");
      expect(instructions).toContain("|");
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
      // 1 メッセージで LLM を 2 回呼ぶので prefill の肥大が体感速度に直接効く。
      // 防ぎたいのは「テンプレ HTML の塊が戻ってくること」。チップ HTML を
      // ベタ書きしていた頃は 6,846 文字で、1 言語ぶんのブロックだけで約 1,430
      // 文字あった。4,200 なら 1 ブロックの復活でも検出でき、かつ正当な指示文の
      // 追加を過度に縛らない。
      expect(buildInstructions().length).toBeLessThan(4200);
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
