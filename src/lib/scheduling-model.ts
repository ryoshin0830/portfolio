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
