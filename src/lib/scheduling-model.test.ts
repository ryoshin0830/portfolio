import { beforeEach, describe, expect, it, vi } from "vitest";

const { createOpenRouterMock, providerMock } = vi.hoisted(() => ({
  createOpenRouterMock: vi.fn(),
  providerMock: vi.fn(),
}));

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: createOpenRouterMock,
}));

import { createSchedulingModel, SCHEDULING_MODEL_ID } from "./scheduling-model";

describe("scheduling model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createOpenRouterMock.mockReturnValue(providerMock);
  });

  it("creates GLM-5.3-Flash with strict provider settings and minimal reasoning effort", () => {
    const expectedModel = { modelId: "test-model" };
    providerMock.mockReturnValue(expectedModel);

    const model = createSchedulingModel("test-api-key");

    expect(SCHEDULING_MODEL_ID).toBe("z-ai/glm-5.3-flash");
    expect(createOpenRouterMock).toHaveBeenCalledWith({
      apiKey: "test-api-key",
      compatibility: "strict",
    });
    expect(providerMock.mock.calls[0]).toEqual([
      "z-ai/glm-5.3-flash",
      { reasoning: { effort: "minimal" } },
    ]);
    expect(model).toBe(expectedModel);
  });

  it("keeps the model settings when the API key is undefined", () => {
    providerMock.mockReturnValue({ modelId: "test-model" });

    createSchedulingModel(undefined);

    expect(createOpenRouterMock).toHaveBeenCalledWith({
      apiKey: undefined,
      compatibility: "strict",
    });
    expect(providerMock.mock.calls[0]).toEqual([
      "z-ai/glm-5.3-flash",
      { reasoning: { effort: "minimal" } },
    ]);
  });
});
