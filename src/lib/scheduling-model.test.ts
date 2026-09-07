import { beforeEach, describe, expect, it, vi } from "vitest";

const { createOpenRouterMock, providerMock } = vi.hoisted(() => ({
  createOpenRouterMock: vi.fn(),
  providerMock: vi.fn(),
}));

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: createOpenRouterMock,
}));

import {
  createSchedulingModel,
  SCHEDULING_MODEL_ID,
  SCHEDULING_REASONING_EFFORT,
} from "./scheduling-model";

describe("scheduling model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createOpenRouterMock.mockReturnValue(providerMock);
  });

  it("creates GPT-5.6 Luna with strict OpenRouter reasoning settings", () => {
    const expectedModel = { modelId: "test-model" };
    providerMock.mockReturnValue(expectedModel);

    const model = createSchedulingModel("test-api-key");

    expect(SCHEDULING_MODEL_ID).toBe("openai/gpt-5.6-luna");
    expect(SCHEDULING_REASONING_EFFORT).toBe("xhigh");
    expect(createOpenRouterMock).toHaveBeenCalledWith({
      apiKey: "test-api-key",
      compatibility: "strict",
      reasoning: { effort: "xhigh" },
    });
    expect(providerMock).toHaveBeenCalledWith("openai/gpt-5.6-luna");
    expect(model).toBe(expectedModel);
  });

  it("keeps the model settings when the API key is undefined", () => {
    providerMock.mockReturnValue({ modelId: "test-model" });

    createSchedulingModel(undefined);

    expect(createOpenRouterMock).toHaveBeenCalledWith({
      apiKey: undefined,
      compatibility: "strict",
      reasoning: { effort: "xhigh" },
    });
  });
});
