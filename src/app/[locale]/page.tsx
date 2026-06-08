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

export default async function Home() {
  // Fetch the merged Zenn + Qiita feed and the X posts once on the server (each
  // cached on its own schedule — articles hourly, posts daily) and hand them to
  // consumers as props: no duplicate client requests, content in the initial
  // HTML. Both degrade to an empty list on failure; the sections handle empty.
  const [articles, posts] = await Promise.all([
    getArticles().catch(() => []),
    getPosts().catch(() => []),
  ]);

  return (
    <main>
      <HeroSection latestArticles={articles.slice(0, 3)} />
      <HighlightsStrip />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <ResearchSection />
      <SkillsSection />
      <WritingFeed articles={articles} posts={posts} />
    </main>
  );
}
