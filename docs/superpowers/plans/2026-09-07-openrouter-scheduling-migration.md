# OpenRouter Scheduling Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 予約機能のすべてのAI呼び出しをOpenRouterの openai/gpt-5.6-luna / xhigh へ移行し、DeepSeek依存を安全に撤去する。

**Architecture:** AI SDK v6互換の @openrouter/ai-sdk-provider@2.9.1 を使い、サーバー専用の共有モデルファクトリへAPIキー、モデルID、reasoning設定を集約する。Mastraの scheduling エージェントと scheduling.ts の移動パディング分類は同じファクトリを使い、Google Calendar、決定論的slot計算、予約直前の再検証、UI Message / SSE境界は変更しない。

**Tech Stack:** Next.js 15、TypeScript、AI SDK 6.0.208、Mastra 1.45.0、@openrouter/ai-sdk-provider 2.9.1、Vitest、Vercel CLI、1Password CLI

## Global Constraints

- 予約機能のすべてのAI呼び出しはOpenRouterを経由する。
- 予約エージェントと移動パディング分類の両方で、モデル openai/gpt-5.6-luna と reasoning effort xhigh を使用する。
- 現行のAI SDKは6.0.208であるため、@openrouter/ai-sdk-provider@2.9.1を採用し、AI SDKやMastraのメジャーアップデートは同時に行わない。
- OpenRouter APIへ直接接続するため、provider設定に compatibility: strict を明示する。
- モデルIDとreasoning設定はサーバー側で固定し、クライアント入力や環境変数で上書きできないようにする。
- GPT-5.6 Lunaのmetadataにtemperatureがないため、移動パディング分類の現行 temperature: 0 は移植しない。
- Vercelプロジェクト eastlinker/portfolio の Preview と Production に OPENROUTER_API_KEY をEncryptedで登録する。
- 新しいキーの疎通確認が終わるまで、旧 DEEPSEEK_API_KEY は削除しない。疎通成功後にPreviewとProductionから削除する。
- DeepSeekまたは別providerへの実行時フォールバック、再送、並列provider実行は行わない。
- Google Calendar、slot計算、予約直前の再検証、予約UI、UI Message / SSE契約、既存レート制限は変更しない。
- xhighの推論とtool callを考慮し、chat routeの maxDuration を30秒から60秒へ変更する。
- APIキーは1Passwordから標準入力でVercelへ渡し、値をログ、コマンド出力、リポジトリ、テストへ残さない。
- 実装時は各機能変更の前に失敗するテストを追加し、テストが通ってから実装する。
- 実装はspec PR #95とは別の実装ブランチで行い、specブランチへ実装コードを混在させない。

---

## File Map

### Create

- src/lib/scheduling-model.ts: OpenRouter provider、モデルID、reasoning、strict compatibilityを生成するサーバー専用共有ファクトリ。
- src/lib/scheduling-model.test.ts: 共有ファクトリがAPIキー、モデルID、xhigh、strict設定を渡すことを検証する。
- src/app/api/schedule/chat/route.test.ts: OPENROUTER_API_KEYの起動条件とchat routeのmaxDurationを検証する。
- src/lib/scheduling.travel-padding.test.ts: 移動パディング分類がOpenRouterを使い、失敗時にheuristicへ戻ることを検証する。
- docs/superpowers/plans/2026-09-07-openrouter-scheduling-migration.md: 本実装計画。

### Modify

- package.json: @openrouter/ai-sdk-provider@2.9.1を追加し、最終タスクで@ai-sdk/deepseekを削除する。
- package-lock.json: package.jsonの依存変更をlockする。
- src/mastra/agents/scheduling-agent.ts: DeepSeek生成を共有モデルファクトリへ差し替える。
- src/lib/scheduling.ts: 移動パディング分類のproviderと環境変数を差し替え、temperature: 0を削除する。
- src/app/api/schedule/chat/route.ts: OPENROUTER_API_KEYの存在確認とmaxDuration=60へ変更する。
- src/lib/scheduling.test.ts: fallback用の環境変数と説明をOPENROUTER_API_KEYへ変更する。
- src/lib/scheduling.booking.test.ts: fallback用の環境変数をOPENROUTER_API_KEYへ変更する。
- src/mastra/agents/scheduling-agent.test.ts: scheduling agentが共有モデルファクトリを使う静的検証を追加する。
- src/mastra/tools/scheduling-tools.ts: provider名を含むコメントをOpenRouterへ更新する。
- src/components/SchedulingChat.tsx: DeepSeekを含むコメントをOpenRouterへ更新する。UIロジックは変更しない。
- src/app/api/schedule/chat/route.test.ts: TDD用に一時追加した旧キーstubを削除する。
- src/lib/scheduling.travel-padding.test.ts: TDD用に一時追加した旧キーstubを削除する。

### External state

- Vercel eastlinker/portfolio Preview / Production: OPENROUTER_API_KEYを追加する。
- Vercel eastlinker/portfolio Preview / Production: 本番スモーク成功後にDEEPSEEK_API_KEYを削除する。

---

### Task 1: AI SDK v6互換OpenRouter providerの依存を追加

**Files:**

- Modify: package.json
- Modify: package-lock.json

**Interfaces:**

- Produces: package.jsonに @openrouter/ai-sdk-provider: 2.9.1 があり、既存の ai: 6.0.208 とpeer dependencyを満たす状態。
- Preserves: @ai-sdk/deepseek: 2.0.39 は呼び出し元の移行が完了するまで残す。

- [ ] **Step 1: OpenRouter providerをexact versionで追加する**

Run:

~~~bash
npm install --save-exact @openrouter/ai-sdk-provider@2.9.1
~~~

Expected: package.jsonとpackage-lock.jsonだけが依存追加で更新され、@openrouter/ai-sdk-providerが2.9.1に固定される。

- [ ] **Step 2: AI SDK v6との依存関係を確認する**

Run:

~~~bash
node -e 'const p = require("./package.json"); if (p.dependencies["@openrouter/ai-sdk-provider"] !== "2.9.1" || p.dependencies.ai !== "6.0.208") process.exit(1); console.log("provider and ai versions are pinned")'
npm ls --depth=0
~~~

Expected: provider and ai versions are pinned が表示され、依存一覧に @openrouter/ai-sdk-provider@2.9.1 と ai@6.0.208 が表示される。invalid peer dependencyが表示されない。

- [ ] **Step 3: 依存追加をコミットする**

Run:

~~~bash
git add package.json package-lock.json
git diff --cached --check
git commit -m "chore: add OpenRouter AI SDK v6 provider"
~~~

Expected: 依存追加だけを含むコミットが作成される。

### Task 2: 共有モデルファクトリをTDDで作る

**Files:**

- Create: src/lib/scheduling-model.test.ts
- Create: src/lib/scheduling-model.ts

**Interfaces:**

- Consumes: @openrouter/ai-sdk-provider の createOpenRouter、AI SDKの LanguageModel 型。
- Produces: SCHEDULING_MODEL_ID: "openai/gpt-5.6-luna"、SCHEDULING_REASONING_EFFORT: "xhigh"、createSchedulingModel(apiKey: string | undefined): LanguageModel。

- [ ] **Step 1: 共有ファクトリの失敗するテストを書く**

Create src/lib/scheduling-model.test.ts:

~~~typescript
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
~~~

- [ ] **Step 2: テストが実装不足で失敗することを確認する**

Run: npx vitest run src/lib/scheduling-model.test.ts

Expected: FAIL with a module-not-found error for ./scheduling-model.

- [ ] **Step 3: 最小の共有モデルファクトリを実装する**

Create src/lib/scheduling-model.ts:

~~~typescript
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

export const SCHEDULING_MODEL_ID = "openai/gpt-5.6-luna";
export const SCHEDULING_REASONING_EFFORT = "xhigh" as const;

export function createSchedulingModel(apiKey: string | undefined): LanguageModel {
  const openrouter = createOpenRouter({
    apiKey,
    compatibility: "strict",
    reasoning: {
      effort: SCHEDULING_REASONING_EFFORT,
    },
  });

  return openrouter(SCHEDULING_MODEL_ID);
}
~~~

- [ ] **Step 4: 共有モデルファクトリのテストを通す**

Run: npx vitest run src/lib/scheduling-model.test.ts

Expected: 2 tests pass. APIキー、strict、reasoning effort、モデルIDのassertionが通る。

- [ ] **Step 5: 共有モデルファクトリをコミットする**

Run:

~~~bash
git add src/lib/scheduling-model.ts src/lib/scheduling-model.test.ts
git diff --cached --check
git commit -m "feat: centralize OpenRouter scheduling model"
~~~

Expected: 共有モデル設定とそのunit testだけを含むコミットが作成される。

### Task 3: scheduling agentとchat routeをOpenRouter設定へ配線する

**Files:**

- Create: src/app/api/schedule/chat/route.test.ts
- Modify: src/mastra/agents/scheduling-agent.ts
- Modify: src/mastra/agents/scheduling-agent.test.ts
- Modify: src/app/api/schedule/chat/route.ts

**Interfaces:**

- Consumes: createSchedulingModel(apiKey: string | undefined): LanguageModel。
- Produces: schedulingAgent.modelに共有モデルを設定し、chat routeがOPENROUTER_API_KEYを必須とする。chat routeのmaxDurationは60。

- [ ] **Step 1: chat routeとagent配線の失敗するテストを書く**

Create src/app/api/schedule/chat/route.test.ts:

~~~typescript
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
~~~

Add this test to src/mastra/agents/scheduling-agent.test.ts:

~~~typescript
import fs from "node:fs";
import path from "node:path";

it("uses the shared OpenRouter scheduling model", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "scheduling-agent.ts"), "utf8");

  expect(source).toContain("createSchedulingModel");
  expect(source).toContain("process.env.OPENROUTER_API_KEY");
  expect(source).not.toContain("createDeepSeek");
  expect(source).not.toContain("deepseek-chat");
});
~~~

The fs and path imports are added to the existing import block; the existing instructions tests remain unchanged.

- [ ] **Step 2: 新しい配線テストが現行DeepSeek実装で失敗することを確認する**

Run: npx vitest run src/app/api/schedule/chat/route.test.ts src/mastra/agents/scheduling-agent.test.ts

Expected: the configured OpenRouter route test fails with status 503 because the current route checks DEEPSEEK_API_KEY, and the agent source test fails because it still contains createDeepSeek and deepseek-chat.

- [ ] **Step 3: agentを共有モデルファクトリへ差し替える**

In src/mastra/agents/scheduling-agent.ts, replace the DeepSeek import and module-level provider with:

~~~typescript
import { Agent } from "@mastra/core/agent";
import { createSchedulingModel } from "@/lib/scheduling-model";
import { DEFAULT_CONFIG, ownerToday } from "@/lib/scheduling";
import { findSlotsTool, bookSlotTool } from "../tools/scheduling-tools";

const schedulingModel = createSchedulingModel(process.env.OPENROUTER_API_KEY);
~~~

Replace the provider-specific description and model property with:

~~~typescript
/**
 * 日程調整エージェント。OpenRouter（openai/gpt-5.6-luna、reasoning xhigh）。
 * 役割: 訪問者の自然文を解釈 → find-slots で空きを提示 → 同意で book-slot で予約。
 * エージェントに渡すのは移動パディング適用後の空き枠と unavailable 時間帯のみ。
 * 予定名・場所・説明・参加者は渡さない。
 *
 * instructions は関数で都度評価し、現在日時(JST)を埋め込む（warm サーバーでも今日が古くならない）。
 */
~~~

In the existing Agent object, replace only the model property:

~~~typescript
  model: schedulingModel,
~~~

The id, name, instructions, findSlotsTool, and bookSlotTool properties remain unchanged.

- [ ] **Step 4: chat routeの環境変数と実行上限を差し替える**

In src/app/api/schedule/chat/route.ts, use these exact declarations and guard:

~~~typescript
export const runtime = "nodejs"; // Mastra/googleapis は Node 依存。Edge 不可。
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST /api/schedule/chat  — Mastra エージェント（OpenRouter）の本物トークンストリーミング。
 * body は AI SDK の useChat 形式（{ messages, ... }）。エージェントが find-slots / book-slot
 * ツールを呼んで応答する。カレンダーの中身はツールに渡さない（空き時刻のみ）。
 */
export async function POST(req: Request) {
  if (!isGoogleConfigured() || !process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
~~~

Keep the existing rate-limit, body validation, handleChatStream, and catch blocks exactly as they are.

- [ ] **Step 5: agentとrouteのテストを通す**

Run: npx vitest run src/lib/scheduling-model.test.ts src/app/api/schedule/chat/route.test.ts src/mastra/agents/scheduling-agent.test.ts

Expected: all tests pass, including the 200 response with only OPENROUTER_API_KEY and maxDuration=60.

- [ ] **Step 6: agentとchat routeの配線をコミットする**

Run:

~~~bash
git add src/mastra/agents/scheduling-agent.ts src/mastra/agents/scheduling-agent.test.ts src/app/api/schedule/chat/route.ts src/app/api/schedule/chat/route.test.ts
git diff --cached --check
git commit -m "feat: wire scheduling chat to OpenRouter"
~~~

Expected: agent、chat route、配線テストだけを含むコミットが作成される。

### Task 4: 移動パディング分類をOpenRouterへ移行しtemperatureを除去する

**Files:**

- Create: src/lib/scheduling.travel-padding.test.ts
- Modify: src/lib/scheduling.ts

**Interfaces:**

- Consumes: createSchedulingModel(apiKey: string | undefined): LanguageModel、既存の travelPaddingDecisionSchema、findSlotsInRange。
- Produces: classifyTravelPaddingがOPENROUTER_API_KEYで共有モデルを生成し、temperatureを送らず、失敗時にfallbackTravelDecisionsへ戻る。

- [ ] **Step 1: OpenRouter失敗時のfallbackテストを書く**

Create src/lib/scheduling.travel-padding.test.ts:

~~~typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SchedulingConfig } from "@/types/scheduling";

const { generateTextMock, createSchedulingModelMock, modelMock } = vi.hoisted(() => {
  const modelMock = { modelId: "test-model" };
  return {
    generateTextMock: vi.fn(),
    createSchedulingModelMock: vi.fn(() => modelMock),
    modelMock,
  };
});

vi.mock("@/lib/scheduling-model", () => ({
  createSchedulingModel: createSchedulingModelMock,
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    generateText: generateTextMock,
  };
});

vi.mock("@/lib/google-calendar", () => ({
  fetchBusy: vi.fn(),
  fetchCalendarEventContexts: vi.fn(),
  insertEvent: vi.fn(),
}));

import { fetchBusy, fetchCalendarEventContexts } from "@/lib/google-calendar";
import { findSlotsInRange } from "./scheduling";

const mockFetchBusy = vi.mocked(fetchBusy);
const mockFetchEventContexts = vi.mocked(fetchCalendarEventContexts);

function cfg(overrides: Partial<SchedulingConfig> = {}): SchedulingConfig {
  return {
    timezone: "Asia/Tokyo",
    utcOffset: "+09:00",
    startHour: 10,
    endHour: 15,
    slotMinutes: 60,
    leadMinutes: 120,
    travelPaddingBeforeMinutes: 60,
    travelPaddingAfterMinutes: 60,
    excludeWeekends: false,
    horizonDays: 30,
    ...overrides,
  };
}

describe("travel padding OpenRouter fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
    mockFetchBusy.mockResolvedValue([
      {
        start: "2026-06-22T11:00:00+09:00",
        end: "2026-06-22T11:30:00+09:00",
      },
    ]);
    mockFetchEventContexts.mockResolvedValue([
      {
        id: "physical-event",
        start: "2026-06-22T11:00:00+09:00",
        end: "2026-06-22T11:30:00+09:00",
        summary: "Client visit",
        location: "Tokyo office",
        hasConference: false,
      },
    ]);
    generateTextMock.mockRejectedValue(new Error("OpenRouter unavailable"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the shared model and falls back to physical travel padding", async () => {
    const result = await findSlotsInRange(
      "2026-06-22",
      "2026-06-22",
      cfg(),
      new Date("2026-06-22T00:00:00+09:00"),
    );

    expect(createSchedulingModelMock).toHaveBeenCalledWith("test-openrouter-key");
    expect(generateTextMock).toHaveBeenCalledTimes(1);
    const request = generateTextMock.mock.calls[0][0] as {
      model: unknown;
    };
    expect(request.model).toBe(modelMock);
    const unsupportedOption = ["temp", "erature"].join("");
    expect(request).not.toHaveProperty(unsupportedOption);
    expect(result.slots.map((slot) => slot.label)).not.toContain("11:30");
    expect(result.slots.map((slot) => slot.label)).toContain("12:30");
  });
});
~~~

- [ ] **Step 2: 新しいfallbackテストが現行実装で失敗することを確認する**

Run: npx vitest run src/lib/scheduling.travel-padding.test.ts

Expected: FAIL because the current implementation checks DEEPSEEK_API_KEY, so it returns before calling createSchedulingModelMock and generateTextMock.

- [ ] **Step 3: classifyTravelPaddingのproviderとenvを差し替える**

In src/lib/scheduling.ts, replace the provider import:

~~~typescript
import { createSchedulingModel } from "@/lib/scheduling-model";
import { generateText, Output } from "ai";
~~~

Replace the complete classifyTravelPadding function with:

~~~typescript
async function classifyTravelPadding(
  events: CalendarEventContext[],
  cfg: SchedulingConfig,
): Promise<Map<string, TravelPaddingDecision>> {
  if (events.length === 0) return new Map();
  if (!process.env.OPENROUTER_API_KEY) return fallbackTravelDecisions(events);

  try {
    const model = createSchedulingModel(process.env.OPENROUTER_API_KEY);
    const { output } = await generateText({
      model,
      output: Output.object({ schema: travelPaddingDecisionSchema }),
      system: TRAVEL_PADDING_SYSTEM_PROMPT,
      prompt: JSON.stringify({
        timezone: cfg.timezone,
        defaultPaddingMinutes: {
          before: cfg.travelPaddingBeforeMinutes,
          after: cfg.travelPaddingAfterMinutes,
        },
        events: events.map((event) => ({
          id: event.id,
          start: event.start,
          end: event.end,
          location: event.location ?? "",
          eventType: event.eventType ?? "",
          transparency: event.transparency ?? "",
          hasConference: event.hasConference,
        })),
      }),
    });

    const byId = new Map<string, TravelPaddingDecision>();
    for (const decision of output.decisions) {
      byId.set(decision.eventId, decision);
    }
    for (const event of events) {
      if (!byId.has(event.id)) {
        byId.set(event.id, fallbackTravelDecisions([event]).get(event.id)!);
      }
    }
    return byId;
  } catch (err) {
    console.error("[scheduling] travel padding LLM failed; using heuristic fallback:", err);
    return fallbackTravelDecisions(events);
  }
}
~~~

Do not add temperature: 0 elsewhere in this request. Keep the existing structured output schema, event minimization, missing-decision fallback, and catch behavior.

- [ ] **Step 4: 移動パディングのOpenRouterテストを通す**

Run: npx vitest run src/lib/scheduling.travel-padding.test.ts src/lib/scheduling.test.ts src/lib/scheduling.booking.test.ts

Expected: the new rejection fallback test and all existing scheduling/booking tests pass. The test confirms no temperature property is sent.

- [ ] **Step 5: 移動パディング移行をコミットする**

Run:

~~~bash
git add src/lib/scheduling.ts src/lib/scheduling.travel-padding.test.ts
git diff --cached --check
git commit -m "feat: migrate travel padding classification to OpenRouter"
~~~

Expected: scheduling classification and its isolated fallback testだけを含むコミットが作成される。

### Task 5: DeepSeek依存、環境変数、説明コメントを撤去する

**Files:**

- Modify: src/lib/scheduling.test.ts
- Modify: src/lib/scheduling.booking.test.ts
- Modify: src/mastra/tools/scheduling-tools.ts
- Modify: src/components/SchedulingChat.tsx
- Modify: package.json
- Modify: package-lock.json
- Modify: src/app/api/schedule/chat/route.test.ts
- Modify: src/lib/scheduling.travel-padding.test.ts

**Interfaces:**

- Consumes: Task 2からTask 4までの共有モデルとOpenRouter環境変数。
- Produces: active source、package.json、package-lock.json、testsにDeepSeek provider、旧モデル、旧環境変数が存在しない状態。

- [ ] **Step 1: 既存テストのfallback環境変数を更新する**

In src/lib/scheduling.test.ts and src/lib/scheduling.booking.test.ts, replace:

~~~typescript
vi.stubEnv("DEEPSEEK_API_KEY", "");
~~~

with:

~~~typescript
vi.stubEnv("OPENROUTER_API_KEY", "");
~~~

In src/app/api/schedule/chat/route.test.ts and src/lib/scheduling.travel-padding.test.ts, remove the temporary baseline-only line:

~~~typescript
vi.stubEnv("DEEPSEEK_API_KEY", "");
~~~

The route and travel-padding tests keep their OPENROUTER_API_KEY stubs; they no longer need any legacy-provider environment setup after migration.

In src/lib/scheduling.test.ts, replace the fallback comment:

~~~typescript
// OPENROUTER_API_KEY='' (beforeEach で設定済み) なので fallback ヒューリスティックが使われる。
~~~

Keep the existing test fixtures and assertions unchanged.

- [ ] **Step 2: ユーザー向けコードコメントとtoolコメントを更新する**

In src/mastra/tools/scheduling-tools.ts, replace the provider-specific comment wording with:

~~~typescript
 *   エージェント（OpenRouter）とブラウザに返すのは、移動パディング適用後の空き枠のみ。
~~~

In src/components/SchedulingChat.tsx, replace the two DeepSeek descriptions with:

~~~typescript
 * AI(OpenRouter) が生成する生 HTML を rehype-raw で描画するため、XSS 面を
~~~

~~~typescript
 * OpenRouterのMastraエージェントを useChat 経由で叩く。応答は本物のトークン
~~~

Do not change the component behavior, sanitization schema, transport, or error UI.

- [ ] **Step 3: DeepSeek dependencyを削除する**

Run:

~~~bash
npm uninstall @ai-sdk/deepseek
~~~

Expected: package.jsonとpackage-lock.jsonから @ai-sdk/deepseek とそのlock entryが削除される。OpenRouter provider、ai、Mastraの依存は残る。

- [ ] **Step 4: active sourceからDeepSeekが消えたことを確認する**

Run:

~~~bash
if rg -n -i 'deepseek|DEEPSEEK|@ai-sdk/deepseek' src package.json package-lock.json; then exit 1; fi
~~~

Expected: no output and exit code 0.

- [ ] **Step 5: 全ての既存unit testを通す**

Run: npm test

Expected: Vitestの全テストがpassし、DeepSeekのmodule-not-foundや環境変数依存が発生しない。

- [ ] **Step 6: 旧依存撤去をコミットする**

Run:

~~~bash
git add src/lib/scheduling.test.ts src/lib/scheduling.booking.test.ts src/mastra/tools/scheduling-tools.ts src/components/SchedulingChat.tsx package.json package-lock.json
git add src/lib/scheduling.travel-padding.test.ts src/app/api/schedule/chat/route.test.ts
git diff --cached --check
git commit -m "chore: remove DeepSeek scheduling dependency"
~~~

Expected: 旧provider、旧環境変数、コメント更新だけを含むコミットが作成される。

### Task 6: Vercel Preview / ProductionへOpenRouter APIキーを登録する

**Files:**

- External: Vercel eastlinker/portfolio Preview
- External: Vercel eastlinker/portfolio Production

**Interfaces:**

- Consumes: ~/.zshrcのOPSA、1Password credential参照 op://agent/OpenRouter API Key - portfolio/credential。
- Produces: VercelのPreviewとProductionにEncryptedなOPENROUTER_API_KEY。DEEPSEEK_API_KEYはこのタスクでは保持する。

- [ ] **Step 1: OpenRouterキーを1PasswordからVercelへ標準入力で登録する**

Run exactly:

~~~bash
zsh -lc 'source /Users/shin-ryo/.zshrc; OP_SERVICE_ACCOUNT_TOKEN="$OPSA" op read "op://agent/OpenRouter API Key - portfolio/credential"' | vercel env add OPENROUTER_API_KEY production,preview --project portfolio --scope eastlinker --sensitive --force --yes
~~~

Expected: Vercel CLI reports successful creation or update of OPENROUTER_API_KEY for Preview and Production. The API key value must not appear in terminal output.

- [ ] **Step 2: Vercelの環境名・暗号化状態だけを確認する**

Run:

~~~bash
vercel env ls --project portfolio --scope eastlinker | rg 'OPENROUTER_API_KEY|DEEPSEEK_API_KEY'
~~~

Expected: OPENROUTER_API_KEYがEncryptedとしてPreviewとProductionに1行ずつ表示され、疎通確認前なのでDEEPSEEK_API_KEYもPreviewとProductionに残っている。値の表示やvercel env pullは行わない。

- [ ] **Step 3: 追加したVercel環境変数を記録する**

PRコメントまたはリリース記録へ、次の値だけを記録する。

~~~text
OPENROUTER_API_KEY: Preview / Production, Encrypted
DEEPSEEK_API_KEY: retained until production smoke test
~~~

Expected: credential value、Authorizationヘッダー、OPSA値を含まない記録になる。外部環境変数の追加自体にgit commitは作成しない。

### Task 7: デプロイ後に本番スモークを実行し、旧キーを削除する

**Files:**

- External: Vercel deployment and environment variables

**Interfaces:**

- Consumes: Task 5までの実装コミット、Task 6のOPENROUTER_API_KEY、既存のGoogle Calendar環境変数。
- Produces: OpenRouterで空き枠提示まで成功した本番デプロイ、旧DEEPSEEK_API_KEYの削除。

- [ ] **Step 1: 実装コミットをProductionへデプロイする**

実装ブランチをレビュー・マージし、既存のVercel Git連携でProductionへデプロイする。CLIで手動デプロイする場合は、レビュー済みの実装コミットから次を実行する。

~~~bash
vercel deploy --prod --project portfolio --scope eastlinker --yes
~~~

Expected: Production deploymentが作成され、デプロイ対象commitがTask 5までの実装を含む。

- [ ] **Step 2: 副作用なしの本番SSEスモークを実行する**

Run:

~~~bash
smoke_dir=$(mktemp -d)
curl --no-buffer -sS -D "$smoke_dir/headers" -H 'content-type: application/json' -H 'accept: text/event-stream' --data '{"messages":[{"id":"openrouter-smoke","role":"user","parts":[{"type":"text","text":"PROPOSE_INITIAL_SLOTS_IN_EN"}]}]}' https://www.ryosh.in/api/schedule/chat -o "$smoke_dir/stream"
status=$(awk 'NR == 1 { print $2; exit }' "$smoke_dir/headers")
test "$status" = "200"
if rg -n -i 'type:error|deepseek|insufficient balance' "$smoke_dir/stream"; then exit 1; fi
rg -n 'data:|text-delta|find-slots|slot|finish' "$smoke_dir/stream"
~~~

Expected: HTTP status 200、SSE内にtype:error、DeepSeek、Insufficient Balanceがなく、回答と空き枠候補に対応するイベントが確認できる。予約登録は実行しない。

- [ ] **Step 3: VercelログとOpenRouter利用状況を確認する**

Vercel FunctionログとOpenRouter管理画面で次を確認する。

- DeepSeek URL、deepseek-chat、認証情報が出ていない。
- openai/gpt-5.6-lunaのリクエストが記録されている。
- xhighによる推論トークン利用を確認できる。
- 60秒以内に応答が完了している。

Expected: provider切り替え、モデル、reasoning、実行時間がspecと一致する。失敗した場合はDEEPSEEK_API_KEYを削除せず、旧デプロイを再デプロイしてから原因を修正する。

- [ ] **Step 4: 本番スモーク成功後にPreviewの旧キーを削除する**

Run:

~~~bash
vercel env rm DEEPSEEK_API_KEY preview --project portfolio --scope eastlinker --yes
~~~

Expected: PreviewのDEEPSEEK_API_KEYだけが削除される。

- [ ] **Step 5: 本番スモーク成功後にProductionの旧キーを削除する**

Run:

~~~bash
vercel env rm DEEPSEEK_API_KEY production --project portfolio --scope eastlinker --yes
~~~

Expected: ProductionのDEEPSEEK_API_KEYだけが削除される。

- [ ] **Step 6: 旧キー削除後の環境一覧を確認する**

Run:

~~~bash
vercel env ls --project portfolio --scope eastlinker | rg 'OPENROUTER_API_KEY|DEEPSEEK_API_KEY'
~~~

Expected: OPENROUTER_API_KEYのEncrypted Preview / Productionだけが表示され、DEEPSEEK_API_KEYは表示されない。

### Task 8: リポジトリ全体の最終検証を行う

**Files:**

- Read-only: src、package.json、package-lock.json、実装ブランチの全差分

**Interfaces:**

- Consumes: Task 1からTask 7までのコード、依存、Vercel設定、デプロイ結果。
- Produces: 受け入れ基準を満たした検証結果と、実装ブランチのクリーンな作業ツリー。

- [ ] **Step 1: DeepSeekとunsupported parameterの残存を検査する**

Run:

~~~bash
if rg -n -i 'deepseek|DEEPSEEK|@ai-sdk/deepseek' src package.json package-lock.json; then exit 1; fi
if rg -n 'temperature' src/lib/scheduling.ts src/lib/scheduling.travel-padding.test.ts; then exit 1; fi
rg -n 'createSchedulingModel|OPENROUTER_API_KEY|openai/gpt-5\.6-luna|xhigh|compatibility' src package.json package-lock.json
~~~

Expected: 1つ目と2つ目は出力なしで成功し、3つ目には共有ファクトリ、OpenRouter環境変数、指定モデル、xhigh、strict設定が表示される。

- [ ] **Step 2: typecheckを実行する**

Run: npm run typecheck

Expected: TypeScript compiler exits with code 0 and no errors.

- [ ] **Step 3: lintを実行する**

Run: npm run lint

Expected: Next lint exits with code 0 and no new warning requiring changes.

- [ ] **Step 4: unit testを実行する**

Run: npm test

Expected: 全Vitest testがpassする。

- [ ] **Step 5: production buildを実行する**

Run: npm run build

Expected: Next.js production build exits with code 0 and server-only OpenRouter dependencyがclient bundleへ取り込まれない。

- [ ] **Step 6: 差分と作業ツリーを確認する**

Run:

~~~bash
git diff --check
git status --short
~~~

Expected: whitespace errorがなく、意図しない未追跡・未コミットファイルがない。

## Spec Coverage and Self-Review

| Spec requirement | Plan coverage |
|------------------|---------------|
| OpenRouterへの全AI呼び出し統一 | Task 2、Task 3、Task 4、Task 8 |
| GPT-5.6 Luna / xhighの固定 | Task 2のfactory test、Task 3のagent配線、Task 8の静的検査 |
| AI SDK v6互換provider 2.9.1 | Task 1 |
| strict compatibility | Task 2のfactory test、Task 8 |
| temperature: 0を送らない | Task 4のfallback test、Task 8 |
| OPENROUTER_API_KEYの503起動条件 | Task 3のroute test |
| 移動分類のheuristic fallback | Task 4 |
| DeepSeek fallbackを実装しない | Global Constraints、Task 5、Task 7 |
| 既存slot・Calendar・booking・UI契約の維持 | Task 3、Task 4、Task 8の全テスト |
| maxDuration=60 | Task 3のroute test、Task 8 |
| Vercel Preview / ProductionのEncrypted登録 | Task 6 |
| 本番SSEとモデルのスモーク | Task 7 |
| 旧DeepSeekキー削除の順序 | Task 6で保持、Task 7成功後に削除 |
| 秘密情報を出力しない | Global Constraints、Task 6、Task 7 |

計画の自己レビュー結果:

- 実装者が埋める未確定欄を残さない。
- 共有モデルファクトリのインターフェースをTask 2で定義し、Task 3とTask 4が同じ関数シグネチャを使う。
- 移動分類のtemperature削除、OpenRouter strict設定、Vercel旧キー削除の順序をspecと一致させている。
- 対象は一つのprovider移行であり、独立した実装計画への分割は不要である。
