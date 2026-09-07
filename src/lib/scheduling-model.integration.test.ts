import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSchedulingModel } from "./scheduling-model";

describe("scheduling model OpenRouter request", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "test-response",
          model: "z-ai/glm-5.3-flash",
          provider: "openai",
          choices: [
            {
              message: { role: "assistant", content: "{}" },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the configured model and structured output without reasoning or temperature", async () => {
    const model = createSchedulingModel("test-openrouter-key");

    await model.doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: "Return JSON" }] }],
      responseFormat: {
        type: "json",
        name: "test_response",
        schema: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
          additionalProperties: false,
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer test-openrouter-key");

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      model: "z-ai/glm-5.3-flash",
      response_format: {
        type: "json_schema",
        json_schema: { name: "test_response", strict: true },
      },
    });
    expect(body).not.toHaveProperty("reasoning");
    expect(body).not.toHaveProperty("temperature");
  });
});
