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
