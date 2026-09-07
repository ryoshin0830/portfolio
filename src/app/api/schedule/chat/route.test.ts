import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createUIMessageStreamResponseMock,
  handleChatStreamMock,
  isGoogleConfiguredMock,
  rateLimitMock,
  clientIpMock,
} = vi.hoisted(() => ({
  createUIMessageStreamResponseMock: vi.fn(),
  handleChatStreamMock: vi.fn(),
  isGoogleConfiguredMock: vi.fn(),
  rateLimitMock: vi.fn(),
  clientIpMock: vi.fn(),
}));

vi.mock("@mastra/ai-sdk", () => ({
  handleChatStream: handleChatStreamMock,
}));

vi.mock("@/mastra", () => ({
  mastra: {},
}));

vi.mock("@/lib/google-calendar", () => ({
  isGoogleConfigured: isGoogleConfiguredMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: rateLimitMock,
  clientIp: clientIpMock,
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    createUIMessageStreamResponse: createUIMessageStreamResponseMock,
  };
});

import { maxDuration, POST } from "./route";

function request() {
  return new Request("http://localhost/api/schedule/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          id: "message-1",
          role: "user",
          parts: [{ type: "text", text: "hello" }],
        },
      ],
    }),
  });
}

describe("POST /api/schedule/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    isGoogleConfiguredMock.mockReturnValue(true);
    rateLimitMock.mockReturnValue(true);
    clientIpMock.mockReturnValue("test-ip");
    handleChatStreamMock.mockResolvedValue({});
    createUIMessageStreamResponseMock.mockImplementation(() => new Response("stream"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts the OpenRouter key when only the new key is configured", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(handleChatStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: "scheduling",
        version: "v6",
      }),
    );
  });

  it("returns 503 when the OpenRouter key is absent", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(handleChatStreamMock).not.toHaveBeenCalled();
  });

  it("allows 60 seconds for reasoning and tool calls", () => {
    expect(maxDuration).toBe(60);
  });
});
