---
id: DD-openrouter-scheduling-migration-02
type: design-doc
status: proposed
---

# 予約AIのOpenRouter移行 設計書（Design Doc）

- 関連 Issue: なし（本番障害調査から開始）
- 関連ドキュメント: [要件定義書](./01_PRD.md)
- 調査基準日: 2026-09-07（JST）

この設計は、既存の予約ドメインとストリーミング契約を保ったまま、AI provider・認証・モデル設定を置き換えるための判断を記録する。

## 1. スコープと全体像

### 1.1 システム構成

~~~mermaid
flowchart LR
    U["ユーザー"] --> C["SchedulingChat"]
    C --> R["/api/schedule/chat"]
    R --> A["Mastra scheduling エージェント"]
    A --> M["共有モデルファクトリ"]
    M --> O["OpenRouter API"]
    O --> L["openai/gpt-5.6-luna"]
    A --> F["find-slots ツール"]
    F --> S["予約ドメイン"]
    S --> G["Google Calendar"]
    S --> T["移動パディング分類"]
    T --> M
    A --> B["book-slot ツール"]
    B --> S
    D["/api/schedule/book"] --> S
    V["Vercel Preview / Production"] --> E["OPENROUTER_API_KEY"]
    E --> M
~~~

予約チャットの通常経路では、SchedulingChatから既存のUI Message形式でチャットAPIへ送信する。Mastraエージェントは共有モデルファクトリで作ったLanguageModelを使い、必要に応じてfind-slotsまたはbook-slotを呼び出す。find-slotsが空き枠を計算するとき、イベント文脈の移動パディング分類も同じ共有モデルファクトリを使う。

Google Calendarは空き枠と予約の正本であり、今回の変更でproviderの責務を持たせない。既存の直接予約APIも同じ予約ドメインを使うが、チャット移行のストリーム契約とは独立して維持する。

### 1.2 既存資産の再利用

| 既存資産 | 現在の責務 | 移行後の扱い | 対応する既存テスト |
|----------|------------|--------------|--------------------|
| src/lib/scheduling.ts | 日付範囲、busy除外、移動パディング、予約直前の再検証 | 予約ロジックは再利用し、分類時のprovider生成だけ共有ファクトリへ差し替える | src/lib/scheduling.test.ts、src/lib/scheduling.booking.test.ts |
| src/mastra/agents/scheduling-agent.ts | instructions、モデル、2つの予約ツールの登録 | instructionsとtoolsは維持し、モデルを共有ファクトリへ差し替える | src/mastra/agents/scheduling-agent.test.ts |
| src/mastra/tools/scheduling-tools.ts | find-slots / book-slotのMastra境界 | 入出力とGoogle Calendar呼び出しを変更しない | src/mastra/tools/scheduling-tools.test.ts |
| src/app/api/schedule/chat/route.ts | 設定チェックとMastra UI Messageストリーミング | チェック対象をOPENROUTER_API_KEYへ変更し、maxDurationを60秒へ変更する | 既存のストリーム検証、デプロイスモーク |
| src/components/SchedulingChat.tsx | チャットUI、提案、空き枠ボタン、サニタイズ | API契約が変わらないため変更しない。DeepSeek表記のコメント・説明だけ更新対象 | src/components/SchedulingChat.test.tsx |
| 旧DeepSeek移行の共有ファクトリ | provider設定を呼び出し元から分離するパターン | 概念を再利用し、OpenRouter向けに新しい共有ファクトリとテストを作る | 新規の共有モデルテスト |

## 2. データ設計

### 2.1 永続データ

DBテーブル、Google Calendarイベントの形式、予約データのカラムは追加・変更しない。モデルの推論結果は従来どおりリクエスト処理中にのみ利用し、DBへ保存しない。

### 2.2 環境変数と固定設定

| 設定 | 保管場所 | 値の決め方 | 移行時の扱い |
|------|----------|------------|--------------|
| OPENROUTER_API_KEY | Vercel Preview / ProductionのEncrypted env | 1Passwordの指定credential | 先に登録し、デプロイ後に存在を確認する |
| DEEPSEEK_API_KEY | Vercel Preview / ProductionのEncrypted env | 既存値 | 新コードの疎通確認が終わるまで保持し、その後削除する |
| SCHEDULING_MODEL_ID | サーバー専用の共有モデル設定 | openai/gpt-5.6-luna 固定 | 環境変数化しない |
| SCHEDULING_REASONING_EFFORT | サーバー専用の共有モデル設定 | xhigh 固定 | 環境変数化しない |
| GOOGLE_* | Vercel Preview / Productionの既存env | 既存値 | 変更しない |

APIキーはクライアントへ公開せず、Next.jsのサーバー実行時にだけ参照する。テストでは実値を読み込まない。

## 3. 処理フロー・ユースケース

### 3.1 空き枠を提示する正常系

~~~mermaid
sequenceDiagram
    participant U as ユーザー
    participant C as SchedulingChat
    participant R as チャットAPI
    participant A as schedulingエージェント
    participant M as 共有モデルファクトリ
    participant O as OpenRouter
    participant F as find-slots
    participant S as 予約ドメイン
    participant G as Google Calendar

    U->>C: 日程調整メッセージ
    C->>R: UI Messageストリーム要求
    R->>R: Google設定とOPENROUTER_API_KEYを確認
    R->>A: Mastraストリーム開始
    A->>M: GPT-5.6 Luna / xhighモデルを取得
    A->>O: 回答またはfind-slotsの判断を要求
    O-->>A: tool call
    A->>F: 日付範囲と条件
    F->>S: 空き枠計算
    S->>G: busyとイベント文脈を取得
    S->>M: 移動パディング分類モデルを取得
    M->>O: 同じモデル / xhighで分類
    O-->>S: 構造化された分類結果
    S-->>F: 移動時間反映済み候補
    F-->>A: 候補とタイムゾーン
    A->>O: ツール結果を含む最終回答を要求
    O-->>A: 回答ストリーム
    A-->>R: UI Messageイベント
    R-->>C: SSE
    C-->>U: 空き枠を表示
~~~

### 3.2 予約登録

予約登録は既存のbook-slotツールから予約ドメインを呼び出す経路を維持する。予約ドメインは候補の構造検証、現在時刻・リードタイム検証、Google Calendarのbusy再取得、移動パディング再計算、イベント登録を順番に実施する。OpenRouter移行によって、予約の最終検証やイベント登録をモデルに委ねることはない。

### 3.3 OpenRouterが利用できない場合

チャットAPIでOPENROUTER_API_KEYが未設定なら、処理開始前にHTTP 503を返す。キーが設定されていてOpenRouterが401、402、429、5xx、タイムアウトなどを返した場合、予約エージェントの既存ストリームエラー経路を使う。DeepSeekへ再送はしない。

移動パディング分類だけは、キー未設定またはモデル呼び出し失敗時に既存ヒューリスティックへフォールバックし、空き枠計算そのものを可能な範囲で継続する。

## 4. 主要な設計決定とトレードオフ

| # | 決定 | 採用案と理由 | 代替案 |
|---|------|-------------|--------|
| 1 | OpenRouterとの接続方法 | @openrouter/ai-sdk-provider@2.9.1 を採用する。現行のAI SDK v6と互換性があり、MastraとAI SDKのストリーミング・tool calling境界を維持できる | OpenAI互換providerを手動設定する案は依存を減らせるが、reasoning・tool calling・structured outputの差分を自前で吸収する必要がある |
| 2 | モデル設定の所有者 | サーバー専用の共有モデルファクトリにモデルID、APIキー、reasoning設定を集約する。2つの呼び出し元の設定ドリフトを防ぐ | エージェントと移動分類でproviderを個別生成すると、片方だけ旧モデル・旧設定になるリスクがある |
| 3 | reasoningの渡し方 | provider生成時のextraBodyに reasoning: { effort: xhigh } を設定する。Mastra内部の呼び出しにも自動的に適用できる | 各generateTextまたはstreamTextにproviderOptionsを渡す案は、Mastraエージェント経路へ確実に渡る保証がなく、設定漏れが起きやすい |
| 4 | モデルIDとeffortの外部設定 | openai/gpt-5.6-luna と xhigh をコード上の定数として固定する。今回の要件をサーバー側で保証し、クライアントから上書きさせない | 環境変数化は運用上の変更が容易になるが、意図しないモデル変更と費用変動を招く |
| 5 | providerフォールバック | DeepSeekを実行時フォールバックとして残さない。移行後の挙動と障害原因を明確にし、ユーザーの「DeepSeekではなくOpenRouter」という方針を守る | 二重providerフォールバックは短期的な可用性を上げる可能性があるが、DeepSeek残高不足を再発させ、設定・監視を複雑にする |
| 6 | Vercelの登録対象 | PreviewとProductionへEncrypted登録する。既存のDeepSeekキーと同じ対象を維持し、PR previewと本番で挙動が分かれないようにする | Productionだけに登録すると本番は動くが、Previewで予約チャットを検証できない |
| 7 | チャットの実行時間 | maxDurationを30秒から60秒へ拡張する。xhighをエージェントと内部分類の双方で使い、tool callを含む経路の余裕を確保する | 30秒を維持すると設定変更は小さいが、推論・Calendar取得・複数回のモデル呼び出しでタイムアウトしやすい |

## 5. 既存処理・インフラへの影響

### 5.1 コード影響

| 対象 | 変更内容 | 変更しない内容 |
|------|----------|----------------|
| package.json / package-lock.json | DeepSeek providerを削除し、AI SDK v6互換のOpenRouter providerを追加する | AI SDK、Mastra、Next.jsのメジャーバージョン |
| 共有モデル設定 | OpenRouter provider、モデルID、xhighを一元化する | Google Calendar設定 |
| scheduling agent | model参照とコメントをOpenRouter向けに変更する | agent ID、instructions、find-slots、book-slot |
| scheduling.ts | 移動パディング分類が共有モデルファクトリを使うように変更する | fallback heuristic、slot計算、予約再検証 |
| chat route | 環境変数名とmaxDurationを変更する | UI Message protocol、rate limit、runtime |
| テスト | providerモック、環境変数名、モデル設定の検証を更新・追加する | 既存の時間・予約・XSSテストの目的 |
| SchedulingChat | DeepSeekという説明をOpenRouter向けに更新する | UI、サニタイズ、actionリンク、空き枠表示 |

### 5.2 インフラ影響

- Vercel eastlinker/portfolio の Preview と Production に新しいEncrypted環境変数を追加する。
- 新しい環境変数がない状態で新コードをデプロイしない。登録後に環境変数名と対象だけをCLIで確認する。
- APIキーの値確認のためにvercel env pullを実行しない。必要な場合も値を表示せず、Encrypted表示と対象環境だけを確認する。
- OpenRouterの利用量・残高はOpenRouter管理画面で確認し、CLIやアプリログにキーを出さない。
- Google CalendarのOAuth資格情報、イベント、会議リンク、メール通知設定に変更を加えない。

### 5.3 リリース順序とロールバック

1. spec docsをコミットする。
2. 実装計画に従い、まず失敗するテストを追加してprovider設定の不在を確認する。
3. OpenRouter provider、共有モデルファクトリ、呼び出し元を実装し、ローカル検証を通す。
4. VercelのPreviewとProductionへOPENROUTER_API_KEYを登録する。
5. 新コードをデプロイする。
6. 本番チャットで空き枠提示のスモークテストを実行する。
7. 成功後、DEEPSEEK_API_KEYをPreviewとProductionから削除する。

スモークテスト失敗時は、旧DeepSeekキーを残したまま原因を切り分ける。必要なら旧コミットを再デプロイして復旧する。新コード内でDeepSeekを呼び戻すことはしない。

## 6. 異常系・監視

### 6.1 異常系ハンドリング

| 事象 | 期待する挙動 | 確認方法 |
|------|--------------|----------|
| OPENROUTER_API_KEY未設定 | チャットAPIはHTTP 503。移動分類はheuristicへフォールバック | routeの単体テスト、環境変数なしの既存テスト |
| APIキー無効（401） | 予約エージェントの既存ストリームエラー。DeepSeekへ再送しない | Vercelログとproviderエラー種別 |
| 残高不足（402） | 予約エージェントの既存ストリームエラー。移動分類はheuristicへフォールバック可能 | OpenRouter利用状況と本番ログ |
| レート制限（429） | 既存エラー経路。自動リトライや別provider切り替えは追加しない | Vercelログ |
| structured output / tool call不整合 | スモークテストを失敗扱いにし、モデル・provider互換性を調査する | find-slots実行と最終ストリーム |
| 60秒超過 | Vercelのタイムアウト。リリース成功と判定しない | Functionログ、実測時間 |
| Calendar API障害 | 既存のGoogle Calendarエラー経路を維持する | 既存テスト、Vercelログ |

### 6.2 通知・監視ルール

第1弾では新しい自動通知を追加しない。リリース時に次を手動確認する。

- Vercel FunctionログにDeepSeekのURL、モデル名、認証情報が出ていないこと。
- OpenRouter側で指定モデルのリクエストと推論トークン利用量を確認できること。
- 本番チャットのSSEがエラーイベントで終了せず、空き枠を表示すること。
- 既存のレート制限とGoogle Calendar APIエラーがprovider変更で変化していないこと。

## 7. 実装計画

### Phase 1: OpenRouter移行と本番検証

**目的**: 予約機能のAI呼び出しをOpenRouterへ切り替え、指定モデル・xhigh・秘密管理・本番疎通を一つのリリースで完了する。

**作成・変更対象**:

- AI SDK v6互換OpenRouter providerとlockfile
- サーバー専用の共有モデルファクトリと設定テスト
- scheduling agent、移動パディング分類、chat routeのprovider参照
- DeepSeek前提のテストとコメント
- Vercel Preview / Productionの環境変数
- 本番スモークテスト記録

**完了条件**:

- [ ] 先に追加した共有モデル設定テストが失敗し、その後実装により通過する
- [ ] 予約エージェントと移動パディング分類の両方がGPT-5.6 Luna / xhighを使う
- [ ] npm test、npm run typecheck、npm run lint、npm run build が通過する
- [ ] PreviewとProductionにOPENROUTER_API_KEYがEncryptedで登録されている
- [ ] 本番スモークテストで空き枠提示まで成功する
- [ ] 成功確認後にDeepSeek依存とVercelキーを削除する

## 8. 残課題と決定事項

#### 設計確認（2026-09-07）で確定した事項

- 予約エージェントだけでなく、移動パディング分類もOpenRouterの指定モデルと xhigh を使う。
- 現在の本番障害はDeepSeekの残高不足による402であり、OpenRouter移行の直接動機とする。
- AI SDK v6との互換性を優先し、OpenRouter providerは2.9.1に固定する。
- 新しいキーはPreviewとProductionに登録し、疎通確認後に旧DeepSeekキーを削除する。
- providerフォールバックは実装せず、移動パディング分類の決定的fallbackだけを維持する。

## 9. 参考資料

- [要件定義書](./01_PRD.md)
- [チャットAPIの現行実装](../../../src/app/api/schedule/chat/route.ts)
- [予約エージェントの現行実装](../../../src/mastra/agents/scheduling-agent.ts)
- [空き枠計算と移動パディングの現行実装](../../../src/lib/scheduling.ts)
- [予約ツールの現行実装](../../../src/mastra/tools/scheduling-tools.ts)
- [Google Calendar連携の現行実装](../../../src/lib/google-calendar.ts)
- [チャットUIの現行実装](../../../src/components/SchedulingChat.tsx)
- [OpenRouter公式: AI SDK / framework移行ガイド](https://openrouter.ai/docs/cookbook/get-started/migrate-to-openrouter)
- [OpenRouter公式: reasoning tokensとeffort](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens)
- [OpenRouter公式: OpenAI GPT-5.6 Luna](https://openrouter.ai/openai/gpt-5.6-luna-20260709)
- [OpenRouter providerのAI SDK v6互換リリース](https://www.npmjs.com/package/@openrouter/ai-sdk-provider)
