import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ResearchSection from "@/components/ResearchSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import ZennFeed from "@/components/ZennFeed";
import TeachingSection from "@/components/TeachingSection";
import GallerySection from "@/components/GallerySection";
import URLShortenerSection from "@/components/URLShortenerSection";
import YopmailAccessSection from "@/components/YopmailAccessSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ResearchSection />
      <SkillsSection />
      <ProjectsSection />
      <ZennFeed />
      <TeachingSection />
      <GallerySection />
      <URLShortenerSection />
      <YopmailAccessSection />
    </main>
  );
}
