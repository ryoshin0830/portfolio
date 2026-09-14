# Notion サイトを発信フィードの 5 番目のソースにする

- 日付: 2026-09-14
- 対象: `https://ryoshin.notion.site/` を ryosh.in の `#blog`（発信）に取り込む

## 背景

個人的な短いメモを Notion サイトに書く運用を始めた。これを Zenn / Qiita / note / X と
同じ体裁で ryosh.in に流し、あわせて Notion サイトへの入口を置く。

## 事前検証（実施済み）

### HTML スクレイピングは不可

notion.site は完全クライアント描画で、素の `curl` はどのサイトでも同一の空シェルを返す。

| 対象 | サイズ | `<title>` | boot data |
|---|---|---|---|
| `ryoshin.notion.site` | 19,974 B | `Notion` | `null` |
| `ana.notion.site` | 19,975 B | `Notion` | `null` |
| `notion-templates.notion.site` | 19,975 B | `Notion` | `null` |

Googlebot の User-Agent を送ると Cloudflare が 403 を返す。実ブラウザで描画して初めて
`<title>` が `Shin` になる。よって HTML パース路線は採らない。

### 内部 JSON API は Cookie・UA・認証なしで叩ける

Node 24 の `fetch`（Next.js のサーバー実行と同条件）で検証した。

```
getPublicPageDataForDomain  200  221ms   publicAccessRole = "reader"
loadCachedPageChunkV2       200  397ms   collection_view ブロックを発見
queryCollection             200  270ms   行データ取得
```

**ID をハードコードせず、ドメイン名 `"ryoshin"` だけから到達できる**ことを確認済み。
ビューをテーブルから feed 型に変更しても追従した（ビュー種別は描画のみに影響し、
`queryCollection` が返す行・スキーマ・日時は変わらない）。

### DB スキーマ

```
key="title"   name=Name               type=title
key="RSOE"    name=Summary            type=text
key="lt::"    name=Created time       type=created_time
key="iGmN"    name=Last edited time   type=last_edited_time
key="qqUX"    name=Status             type=status   (Not started / In progress / Done)
```

`created_time` / `last_edited_time` 型は**自動計算プロパティで、値が行の `properties` に入らない**。
実体は `block.created_time` / `block.last_edited_time`。手で編集できる `Date` 型ではないため、
公開日を任意に決めることはできない。`created_time` を Zenn の `published_at` 相当として使う。

`Created time` プロパティを指定したサーバー側ソート（`{property:"lt::", direction:"descending"}`）が
200 で通ることも確認済み。

### 行の個別ページ

`https://ryoshin.notion.site/<id をハイフン除去>` で公開されており、ディープリンク可能。

## 決定事項

| 項目 | 決定 | 補足 |
|---|---|---|
| 入口の形 | `WritingFeed`（`#blog`）の 5 番目のソース | 新セクションは作らない |
| 公開ゲート | なし。全行を出す | `Status` は使わない。書きかけも公開される点は了解済み |
| `Summary` | タイトル + 要約 2 行クランプで表示 | 検索対象にも含める |
| Hero ティーザー | Notion を含めない | Zenn/Qiita/note の記事のみ |

## 設計

### モジュール配置

Notion 取得は `src/lib/notion.ts` として独立させる。`articles.ts` に混ぜない理由:

1. `articles.ts` の役割は**タイトル正規化によるクロスポスト重複排除**であり、Notion の
   メモは Zenn 記事と重複排除される筋合いがない（同名になれば誤マージする）。
2. `MergedArticle` に `summary` の居場所がない。
3. Notion は 3 ステップの探索チェーンを要し、単発 GET 3 本とは構造が違う。

X が `posts.ts` として独立しているのと同じ扱いになる。

### `src/lib/notion.ts`（新規）

定数はドメイン名のみ。ID は一切ハードコードしない。

```
1. getPublicPageDataForDomain  → publicAccessRole 確認 + pageId + spaceId
2. loadCachedPageChunkV2       → collection_view ブロックから collection_id / view_ids
3. queryCollection             → 行を取得（created_time 降順、limit 50）
```

ソートキーはスキーマから `type === "created_time"` のプロパティを探して使う。
該当プロパティが無い場合は無ソートで取得し、クライアント側で `created_time` により並べ替える。

- キャッシュ: `unstable_cache(..., { revalidate: 3600 })`。`articles.ts` と同じ 1 時間。
- `publicAccessRole !== "reader"` は throw する。キャッシュさせず、Vercel の
  Function Logs に残して気づけるようにする（`fetchNote()` と同じ方針）。
- 呼び出し側（`page.tsx`）が catch して空配列に degrade する。

### 型 — `src/types/articles.ts`

```ts
export type FeedSource = "zenn" | "qiita" | "note" | "x" | "notion";

export interface FeedItem {
  kind: "article" | "post" | "notion";
  summary?: string;
  // 既存フィールドは変更なし
}

export interface NotionNote {
  id: string;
  title: string;
  summary?: string;
  date: string; // ISO 8601（created_time）
  url: string;
}
```

**命名の注意**: このコードベースで `note` は既に note.com を指す。Notion は `notion` とし、
両者を混同しないこと。

`kind: "notion"` を新設するのが要点。`page.tsx` の Hero は既に `kind === "article"` で
絞り込んでいるため、**Hero から Notion を除外する追加コードが不要になる**。

### マージ — `src/lib/feed.ts`

`buildFeed(articles, posts)` → `buildFeed(articles, posts, notes)`。
日付ソートは既存のまま（`Date.parse` 比較で TZ 差を吸収済み）。

### 表示 — `src/components/WritingFeed.tsx`

- ソースフィルタに `Notion` を追加（6 個目のボタン）
- `kind === "notion"` の行はタイトル下に `summary` を 2 行クランプで表示
- 検索は `text` に加えて `summary` も対象にし、`highlight()` を要約側にも適用
- 一覧下部のプロフィールリンク行に「Notion で見る ↗」を追加（`https://ryoshin.notion.site/`）
  — これが**入口**にあたる

### アイコン — `src/components/icons/BrandIcons.tsx`

simple-icons の Notion 単一パスを `currentColor` で追加し、`BRAND_LABEL` と
`SourceIcon` に配線する。既存アイコンと同じくモノクロ。

### i18n — `messages/{ja,en,zh}.json`

`writingFeed.viewOnNotion` を追加し、`subtitle` を Notion 込みに更新する。
`tests/messages.test.ts` がキー構造の一致を強制するため 3 言語同時に編集する。
Notion の本文は日本語のみだが、Zenn/Qiita/note も同様なので既存挙動と一貫する。

### 変更しないもの

`src/lib/sections.ts` / `next.config.ts` / `src/components/Navigation.tsx` は変更なし。
新セクションを作らない選択のため、セクション整合性テストの対象は動かない。

## テスト

ネットワークは fixture でモックし、テストから実 API は叩かない。

| ファイル | 内容 |
|---|---|
| `src/lib/notion.test.ts`（新規） | 実レスポンスの fixture をパース。`publicAccessRole: "none"`、`Summary` 欠損、空 DB、ソートキー不在時のフォールバック |
| `src/lib/feed.test.ts`（新規） | Notion を混ぜた日付ソート。`buildFeed` は現状テストが無いためここで作る |
| `src/components/WritingFeed.test.tsx`（拡張） | Notion フィルタ、`summary` の描画、要約を含む検索 |

検証は `npm run typecheck && npm run lint && npm run test` に加えて本番ビルドとブラウザ確認。

## リスクと対応

**非公式 API である。** `fetchNote()`（note.com の非公式 API）と同じ性質で、新規のリスク
分類ではない。`Promise.allSettled` + `console.error` + 空配列 degrade の既存パターンに乗せる。

**Cloudflare の後ろにいる。** 現状は UA なしで通るが、将来 bot 判定が厳しくなる可能性がある。

**乗り換え先。** 壊れた場合は個人ワークスペース（space: `eastlinker`）に internal integration を
作り、公式 API（`api.notion.com`、Bearer トークン必須）へ移行する。`X_BEARER_TOKEN` と
同じ環境変数パターンで実装できる。**今回は実装しない。**

**書きかけの公開。** ゲートなしの方針上、`Status` が未設定・書きかけの行も `#blog` に出る。
後から絞る場合は `notion.ts` に 1 行のフィルタを足すだけで済む形にしておく（今回は入れない）。

**ページネーション。** `limit 50` で取得する。それを超える規模になったらカーソル対応を検討する
（現時点では不要）。
