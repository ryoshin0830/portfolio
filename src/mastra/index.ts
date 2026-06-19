import { Mastra } from "@mastra/core";
import { schedulingAgent } from "./agents/scheduling-agent";

/**
 * Mastra インスタンス（サーバー専用）。Route Handler から import して使う。
 * 将来メモリ/ワークフローを足す場合はここに storage / workflows を登録する。
 */
export const mastra = new Mastra({
  agents: { scheduling: schedulingAgent },
});
