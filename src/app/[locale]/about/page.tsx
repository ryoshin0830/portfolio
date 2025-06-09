import dynamic from "next/dynamic";

const AboutSection = dynamic(() => import("@/components/AboutSection"), {
  loading: () => <div />,
});

export default function AboutPage() {
  return <AboutSection />;
} 