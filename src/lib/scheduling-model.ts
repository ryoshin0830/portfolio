import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModelV3 } from "@openrouter/ai-sdk-provider";

export const SCHEDULING_MODEL_ID = "openai/gpt-5.6-luna";
export const SCHEDULING_REASONING_EFFORT = "xhigh" as const;

export function createSchedulingModel(apiKey: string | undefined): LanguageModelV3 {
  const openrouter = createOpenRouter({
    apiKey,
    compatibility: "strict",
  });

  return openrouter(SCHEDULING_MODEL_ID, {
    reasoning: {
      effort: SCHEDULING_REASONING_EFFORT,
    },
  });
}
