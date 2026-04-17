import HeroSection from "@/components/HeroSection";
import LatestZennArticle from "@/components/LatestZennArticle";
import AboutSection from "@/components/AboutSection";
import ResearchSection from "@/components/ResearchSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import ZennFeed from "@/components/ZennFeed";
import TeachingSection from "@/components/TeachingSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <LatestZennArticle />
      <AboutSection />
      <ResearchSection />
      <SkillsSection />
      <ProjectsSection />
      <ZennFeed />
      <TeachingSection />
    </main>
  );
}
