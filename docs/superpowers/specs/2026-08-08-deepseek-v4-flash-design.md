# 予約機能のDeepSeek V4 Flash移行 設計

## 目的

ポートフォリオサイトの予約機能で使用するDeepSeekモデルを、現在の
`deepseek-chat` から `deepseek-v4-flash` へ変更する。予約会話と移動要否判定で
同じモデル設定を共有し、将来の変更時に片方だけが古い設定に残ることを防ぐ。

## 対象範囲

- `src/mastra/agents/scheduling-agent.ts` の予約会話エージェント
- `src/lib/scheduling.ts` のカレンダー予定に対する移動要否判定
- 上記2箇所が使用する共有モデル生成ヘルパーと、その回帰テスト

予約枠の計算、Google Calendar連携、会話指示、APIレスポンス、環境変数の契約は
変更しない。

## 設計

`src/lib/scheduling-model.ts` を追加し、予約機能専用のモデルID定数
`SCHEDULING_MODEL_ID` と、DeepSeekプロバイダーからモデルを生成する
`createSchedulingModel` を公開する。モデルIDは `deepseek-v4-flash` に固定する。

予約会話エージェントと移動要否判定は、個別に `createDeepSeek` とモデル文字列を
組み立てず、`createSchedulingModel` を呼び出す。APIキーを引数として渡す既存の
責務は維持するため、秘密情報の扱いや環境変数名は変わらない。

データフローは次のとおり。

1. 呼び出し元が `DEEPSEEK_API_KEY` を取得する。
2. `createSchedulingModel` がAPIキーでDeepSeekプロバイダーを作成する。
3. プロバイダーへ `deepseek-v4-flash` を渡し、AI SDK用のモデルを返す。
4. Mastraエージェントまたは `generateText` が返されたモデルを使用する。

## エラー処理

移動要否判定は、APIキーが未設定の場合にLLMを呼ばず、既存のヒューリスティックへ
フォールバックする。LLM呼び出しが失敗した場合も同じフォールバックを維持する。
予約会話APIの未設定時503応答と上流エラー時502応答も変更しない。

共有ヘルパーは既存のDeepSeekプロバイダーと同じエラー伝播を行い、新しい再試行や
独自フォールバックは追加しない。

## テスト

Vitestで `@ai-sdk/deepseek` のプロバイダー生成関数を置き換え、
`createSchedulingModel` が受け取ったAPIキーをそのまま渡すことと、生成した
プロバイダーを正確に `deepseek-v4-flash` で呼ぶことを検証する。

実装はテストを先に追加して期待どおり失敗することを確認し、その後に最小実装を
追加する。完了時は全Vitest、TypeScript型検査、ESLint、本番ビルドを実行する。

## 完了条件

- 予約機能の2つのLLM利用箇所が共有ヘルパーを使用する。
- 実行時に選択されるモデルIDが `deepseek-v4-flash` である。
- `deepseek-chat` の予約機能内の参照が残っていない。
- 既存のフォールバックとAPIエラー処理が維持される。
- 回帰テスト、全テスト、型検査、lint、本番ビルドが成功する。
