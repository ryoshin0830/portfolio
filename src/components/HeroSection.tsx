"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  FaGithub,
  FaLinkedin,
  FaFacebook,
  FaInstagram,
  FaLine,
  FaWeixin,
  FaWhatsapp,
  FaEnvelope,
} from "react-icons/fa";
import { SiQiita, SiX, SiXiaohongshu } from "react-icons/si";
import Image from "next/image";

const HeroSection = () => {
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [showWeChatQR, setShowWeChatQR] = useState(false);
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false);
  const t = useTranslations("hero");
  const tNames = useTranslations("names");
  const tCommon = useTranslations("common");
  const tHeroCategories = useTranslations("heroCategories");
  const tSocialActions = useTranslations("socialActions");
  const tEmail = useTranslations("email");
  const locale = useLocale();

  const names = [
    tNames("japanese"),
    tNames("japaneseFurigana"),
    tNames("english"),
    tNames("chinese"),
  ];
  const roles = t.raw("roles") as string[];

  const socialPlatforms = [
    { id: "email", name: tEmail("contact"), href: `mailto:${tEmail("address")}`, icon: FaEnvelope, priority: { ja: 10, en: 10, zh: 10 }, category: "professional" as const },
    { id: "github", name: "GitHub", href: "https://github.com/ryoshin0830", icon: FaGithub, priority: { ja: 7, en: 8, zh: 7 }, category: "professional" as const },
    { id: "linkedin", name: "LinkedIn", href: "https://www.linkedin.com/in/ryoshin", icon: FaLinkedin, priority: { ja: 8, en: 9, zh: 8 }, category: "social" as const },
    { id: "x", name: "X", href: "https://x.com/ryoshin0830", icon: SiX, priority: { ja: 8, en: 7, zh: 6 }, category: "social" as const },
    { id: "zenn", name: "Zenn", href: "https://zenn.dev/ryoushin", iconPath: "/logo-only.svg", priority: { ja: 9, en: 5, zh: 4 }, category: "professional" as const },
    { id: "qiita", name: "Qiita", href: "https://qiita.com/ryoshin0830", icon: SiQiita, priority: { ja: 6, en: 4, zh: 3 }, category: "professional" as const },
    { id: "line", name: "LINE", href: "https://line.me/ti/p/J7cd9CqhvX", icon: FaLine, priority: { ja: 10, en: 3, zh: 5 }, category: "messaging" as const },
    { id: "wechat", name: "WeChat", href: "#", icon: FaWeixin, priority: { ja: 4, en: 5, zh: 10 }, category: "messaging" as const, qrCode: "/wechat-qr.png" },
    { id: "whatsapp", name: "WhatsApp", href: "#", icon: FaWhatsapp, priority: { ja: 5, en: 9, zh: 4 }, category: "messaging" as const, qrCode: "/whatsapp-qr.png" },
    { id: "facebook", name: "Facebook", href: "https://www.facebook.com/ryoshin0830", icon: FaFacebook, priority: { ja: 4, en: 6, zh: 5 }, category: "social" as const },
    { id: "instagram", name: "Instagram", href: "https://www.instagram.com/ryoshin0830", icon: FaInstagram, priority: { ja: 5, en: 5, zh: 6 }, category: "social" as const },
    { id: "xiaohongshu", name: "小红书", href: "https://www.xiaohongshu.com/user/profile/5a0e90b211be1056202b808f", icon: SiXiaohongshu, priority: { ja: 2, en: 2, zh: 8 }, category: "social" as const },
  ];

  const sortedPlatforms = [...socialPlatforms].sort((a, b) => {
    const cur = locale as "ja" | "en" | "zh";
    return (b.priority[cur] || 0) - (a.priority[cur] || 0);
  });

  useEffect(() => {
    const i = setInterval(() => setCurrentNameIndex((p) => (p + 1) % names.length), 4000);
    return () => clearInterval(i);
  }, [names.length]);

  useEffect(() => {
    const i = setInterval(() => setCurrentRoleIndex((p) => (p + 1) % roles.length), 3500);
    return () => clearInterval(i);
  }, [roles.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".qr-container")) {
        setShowWeChatQR(false);
        setShowWhatsAppQR(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const grouped = sortedPlatforms.reduce(
    (acc, p) => {
      (acc[p.category] ||= []).push(p);
      return acc;
    },
    {} as Record<string, typeof sortedPlatforms>,
  );
  const orderByLocale: Record<string, string[]> = {
    ja: ["messaging", "professional", "social"],
    zh: ["messaging", "social", "professional"],
    en: ["professional", "social", "messaging"],
  };
  const order = orderByLocale[locale] || orderByLocale.en;

  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[color:var(--color-paper)]">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10 pt-32 pb-12 flex-1 flex flex-col">
        {/* Editorial masthead */}
        <header className="flex items-baseline justify-between border-b border-[color:var(--color-rule)] pb-3 mb-12">
          <span className="kicker">Vol. 01 · Portfolio</span>
          <span className="kicker num">{t("coordinate")}</span>
        </header>

        {/* Display name */}
        <div className="mt-4">
          <h1 className="hero-name break-words">
            {names[currentNameIndex]}
          </h1>
          <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
        </div>

        {/* Role + currentlyAt — single bottom rail with mono labels */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-baseline gap-x-8 gap-y-4 border-t border-[color:var(--color-rule-soft)] pt-6">
          <div>
            <div className="kicker mb-2">Role</div>
            <div
              className="font-semibold tracking-tight text-2xl md:text-3xl text-[color:var(--color-ink)]"
              aria-live="polite"
            >
              {roles[currentRoleIndex]}
            </div>
          </div>
          <div className="hidden md:block h-px bg-[color:var(--color-rule-soft)] self-center" />
          <div className="md:text-right">
            <div className="kicker mb-2">Currently</div>
            <div className="text-base md:text-lg text-[color:var(--color-ink)]">
              {t("currentlyAt")}
            </div>
          </div>
        </div>

        {/* Origin / current geographic line */}
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <span className="tag-mono">{t("origin")} · {t("beijing")}</span>
          <span className="tag-mono">{t("current")} · {t("kyoto")}</span>
          <span className="tag-mono">{t("description")}</span>
        </div>

        {/* Social rail — editorial, no gradients */}
        <div className="mt-auto pt-16">
          <div className="grid gap-8 md:grid-cols-3">
            {order
              .map((category) => {
                const platforms = grouped[category] || [];
                if (platforms.length === 0) return null;
                return (
                  <div key={category} className="border-t border-[color:var(--color-rule-soft)] pt-4">
                    <h4 className="kicker mb-3">
                      {tHeroCategories(category as "messaging" | "professional" | "social")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map((p) => {
                        const isQR = "qrCode" in p && p.qrCode;
                        if (isQR) {
                          return (
                            <div key={p.id} className="qr-container relative">
                              <button
                                type="button"
                                onClick={() =>
                                  p.id === "wechat"
                                    ? setShowWeChatQR((v) => !v)
                                    : setShowWhatsAppQR((v) => !v)
                                }
                                className="focus-edit inline-flex items-center justify-center w-9 h-9 border border-[color:var(--color-rule-soft)] hover:border-[color:var(--color-ink)] transition-colors text-[color:var(--color-ink)] rounded-[2px]"
                                aria-label={p.name}
                              >
                                {p.icon && <p.icon size={16} />}
                              </button>
                              {((p.id === "wechat" && showWeChatQR) ||
                                (p.id === "whatsapp" && showWhatsAppQR)) && (
                                <>
                                  <div
                                    className="fixed inset-0 bg-[color:var(--color-ink)]/40 z-40"
                                    onClick={() =>
                                      p.id === "wechat"
                                        ? setShowWeChatQR(false)
                                        : setShowWhatsAppQR(false)
                                    }
                                  />
                                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 bg-[color:var(--color-paper)] border border-[color:var(--color-rule)] z-50 max-w-sm mx-4">
                                    <h3 className="text-lg font-semibold tracking-tight text-[color:var(--color-ink)] mb-4 text-center">
                                      {p.id === "wechat"
                                        ? tSocialActions("wechatQR")
                                        : tSocialActions("whatsappQR")}
                                    </h3>
                                    <div className="bg-white p-3">
                                      <Image
                                        src={p.qrCode!}
                                        alt={`${p.name} QR Code`}
                                        width={200}
                                        height={200}
                                        sizes="200px"
                                        className="w-full max-w-60 mx-auto"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        p.id === "wechat"
                                          ? setShowWeChatQR(false)
                                          : setShowWhatsAppQR(false)
                                      }
                                      className="mt-4 w-full px-4 py-2 border border-[color:var(--color-rule)] text-[color:var(--color-ink)] meta hover:bg-[color:var(--color-paper-deep)] transition-colors"
                                    >
                                      {tCommon("close")}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        }
                        return (
                          <a
                            key={p.id}
                            href={p.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="focus-edit inline-flex items-center justify-center w-9 h-9 border border-[color:var(--color-rule-soft)] hover:border-[color:var(--color-ink)] transition-colors text-[color:var(--color-ink)] rounded-[2px]"
                            aria-label={p.name}
                          >
                            {"icon" in p && p.icon ? (
                              <p.icon size={16} />
                            ) : (
                              <Image
                                src={p.iconPath!}
                                alt={p.name}
                                width={16}
                                height={16}
                                sizes="16px"
                                className="w-4 h-4"
                              />
                            )}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })
              .filter(Boolean)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
