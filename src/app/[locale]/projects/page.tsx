import dynamic from "next/dynamic";
import ScrollableLayout from "@/components/ScrollableLayout";

const ProjectsSection = dynamic(() => import("@/components/ProjectsSection"), {
  loading: () => <div />,
});

export default function ProjectsPage() {
  return (
    <ScrollableLayout>
      <ProjectsSection />
    </ScrollableLayout>
  );
} 