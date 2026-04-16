# ポートフォリオサイト 調査レポート

> 調査日: 2026-04-16
> 問題: 「AIっぽさが強い」「カクついている」

---

## 1. AIっぽいデザインの原因

### 1.1 青紫グラデーションの多用 [CRITICAL]

サイト全体で同じ blue → purple グラデーションが繰り返し使われている。これはAIテンプレートの典型的な配色。

| ファイル | 行 | 内容 |
|---|---|---|
| `globals.css` | 7-31 | `--gradient-start: #667eea` → `--gradient-end: #764ba2`（最も一般的なAIテンプレのグラデ） |
| `HeroSection.tsx` | 182-188 | `from-slate-50 via-blue-50/50 to-purple-50/30` + blurredな円形ブロブ |
| `Navigation.tsx` | 145, 175-176 | ロゴとアクティブナビに `from-blue-500 to-purple-600` |

**根本原因**: カスタムカラーパレットが存在せず、Tailwindのデフォルト blue/purple をそのまま使用。

### 1.2 グラデーションテキストの乱用 [CRITICAL]

`globals.css` L111-116 の `.gradient-text` クラスが **全セクションの見出しで使用**:

- HeroSection (名前)
- ProjectsSection (タイトル)
- SkillsSection (タイトル)
- GallerySection (タイトル)
- ResearchSection (タイトル)
- Navigation (ロゴ)
- TimelineSection (イベントタイトル)

**問題**: 全見出しが同じグラデーション → テンプレ感が増幅。

### 1.3 コピペカードデザイン [CRITICAL]

全セクションで **同一のカード構造** が使い回されている:

```
bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8
border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl
```

**該当ファイル**:
- `ProjectsSection.tsx` L186, L223
- `SkillsSection.tsx` L188, L313
- `AboutSection.tsx` L82-83
- `ResearchSection.tsx` L142
- `GallerySection.tsx` L138, L270-271

**問題**: セクション間のビジュアル差別化がゼロ。機械的な均一性。

### 1.4 グラスモーフィズムの過剰使用 [HIGH]

| ファイル | 行 | 問題 |
|---|---|---|
| `globals.css` | 96-108 | `.glass` / `.glass-dark` に `backdrop-filter: blur(10px)` |
| `HeroSection.tsx` | 204, 225-232 | バッジ全てに `backdrop-blur-sm` |
| `ProjectsSection.tsx` | 186 | カード全面に `backdrop-blur-xl` |
| `SkillsSection.tsx` | 188 | 同上 |

### 1.5 グロー・ネオンエフェクト [HIGH]

`globals.css` L119-135:
- `.shadow-glow` / `.shadow-glow-purple` — 青・紫のグローシャドウ
- `.animate-pulse-glow` — 無限のパルスアニメーション

HeroSection のソーシャルアイコン、TimelineSection のイベントカードなど全体的にネオングロー。

### 1.6 セクション構造の機械的均一性 [HIGH]

全セクションが同一テンプレートに従う:
- `pt-32 pb-24` のパディング
- `text-5xl md:text-6xl lg:text-7xl font-black` のタイトル
- `inline-flex items-center gap-2 px-4 py-2 ... rounded-full` のバッジ
- 同じ色パターンの背景

### 1.7 その他のAI感要因

- **フォント**: Inter のみ。カスタムタイポグラフィなし
- **アイコン**: lucide-react のジェネリックアイコンのみ（カスタムSVGなし）
- **ダークモード**: `dark:bg-slate-800` の機械的反転、個性なし
- **同一のframer-motionパターン**: 全コンポーネントで `opacity: 0, y: 20` → `opacity: 1, y: 0`

---

## 2. カクつき（ジャンク）の原因

### 2.1 スクロールリスナーの未スロットル [CRITICAL]

**ファイル**: `Navigation.tsx` L87-92

```typescript
const handleScroll = () => {
  setIsScrolled(window.scrollY > 50);
};
window.addEventListener("scroll", handleScroll);
```

スクロール毎フレーム（60+回/秒）で state 更新 → Navigation 全体の再レンダリング。**スロットル/デバウンスなし**。

### 2.2 SVGアニメーション + フィルタ [CRITICAL]

**ファイル**: `TimelineSection.tsx`

| 行 | 問題 |
|---|---|
| 172-186 | `<animateMotion>` でSVG円を3つ同時にパスアニメーション（3-5秒ループ） |
| 112-162 | `motion.svg` の `pathLength` アニメーション（非コンポジタブルプロパティ） |
| 各項目 | `feGaussianBlur` フィルタが各パスに適用（GPU非最適化） |

SVGネイティブアニメーション + フィルタはメインスレッドをブロック。

### 2.3 クライアントコンポーネントの過剰 [CRITICAL]

**15コンポーネント中13個が `'use client'`**:

```
Navigation, HeroSection, AboutSection, SkillsSection,
ProjectsSection, ZennFeed, TeachingSection, GallerySection,
URLShortenerSection, ResearchSection, YopmailAccessSection,
TimelineSection, ThemeContext
```

→ サーバーコンポーネントのメリットがほぼ消失。巨大なクライアントJSバンドル。

### 2.4 framer-motion の非最適インポート [HIGH]

9コンポーネントが `import { motion } from "framer-motion"` を使用。

- `motion` は全機能バンドル。`m` (LazyMotion) を使えばバンドルサイズ大幅削減
- 230以上のアニメーションインスタンスが存在

### 2.5 backdrop-filter のパフォーマンスコスト [HIGH]

`backdrop-filter: blur()` は GPU 負荷が高い。これが以下で多用されている:
- `.glass` / `.glass-dark` クラス（globals.css）
- 全カードコンポーネント（`backdrop-blur-xl`）
- バッジ要素（`backdrop-blur-sm`）

スクロール中にこれらの要素が画面に多数存在し、GPUリソースを圧迫。

### 2.6 widthアニメーション（レイアウトスラッシング） [HIGH]

**ファイル**: `SkillsSection.tsx` L229-238, L342-349

```tsx
<div style={{ width: `${skill.level}%` }}
     className="transition-all duration-1000 ease-out" />
```

18以上のプログレスバーが `width` を同時アニメーション → 各フレームでレイアウト再計算。`transform: scaleX()` に置き換えるべき。

### 2.7 `setInterval` による大テキスト再レンダリング [MEDIUM]

**ファイル**: `HeroSection.tsx` L151-163

```typescript
setInterval(() => setCurrentNameIndex(...), 4000);  // 名前サイクル
setInterval(() => setCurrentRoleIndex(...), 3500);   // 役職サイクル
```

`text-7xl lg:text-8xl` の大テキストが3.5-4秒ごとに再レンダリング。

### 2.8 スムーズスクロールの競合 [MEDIUM]

- `globals.css` L54: `scroll-behavior: smooth`（CSS）
- JS側: `scrollIntoView({ behavior: 'smooth' })`

CSS と JS の両方がスムーズスクロールを制御 → 二重アニメーションの可能性。

### 2.9 画像の未最適化 [MEDIUM]

| ファイル | サイズ |
|---|---|
| `lab.jpeg` | 393 KB |
| `wechat-qr.png` | 302 KB |
| `daily.jpeg` | 289 KB |
| `ski.jpeg` | 274 KB |

`next/image` は使用しているが、`sizes` prop 未設定。

### 2.10 テーマ検出によるハイドレーション不一致 [MEDIUM]

**ファイル**: `ThemeContext.tsx` L20-36

サーバー側はライトテーマでレンダリング → クライアントで `prefers-color-scheme: dark` を検出 → 再レンダリング → レイアウトシフト。

### 2.11 `.animate-pulse-glow` 無限アニメーション [LOW]

`globals.css` L128-135: `box-shadow` を3秒間隔で無限アニメーション。`box-shadow` の変更はレイアウトスラッシングを引き起こす。

---

## 3. 優先度別 改善方針

### P0 — 即座に修正すべき（カクつきの主要因）

| # | 対策 | 対象ファイル |
|---|---|---|
| 1 | スクロールリスナーにスロットル追加（100ms） | `Navigation.tsx` |
| 2 | TimelineSection の SVGアニメーション簡素化 | `TimelineSection.tsx` |
| 3 | `backdrop-blur-xl` を削除 or 軽量化 | 全カードコンポーネント |
| 4 | `width` アニメーション → `transform: scaleX()` に変更 | `SkillsSection.tsx` |

### P1 — バンドル・パフォーマンス改善

| # | 対策 | 対象 |
|---|---|---|
| 5 | `motion` → `m` + `LazyMotion` に移行 | 全9コンポーネント |
| 6 | 不要な `'use client'` を削除、Server Component化 | 静的セクション |
| 7 | 画像に `sizes` prop 追加、圧縮 | `HeroSection.tsx` 他 |
| 8 | CSSスムーズスクロールの競合解消 | `globals.css` |

### P2 — AIっぽさの解消（デザインリニューアル）

| # | 対策 |
|---|---|
| 9 | カスタムカラーパレット策定（青紫グラデ廃止） |
| 10 | `.gradient-text` 廃止、ソリッドカラーでタイポグラフィ階層を構築 |
| 11 | セクションごとに異なるカードデザイン |
| 12 | グラスモーフィズム廃止 → ソリッド or 微妙なテクスチャ |
| 13 | アニメーションパターンの多様化（全て fade-in-up は廃止） |
| 14 | カスタムフォント・タイポグラフィスケール導入 |
| 15 | ダークモードの個性的な配色 |

---

## 4. 影響度まとめ

```
カクつき寄与度:
  スクロールリスナー未スロットル ████████████ 30%
  SVGアニメーション+フィルタ    ████████████ 25%
  backdrop-blur 多用           ████████░░░░ 20%
  大量の 'use client'          ██████░░░░░░ 15%
  widthアニメーション           ████░░░░░░░░ 10%

AIっぽさ寄与度:
  青紫グラデーション統一        ████████████ 30%
  コピペカードデザイン          ██████████░░ 25%
  グラデーションテキスト乱用    ████████░░░░ 20%
  グラスモーフィズム過剰        ██████░░░░░░ 15%
  均一アニメーション+構造       ████░░░░░░░░ 10%
```
