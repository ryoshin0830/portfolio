---
name: openrouter-scheduling-migration
type: design-spec
status: proposed
date: 2026-09-07
---

# 予約AIのOpenRouter移行 Design Spec

## 1. 概要

### 1.1 背景

予約機能の本番チャットは、画面からのHTTPリクエスト自体は成功しているように見える一方、SSEストリーム内でDeepSeek APIの呼び出しが 402 / Insufficient Balance になり、AIの回答を返せない状態になっている。画面はストリーム内の詳細エラーを一般的な再試行メッセージとして表示するため、利用者からは「予約部分が壊れている」ように見える。

2026-09-07の調査時点で、Vercelの eastlinker/portfolio には DEEPSEEK_API_KEY が Preview と Production に登録されているが、OPENROUTER_API_KEY は登録されていない。現在の本番デプロイは、DeepSeek V4 Flash移行をrevertしたmain相当コミット上にある。

### 1.2 決定事項

予約機能のすべてのAI呼び出しをOpenRouter経由に変更する。現在対象となる呼び出しは次の2つである。

1. Mastraの scheduling エージェントによる会話、tool call、tool結果後の最終回答
2. 空き枠検索中の移動パディング分類

両方で次を固定して使う。

- Provider: OpenRouter
- Model: openai/gpt-5.6-luna
- Reasoning effort: xhigh
- Credential: OPENROUTER_API_KEY

DeepSeekへの実行時フォールバックは実装しない。移動パディング分類に既存の決定的ヒューリスティックフォールバックがあるため、それだけは維持する。

### 1.3 目的

- DeepSeek残高不足で停止している本番予約チャットをOpenRouterへ切り替える。
- モデル、reasoning、APIキーの設定を一箇所へ集約し、エージェントと内部分類の設定ドリフトを防ぐ。
- Google Calendar、空き枠計算、予約直前の再検証、UI Message / SSE契約を変更せず、provider移行による回帰を限定する。

## 2. 現行実装の詳細確認

### 2.1 チャットのリクエスト経路

現在の経路は次のとおりである。

1. SchedulingChat が ai の DefaultChatTransport で /api/schedule/chat にUI Messageを送信する。
2. chat route が Google Calendar設定と DEEPSEEK_API_KEY の存在を確認する。
3. 設定が揃っていれば、Mastraの handleChatStream に agentId scheduling として処理を渡す。
4. scheduling エージェントが DeepSeek の deepseek-chat を使い、必要に応じて find-slots または book-slot を呼ぶ。
5. MastraのストリームがUI Message / SSEとしてブラウザへ返る。
6. SchedulingChat はテキスト部分だけを表示し、提案リンクと空き枠候補を次のメッセージ入力へ変換する。

本番で確認された失敗は経路1から3のHTTP応答ではなく、経路4のDeepSeek API呼び出しで発生した。外側のHTTPステータスが200でも、SSE内にエラーイベントが流れるため、画面上は一般的なチャットエラーになる。

### 2.2 AI呼び出しの分散箇所

| 対象 | 現行のDeepSeek依存 | 移行後の扱い |
|------|--------------------|--------------|
| src/mastra/agents/scheduling-agent.ts | createDeepSeek と deepseek-chat をモジュールレベルで生成 | 共有モデルファクトリが返すLanguageModelへ差し替える |
| src/lib/scheduling.ts | classifyTravelPadding が DEEPSEEK_API_KEY を確認し、deepseek-chatで generateText / structured outputを実行 | 同じ共有モデルファクトリを使い、reasoning xhighを適用する |
| src/app/api/schedule/chat/route.ts | DEEPSEEK_API_KEYがない場合に503 | OPENROUTER_API_KEYの確認へ差し替える |
| package.json / package-lock.json | @ai-sdk/deepseek 2.0.39 | AI SDK v6互換のOpenRouter providerへ置換する |
| src/lib/scheduling.test.ts | テスト前処理がDEEPSEEK_API_KEYを空にする | OPENROUTER_API_KEYへ変更する |
| src/lib/scheduling.booking.test.ts | 同上 | OPENROUTER_API_KEYへ変更する |
| src/components/SchedulingChat.tsx | DeepSeekを説明するコメント | OpenRouterを説明する文言へ更新する。UIロジックは変更しない |

### 2.3 変更しない既存処理

provider移行の対象外とし、既存テストで回帰を確認する。

- Asia/Tokyoを基準にした日付・時刻とオフセットの処理
- 営業時間、所要時間、リードタイム、予約可能期間、曜日制約
- Google Calendar freebusy とイベント文脈の取得
- 移動パディングの適用、分類失敗時のヒューリスティック
- find-slots の入力・出力と最大候補数
- book-slot の入力検証、候補の再検証、slot_taken、イベント登録
- /api/schedule/book の直接予約経路
- rate-limit のチャット15回/分、予約5回/5分
- SchedulingChat のサニタイズ、actionリンク、空き枠ボタン、UI Message形式

### 2.4 依存関係の制約

現在のAI SDKは6.0.208である。OpenRouter providerの最新版はAI SDK v7向けのため、今回の移行ではAI SDK v6互換の @openrouter/ai-sdk-provider 2.9.1 を固定採用する。AI SDKやMastraのメジャーアップデートは同時に行わない。

## 3. 要件

### 3.1 機能要件

- FR-01: 予約機能のすべてのAI呼び出しはOpenRouterを経由する。
- FR-02: 予約エージェントと移動パディング分類は同じモデルID openai/gpt-5.6-lunaを使う。
- FR-03: 予約エージェントと移動パディング分類の両方に reasoning effort xhigh を適用する。
- FR-04: モデルIDとreasoning設定はサーバー側で固定し、クライアント入力や環境変数で上書きできない。
- FR-05: チャットAPIはGoogle Calendar設定または OPENROUTER_API_KEY が欠けている場合にHTTP 503を返す。
- FR-06: 移動パディング分類はOpenRouterのキー未設定または呼び出し失敗時、別providerではなく既存ヒューリスティックへフォールバックする。
- FR-07: DeepSeekへの自動フォールバック、再送、並列provider実行は行わない。
- FR-08: AI SDKのUI Message / SSE契約、Mastraのagent ID、既存tool IDを変更しない。

### 3.2 秘密管理要件

- Vercelプロジェクト eastlinker/portfolio の Preview と Production に OPENROUTER_API_KEY をEncryptedで登録する。
- 値は1Passwordの op://agent/OpenRouter API Key - portfolio/credential から取得する。
- APIキーはリポジトリ、spec、ログ、テスト、スクリーンショット、コマンド出力に残さない。
- APIキーはサーバー専用とし、NEXT_PUBLIC_ 接頭辞を付けない。
- Development環境へVercelキーを追加しない。現在もAIキーはPreviewとProductionだけに存在する。
- 新しいキーの疎通確認が終わるまで、旧 DEEPSEEK_API_KEY は削除しない。

### 3.3 実行時間・運用要件

- xhighの推論、Google Calendar取得、tool call、tool結果後の応答を考慮し、chat route の maxDuration を30秒から60秒へ変更する。
- 既存のレート制限を維持する。
- OpenRouterの利用量、推論トークン、残高はOpenRouter管理画面で確認する。
- 第1弾では残高アラートや自動provider切り替えは追加しない。

## 4. 代替案と採用理由

### 案A: 公式OpenRouter AI SDK providerを共有ファクトリで使う（採用）

AI SDK v6互換の @openrouter/ai-sdk-provider@2.9.1 を導入し、createOpenRouterでサーバー専用の共有モデルを生成する。provider生成時のextraBodyに reasoning: { effort: xhigh } を設定し、agentとgenerateTextの両経路へ同じ設定を適用する。

採用理由は、現在のMastra・AI SDKストリーム・tool calling・structured outputの境界を保ったまま、providerだけを交換できるためである。共有ファクトリをテストすれば、モデルとreasoningの設定漏れを1箇所で検出できる。

### 案B: OpenAI互換providerを手動設定する

OpenRouterのAPI URLをOpenAI互換providerへ設定する。依存を減らせる可能性はあるが、reasoning、tool calling、structured output、ヘッダー、エラー変換を個別に検証・維持する必要がある。今回の既存構成に対して不要な接続責務を増やすため不採用とする。

### 案C: OpenRouterとDeepSeekの実行時フォールバックを残す

OpenRouter障害時にDeepSeekへ切り替える案である。短期的な可用性を上げる可能性はあるが、今回の移行目的であるDeepSeekからの離脱と矛盾し、残高不足の再発、providerごとの設定ドリフト、障害原因の不透明化を招くため不採用とする。

## 5. 採用設計

### 5.1 コンポーネント構成

~~~mermaid
flowchart LR
    U["ユーザー"] --> C["SchedulingChat"]
    C --> R["/api/schedule/chat"]
    R --> A["Mastra scheduling エージェント"]
    A --> M["共有モデルファクトリ"]
    M --> O["OpenRouter API"]
    O --> L["openai/gpt-5.6-luna"]
    A --> F["find-slots"]
    F --> S["予約ドメイン"]
    S --> G["Google Calendar"]
    S --> T["移動パディング分類"]
    T --> M
    A --> B["book-slot"]
    B --> S
    D["/api/schedule/book"] --> S
    V["Vercel Preview / Production"] --> E["OPENROUTER_API_KEY"]
    E --> M
~~~

共有モデルファクトリはモデルID、reasoning、APIキーを所有する。呼び出し元はprovider固有の生成処理を持たず、LanguageModelだけを受け取る。Google Calendarと予約ドメインはAI providerから独立する。

### 5.2 共有モデルファクトリ

実装時の責務は次の最小単位にする。

~~~typescript
const SCHEDULING_MODEL_ID = "openai/gpt-5.6-luna";
const SCHEDULING_REASONING_EFFORT = "xhigh";

function createSchedulingModel(apiKey: string | undefined) {
  const openrouter = createOpenRouter({
    apiKey,
    extraBody: {
      reasoning: {
        effort: SCHEDULING_REASONING_EFFORT,
      },
    },
  });

  return openrouter(SCHEDULING_MODEL_ID);
}
~~~

実際のファイル名は実装計画で確定するが、モデル生成は一つのサーバー専用モジュールへ集約する。テストからAPIキーを注入できるようにし、モジュールのテストで次を検証する。

- createOpenRouterへ受け取ったAPIキーが渡る。
- extraBodyに reasoning.effort = xhigh が渡る。
- providerへ正確なモデルIDが渡る。
- providerから返されたLanguageModelをそのまま返す。
- DeepSeek providerや旧モデルIDを参照しない。

### 5.3 予約エージェント

scheduling-agent は既存のinstructions、agent ID scheduling、find-slots、book-slotを維持する。modelだけを共有モデルファクトリの結果へ置き換える。エージェント自身がモデルID、APIキー、reasoningの値を再定義してはならない。

### 5.4 移動パディング分類

classifyTravelPadding は OPENROUTER_API_KEY を確認し、存在する場合に共有モデルファクトリでモデルを生成して既存のstructured outputスキーマへ渡す。キーがない場合、またはOpenRouter呼び出しが失敗した場合は、現行のキーワードベースのfallbackTravelDecisionsを使う。

分類のための推論結果は保存しない。移動パディングの最終値はこれまでどおり空き枠計算へ渡し、予約直前にも同じルールで再検証する。

### 5.5 チャットAPI

chat route の設定チェックを DEEPSEEK_API_KEY から OPENROUTER_API_KEY へ変更し、maxDurationを60秒にする。それ以外のruntime、dynamic、rate limit、Mastra handleChatStream、agent ID、UI Message versionは維持する。

OpenRouterの401、402、429、5xx、タイムアウトは既存の予約エージェントのストリームエラー経路へ流す。今回のspecでは、エラーのUI文言をproviderごとに細分化しない。

### 5.6 環境変数の移行表

| 環境 | OPENROUTER_API_KEY | DEEPSEEK_API_KEY | 移行時の操作 |
|------|--------------------|------------------|--------------|
| Preview | Encryptedで追加 | 疎通確認まで保持し、成功後に削除 | 新キー追加、デプロイ・必要に応じてpreview確認、旧キー削除 |
| Production | Encryptedで追加 | 疎通確認まで保持し、成功後に削除 | 新キー追加、デプロイ、本番スモーク、旧キー削除 |
| Development | 追加しない | 既存のAIキーなし | ローカル秘密の配布は行わない |

1PasswordからVercel CLIへの入力は標準入力で行う。APIキーの実値を表示する cat、echo、ログ出力、値付きコマンドライン引数は使わない。

## 6. データフロー

### 6.1 空き枠提示

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
    A->>O: 応答またはfind-slots判断を要求
    O-->>A: find-slots tool call
    A->>F: 日付範囲と条件
    F->>S: 空き枠計算
    S->>G: busyとイベント文脈を取得
    S->>M: 移動分類モデルを取得
    M->>O: 同じモデル / xhighで分類
    O-->>S: structured output
    S-->>F: 移動時間反映済み候補
    F-->>A: 候補とタイムゾーン
    A->>O: tool結果を含む最終回答を要求
    O-->>A: 回答ストリーム
    A-->>R: UI Messageイベント
    R-->>C: SSE
    C-->>U: 空き枠を表示
~~~

### 6.2 予約登録

予約登録の正本はGoogle Calendarであり、AIは候補選択と会話制御だけを担う。book-slotは既存どおり予約ドメインへ入り、候補の構造一致、リードタイム、busy、移動パディング、イベント登録を再確認する。AI provider移行でイベント登録をモデルへ委ねたり、予約検証を省略したりしない。

### 6.3 障害時

~~~mermaid
flowchart TD
    S["AI呼び出し"] --> K{"OPENROUTER_API_KEYがあるか"}
    K -->|"いいえ / chat"| E503["HTTP 503"]
    K -->|"いいえ / travel"| H["決定的heuristic"]
    K -->|"はい"| O["OpenRouter"]
    O -->|"成功"| R["通常の回答または分類"]
    O -->|"失敗 / agent"| SE["既存SSEストリームエラー"]
    O -->|"失敗 / travel"| H
    SE --> N["DeepSeekへ再送しない"]
~~~

## 7. テストと検証

### 7.1 TDDの順序

実装時は、まず共有モデルファクトリのテストを追加し、DeepSeek provider・旧モデル・xhigh未設定を検出する失敗を確認してから実装する。次に呼び出し元を移行し、各テストを通過させる。

### 7.2 単体テスト

- 共有モデルファクトリ: provider、APIキー、モデルID、reasoning effortをモックで検証する。
- scheduling agent: instructions、agent ID、tool登録を維持し、共有モデルを使用することを確認する。
- scheduling: OPENROUTER_API_KEY未設定時のheuristic、OpenRouter失敗時のheuristic、structured outputの既存スキーマを確認する。
- chat route: OPENROUTER_API_KEY欠落時に503となることを確認する。
- 既存のslot計算、booking、tool、SchedulingChatテストを変更理由の範囲内で更新し、目的を維持する。

### 7.3 静的検証

- アクティブなソース、package.json、package-lock.json、テストに DeepSeek provider、deepseek-chat、DEEPSEEK_API_KEY が残っていないことを検索する。
- OPENROUTER_API_KEYがクライアントコードへ到達していないことを確認する。
- モデルIDが共有モデル設定以外に重複していないことを確認する。
- doc、ログ、テスト出力にAPIキー実値がないことを確認する。

### 7.4 リポジトリ検証

次を通過させる。

- npm test
- npm run typecheck
- npm run lint
- npm run build
- git diff --check

### 7.5 本番スモーク

デプロイ後、予約登録という副作用を発生させずに、本番チャットへ有効なUI Message形式で日程調整を送る。次を確認する。

- SSEがエラーイベントで終了せず、回答が完了する。
- find-slotsが実行され、空き枠が表示される。
- VercelログにDeepSeek URL、deepseek-chat、Insufficient Balance、APIキーが出ない。
- OpenRouter管理画面で指定モデルのリクエストと推論トークンを確認できる。
- 予約作成は既存の単体テストで検証し、本番スモークでは行わない。

## 8. リリース・ロールバック

### 8.1 リリース順序

1. specをレビュー可能な状態でコミットする。
2. 実装計画を作成する。
3. 失敗するテストを先に追加する。
4. provider依存、共有モデル、呼び出し元、テストを変更する。
5. ローカルのtest、typecheck、lint、buildを通す。
6. 1PasswordからOPENROUTER_API_KEYをVercel Preview / ProductionへEncrypted登録する。
7. 新コードをデプロイする。
8. PreviewとProductionで空き枠提示を確認する。
9. 成功確認後、Vercel Preview / ProductionのDEEPSEEK_API_KEYを削除する。

### 8.2 ロールバック

新コードのデプロイ後、OpenRouterの認証、tool call、structured output、タイムアウトのいずれかでスモークが失敗した場合、旧DeepSeekキーをすぐに削除しない。原因をVercelログとOpenRouter利用状況で切り分け、必要なら旧コミットを再デプロイする。

旧キー削除後は、旧デプロイへ戻す場合でもDeepSeekキーを復元しない。復旧はOpenRouter側の設定修正または新コードの修正で行う。DeepSeekを実行時フォールバックとして復活させない。

## 9. 受け入れ基準

- [ ] 予約エージェントがOpenRouterの openai/gpt-5.6-luna を使う。
- [ ] 移動パディング分類が同じモデルを使う。
- [ ] 両方に reasoning effort xhigh が適用される。
- [ ] OPENROUTER_API_KEYがないchat routeは503になる。
- [ ] 移動パディング分類はprovider障害時にheuristicへフォールバックする。
- [ ] DeepSeek依存、旧モデル、旧環境変数参照がアクティブなコードとlockfileから消える。
- [ ] AI SDK v6とMastraのメジャーバージョンを変更しない。
- [ ] 既存のGoogle Calendar、slot計算、予約検証、UI Message/SSE契約が維持される。
- [ ] chat routeのmaxDurationが60秒になる。
- [ ] Vercel Preview / ProductionにOPENROUTER_API_KEYがEncryptedで存在する。
- [ ] 本番スモークで空き枠提示まで成功する。
- [ ] 疎通確認後にVercel Preview / ProductionからDEEPSEEK_API_KEYを削除する。
- [ ] APIキーの実値がリポジトリ、ログ、ドキュメント、テスト出力に露出していない。

## 10. スコープ外

次の項目はこのspecの実装計画へ含めない。

- providerの実行時フォールバック
- モデルIDまたはreasoning effortの管理画面・環境変数化
- 予約UIのprovider別エラー文言改善
- OpenRouter残高・利用量の自動通知
- Google Calendarのスキーマ、OAuth、イベント形式の変更
- ローカル開発者への秘密情報配布
- AI SDK、Mastra、Next.jsのメジャーアップデート

## 11. 参考資料

- [OpenRouter公式: AI SDK / framework移行ガイド](https://openrouter.ai/docs/cookbook/get-started/migrate-to-openrouter)
- [OpenRouter公式: reasoning tokensとeffort](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens)
- [OpenRouter公式: OpenAI GPT-5.6 Luna](https://openrouter.ai/openai/gpt-5.6-luna-20260709)
- [OpenRouter providerのAI SDK v6互換リリース](https://www.npmjs.com/package/@openrouter/ai-sdk-provider)
- [チャットAPIの現行実装](../../../src/app/api/schedule/chat/route.ts)
- [予約エージェントの現行実装](../../../src/mastra/agents/scheduling-agent.ts)
- [空き枠計算と移動パディングの現行実装](../../../src/lib/scheduling.ts)
- [予約ツールの現行実装](../../../src/mastra/tools/scheduling-tools.ts)
- [Google Calendar連携の現行実装](../../../src/lib/google-calendar.ts)
- [チャットUIの現行実装](../../../src/components/SchedulingChat.tsx)

## 12. 設計確認

2026-09-07に次を確認済み。

- 依頼者は、予約エージェントと移動パディング分類を含むすべてのモデル呼び出しに、openai/gpt-5.6-luna と xhigh を適用することを承認した。
- 現行本番障害はDeepSeekの残高不足である。
- 本specは実装を含まず、OpenRouter移行の実装計画と実装の前提を定義する。
