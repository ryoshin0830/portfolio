import { createDeepSeek } from "@ai-sdk/deepseek";

export const SCHEDULING_MODEL_ID = "deepseek-v4-flash";

export function createSchedulingModel(apiKey: string | undefined) {
  const deepseek = createDeepSeek({ apiKey });
  return deepseek(SCHEDULING_MODEL_ID);
}
