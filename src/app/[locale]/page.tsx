import HeroSection from "@/components/HeroSection";
import LatestWritingSection from "@/components/LatestWritingSection";
import HighlightsStrip from "@/components/HighlightsStrip";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import ProjectsSection from "@/components/ProjectsSection";
import ResearchSection from "@/components/ResearchSection";
import SkillsSection from "@/components/SkillsSection";
import WritingFeed from "@/components/WritingFeed";
import ClosingCTA from "@/components/ClosingCTA";
import { setRequestLocale } from "next-intl/server";
import { getArticles } from "@/lib/articles";
import { getPosts } from "@/lib/posts";
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
  const [articles, posts] = await Promise.all([
    getArticles().catch((err) => {
      console.error("[feed] articles fetch failed:", err);
      return [];
    }),
    getPosts().catch((err) => {
      console.error("[feed] X posts fetch failed:", err);
      return [];
    }),
  ]);
  const feed = buildFeed(articles, posts);
  // The Hero shows articles and posts as two separate columns (mixing them by
  // date buries the articles under the more-frequent posts), so split the feed
  // by kind there. The bottom section keeps the merged, date-sorted stream.
  // 3 each (was 5): the full archive lives in WritingFeed (#blog) below —
  // a longer duplicate list directly under the hero just created déjà vu.
  const latestArticles = feed.filter((i) => i.kind === "article").slice(0, 3);
  const latestPosts = feed.filter((i) => i.kind === "post").slice(0, 3);

  return (
    <main>
      <HeroSection />
      <LatestWritingSection
        latestArticles={latestArticles}
        latestPosts={latestPosts}
      />
      <HighlightsStrip />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <ResearchSection />
      <SkillsSection />
      <WritingFeed items={feed} />
      <ClosingCTA />
    </main>
  );
}
