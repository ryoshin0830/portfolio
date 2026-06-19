import { describe, it, expect } from "vitest";
import { buildInstructions } from "./scheduling-agent";

describe("scheduling-agent", () => {
  describe("buildInstructions", () => {
    it("should strictly enforce bullet list formatting with both date and time", () => {
      const instructions = buildInstructions();
      
      // Ensure the instructions explicitly forbid grouping
      expect(instructions).toContain("DO NOT group times under date headers");
      
      // Ensure the instructions require both date and time on the same line
      expect(instructions).toContain("EACH bullet point MUST contain BOTH the date and the time on the SAME line");
      
      // Ensure it provides a concrete example
      expect(instructions).toContain("- 6/21 (Sun) 17:00 - 18:00");
      expect(instructions).toContain("- 6/22（月）20:00 - 20:30");
      
      // Ensure it explains the UI behavior
      expect(instructions).toContain("clickable buttons");
    });
    
    it("should include security rules to not reveal internal details", () => {
      const instructions = buildInstructions();
      expect(instructions).toContain("Never reveal internal tool names, parameters, or JSON to the visitor");
      expect(instructions).toContain("cannot see private calendar details");
    });
  });
});
