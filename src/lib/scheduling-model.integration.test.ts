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

  it("requests the minimal reasoning effort so the model does not spend thinking time", async () => {
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
    // 日程調整は「ツール呼び出し＋定型フォーマット出力」なので thinking の価値は薄い。
    // 既定のままだと 1 呼び出しあたり数秒〜十数秒を thinking に費やし、
    // /api/schedule/chat が Vercel の 60 秒制限を超えて無言で切れる。
    // なお z-ai/glm-5.3-flash は OpenRouter 側で reasoning の完全無効化が
    // 拒否される（"Reasoning is mandatory for this endpoint and cannot be
    // disabled."）ため、最小 effort まで落とすのが取れる手になる。
    expect(body.reasoning).toEqual({ effort: "minimal" });
    expect(body).not.toHaveProperty("temperature");
  });

  it("does not pin OpenRouter provider routing", async () => {
    // このモデルは OpenRouter 上で 25 社が配信しているため routing を触りたくなるが、
    // 実測では既定（価格順）が最も安定していた。
    //   sort:"latency"    … TTFB は 0.6-1.5 秒まで下がったが 5 回中 4 回が 60 秒
    //                       タイムアウト（所要時間を支配するのは TTFB ではなく decode）
    //   sort:"throughput" … 交互 A/B 各 6 回で mean 14.1s（既定は 15.5s）。差は
    //                       ノイズの範囲で、既定のほうが分散が小さかった（14.0-18.2s
    //                       対 9.4-17.8s）
    // 効果が確認できない結合は持たない。再検討するときは必ず交互 A/B で測ること。
    const model = createSchedulingModel("test-openrouter-key");

    await model.doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).not.toHaveProperty("provider");
  });
});
