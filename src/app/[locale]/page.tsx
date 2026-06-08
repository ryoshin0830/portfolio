import HeroSection from "@/components/HeroSection";
import HighlightsStrip from "@/components/HighlightsStrip";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import ProjectsSection from "@/components/ProjectsSection";
import ResearchSection from "@/components/ResearchSection";
import SkillsSection from "@/components/SkillsSection";
import WritingFeed from "@/components/WritingFeed";
import { getArticles } from "@/lib/articles";

export default async function Home() {
  // Fetch the merged Zenn + Qiita feed once on the server (cached for an hour)
  // and hand it to both consumers as props — no duplicate client requests, and
  // the article list is in the initial HTML. Degrade to an empty list if both
  // upstream feeds are unreachable; the sections handle the empty state.
  const articles = await getArticles().catch(() => []);

  return (
    <main>
      <HeroSection latestArticles={articles.slice(0, 3)} />
      <HighlightsStrip />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <ResearchSection />
      <SkillsSection />
      <WritingFeed articles={articles} />
    </main>
  );
}
