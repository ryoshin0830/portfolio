---
id: DD-openrouter-scheduling-migration-01
type: prd
status: proposed
---

# 予約AIのOpenRouter移行 要件定義書（PRD）

- 関連 Issue: なし（本番障害調査から開始）
- 関連ドキュメント: [設計書](./02_design-doc.md)
- 調査基準日: 2026-09-07（JST）

## 1. 概要

### 1.1 背景

予約機能の本番チャットは、画面からのHTTPリクエスト自体は成功しているように見える一方、SSEストリーム内でDeepSeek APIの呼び出しが 402 / Insufficient Balance になり、AIの回答を返せない状態になっている。画面はストリーム内の詳細エラーを一般的な再試行メッセージとして表示するため、利用者からは「予約部分が壊れている」ように見える。

現行コードでは、DeepSeekのprovider設定が予約エージェント、空き枠検索時の移動パディング分類、チャットAPIの起動条件、テストに分散している。Vercelの eastlinker/portfolio には、調査時点で DEEPSEEK_API_KEY が Preview と Production に登録されているが、OPENROUTER_API_KEY は登録されていない。

### 1.2 目的

予約機能で使用するすべてのAI呼び出しをOpenRouter経由に移行する。予約エージェントと移動パディング分類の両方で、モデル openai/gpt-5.6-luna と reasoning effort xhigh を使用する。

Google Calendar連携、空き枠計算、予約の再確認、予約UIとAI SDKのストリームプロトコルは維持し、providerと認証情報の差し替えに限定して移行する。

### 1.3 リリース方針

第1弾で移行を完了させる。基盤だけを先に残す段階分割は行わず、次の順序で一つのリリースとして扱う。

1. 本仕様に基づく共有モデル設定、provider依存、呼び出し元、テストを変更する。
2. OpenRouter APIキーをVercelの Preview と Production に暗号化登録する。既存のDeepSeekキーはこの時点では削除しない。
3. 新しいコードをデプロイし、予約チャットの空き枠提示までを本番スモークテストする。
4. 成功を確認した後、Preview と Production の DEEPSEEK_API_KEY を削除する。

この順序により、コード切り替え前に新しい認証情報を用意でき、疎通失敗時には旧デプロイと旧キーを使った復旧余地を残せる。OpenRouterとDeepSeekを実行時フォールバックとして併用することは、今回の要件には含めない。

## 2. 用語

| 用語 | 意味 |
|------|------|
| 予約エージェント | Mastraに登録された scheduling エージェント。空き枠検索と予約ツールを呼び出し、利用者へ回答する |
| 移動パディング分類 | Google Calendarのイベント文脈から、前後に必要な移動時間を分類する内部処理 |
| 共有モデルファクトリ | モデルID、APIキー、reasoning設定を一箇所で組み立てるサーバー専用の生成関数 |
| xhigh | OpenRouterの reasoning effort 値。予約エージェントと移動パディング分類の両方に固定適用する |
| 本番スモークテスト | 副作用のある予約登録を行わず、本番チャットで空き枠を取得し、ストリームが正常終了することを確認するテスト |

## 3. 機能要件

### FR-01: OpenRouterへの統一

予約機能のすべてのAI呼び出しはOpenRouterを経由しなければならない。現行の対象は次の2箇所とする。

- scheduling エージェントの通常応答、ツール呼び出し、ツール結果後の応答
- scheduling.ts 内の移動パディング分類

将来、予約機能にAI呼び出しを追加する場合も、共有モデルファクトリを経由する。

### FR-02: モデルとreasoning設定

すべての対象呼び出しは、モデル openai/gpt-5.6-luna と reasoning effort xhigh を使用する。モデルIDとreasoning値はサーバー側の定数または共有モデル設定で固定し、クライアント入力やVercel環境変数から変更できないようにする。

### FR-03: 認証情報

OpenRouterの認証には OPENROUTER_API_KEY を使用する。予約チャットAPIは、Google Calendar設定に加えてこの環境変数が存在しない場合、既存のサービス利用不可レスポンス（HTTP 503）を返す。

移動パディング分類は、キー未設定またはOpenRouter呼び出し失敗時に、既存の決定的なヒューリスティックへフォールバックできる。このフォールバックは別のAI providerを呼び出してはならない。

### FR-04: 既存の予約挙動の維持

次の処理仕様はprovider移行によって変更しない。

- Asia/Tokyoを基準とした日付・時刻の扱い
- 営業時間、リードタイム、予約可能期間、曜日、所要時間の制約
- Google Calendarのbusy情報とイベント文脈の取得
- 空き枠の移動パディング適用
- 予約直前の再取得・再検証と slot_taken の扱い
- 予約ツールおよび既存の直接予約APIの入力検証とレート制限

### FR-05: ストリーム契約の維持

/api/schedule/chat のUI Message / SSEストリーム契約、MastraのエージェントID、既存ツールID、SchedulingChatの提案リンクおよび空き枠ボタンの動作は変更しない。

### FR-06: Vercel環境変数

Vercelプロジェクト eastlinker/portfolio の Preview と Production に、暗号化された OPENROUTER_API_KEY を登録する。値は1Passwordの次の参照から取得する。

op://agent/OpenRouter API Key - portfolio/credential

キーの実値はリポジトリ、ドキュメント、ログ、コマンド出力、テストスナップショットに残してはならない。

### FR-07: 旧設定の撤去

本番スモークテストとデプロイ後検証が成功した後、アクティブなコード、package.json、package-lock.json、テストからDeepSeek依存と参照を削除する。Vercelの Preview と Production からも DEEPSEEK_API_KEY を削除する。

## 4. スコープ外（次弾以降 / 本件対象外）

| 項目 | 後回しの理由 | 解禁トリガー |
|------|-------------|-------------|
| DeepSeekまたは別providerへの実行時フォールバック | 「DeepSeekではなくOpenRouterを使う」という今回の方針と矛盾し、障害原因の切り分けを難しくするため | OpenRouterの可用性要件と費用上限を別途合意したとき |
| モデルID・reasoning effortの管理画面または環境変数化 | 今回は指定値を固定する移行であり、利用者が変更する要件がないため | 複数モデルのA/Bテスト要件が決まったとき |
| 予約UIのエラー文言改善 | 現在の詳細エラー非表示は別のUX課題であり、provider移行の回帰範囲を広げるため | OpenRouter移行後のエラー分類要件が決まったとき |
| OpenRouter残高・利用量の自動監視と通知 | 今回は接続切り替えを優先し、既存のVercelログとOpenRouter管理画面で確認するため | 月次費用上限またはアラート閾値が決まったとき |
| ローカル開発用の秘密情報配布 | リポジトリに秘密を置かず、既存のローカル運用方針を維持するため | 開発者向けの安全なsecret注入手順を別途決めたとき |

## 5. 非機能要件

### 5.1 セキュリティ要件

- APIキーはサーバー専用環境変数として扱い、NEXT_PUBLIC_ 接頭辞を付けない。
- 1PasswordからVercel CLIへは標準入力で渡し、キーを端末出力へ表示しない。
- VercelではProductionとPreviewを暗号化変数として登録する。
- モデル設定テストでは実キーを使わず、ダミー値または空値を使用する。
- エラー記録やスモークテスト結果には、APIキー、Authorizationヘッダー、完全なプロンプトを含めない。

### 5.2 可用性・運用要件

- reasoningを xhigh に統一することで推論時間が増える可能性があるため、チャットAPIの maxDuration は30秒から60秒へ変更する。
- 60秒以内に完了しない場合はリリース失敗として扱い、VercelログとOpenRouter側のリクエスト状況を確認する。
- 移動パディング分類だけは、OpenRouter障害時に既存ヒューリスティックで空き枠計算を継続できる。
- 既存のチャット15回/分、予約5回/5分のレート制限は維持する。

### 5.3 コスト・品質

- xhighはユーザー向け応答だけでなく内部分類にも適用するため、移行後はOpenRouterの利用量と推論トークンを確認する。
- クライアントからreasoning設定やモデルIDを上書きできないようにし、意図しない高額モデルへの切り替えを防ぐ。
- OpenRouterのモデルがtool callingとstructured outputsを提供することを、依存更新後の単体テストと本番スモークテストで確認する。

## 6. 制約・前提

- 現行プロジェクトはAI SDK v6系を利用しているため、OpenRouter providerはAI SDK v6互換の @openrouter/ai-sdk-provider@2.9.1 を採用する。最新版を無条件に導入しない。
- Mastraエージェントは既存のLanguageModelを受け取る構成を維持し、Mastraのストリーミングやツールプロトコルを独自実装しない。
- Google OAuth、Google Calendar、既存のslot計算は移行対象外とする。
- Vercelの環境変数は調査時点でPreviewとProductionにDeepSeekキーがあるため、OpenRouterキーも同じ2環境へ登録する。Development環境への登録は行わない。
- 現在の作業ツリーは本番のmain相当コミットを基準にしており、spec docsのコミット後に実装計画を作る。

## 7. 受け入れ基準

### 7.1 コードとテスト

- [ ] 予約機能のAI呼び出しが共有モデルファクトリを経由している。
- [ ] 共有モデルファクトリのテストが、OpenRouter provider、モデルID、reasoning.effort = xhigh、APIキーの受け渡しを検証している。
- [ ] アクティブなソース、package.json、package-lock.json、テストにDeepSeekのprovider・モデル名・環境変数参照が残っていない。
- [ ] 既存の予約・空き枠計算・移動パディング・UI関連テストが通過する。
- [ ] typecheck、lint、buildが通過する。
- [ ] maxDuration=60 がチャットAPIに反映されている。

### 7.2 Vercelと秘密管理

- [ ] PreviewとProductionの両方に OPENROUTER_API_KEY がEncryptedとして存在する。
- [ ] APIキーの実値がコマンド出力、ログ、リポジトリ、ドキュメントに露出していない。
- [ ] 新しいコードをデプロイした後、旧DeepSeekキーを削除する。

### 7.3 本番スモーク

- [ ] 本番の予約チャットへ有効なUI Message形式で問い合わせ、SSEストリームがエラーイベントで終わらず正常終了する。
- [ ] 空き枠検索ツールが実行され、予約候補が表示される。
- [ ] レスポンスまたはVercelログにDeepSeek URL、deepseek-chat、Insufficient Balance が現れない。
- [ ] 副作用のある予約登録はスモークテストで行わない。予約作成の回帰は既存単体テストで確認する。

## 8. 成功指標

- 本番予約チャットで、DeepSeek残高不足によるエラーが発生しない。
- OpenRouterの指定モデルとxhigh設定で、空き枠提示までの主要ユースケースが完了する。
- Google Calendarの空き枠・予約整合性に、provider移行に起因する回帰がない。
- 移行後にDeepSeekキーと依存が残らず、秘密情報の露出がない。

## 9. 参考資料

- [OpenRouter公式: AI SDK / framework移行ガイド](https://openrouter.ai/docs/cookbook/get-started/migrate-to-openrouter)
- [OpenRouter公式: reasoning tokensとeffort](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens)
- [OpenRouter公式: OpenAI GPT-5.6 Luna](https://openrouter.ai/openai/gpt-5.6-luna-20260709)
- [OpenRouter providerのAI SDK v6互換リリース](https://www.npmjs.com/package/@openrouter/ai-sdk-provider)
- [チャットAPIの現行実装](../../../src/app/api/schedule/chat/route.ts)
- [予約エージェントの現行実装](../../../src/mastra/agents/scheduling-agent.ts)
- [空き枠計算と移動パディングの現行実装](../../../src/lib/scheduling.ts)
- [予約ツールの現行実装](../../../src/mastra/tools/scheduling-tools.ts)
