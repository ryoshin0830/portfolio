/**
 * ページ内セクション ID とハッシュ駆動ダイアログの単一ソース（single source of truth）。
 *
 * ここに載せた ID は次の箇所すべてと整合している必要がある:
 *  1. page.tsx が描画する各セクションコンポーネントの `id` 属性
 *  2. next.config.ts の旧 URL リダイレクト（/{locale}/{section} → /{locale}#section）
 *  3. useScrollNavigation の scroll-spy（URL を /{locale}/{section} に書き換える）
 *
 * 整合性は src/lib/sections.test.ts が検証する（pre-commit / pre-push で実行）。
 */

/** ページ上の DOM 順。scroll-spy はこの順で監視する。 */
export const SECTION_IDS = [
  "hero",
  "about",
  "experience",
  "projects",
  "research",
  "skills",
  "blog",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/**
 * セクションではなく、URL ハッシュで開くダイアログ。
 * `#contact` は ContactModal が hashchange を監視して開く（旧 ContactSection は
 * ページ最下部にあり、アンカースクロールが WritingFeed の遅延描画で目的地に
 * 届かないバグが構造的に起きるため、モーダルに置き換えた）。
 */
export const HASH_DIALOGS = ["contact"] as const;

/**
 * 旧 URL `/{locale}/{section}` を `/{locale}#section` へ誘導する対象。
 * - scroll-spy が URL を `/{locale}/{section}` に書き換えるため、hero 以外の
 *   すべてのセクションが必要（無いとその URL のリロードが 404 になる）。
 * - contact は旧セクション URL の互換: /{locale}/contact → /{locale}#contact で
 *   ContactModal が開く（ディープリンクとして機能し続ける）。
 */
export const SECTION_REDIRECTS: readonly string[] = [
  ...SECTION_IDS.filter((id) => id !== "hero"),
  ...HASH_DIALOGS,
];
