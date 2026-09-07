import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { AgentMock, bookSlotToolMock, createSchedulingModelMock, findSlotsToolMock, modelMock } = vi.hoisted(() => {
  const modelMock = { modelId: "openrouter-test-model" };
  return {
    AgentMock: vi.fn(function (this: Record<string, unknown>, options: Record<string, unknown>) {
      Object.assign(this, options);
    }),
    bookSlotToolMock: { id: "book-slot" },
    createSchedulingModelMock: vi.fn(() => modelMock),
    findSlotsToolMock: { id: "find-slots" },
    modelMock,
  };
});

vi.mock("@mastra/core/agent", () => ({ Agent: AgentMock }));

vi.mock("@/lib/scheduling-model", () => ({
  createSchedulingModel: createSchedulingModelMock,
}));

vi.mock("../tools/scheduling-tools", () => ({
  bookSlotTool: bookSlotToolMock,
  findSlotsTool: findSlotsToolMock,
}));

describe("scheduling-agent model wiring", () => {
  beforeAll(async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
    await import("./scheduling-agent");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("constructs the agent with the shared OpenRouter model and existing tools", () => {
    expect(createSchedulingModelMock).toHaveBeenCalledWith("test-openrouter-key");
    expect(AgentMock).toHaveBeenCalledTimes(1);

    const options = AgentMock.mock.calls[0][0] as {
      id: string;
      model: unknown;
      tools: Record<string, unknown>;
    };
    expect(options).toMatchObject({
      id: "scheduling",
      model: modelMock,
      tools: {
        findSlotsTool: findSlotsToolMock,
        bookSlotTool: bookSlotToolMock,
      },
    });
  });
});
