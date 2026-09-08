# 予約モデル切り替え Design Spec

## 1. 背景と目的

予約機能は、OpenRouter経由の共有モデルファクトリを使って、予約チャットのエージェントと移動パディング分類を実行している。現在のモデルは `openai/gpt-5.6-luna` で、生成時に `reasoning.effort: xhigh` を指定している。

今回の変更では、予約機能で使うモデルを `z-ai/glm-5.3-flash` に切り替える。reasoning effortは指定せず、OpenRouterとモデルのデフォルト設定に委ねる。

## 2. 要件

- 予約エージェントと移動パディング分類の両方が `z-ai/glm-5.3-flash` を使う。
- OpenRouter providerのモデル生成呼び出しに `reasoning` プロパティを渡さない。
- OpenRouterの `compatibility: "strict"` と `OPENROUTER_API_KEY` の受け渡しは維持する。
- 予約エージェントのツール、Google Calendar連携、空き枠計算、予約直前の再検証、UI Message / SSE契約、レート制限は変更しない。
- 移動パディング分類の、APIキー未設定時とモデル呼び出し失敗時のheuristic fallbackは維持する。
- モデルIDとreasoning設定をクライアント入力や環境変数で上書きできるようにはしない。
- 対応するユニットテストとOpenRouterリクエストテストで、モデルIDと `reasoning` 未送信を検証する。

## 3. 採用案と代替案

### 案A: 共有モデルファクトリだけを更新する（採用）

`src/lib/scheduling-model.ts` の固定モデルIDを変更し、providerのモデル生成を `openrouter("z-ai/glm-5.3-flash")` とする。第2引数を渡さないことで `reasoning` をリクエストに含めない。既存の2つの呼び出し元は共有ファクトリを使い続けるため、予約機能全体の設定を一箇所で揃えられる。

変更範囲が小さく、予約フローやprovider境界を変えずに、モデルと推論設定だけを確実に置き換えられるため採用する。

### 案B: 予約エージェントと分類処理に個別のモデル設定を持たせる

各呼び出し元でモデルIDを指定する案である。現在の共有設定を分散させ、片方だけ古いモデルやreasoning設定を使うドリフトを招くため採用しない。

### 案C: モデルIDとreasoningを環境変数化する

運用時の切り替えは容易になるが、今回必要な固定変更に対して設定経路と検証範囲を増やす。モデルの意図しない上書きを許すため採用しない。

## 4. 設計

### 4.1 モデルファクトリ

モデル設定の正本は `src/lib/scheduling-model.ts` とする。ファクトリは次の責務を持つ。

```typescript
export const SCHEDULING_MODEL_ID = "z-ai/glm-5.3-flash";

export function createSchedulingModel(apiKey: string | undefined): LanguageModelV3 {
  const openrouter = createOpenRouter({
    apiKey,
    compatibility: "strict",
  });

  return openrouter(SCHEDULING_MODEL_ID);
}
```

`reasoning`、`temperature`、モデルを上書きする入力は渡さない。これにより、OpenRouterリクエストにはモデルIDだけが明示され、reasoning effortは指定なしになる。

### 4.2 呼び出しとデータフロー

予約チャットのscheduling agentと、空き枠計算中の移動パディング分類は同じ `createSchedulingModel` を呼ぶ。前者は既存のMastra tool callingとUI Messageストリームを使い、後者は既存のstructured outputスキーマを使う。モデル変更はこれらの境界の内側に留める。

```text
SchedulingChat
  -> /api/schedule/chat
  -> scheduling agent -> createSchedulingModel -> OpenRouter / z-ai/glm-5.3-flash
  -> find-slots -> calendar + travel-padding classification
                         -> createSchedulingModel -> OpenRouter / z-ai/glm-5.3-flash
```

Google Calendarの予定詳細をブラウザやエージェントへ渡さない既存のデータ制限は維持する。

### 4.3 エラー処理

チャットAPIの未設定・レート制限・上流エラーの処理は変更しない。移動パディング分類でAPIキーがない場合、またはGLM呼び出しが失敗した場合は、既存のheuristic fallbackを使う。モデル切り替えに伴うprovider別のUIエラー文言や別providerへのフォールバックは追加しない。

## 5. テスト方針

- 共有モデルファクトリのユニットテストで、モデルIDが `z-ai/glm-5.3-flash` であること、strict設定とAPIキーが渡ること、provider呼び出しにreasoning設定がないことを検証する。
- OpenRouterリクエストテストで、送信モデルが `z-ai/glm-5.3-flash` であり、リクエストボディに `reasoning` と `temperature` がないことを検証する。
- scheduling agentの配線テストと既存の予約テストを実行し、共有モデル利用と予約ドメインの回帰がないことを確認する。
- 最終確認では `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` を実行する。

## 6. 対象外

- OpenRouter APIキーの追加・削除やVercel環境設定
- 予約UI、チャットAPIのストリーミング契約、Google Calendar、空き枠計算ルール
- 別providerへのフォールバックや実行時モデル切り替え
- 過去のOpenRouter移行設計書・計画書に記録された履歴の書き換え
