import HeroSection from "@/components/HeroSection";
import HighlightsStrip from "@/components/HighlightsStrip";
import LatestZennArticle from "@/components/LatestZennArticle";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import ResearchSection from "@/components/ResearchSection";
import ProjectsSection from "@/components/ProjectsSection";
import SkillsSection from "@/components/SkillsSection";
import ZennFeed from "@/components/ZennFeed";
import ContractCTA from "@/components/ContractCTA";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HighlightsStrip />
      <LatestZennArticle />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <ResearchSection />
      <SkillsSection />
      <ZennFeed />
      <ContractCTA />
    </main>
  );
}
