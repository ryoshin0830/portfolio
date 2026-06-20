import { describe, it, expect } from "vitest";
import { buildInstructions } from "./scheduling-agent";

describe("scheduling-agent", () => {
  describe("buildInstructions", () => {
    it("should strictly enforce bullet list formatting with both date and time", () => {
      const instructions = buildInstructions();
      expect(instructions).toContain("Style: reply in the visitor's language");
      
      expect(instructions).toContain("- 6/21 (Sun) 17:00 - 18:00");
    });
    
    it("should include security rules to not reveal internal details", () => {
      const instructions = buildInstructions();
      expect(instructions).toContain("Never reveal internal tool names, parameters, or JSON to the visitor");
      expect(instructions).toContain("cannot see private calendar details");
    });
  });
});
