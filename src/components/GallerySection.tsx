"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section
      id="gallery"
      className="py-20 bg-white dark:bg-slate-900"
      data-oid="co-rhtj"
    >
      <div className="container mx-auto px-4" data-oid="orl6fyk">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          data-oid="uhto89_"
        >
          <h2
            className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-center"
            data-oid="yxh56ox"
          >
            <Camera
              className="mr-4 text-blue-600"
              size={40}
              data-oid="gvjbdff"
            />

            {t("title")}
          </h2>
          <p
            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
            data-oid="o_nergy"
          >
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          data-oid="5iriqir"
        >
          {categories.map((category) => (
            <motion.button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCategory === category.key
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-oid="o1gyzd7"
            >
              {category.labelKey ? t(category.labelKey) : category.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Image Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          key={activeCategory} // Re-animate when category changes
          data-oid="g8nptpd"
        >
          {filteredImages.map((image, index) => (
            <motion.div
              key={`${activeCategory}-${index}`}
              variants={itemVariants}
              className="group cursor-pointer"
              onClick={() => openModal(index)}
              whileHover={{ scale: 1.02 }}
              layout
              data-oid="-27pm5r"
            >
              <div
                className="relative aspect-square overflow-hidden rounded-xl shadow-lg"
                data-oid="dr.injr"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  data-oid="bybq8ib"
                />

                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  data-oid="s3-za7s"
                />

                <div
                  className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  data-oid="sfq6926"
                >
                  <h3 className="font-semibold mb-1" data-oid="ox-d1v5">
                    {t(image.titleKey)}
                  </h3>
                  <p className="text-sm text-slate-200" data-oid="9v72b3v">
                    {image.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Modal */}
        <AnimatePresence data-oid="idei52x">
          {selectedImage !== null && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              data-oid="660umqe"
            >
              <div
                className="relative max-w-4xl max-h-[90vh] mx-4"
                data-oid="8pwr6wt"
              >
                {/* Close Button */}
                <motion.button
                  className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors duration-200"
                  onClick={closeModal}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  data-oid="z31:80l"
                >
                  <X size={32} data-oid="._5.q0g" />
                </motion.button>

                {/* Navigation Buttons */}
                {filteredImages.length > 1 && (
                  <>
                    <motion.button
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 transition-colors duration-200 bg-black/50 rounded-full p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      data-oid="kar6r_r"
                    >
                      <ChevronLeft size={24} data-oid="p1e7lrs" />
                    </motion.button>
                    <motion.button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 transition-colors duration-200 bg-black/50 rounded-full p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      data-oid="fdf2ign"
                    >
                      <ChevronRight size={24} data-oid="ppynha0" />
                    </motion.button>
                  </>
                )}

                {/* Image */}
                <motion.div
                  className="relative"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                  data-oid="mk1ofir"
                >
                  <Image
                    src={filteredImages[selectedImage].src}
                    alt={filteredImages[selectedImage].alt}
                    width={800}
                    height={600}
                    className="rounded-lg shadow-2xl max-h-[70vh] w-auto object-contain"
                    data-oid="f_twgcq"
                  />

                  {/* Image Info */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg"
                    data-oid="x5_-svf"
                  >
                    <h3
                      className="text-white text-xl font-semibold mb-2"
                      data-oid="dcuetjg"
                    >
                      {t(filteredImages[selectedImage].titleKey)}
                    </h3>
                    <p className="text-slate-200" data-oid="dap_l3m">
                      {filteredImages[selectedImage].description}
                    </p>
                  </div>
                </motion.div>

                {/* Image Counter */}
                {filteredImages.length > 1 && (
                  <div
                    className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white text-sm"
                    data-oid="bltocda"
                  >
                    {selectedImage + 1} / {filteredImages.length}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default GallerySection;
