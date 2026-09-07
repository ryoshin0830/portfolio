# Scheduling GLM-5.3-Flash Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 予約機能の共有モデルを z-ai/glm-5.3-flash に切り替え、reasoning effortを指定しないOpenRouterリクエストへ変更する。

**Architecture:** src/lib/scheduling-model.ts がモデルIDとOpenRouterのstrict設定を一元管理する。予約エージェントと移動パディング分類は既存どおりこのファクトリを呼び、providerへモデルIDだけを渡すことでreasoning設定を省略する。

**Tech Stack:** Next.js 15、TypeScript、AI SDK 6.0.208、Mastra 1.45.0、@openrouter/ai-sdk-provider 2.9.1、Vitest

## Global Constraints

- 予約エージェントと移動パディング分類の両方が z-ai/glm-5.3-flash を使う。
- OpenRouter providerのモデル生成呼び出しに reasoning プロパティを渡さない。
- OpenRouterの compatibility: "strict" と OPENROUTER_API_KEY の受け渡しは維持する。
- 予約エージェントのツール、Google Calendar連携、空き枠計算、予約直前の再検証、UI Message / SSE契約、レート制限は変更しない。
- 移動パディング分類のAPIキー未設定時とモデル呼び出し失敗時のheuristic fallbackは維持する。
- モデルIDとreasoning設定をクライアント入力や環境変数で上書きできるようにはしない。
- 過去のOpenRouter移行設計書・計画書に記録された履歴は書き換えない。

---

## File Map

### Create

- docs/superpowers/specs/2026-09-07-scheduling-glm-5-3-flash-design.md: 今回のモデル切り替えの要件、採用案、設計、テスト方針。
- docs/superpowers/plans/2026-09-07-scheduling-glm-5-3-flash.md: この実装計画。

### Modify

- src/lib/scheduling-model.test.ts: 共有ファクトリがGLMモデルIDを使い、reasoning引数を渡さないことを検証する。
- src/lib/scheduling-model.integration.test.ts: OpenRouterリクエストのモデルIDとreasoning未送信を検証する。
- src/lib/scheduling-model.ts: モデルIDをGLMへ変更し、provider呼び出しからreasoning設定を削除する。
- src/mastra/agents/scheduling-agent.ts: 現在のモデル名を示すサーバー側コメントを更新する。

### Preserved

- src/lib/scheduling.ts: 共有ファクトリの呼び出し、structured output、heuristic fallbackを変更しない。
- src/mastra/agents/scheduling-agent.wiring.test.ts: agentが共有ファクトリを使う既存の配線検証を維持する。
- src/app/api/schedule/chat/route.ts: OpenRouter APIキーの確認、ストリーム、エラー処理、maxDurationを変更しない。

---

### Task 1: 共有モデルの契約テストをGLM仕様へ更新する

**Files:**

- Modify: src/lib/scheduling-model.test.ts
- Modify: src/lib/scheduling-model.integration.test.ts

**Interfaces:**

- Consumes: 既存の createSchedulingModel(apiKey: string | undefined): LanguageModelV3。
- Produces: z-ai/glm-5.3-flash を期待し、provider呼び出しとHTTPリクエストにreasoning設定がないテスト契約。

- [ ] **Step 1: 共有ファクトリのunit testを新しいモデル契約へ変更する**

src/lib/scheduling-model.test.ts のテストを次の内容に置き換える。SCHEDULING_REASONING_EFFORT のimportとassertionを削除し、providerの呼び出し引数がモデルIDだけであることを検証する。

~~~typescript
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

  it("creates GLM-5.3-Flash with strict provider settings and default reasoning", () => {
    const expectedModel = { modelId: "test-model" };
    providerMock.mockReturnValue(expectedModel);

    const model = createSchedulingModel("test-api-key");

    expect(SCHEDULING_MODEL_ID).toBe("z-ai/glm-5.3-flash");
    expect(createOpenRouterMock).toHaveBeenCalledWith({
      apiKey: "test-api-key",
      compatibility: "strict",
    });
    expect(providerMock.mock.calls[0]).toEqual(["z-ai/glm-5.3-flash"]);
    expect(model).toBe(expectedModel);
  });

  it("keeps the model settings when the API key is undefined", () => {
    providerMock.mockReturnValue({ modelId: "test-model" });

    createSchedulingModel(undefined);

    expect(createOpenRouterMock).toHaveBeenCalledWith({
      apiKey: undefined,
      compatibility: "strict",
    });
    expect(providerMock.mock.calls[0]).toEqual(["z-ai/glm-5.3-flash"]);
  });
});
~~~

- [ ] **Step 2: OpenRouterリクエストtestの期待値を新しいモデル契約へ変更する**

src/lib/scheduling-model.integration.test.ts でstub responseの model とbodyの model を z-ai/glm-5.3-flash に変更し、テスト名とassertionを次のように更新する。

~~~typescript
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
~~~

- [ ] **Step 3: 更新したテストが現行実装では失敗することを確認する**

Run:

~~~bash
npx vitest run src/lib/scheduling-model.test.ts src/lib/scheduling-model.integration.test.ts
~~~

Expected: FAIL。現行実装の openai/gpt-5.6-luna と reasoning: { effort: "xhigh" } が新しい期待値と一致しない。

---

### Task 2: 共有モデルファクトリをGLM・デフォルトreasoningへ切り替える

**Files:**

- Modify: src/lib/scheduling-model.ts
- Modify: src/mastra/agents/scheduling-agent.ts

**Interfaces:**

- Consumes: createOpenRouter({ apiKey, compatibility: "strict" }) と既存の LanguageModelV3 型。
- Produces: SCHEDULING_MODEL_ID = "z-ai/glm-5.3-flash"、createSchedulingModel が openrouter(SCHEDULING_MODEL_ID) を返す共有モデル。

- [ ] **Step 1: 固定モデルIDとfactoryの最小実装を変更する**

src/lib/scheduling-model.ts を次の内容にする。reasoning定数と第2引数を削除し、APIキーとstrict設定だけをproviderへ渡す。

~~~typescript
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModelV3 } from "@openrouter/ai-sdk-provider";

export const SCHEDULING_MODEL_ID = "z-ai/glm-5.3-flash";

export function createSchedulingModel(apiKey: string | undefined): LanguageModelV3 {
  const openrouter = createOpenRouter({
    apiKey,
    compatibility: "strict",
  });

  return openrouter(SCHEDULING_MODEL_ID);
}
~~~

- [ ] **Step 2: agentコメントのモデル表記を更新する**

src/mastra/agents/scheduling-agent.ts の説明コメントを次の一文へ置き換える。実行時の挙動は変更しない。

~~~typescript
 * 日程調整エージェント。OpenRouter（z-ai/glm-5.3-flash、reasoningはデフォルト設定）。
~~~

- [ ] **Step 3: 共有モデルのunit/integration testを通す**

Run:

~~~bash
npx vitest run src/lib/scheduling-model.test.ts src/lib/scheduling-model.integration.test.ts
~~~

Expected: 3 tests pass。モデルIDが z-ai/glm-5.3-flash で、OpenRouter bodyに reasoning と temperature がない。

- [ ] **Step 4: 予約関連テストで両呼び出し元の回帰を確認する**

Run:

~~~bash
npx vitest run src/lib/scheduling.travel-padding.test.ts src/mastra/agents/scheduling-agent.wiring.test.ts src/mastra/agents/scheduling-agent.test.ts src/lib/scheduling.test.ts src/lib/scheduling.booking.test.ts
~~~

Expected: 対象ファイルの全テストがpass。移動パディングのfallback、agentの共有モデル配線、予約枠と予約確定の既存契約が維持される。

- [ ] **Step 5: 実装をコミットする**

~~~bash
git add src/lib/scheduling-model.ts src/lib/scheduling-model.test.ts src/lib/scheduling-model.integration.test.ts src/mastra/agents/scheduling-agent.ts
git diff --cached --check
git commit -m "fix: switch scheduling model to GLM 5.3 Flash"
~~~

Expected: モデル切り替え、reasoning未指定、対応テスト、コメント更新だけを含むコミットが作成される。

---

### Task 3: 最終検証とPR準備

**Files:**

- Verify: src/lib/scheduling-model.ts
- Verify: src/lib/scheduling-model.test.ts
- Verify: src/lib/scheduling-model.integration.test.ts
- Verify: src/mastra/agents/scheduling-agent.ts

**Interfaces:**

- Consumes: Task 1・Task 2で更新した共有モデルとテスト。
- Produces: main向けPRにレビュー可能な検証済みブランチ。

- [ ] **Step 1: 対象ソースに旧モデルとreasoning指定が残っていないことを確認する**

Run:

~~~bash
if rg -n 'openai/gpt-5\\.6-luna|SCHEDULING_REASONING_EFFORT|reasoning:\\s*\\{' src/lib/scheduling-model.ts src/lib/scheduling-model.test.ts src/lib/scheduling-model.integration.test.ts src/mastra/agents/scheduling-agent.ts; then exit 1; else printf '%s\\n' 'scheduling model source is aligned'; fi
~~~

Expected: scheduling model source is aligned が表示される。

- [ ] **Step 2: 型検査・lint・全テスト・本番ビルドを実行する**

Run:

~~~bash
npm run typecheck
npm run lint
npm test
npm run build
~~~

Expected: 4コマンドがすべてexit 0。npm testは全テストpass、npm run buildはNext.js本番ビルド完了。

- [ ] **Step 3: 差分とコミット履歴を確認する**

Run:

~~~bash
git status --short
git diff --stat main...HEAD
git log --oneline --decorate main..HEAD
~~~

Expected: 未追跡の秘密情報がなく、変更は設計書・計画書・モデル設定・対応テスト・コメントに限定される。

- [ ] **Step 4: ブランチをpushしてmain向けPRを作成する**

~~~bash
git push -u origin fix/scheduling-glm-5-3-flash
gh pr create --base main --head fix/scheduling-glm-5-3-flash --title "fix: switch scheduling model to GLM 5.3 Flash" --body-file /tmp/pr-bodies/fix-scheduling-glm-5-3-flash.md
~~~

PR本文はgh-pr-bodyの手順に従い、複数行Markdownを/tmp/pr-bodies/fix-scheduling-glm-5-3-flash.mdへ書いて--body-fileで渡す。本文には、予約エージェントと移動パディング分類を対象にモデルを変更したこと、reasoningを指定しないこと、検証コマンドの結果を記載する。

- [ ] **Step 5: 作成したPR本文とbaseを検証し、PR URLをブラウザで開く**

~~~bash
gh pr view --json number,title,baseRefName,headRefName,url,body
~~~

Expected: baseRefNameがmainで、PR本文の改行とMarkdownが保持され、URLが取得できる。そのURLをブラウザで開いてユーザーへ渡す。
