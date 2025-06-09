import dynamic from "next/dynamic";
import ScrollableLayout from "@/components/ScrollableLayout";

const GallerySection = dynamic(() => import("@/components/GallerySection"), {
  loading: () => <div />,
});

export default function GalleryPage() {
  return (
    <ScrollableLayout>
      <GallerySection />
    </ScrollableLayout>
  );
} 