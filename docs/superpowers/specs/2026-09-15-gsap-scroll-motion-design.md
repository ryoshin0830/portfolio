# スクロール駆動ビジュアル刷新 — GSAP 一本化 + 奥行きレイヤー

日付: 2026-09-15
ブランチ: `feat/cooler-visual-polish`

## 背景

参考サイト（`ryo-shin-intelligence-engineered-sites-project/site-source`）は GSAP
ScrollTrigger + three.js による「Marquee Hero」型のダークサイトで、視差・pin・
kinetic タイポ・横スクロールを組み合わせて強い印象を作っている。
本ポートフォリオ（ryosh.in）はそれとは別系統の Apple 風クリーンなデザインだが、
「見やすさとカッコよさの併存」を目的に、参考サイトのモーション語彙を
自サイトのデザイントークンの上に移植する。

## 決定事項（本設計の前提）

| 論点 | 決定 |
|---|---|
| デザイン強度 | **中間** — 白黒+System Blue・グラデ禁止・セリフ1箇所は維持したまま、奥行きレイヤーを追加 |
| モーションエンジン | **GSAP + ScrollTrigger に一本化**。framer-motion は依存ごと削除（二重管理を作らない） |
| Hero | **kinetic タイポを入れる**。ただし LCP 保護の仕掛けを必須とする（後述） |
| pin | **Projects のみ横スクロール**。ただし `#projects` 自体ではなく内側ラッパーを pin |

## 非目標（やらないこと）

- セクション構成・情報設計の変更（追加/削除/並べ替えをしない）
- `messages/{ja,en,zh}.json` のコンテンツ変更
- 配色トークンの変更（`--color-*` の値はそのまま）
- three.js 等の 3D 導入
- ダークモードの方針変更（デバイス設定追従のまま）

## アーキテクチャ

### 1. モーション基盤

新規 `src/lib/gsap.ts` が GSAP とプラグイン登録の唯一の入口になる。

```ts
// registerPlugin を 1 回だけ、クライアントでのみ実行する
gsap.registerPlugin(useGSAP, ScrollTrigger);
export { gsap, ScrollTrigger, useGSAP };
```

すべてのアニメーションは `useGSAP(() => {...}, { scope: ref })` の中で定義する。
`useGSAP` は内部で `gsap.context()` を張るため、アンマウント時に
生成したトゥイーン・ScrollTrigger・インライン style がまとめて revert される。
**これが「二重管理しない」ための中核**で、手書きの cleanup を増やさない。

分岐（reduced-motion / ブレークポイント / hover 可否）は
`gsap.matchMedia()` で宣言する。条件から外れた瞬間にそのスコープの
アニメーションが自動で revert されるので、メディアクエリごとの
手動 teardown も書かない。

#### framer-motion からの置換表

| 現在 | 置換後 |
|---|---|
| `MotionProvider`（`LazyMotion`/`domAnimation`） | 削除。`src/lib/gsap.ts` へ集約 |
| `m.div` 等の宣言的モーション | 素の DOM + `useGSAP` 内の `gsap.from/to/timeline` |
| `useReducedMotion()`（framer） | `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`。フック文脈では新規 `usePrefersReducedMotion()`（`matchMedia` 直読み） |
| `useScroll`/`useTransform` | `ScrollTrigger` の `scrub` |
| `AnimatePresence`（3 箇所） | 新規 `useExitTransition()` — 閉じアニメ完了後に unmount する最小フック |

`useActiveAnimation` は **公開 API（`ref` / `active` / `inView` / `reduce`）を
変えずに**内部の framer 依存だけを外す。既存の呼び出し側（`HighlightsHeroMetric`,
`TimelineSection`）はシグネチャ互換のまま移行できる。

#### `useExitTransition` の契約

```ts
const { mounted, state } = useExitTransition(open, { exitMs: 180 });
```

- `open: true` → 即座に `mounted: true`, `state: "entering"`
- `open: false` → `state: "exiting"` にして `exitMs` 後に `mounted: false`
- `prefers-reduced-motion` のときは `exitMs` を 0 として即 unmount

Navigation のモバイルメニュー / 言語メニュー、ContactModal、SchedulingChat の
メッセージ追加で共用する。**DOM の出現・消滅タイミングは現状と同じ**にして、
既存テスト（`ContactModal.test.tsx` 等）の前提を壊さない。

### 2. 奥行きレイヤー（新規コンポーネント）

すべて `src/components/motion/` に置く。装飾に使うのは **1px の線・
アウトライン文字・べた塗り**のみで、色のグラデーションは使わない。

| コンポーネント | 内容 |
|---|---|
| `ScrollProgressBar` | ページ上端 2px。`--color-accent`。`scaleX` を scrub |
| `AmbientGrid` | `position: fixed` の 120px 格子（`--color-rule-soft` の 1px 線）。低 opacity、`y` 視差。上下のフェードに `mask-image: linear-gradient(...)` を 1 つ使う（**色のグラデではなくアルファマスク**なので「グラデ禁止」に抵触しないと判断する） |
| `HeroDepth` | Hero 背面の巨大アウトライン文字（`-webkit-text-stroke`）+ 破線の軌道円 2 つ + 十字マーク。scrub 速度を個別に変えて視差を作る |
| `MarqueeRibbon` | 巨大文字の帯。上段と下段が逆方向に流れる。**sans で組む**（セリフ1箇所ルールを維持）。既存セクションの合間に 1 箇所だけ置く |

`ScrollProgressBar` と `AmbientGrid` は `layout.tsx` に常駐させる。
`HeroDepth` は Hero 内、`MarqueeRibbon` はページ内 1 箇所。

### 3. ページ全体のモーション制御 — `ScrollMotionRoot`

参考サイトの `useScrollMotion` に相当するクライアントコンポーネントを 1 つ置き、
**セレクタで横断的にかかる演出**（見出しリビール、カードの pointer tilt、
マグネティックボタン、リスト行のリビール）をここに集約する。
セクションごとに `"use client"` を増やさずに済み、Server Component の比率を保てる。

セクション固有かつ内部状態を持つもの（Projects の横スクロール進捗、
Highlights の数値カウントアップ）は、そのコンポーネント内の `useGSAP` に置く。

### 4. Hero の kinetic タイポと LCP 保護

CLAUDE.md は「LCP テキストは LCP 計測ウィンドウ中に差し替えない」「Hero は
完全に静的なサーバーレンダリング」と定めている。kinetic タイポはこれに
正面から当たるため、次の 4 つを**実装上の必須条件**とする。

1. **文字分割は Server Component 側で静的に行う。** 初期 HTML の時点で
   `<span>` 分割済みのテキストが入っており、クライアントでテキストを
   差し替えない。LCP 要素の内容は最初から最後まで同一。
2. **初期 transform を当てない。** マウント時に `gsap.set()` を打たず、
   ScrollTrigger の `start` を Hero 下端に置いて、**スクロールして初めて**
   変形が始まるようにする。ファーストビューは現状と完全に同じ描画。
3. **CLS を出さない。** 分割は `display: inline-block` の span 化のみで、
   `letter-spacing` と行送りは現行値を維持する。空白は `&nbsp;` に置換。
4. **reduced-motion では matchMedia ごと発火しない。** span は残るが
   アニメーションは登録されない。

### 5. Projects の横スクロール

pin する対象は **`#projects` の内側のラッパー**（`.work-stage` 相当）であり、
`#projects` セクション要素そのものではない。理由:

- ScrollTrigger の pin は対象を `position: fixed` にし、
  高さ分の `pin-spacer` を差し込む。`#projects` 自体を pin すると
  `#projects.getBoundingClientRect().top` が pin 中ずっと固定値になり、
  `src/lib/scroll.ts` の settle スクロールが「まだ到達していない」と誤認して
  nudge を繰り返す。
- 内側を pin すれば `#projects` は通常フローのまま高さだけ伸びるので、
  `useScrollNavigation` の IntersectionObserver による scroll-spy も、
  settle スクロールの収束判定も現行のまま正しく動く。

横スクロールが有効なのは `(min-height: 680px) and (prefers-reduced-motion:
no-preference)` のときだけで、条件を外れると**通常の縦積みグリッドに戻る**
（これが常にフォールバックとして存在する）。キーボードフォーカスが
画面外のカードに移ったときは、対応するスクロール位置へジャンプさせる。

### 6. セクション別の演出

| セクション | 演出 |
|---|---|
| 各セクション見出し | scrub の x スライド + opacity リビール |
| Highlights metric | 既存 SVG を GSAP timeline に移植。数値は scrub カウントアップ（巻き戻せる） |
| Experience / Timeline | 行の scrub スライドイン、進捗ライン |
| Projects | 横スクロール + カード `rotateY` + 進捗バー + `01/04` カウンタ |
| Research / Skills | stagger リビール、chip のスケールイン |
| WritingFeed | 行の `::before` ワイプ hover + scrub リビール |
| 横断 | カードの pointer tilt（`--pointer-x/y` のスポットライト）、マグネティックボタン。`(hover: hover) and (pointer: fine)` 限定 |

## パフォーマンス方針

CLAUDE.md のアニメーション性能ルールを GSAP の語彙に翻訳して守る。

- **ループを回しっぱなしにしない。** ScrollTrigger の scrub アニメーションは
  スクロール時にしか進まないので、`repeat: Infinity` の常時ループは原則作らない。
  どうしてもループが要る箇所（Highlights のパルス）は
  ScrollTrigger の `onToggle` で `play()`/`pause()` し、画面外で止める。
- タブ非表示では `gsap.ticker` が自動で間引かれるが、ループ系は
  `visibilitychange` でも明示的に pause する（`useActiveAnimation` の既存契約）。
- アニメーションするのは `transform` と `opacity` のみ。
  `will-change` は参考サイトと同様、実際に動く要素にだけ付ける。
- `document.fonts.ready` の後に `ScrollTrigger.refresh()` を 1 回呼び、
  日本語フォント読込によるレイアウト確定後に位置を取り直す。

## テスト戦略

### 既存テストを全て通すことを条件とする

特に次は前提を壊しやすいので重点的に確認する。

- `src/components/ContactModal.test.tsx` — 開閉とハッシュ同期。
  `AnimatePresence` を外しても **DOM の出現・消滅タイミングが同じ**であること。
- `src/hooks/useScrollNavigation.test.tsx` — scroll-spy。pin 導入後も
  IntersectionObserver の観測対象が変わらないこと。
- `src/lib/scroll.test.ts` — settle スクロールの収束。
- `src/lib/sections.test.ts` — セクション ID・アンカー・リダイレクトの整合。
  Projects のマークアップを変えても `id="projects"` が維持されること。

### テスト環境の整備

`vitest.setup.ts` に jsdom 不足分のスタブを足す。

- `window.matchMedia` — GSAP の `matchMedia()` と `usePrefersReducedMotion` が使う
- `ResizeObserver` — ScrollTrigger が参照する
- `requestAnimationFrame` / `cancelAnimationFrame` — jsdom にあるが挙動を固定する

### 新規テスト

- `src/hooks/useExitTransition.test.tsx` — open→close で `exitMs` 後に
  unmount されること、reduced-motion では即時であること。
- `src/lib/gsap.test.ts` — `registerPlugin` が複数回 import しても
  1 回しか走らないこと（SSR ガード含む）。

### 最終確認

`npm run build && npm run typecheck && npm run lint && npm run test` を通し、
Playwright MCP で以下を実測する。

- CLS < 0.1（特に Hero の span 分割と MarqueeRibbon 周辺）
- LCP が現行から悪化していないこと
- pin 導入後もナビの各セクションへのジャンプが目的地に到達すること
- `#contact` ディープリンクでモーダルが開くこと
- 画面外で RAF / ループが止まっていること

## リスクと対応

| リスク | 対応 |
|---|---|
| Projects の pin が scroll-spy / settle スクロールを壊す | 内側ラッパー pin で回避する設計。実装中に壊れると判明したら pin をやめて CSS `position: sticky` ベースの縦→横変換にフォールバックする（見た目は近いが pin なし）。判断はテスト結果で行う |
| framer-motion 撤去による退行（モーダル・メニューの挙動） | 「見た目の変化ゼロの移植」と「新規演出」をコミットで分ける。移植コミットの時点で全テストが通ることを確認してから新規演出に進む |
| GSAP 追加によるバンドル増 | `gsap` + `ScrollTrigger` のみ。framer-motion を削除するので差し引きの増加は小さい。動的 import はせず、`ScrollMotionRoot` が client boundary を 1 つに絞る |
| jsdom で ScrollTrigger が落ちる | `vitest.setup.ts` のスタブで対応。それでも不安定なら、テスト環境では `src/lib/gsap.ts` が no-op を返す分岐を持たせる |

## ライセンス

GSAP 3.15 / @gsap/react 2.1.2 はいずれも Standard "no charge" license で、
ScrollTrigger を含む全プラグインが無償で利用できる（3.13 以降）。
商用・非商用を問わず本サイトでの利用に制限はない。
