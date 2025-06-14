"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, ChevronLeft, ChevronRight, Camera, Image as ImageIcon, Filter } from "lucide-react";
import Image from "next/image";

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const t = useTranslations("gallery");

  const images = [
    {
      src: "/lab.jpeg",
      alt: "Research Activity",
      category: "research",
      titleKey: "research",
      description: "京都大学での研究活動の様子",
    },
    {
      src: "/business.jpeg",
      alt: "Business Activity",
      category: "business",
      titleKey: "business",
      description: "株式会社EastLinkerでのビジネス活動",
    },
    {
      src: "/daily.jpeg",
      alt: "Daily Life",
      category: "daily",
      titleKey: "daily",
      description: "日常生活の一コマ",
    },
    {
      src: "/ski.jpeg",
      alt: "Outdoor Activities",
      category: "outdoor",
      titleKey: "outdoor",
      description: "アウトドア活動・スキーの様子",
    },
  ];

  const categories = [
    { key: "all", label: "すべて" },
    { key: "research", labelKey: "research" },
    { key: "business", labelKey: "business" },
    { key: "daily", labelKey: "daily" },
    { key: "outdoor", labelKey: "outdoor" },
  ];

  const filteredImages =
    activeCategory === "all"
      ? images
      : images.filter((img) => img.category === activeCategory);

  const openModal = (index: number) => {
    setSelectedImage(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % filteredImages.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === 0 ? filteredImages.length - 1 : selectedImage - 1,
      );
    }
  };


  return (
    <section id="gallery" className="pt-32 pb-24 bg-gradient-to-b from-white via-slate-50/30 to-white dark:from-slate-900 dark:via-slate-950/30 dark:to-slate-900">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-sm font-medium mb-6">
            <ImageIcon size={16} />
            Photo Gallery
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black gradient-text mb-6 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Category Filter */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-full shadow-lg mb-8">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg shadow-lg">
              <Filter className="text-white" size={20} />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">カテゴリーフィルター</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`relative px-8 py-4 rounded-2xl font-semibold transition-all duration-200 ${
                  activeCategory === category.key
                    ? "text-white shadow-xl bg-gradient-to-r from-blue-600 to-purple-600"
                    : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 shadow-lg hover:shadow-xl"
                }`}
              >
                <span className="relative z-10">
                  {category.labelKey ? t(category.labelKey) : category.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Image Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          key={activeCategory}
        >
          {filteredImages.map((image, index) => (
            <div
              key={`${activeCategory}-${index}`}
              className="group cursor-pointer transition-transform duration-200 hover:-translate-y-2"
              onClick={() => openModal(index)}
            >
              <div className="relative aspect-square overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-200 border-4 border-white dark:border-slate-800">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200" />
                
                {/* Hover content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-4 group-hover:translate-y-0">
                  <h3 className="text-xl font-bold mb-2">
                    {t(image.titleKey)}
                  </h3>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {image.description}
                  </p>
                </div>
                
                {/* Floating camera icon */}
                <div className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {selectedImage !== null && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-200"
              onClick={closeModal}
            >
              <div className="relative max-w-6xl max-h-[90vh] mx-4">
                {/* Modern close button */}
                <button
                  className="absolute -top-16 right-0 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-200 shadow-xl"
                  onClick={closeModal}
                >
                  <X size={24} />
                </button>

                {/* Modern navigation buttons */}
                {filteredImages.length > 1 && (
                  <>
                    <button
                      className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-200 shadow-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                    >
                      <ChevronLeft size={28} />
                    </button>
                    <button
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-200 shadow-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                    >
                      <ChevronRight size={28} />
                    </button>
                  </>
                )}

                {/* Image container */}
                <div
                  className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={filteredImages[selectedImage].src}
                    alt={filteredImages[selectedImage].alt}
                    width={1000}
                    height={700}
                    className="w-auto h-auto max-h-[70vh] object-contain"
                  />

                  {/* Modern image info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8 backdrop-blur-sm">
                    <h3 className="text-white text-2xl font-bold mb-3">
                      {t(filteredImages[selectedImage].titleKey)}
                    </h3>
                    <p className="text-slate-200 text-lg leading-relaxed">
                      {filteredImages[selectedImage].description}
                    </p>
                  </div>
                </div>

                {/* Modern image counter */}
                {filteredImages.length > 1 && (
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium shadow-xl">
                    {selectedImage + 1} of {filteredImages.length}
                  </div>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default GallerySection;
