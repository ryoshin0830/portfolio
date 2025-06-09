import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ryosh.in";

  // Locales and pages we want to expose
  const locales = ["ja", "en", "zh"] as const;
  const pages = ["", "about", "research", "skills", "projects", "gallery"] as const;

  // Root entry with alternates
  const rootEntry: MetadataRoute.Sitemap[number] = {
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
  };

  const entries: MetadataRoute.Sitemap = [rootEntry];

  locales.forEach((locale) => {
    pages.forEach((page) => {
      const path = page ? `/${locale}/${page}` : `/${locale}`;
  const baseUrl = 'https://ryosh.in'
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
      alternates: {
        languages: {
          ja: `${baseUrl}/ja`,
          en: `${baseUrl}/en`,
          zh: `${baseUrl}/zh`,
        },
      },
    },
    {
      url: `${baseUrl}/ja`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/zh`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ]
}