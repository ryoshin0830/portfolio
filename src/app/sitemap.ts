import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ryosh.in";

  const locales = ["ja", "en", "zh"] as const;
  const pages = ["", "about", "research", "skills", "projects", "gallery"] as const;

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: {
          ja: `${baseUrl}/ja`,
          en: `${baseUrl}/en`,
          zh: `${baseUrl}/zh`,
        },
      },
    },
  ];

  locales.forEach((locale) => {
    pages.forEach((page) => {
      const path = page ? `/${locale}/${page}` : `/${locale}`;
      entries.push({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: page === "" ? 1 : 0.9,
      });
    });
  });

  return entries;
}