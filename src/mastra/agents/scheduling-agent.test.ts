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
