import HeroSection from "@/components/HeroSection";
import HighlightsStrip from "@/components/HighlightsStrip";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import ProjectsSection from "@/components/ProjectsSection";
import ResearchSection from "@/components/ResearchSection";
import SkillsSection from "@/components/SkillsSection";
import WritingFeed from "@/components/WritingFeed";
import { getArticles } from "@/lib/articles";
import { getPosts } from "@/lib/posts";
import { buildFeed } from "@/lib/feed";

export default async function Home() {
  // Fetch the merged Zenn + Qiita articles and the X posts once on the server
  // (each cached on its own schedule — articles hourly, posts daily), then merge
  // them into one date-sorted feed handed to consumers as props: no duplicate
  // client requests, content in the initial HTML. Both degrade to an empty list
  // on failure; the sections handle the empty state.
  const [articles, posts] = await Promise.all([
    getArticles().catch(() => []),
    getPosts().catch(() => []),
  ]);
  const feed = buildFeed(articles, posts);
  // The Hero shows articles and posts as two separate columns (mixing them by
  // date buries the articles under the more-frequent posts), so split the feed
  // by kind there. The bottom section keeps the merged, date-sorted stream.
  const latestArticles = feed.filter((i) => i.kind === "article").slice(0, 5);
  const latestPosts = feed.filter((i) => i.kind === "post").slice(0, 5);

  return (
    <main>
      <HeroSection latestArticles={latestArticles} latestPosts={latestPosts} />
      <HighlightsStrip />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <ResearchSection />
      <SkillsSection />
      <WritingFeed items={feed} />
    </main>
  );
}
