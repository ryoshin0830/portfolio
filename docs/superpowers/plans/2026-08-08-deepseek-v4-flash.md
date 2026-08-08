# DeepSeek V4 Flash Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use `deepseek-v4-flash` consistently for both LLM call sites in the portfolio scheduling feature.

**Architecture:** Add one scheduling-specific model factory that owns the DeepSeek model ID and provider construction. The scheduling agent and travel-padding classifier consume that factory, while their existing API-key checks, fallbacks, prompts, and response behavior remain unchanged.

**Tech Stack:** TypeScript 5, Next.js 15, AI SDK 6, `@ai-sdk/deepseek` 2, Mastra, Vitest 4

## Global Constraints

- The scheduling model ID must be exactly `deepseek-v4-flash`.
- Both the scheduling chat agent and travel-padding classifier must use the shared factory.
- Preserve the `DEEPSEEK_API_KEY` environment-variable contract.
- Preserve the heuristic fallback when the API key is absent or travel classification fails.
- Do not change slot calculation, Google Calendar integration, prompts, or API response contracts.

---

### Task 1: Centralize and Migrate the Scheduling Model

**Files:**
- Create: `src/lib/scheduling-model.test.ts`
- Create: `src/lib/scheduling-model.ts`
- Modify: `src/lib/scheduling.ts:1-2,223-229`
- Modify: `src/mastra/agents/scheduling-agent.ts:1-10,61`

**Interfaces:**
- Consumes: `createDeepSeek(options?: { apiKey?: string })` from `@ai-sdk/deepseek`
- Produces: `SCHEDULING_MODEL_ID` with literal value `deepseek-v4-flash`
- Produces: `createSchedulingModel(apiKey: string | undefined)` returning an AI SDK `LanguageModelV3`

- [ ] **Step 1: Write the failing regression test**

Create `src/lib/scheduling-model.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run src/lib/scheduling-model.test.ts
```

Expected: FAIL because `./scheduling-model` does not exist and both consumers still contain `deepseek("deepseek-chat")`.

- [ ] **Step 3: Add the shared model factory**

Create `src/lib/scheduling-model.ts`:

```typescript
import { createDeepSeek } from "@ai-sdk/deepseek";

export const SCHEDULING_MODEL_ID = "deepseek-v4-flash";

export function createSchedulingModel(apiKey: string | undefined) {
  const deepseek = createDeepSeek({ apiKey });
  return deepseek(SCHEDULING_MODEL_ID);
}
```

- [ ] **Step 4: Route the travel-padding classifier through the factory**

In `src/lib/scheduling.ts`, remove the direct `createDeepSeek` import, add:

```typescript
import { createSchedulingModel } from "@/lib/scheduling-model";
```

Then replace the provider construction and model selection with:

```typescript
const { output } = await generateText({
  model: createSchedulingModel(process.env.DEEPSEEK_API_KEY),
```

Keep the existing API-key guard and `catch` fallback unchanged.

- [ ] **Step 5: Route the scheduling agent through the factory**

In `src/mastra/agents/scheduling-agent.ts`, remove the direct `createDeepSeek` import, add:

```typescript
import { createSchedulingModel } from "@/lib/scheduling-model";
```

Construct the shared model once:

```typescript
const schedulingModel = createSchedulingModel(process.env.DEEPSEEK_API_KEY);
```

Pass it to the agent:

```typescript
model: schedulingModel,
```

Update the nearby model comment from `deepseek-chat` to `deepseek-v4-flash`.

- [ ] **Step 6: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run src/lib/scheduling-model.test.ts
```

Expected: PASS with 3 tests and 0 failures.

- [ ] **Step 7: Run full verification**

Run:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
git diff --check
rg -n 'deepseek-chat|deepseek-v4-flash|createSchedulingModel' src/lib src/mastra
```

Expected: all commands exit 0; the only scheduling model ID is `deepseek-v4-flash`; both consumers reference `createSchedulingModel`.

- [ ] **Step 8: Commit the implementation**

```bash
git add src/lib/scheduling-model.test.ts src/lib/scheduling-model.ts src/lib/scheduling.ts src/mastra/agents/scheduling-agent.ts
git commit -m "feat(scheduling): DeepSeek V4 Flashへ移行"
```
