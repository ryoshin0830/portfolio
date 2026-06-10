# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Portfolio Project

Next.js 15 / React 19 / TypeScript 5 / Tailwind CSS 4 のポートフォリオサイト（ryosh.in）。
next-intl による多言語対応（ja/en/zh）、framer-motion によるアニメーション、Vercel にデプロイ。

## Commands

```bash
npm run dev       # 開発サーバー (http://localhost:3000) — Turbopack なし、通常の next dev
npm run build     # 本番ビルド
npm run start     # ビルド済み本番サーバー
npm run lint      # next lint (eslint-config-next, flat config: eslint.config.mjs)
npm run lint:fix  # next lint --fix
npm run typecheck # tsc --noEmit（型検査のみ。eslint は完全な型検査をしないため別途必要）
npm run test      # Vitest（一回実行）。watch は npm run test:watch
```

### テスト（Vitest + Testing Library）

`vitest.config.ts`（jsdom、`@` エイリアス、`vitest.setup.ts` で IntersectionObserver スタブ）。
テストはソース隣接の `src/**/*.test.{ts,tsx}` と `tests/`。最終確認はビルド + ブラウザ確認（Playwright MCP）も併用する。

- `src/hooks/useScrollNavigation.test.tsx` — scroll-spy / settle スクロールの回帰テスト
  （「すべての連絡先で about に飛ばされる」「ナビ到達後に URL が隣のセクションのまま」等）
- `src/lib/scroll.test.ts` — settle スクロール（遅延描画でページが伸びても目的地に到達）
- `src/lib/sections.test.ts` — セクション ID / ページ内アンカー / リダイレクト / ナビの整合性
  （ソース走査の静的テスト。アンカー切れ・リダイレクト漏れをコミット前に検出）
- `src/components/ContactModal.test.tsx` — 連絡先モーダルの開閉・ハッシュ同期
- `tests/messages.test.ts` — `messages/{ja,en,zh}.json` のキー構造一致（配列長含む）

### Git フック（simple-git-hooks + lint-staged）

`npm install` 時に `prepare` スクリプトが `simple-git-hooks` を実行し `.git/hooks` を登録する。設定は `package.json` 内（`simple-git-hooks` / `lint-staged` キー）。

- **pre-commit**: `lint-staged`（staged の `*.{ts,tsx}` に `eslint --fix`）+ `npm run test`（高速）。
- **pre-push**: `npm run typecheck && npm run lint && npm run test`（push 前の最終ゲート。本番ビルドは Vercel 側に任せる）。
- 緊急時は `SKIP_SIMPLE_GIT_HOOKS=1 git commit ...` でスキップ可能。フック定義を変えたら `npx simple-git-hooks` で再登録。

## Architecture

### コンテンツは翻訳ファイルが正（single source of truth）

このサイトの最大の特徴: **すべてのコンテンツデータが `messages/{ja,en,zh}.json` に格納されている**。
別途データファイル（`*.ts` の定数配列など）は存在しない。職歴・スキル・実績・プロジェクトといった
構造化データも翻訳 JSON の中にネストされたオブジェクト/配列として書かれている。

- 3 ファイルは**同じキー構造**を保つ必要がある（`ja.json` のみ行数が多いのは内容差であってキー差ではない）。
  トップレベルキー: `nav, hero, highlights, about, experience, research, skills, projects, contactCTA, teaching, zennFeed, metadata` ほか。
- コンテンツを変更するときは、原則 3 言語すべてを同時に編集する。

### 構造化データの取り出しパターン

コンポーネントは next-intl の翻訳関数から **`t.raw(key)` でオブジェクト/配列を取り出し、`src/types/content.ts` の型にキャスト**して使う。

```tsx
// Server Component の例 (ExperienceSection.tsx)
const t = await getTranslations("experience");
const engagements = t.raw("engagements") as Engagement[];
```

`src/types/content.ts` が JSON 内データの契約を定義する（`Engagement`, `HighlightStat`,
`SkillCategory`, `Expertise`, `ContactCTAContent`）。**JSON のデータ形を変えたらこの型も合わせて更新する**。
`getRaw<T>(t, key)` ヘルパーも同ファイルにある。

### Server / Client の分担

- セクションコンポーネント（`src/components/*Section.tsx`）の多くは **async Server Component** で、
  `getTranslations` / `getLocale`（`next-intl/server`）を使う。
- `"use client"` を使うのは: 外部 API フェッチ系（`ZennFeed`, `LatestZennArticle` — Zenn RSS を
  rss2json 経由で取得）、テーマ切替（`ThemeContext`）、アニメーション（`MotionProvider`）、`Navigation` など。

### ルーティング & i18n

- `src/middleware.ts`: next-intl ミドルウェア。`localePrefix: 'always'`、デフォルト `ja`。全 URL が `/ja|/en|/zh` 始まり。
- `src/i18n.ts`: ロケール検証 + 対応する messages を動的 import。
- ページ実体はすべて `src/app/[locale]/page.tsx`（1 枚のロングページに全セクションを縦に並べる構成）。
- **セクション ID の単一ソースは `src/lib/sections.ts`**（`SECTION_IDS` / `HASH_DIALOGS` /
  `SECTION_REDIRECTS`）。next.config.ts のリダイレクトと `useScrollNavigation` の scroll-spy は
  ここから import する。整合性（page.tsx の描画順・id 属性・アンカー・リダイレクト）は
  `src/lib/sections.test.ts` が検証するので、セクション追加時はテストに従えばよい。
- 旧 URL `/${locale}/{about,blog,contact,…}` は `next.config.ts` の `SECTION_REDIRECTS`
  （静的リダイレクト）で `/${locale}#section` へ誘導する。scroll-spy が URL を
  `/${locale}/<sectionId>` に書き換えるため、リダイレクトが無いとリロードで 404 になる。
- **連絡先はセクションではなくモーダル**（`ContactModal`、layout に常駐）。`#contact` ハッシュで
  開く（Hero の「すべての連絡先」は静的な `<a href="#contact">`、旧 URL `/${locale}/contact` の
  リダイレクトもそのままディープリンクになる）。閉じると replaceState でハッシュを消す。
  旧 ContactSection はページ最下部にあり、途中の WritingFeed が batch 描画でページを伸ばす
  ためアンカースクロールが目的地に届かないバグが構造的に起きていた。
- ページ内アンカー / ナビのスクロールは `src/lib/scroll.ts` の settle スクロール
  （静止後にターゲット位置を検証し、ずれていれば即時ジャンプで補正。ユーザー入力で中断）。
- ロケール追加時に触る箇所: `i18n.ts`, `middleware.ts`, `next.config.ts` には無いが、
  `layout.tsx` の `generateMetadata` / `RootLayout` 内のロケール検証、`sitemap.ts`、`messages/` に新ファイル。

### デザインシステム

- `src/app/globals.css` に CSS 変数ベースのトークン（Apple 風: 純白 + ニアブラック + System Blue、
  グラデーション/ブラー/色付き影なし）。light/dark を `:root` と `:root.dark` で定義。
- ユーティリティクラス（Tailwind ではなく自前）: `.section`, `.section__inner`, `.display`/`.display--xl/xxl`,
  `.prose-body`, `.meta` など。色は `var(--color-ink)` / `var(--color-accent)` 等を直接参照。
- ディスプレイ明朝: Hero の漢字の名前**のみ** `--font-display-serif`（Noto Serif JP **900 のみ** —
  `.display-serif` / `.hero-name`。細いウェイトは超大型で貧弱に見えるため Black 限定）。
  タグライン（`.hero-tagline`）を含め、それ以外の見出し・本文は Inter + Noto Sans JP のまま。
  **セリフは1箇所だけ**に保つ（増やすと和風パンフレット化する）。
- ダークモード: `layout.tsx` の `<head>` にインラインの `themeScript`（`src/app/theme-script.ts`）を埋め込み、
  ハイドレーション前に `<html>` へ `dark`/`light` クラスを付与してフラッシュを防ぐ。`ThemeContext` は
  その DOM 状態を読むだけ。**localStorage に保存せず、毎回デバイス設定に従う**（トグルはそのセッション限り）。

### アニメーション性能ルール（高性能を維持するためのチェックリスト）

新しいアニメーションを足すときは必ず以下を守る。実測（Chrome DevTools MCP / 本番ビルド /
モバイル 4x CPU スロットリング）で検証した方針:

- **ループ系は必ず `useActiveAnimation` でゲートする。** `repeat: Infinity` の framer-motion や
  `setInterval` / `requestAnimationFrame` ループは、`src/hooks/useActiveAnimation.ts` が返す `active`
  （= prefers-reduced-motion ∧ in-view ∧ document可視）で制御し、`active` が false のときは
  **静止フレームを描画**してループ／タイマーを破棄する。画面外やタブ非表示で回し続けない
  （バッテリ・CPU の無駄）。実例: `HighlightsHeroMetric.tsx`, `TimelineSection.tsx`。
- **「一度きり」と「可視中だけ」を分離する。** 数え上げ等の一回限り演出は `triggerOnce` ではなく
  ref ラッチ（例 `hasCountedUp`）で1回に固定し、ループ部分は別途 `active` ゲートする
  （`triggerOnce: true` の `inView` は永続 true になり、タイマーが止まらなくなる）。
- **回転／巡回テキストは CLS を出さない。** 幅の異なるテキストを差し替えるときは固定
  `min-height`（単一行は `whitespace-nowrap`）を予約し、**Grid スタック（`gridArea: 1/1`）+ opacity
  クロスフェード**で重ねる。`aria-live` 領域は**単一ノードを保持**してテキストのみ差し替える
  （複数ノード化は読み上げを壊す）。
- **LCP テキストは LCP 計測ウィンドウ中に差し替えない。** Hero（名前・肩書き・タグライン）は
  完全に静的なサーバーレンダリング（async Server Component、タイマー無し）に揃えてある。
  Hero に動的演出を戻す場合もテキスト LCP 候補は静止させたままにする。
- framer-motion は `LazyMotion`(`domAnimation`) 経由（`MotionProvider`）で使い、`m.*` を用いる。
- 検証は `npm run build && npm run typecheck && npm run lint` + MCP 再トレースで CLS < 0.1・LCP 安定・
  画面外 RAF 停止を確認する。

### SEO

`layout.tsx` の `generateMetadata`（OG/Twitter/canonical/hreflang）、`StructuredData.tsx`（JSON-LD）、
`sitemap.ts`、`robots.ts`。本番ドメインは `https://ryosh.in`。GA は `layout.tsx` に直書き（G-SJ8FDYK6J7）。

## Installed Skills

`.agents/skills/` に配置（Universal agents対応）。

- **frontend-design** — UI設計原則の強制。"AIっぽい"汎用デザインを避け、意図的で大胆なデザイン方向性を実現する
- **web-design-guidelines** — Web Interface Guidelinesに基づくUI監査。a11y、UX、デザインのベストプラクティスをチェック
- **vercel-react-best-practices** — React/Next.jsパフォーマンス最適化。8カテゴリ70ルールでコード品質を向上

## MCP Servers

- **Playwright** (`@playwright/mcp@latest`) — ブラウザ自動化、スクリーンショット検証。プロジェクトスコープ（`.mcp.json`）
- **Context7** (`@upstash/context7-mcp`) — ライブラリの最新ドキュメント取得。ユーザースコープ（`~/.claude.json`）
