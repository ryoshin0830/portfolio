import dynamic from "next/dynamic";

const SkillsSection = dynamic(() => import("@/components/SkillsSection"), {
  loading: () => <div />,
});

export default function SkillsPage() {
  return <SkillsSection />;
} 