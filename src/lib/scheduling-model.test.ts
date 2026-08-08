import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createDeepSeekMock, providerMock } = vi.hoisted(() => ({
  createDeepSeekMock: vi.fn(),
  providerMock: vi.fn(),
}));

vi.mock("@ai-sdk/deepseek", () => ({
  createDeepSeek: createDeepSeekMock,
}));

import {
  createSchedulingModel,
  SCHEDULING_MODEL_ID,
} from "./scheduling-model";

const ROOT = path.resolve(__dirname, "../..");
const consumers = [
  "src/lib/scheduling.ts",
  "src/mastra/agents/scheduling-agent.ts",
];

describe("scheduling model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createDeepSeekMock.mockReturnValue(providerMock);
  });

  it("creates the DeepSeek V4 Flash model with the provided API key", () => {
    const expectedModel = { id: "test-model" };
    providerMock.mockReturnValue(expectedModel);

    const model = createSchedulingModel("test-api-key");

    expect(SCHEDULING_MODEL_ID).toBe("deepseek-v4-flash");
    expect(createDeepSeekMock).toHaveBeenCalledWith({ apiKey: "test-api-key" });
    expect(providerMock).toHaveBeenCalledWith("deepseek-v4-flash");
    expect(model).toBe(expectedModel);
  });

  it.each(consumers)("wires %s through the shared model factory", (file) => {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");

    expect(source).toContain("createSchedulingModel");
    expect(source).not.toContain("deepseek-chat");
  });
});
