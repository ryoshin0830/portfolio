import HeroSection from "@/components/HeroSection";
import HighlightsStrip from "@/components/HighlightsStrip";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import ProjectsSection from "@/components/ProjectsSection";
import ResearchSection from "@/components/ResearchSection";
import SkillsSection from "@/components/SkillsSection";
import SchedulingSection from "@/components/SchedulingSection";
import WritingFeed from "@/components/WritingFeed";
import ScrollRail from "@/components/motion/ScrollRail";
import { setRequestLocale } from "next-intl/server";
import { getArticles } from "@/lib/articles";
import { getPosts } from "@/lib/posts";
import { getNotionNotes } from "@/lib/notion";
import { buildFeed } from "@/lib/feed";

// ISR: ビルド時にプリレンダリングし、60 秒ごとにバックグラウンド再生成する。
// 60 秒は X 投稿のフェッチキャッシュ（posts.ts）と同じ間隔で、新しい投稿が
// 約 1 分で反映される従来の挙動を保ったままページ自体を静的配信にする。
export const revalidate = 60;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // 静的レンダリングを有効化（配下の getTranslations をヘッダー非依存にする）
  setRequestLocale(locale);
  // Fetch the merged Zenn + Qiita articles and the X posts once on the server
  // (each cached on its own schedule — articles hourly, posts daily), then merge
  // them into one date-sorted feed handed to consumers as props: no duplicate
  // client requests, content in the initial HTML. Both degrade to an empty list
  // on failure; the sections handle the empty state.
  const [articles, posts, notes] = await Promise.all([
    getArticles().catch((err) => {
      console.error("[feed] articles fetch failed:", err);
      return [];
    }),
    getPosts().catch((err) => {
      console.error("[feed] X posts fetch failed:", err);
      return [];
    }),
    // Notion is an undocumented API behind Cloudflare; a failure must not take
    // the page down, so it degrades to an empty list like the other sources.
    getNotionNotes().catch((err) => {
      console.error("[feed] Notion notes fetch failed:", err);
      return [];
    }),
  ]);
  const feed = buildFeed(articles, posts, notes);
  // Hero teaser: surface the latest substantial writing (Zenn/Qiita/note
  // articles); fall back to X posts only when there are no articles. Notion
  // notes are deliberately excluded — they use kind "notion", so this filter
  // leaves them out. The full date-sorted archive lives in WritingFeed (#blog)
  // — the single dedicated 発信 section.
  const latestArticles = feed.filter((i) => i.kind === "article").slice(0, 3);
  const latestPosts = feed.filter((i) => i.kind === "post").slice(0, 3);
  const heroLatest = latestArticles.length > 0 ? latestArticles : latestPosts;

  return (
    <main>
      <HeroSection latestItems={heroLatest} />
      {/* セクション間の空白帯に置く横流れの帯。本文の裏には入らないので
          可読性を削らず、縦スクロールが横の動きに変換される。
          向きを交互にすると（左→右→左）ページを下るリズムが出る。 */}
      <ScrollRail direction="left" seed={11} />
      {/* 自己紹介(about)→数字で見る成果(highlights)→経歴…と、初見でも文脈が
          積み上がる物語順。発信(WritingFeed)はページ末尾の単一セクションに集約。 */}
      <AboutSection />
      <HighlightsStrip />
      <ScrollRail direction="right" seed={23} />
      <ExperienceSection />
      <ProjectsSection />
      <ScrollRail direction="left" seed={37} />
      <ResearchSection />
      <SkillsSection />
      <ScrollRail direction="right" seed={53} />
      <SchedulingSection />
      <WritingFeed items={feed} />
    </main>
  );
}
