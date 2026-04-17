import { getLocale, getTranslations } from "next-intl/server";
import HeroQRTrigger from "./HeroQRTrigger";

type Category = "messaging" | "professional" | "social";

type Platform = {
  id: string;
  name: string;
  href?: string;
  qrCode?: string;
  category: Category;
  priority: { ja: number; en: number; zh: number };
};

const categoryOrderByLocale: Record<string, Category[]> = {
  ja: ["professional", "messaging", "social"],
  zh: ["messaging", "social", "professional"],
  en: ["professional", "social", "messaging"],
};

const HeroSection = async () => {
  const locale = (await getLocale()) as "ja" | "en" | "zh";
  const t = await getTranslations("hero");
  const tNames = await getTranslations("names");
  const tEmail = await getTranslations("email");
  const tHeroCategories = await getTranslations("heroCategories");

  const roles = t.raw("roles") as string[];
  const role = roles[0] ?? "";

  const primaryName =
    locale === "en"
      ? tNames("english")
      : locale === "zh"
        ? tNames("shortName")
        : tNames("japanese");

  const secondaryName =
    locale === "en"
      ? tNames("japanese")
      : locale === "zh"
        ? tNames("english")
        : tNames("english");

  const platforms: Platform[] = [
    {
      id: "email",
      name: tEmail("contact"),
      href: `mailto:${tEmail("address")}`,
      category: "professional",
      priority: { ja: 10, en: 10, zh: 10 },
    },
    {
      id: "github",
      name: "GitHub",
      href: "https://github.com/ryoshin0830",
      category: "professional",
      priority: { ja: 7, en: 8, zh: 7 },
    },
    {
      id: "zenn",
      name: "Zenn",
      href: "https://zenn.dev/ryoushin",
      category: "professional",
      priority: { ja: 9, en: 5, zh: 4 },
    },
    {
      id: "qiita",
      name: "Qiita",
      href: "https://qiita.com/ryoshin0830",
      category: "professional",
      priority: { ja: 6, en: 4, zh: 3 },
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/ryoshin",
      category: "social",
      priority: { ja: 8, en: 9, zh: 8 },
    },
    {
      id: "x",
      name: "X",
      href: "https://x.com/ryoshin0830",
      category: "social",
      priority: { ja: 8, en: 7, zh: 6 },
    },
    {
      id: "facebook",
      name: "Facebook",
      href: "https://www.facebook.com/ryoshin0830",
      category: "social",
      priority: { ja: 4, en: 6, zh: 5 },
    },
    {
      id: "instagram",
      name: "Instagram",
      href: "https://www.instagram.com/ryoshin0830",
      category: "social",
      priority: { ja: 5, en: 5, zh: 6 },
    },
    {
      id: "xiaohongshu",
      name: "小红书",
      href: "https://www.xiaohongshu.com/user/profile/5a0e90b211be1056202b808f?xsec_token=YBERRMVpcYr3fOe_IO5v-tr9JY5mUTiZ4O0J_11Q_DwII=&xsec_source=app_share&xhsshare=CopyLink&appuid=5a0e90b211be1056202b808f&apptime=1749915336&share_id=ba7caa0644c54d339241e3b501b3fede",
      category: "social",
      priority: { ja: 2, en: 2, zh: 8 },
    },
    {
      id: "line",
      name: "LINE",
      href: "https://line.me/ti/p/J7cd9CqhvX",
      category: "messaging",
      priority: { ja: 10, en: 3, zh: 5 },
    },
    {
      id: "wechat",
      name: "WeChat",
      qrCode: "/wechat-qr.png",
      category: "messaging",
      priority: { ja: 4, en: 5, zh: 10 },
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      qrCode: "/whatsapp-qr.png",
      category: "messaging",
      priority: { ja: 5, en: 9, zh: 4 },
    },
  ];

  const grouped = platforms.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<Category, Platform[]>);

  for (const cat of Object.keys(grouped) as Category[]) {
    grouped[cat].sort(
      (a, b) => (b.priority[locale] ?? 0) - (a.priority[locale] ?? 0),
    );
  }

  const categoryOrder = categoryOrderByLocale[locale] ?? categoryOrderByLocale.en;

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-end bg-[color:var(--color-paper)] pt-28 pb-16 sm:pb-20"
    >
      <div className="container mx-auto px-6 sm:px-10 max-w-7xl w-full relative z-10">
        <div className="max-w-4xl">
          <p className="meta mb-6 sm:mb-10">
            <span>{t("kyoto")}</span>
            <span aria-hidden="true" className="mx-2 opacity-60">·</span>
            <span>{new Date().getFullYear()}</span>
          </p>

          <h1
            className="font-display text-[color:var(--color-ink)] tracking-[-0.035em] leading-[0.9] name-display"
            lang={locale === "en" ? "en" : locale === "zh" ? "zh" : "ja"}
          >
            {primaryName}
          </h1>

          <p className="meta mt-5 sm:mt-6">
            <span className="text-[color:var(--color-ink)]">{role}</span>
            <span aria-hidden="true" className="mx-2 opacity-60">·</span>
            <span>{secondaryName}</span>
          </p>

          <div className="mt-12 sm:mt-16 max-w-2xl space-y-3">
            <p className="text-lg sm:text-xl leading-[1.55] text-[color:var(--color-ink)]">
              {t("subtitle")}
            </p>
            <p className="meta">
              {t("description")}
            </p>
            <p className="meta text-[color:var(--color-ink-soft)]">
              <span>{t("beijing")}</span>
              <span aria-hidden="true" className="mx-2">→</span>
              <span>{t("kyoto")}</span>
            </p>
          </div>

          <hr className="rule-soft mt-16 sm:mt-20 max-w-2xl" />

          <div className="mt-10 grid gap-10 sm:grid-cols-3 max-w-3xl">
            {categoryOrder.map((category) => {
              const items = grouped[category] ?? [];
              if (items.length === 0) return null;
              return (
                <div key={category}>
                  <h2 className="meta mb-4">
                    {tHeroCategories(category)}
                  </h2>
                  <ul className="space-y-2 text-[color:var(--color-ink)]">
                    {items.map((p) =>
                      p.qrCode ? (
                        <li key={p.id}>
                          <HeroQRTrigger
                            platformId={p.id as "wechat" | "whatsapp"}
                            label={p.name}
                            qrSrc={p.qrCode}
                          />
                        </li>
                      ) : (
                        <li key={p.id}>
                          <a
                            href={p.href}
                            target={p.href?.startsWith("http") ? "_blank" : undefined}
                            rel={p.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="underline-offset-4 decoration-transparent hover:decoration-[color:var(--color-teal-ink)] hover:text-[color:var(--color-teal-ink)] underline transition-colors"
                          >
                            {p.name}
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
