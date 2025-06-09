import dynamic from "next/dynamic";
import ScrollableLayout from "@/components/ScrollableLayout";

const SkillsSection = dynamic(() => import("@/components/SkillsSection"), {
  loading: () => <div />,
});

export default function SkillsPage() {
  return (
    <ScrollableLayout>
      <SkillsSection />
    </ScrollableLayout>
  );
} 