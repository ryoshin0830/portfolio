import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ResearchSection from "@/components/ResearchSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import ZennFeed from "@/components/ZennFeed";
import CertificationsSection from "@/components/CertificationsSection";
import TeachingSection from "@/components/TeachingSection";
import GallerySection from "@/components/GallerySection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ResearchSection />
      <SkillsSection />
      <ProjectsSection />
      <ZennFeed />
      <CertificationsSection />
      <TeachingSection />
      <GallerySection />
    </main>
  );
}
