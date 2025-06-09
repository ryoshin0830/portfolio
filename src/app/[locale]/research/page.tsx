import dynamic from "next/dynamic";

const ResearchSection = dynamic(() => import("@/components/ResearchSection"), {
  loading: () => <div />,
});

export default function ResearchPage() {
  return <ResearchSection />;
} 