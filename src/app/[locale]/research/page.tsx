import dynamic from "next/dynamic";
import ScrollableLayout from "@/components/ScrollableLayout";

const ResearchSection = dynamic(() => import("@/components/ResearchSection"), {
  loading: () => <div />,
});

export default function ResearchPage() {
  return (
    <ScrollableLayout>
      <ResearchSection />
    </ScrollableLayout>
  );
} 