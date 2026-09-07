# Task 1 Report: Update Scheduling Model Contract Tests for GLM

## Status

RED complete. The two specified contract tests now describe the requested `z-ai/glm-5.3-flash` model and default reasoning behavior. Production implementation was intentionally left unchanged for the next task.

## Changes

- Updated `src/lib/scheduling-model.test.ts` to expect `z-ai/glm-5.3-flash` and a provider call containing only the model ID.
- Removed the `SCHEDULING_REASONING_EFFORT` import and assertions.
- Updated `src/lib/scheduling-model.integration.test.ts` to expect the GLM model in the stub response and request body.
- Added assertions that the HTTP request has neither `reasoning` nor `temperature`.

## TDD Evidence

Command:

```bash
npx vitest run src/lib/scheduling-model.test.ts src/lib/scheduling-model.integration.test.ts
```

Result: expected RED — 2 test files failed, with 3 tests failing.

The failures demonstrate that the current implementation still sends `openai/gpt-5.6-luna` and `reasoning: { effort: "xhigh" }`, while the new contract expects `z-ai/glm-5.3-flash` and no reasoning option.

## Self-Review

- Only the two test files named in the brief were modified; no production file was changed.
- The unit tests preserve the strict provider configuration and API-key behavior.
- The integration test preserves the structured-output assertion and independently rejects both reasoning and temperature fields.
- `git diff --check` passed.

## Commit

The test-only changes and this required report are committed as:

`test(scheduling): update model contract tests for GLM`
