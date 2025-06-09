import dynamic from "next/dynamic";

const ProjectsSection = dynamic(() => import("@/components/ProjectsSection"), {
  loading: () => <div />,
});

export default function ProjectsPage() {
  return <ProjectsSection />;
} 