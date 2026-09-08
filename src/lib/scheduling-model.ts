import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModelV3 } from "@openrouter/ai-sdk-provider";

export const SCHEDULING_MODEL_ID = "z-ai/glm-5.3-flash";

export function createSchedulingModel(apiKey: string | undefined): LanguageModelV3 {
  const openrouter = createOpenRouter({
    apiKey,
    compatibility: "strict",
  });

  // reasoning.effort=minimal:
  //   GLM 5.3 Flash は hybrid reasoning モデルで、reasoning を未指定にすると
  //   thinking が既定で有効になる。日程調整は「ツール呼び出し＋定型フォーマット
  //   出力」なので thinking の価値は薄く、1 呼び出しあたり数秒〜十数秒を費やして
  //   /api/schedule/chat が Vercel の 60 秒制限を超えていた。完全無効化
  //   （reasoning.enabled=false / effort:"none"）は OpenRouter が "Reasoning is
  //   mandatory for this endpoint and cannot be disabled." で拒否するため、
  //   指定できる最小の effort まで落とす。
  //
  // provider ルーティングは指定しない（既定＝価格順）。25 社が配信しているモデル
  //   なので触りたくなるが、実測では既定が最も安定していた。sort:"latency" は TTFB
  //   だけ下げて 5 回中 4 回タイムアウト（所要時間の支配項は TTFB ではなく decode）、
  //   sort:"throughput" は交互 A/B 各 6 回で mean 14.1s 対 15.5s とノイズ程度の差で、
  //   分散は既定のほうが小さかった。詳細は scheduling-model.integration.test.ts。
  return openrouter(SCHEDULING_MODEL_ID, {
    reasoning: { effort: "minimal" },
  });
}
