import dynamic from "next/dynamic";

const GallerySection = dynamic(() => import("@/components/GallerySection"), {
  loading: () => <div />,
});

export default function GalleryPage() {
  return <GallerySection />;
} 