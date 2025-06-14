import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ResearchSection from "@/components/ResearchSection";
import PublicationsSection from "@/components/PublicationsSection";
import TeachingSection from "@/components/TeachingSection";
import CertificationsSection from "@/components/CertificationsSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import ZennFeed from "@/components/ZennFeed";
import GallerySection from "@/components/GallerySection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ResearchSection />
      <PublicationsSection />
      <TeachingSection />
      <CertificationsSection />
      <SkillsSection />
      <ProjectsSection />
      <ZennFeed />
      <GallerySection />
    </main>
  );
}
