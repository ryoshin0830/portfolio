import dynamic from "next/dynamic";
import ScrollableLayout from "@/components/ScrollableLayout";

const AboutSection = dynamic(() => import("@/components/AboutSection"), {
  loading: () => <div />,
});

export default function AboutPage() {
  return (
    <ScrollableLayout>
      <AboutSection />
    </ScrollableLayout>
  );
} 