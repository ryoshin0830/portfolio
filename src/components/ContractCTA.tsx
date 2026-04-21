"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
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

type Locale = "ja" | "en" | "zh";

interface Platform {
  id: string;
  name: string;
  href: string;
  icon?: React.ElementType;
  iconPath?: string;
  priority: Record<Locale, number>;
  category: "messaging" | "professional" | "social";
  qrCode?: string;
}

export default function ContractCTA() {
  const t = useTranslations("contactCTA");
  const tHeroCategories = useTranslations("heroCategories");
  const tSocialActions = useTranslations("socialActions");
  const tCommon = useTranslations("common");
  const tEmail = useTranslations("email");
  const locale = useLocale() as Locale;

  const [showWeChatQR, setShowWeChatQR] = useState(false);
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false);

  const domains = t.raw("domains") as string[];

  const platforms: Platform[] = [
    {
      id: "email",
      name: tEmail("contact"),
      href: `mailto:${tEmail("address")}`,
      icon: FaEnvelope,
      priority: { ja: 10, en: 10, zh: 10 },
      category: "professional",
    },
    {
      id: "github",
      name: "GitHub",
      href: "https://github.com/ryoshin0830",
      icon: FaGithub,
      priority: { ja: 7, en: 8, zh: 7 },
      category: "professional",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/ryoshin",
      icon: FaLinkedin,
      priority: { ja: 8, en: 9, zh: 8 },
      category: "social",
    },
    {
      id: "x",
      name: "X",
      href: "https://x.com/ryoshin0830",
      icon: SiX,
      priority: { ja: 8, en: 7, zh: 6 },
      category: "social",
    },
    {
      id: "zenn",
      name: "Zenn",
      href: "https://zenn.dev/ryoushin",
      iconPath: "/logo-only.svg",
      priority: { ja: 9, en: 5, zh: 4 },
      category: "professional",
    },
    {
      id: "qiita",
      name: "Qiita",
      href: "https://qiita.com/ryoshin0830",
      icon: SiQiita,
      priority: { ja: 6, en: 4, zh: 3 },
      category: "professional",
    },
    {
      id: "line",
      name: "LINE",
      href: "https://line.me/ti/p/J7cd9CqhvX",
      icon: FaLine,
      priority: { ja: 10, en: 3, zh: 5 },
      category: "messaging",
    },
    {
      id: "wechat",
      name: "WeChat",
      href: "#",
      icon: FaWeixin,
      priority: { ja: 4, en: 5, zh: 10 },
      category: "messaging",
      qrCode: "/wechat-qr.png",
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      href: "#",
      icon: FaWhatsapp,
      priority: { ja: 5, en: 9, zh: 4 },
      category: "messaging",
      qrCode: "/whatsapp-qr.png",
    },
    {
      id: "facebook",
      name: "Facebook",
      href: "https://www.facebook.com/ryoshin0830",
      icon: FaFacebook,
      priority: { ja: 4, en: 6, zh: 5 },
      category: "social",
    },
    {
      id: "instagram",
      name: "Instagram",
      href: "https://www.instagram.com/ryoshin0830",
      icon: FaInstagram,
      priority: { ja: 5, en: 5, zh: 6 },
      category: "social",
    },
    {
      id: "xiaohongshu",
      name: "小红书",
      href: "https://www.xiaohongshu.com/user/profile/5a0e90b211be1056202b808f",
      icon: SiXiaohongshu,
      priority: { ja: 2, en: 2, zh: 8 },
      category: "social",
    },
  ];

  const orderByLocale: Record<Locale, Array<"messaging" | "professional" | "social">> = {
    ja: ["professional", "messaging", "social"],
    zh: ["messaging", "social", "professional"],
    en: ["professional", "social", "messaging"],
  };
  const categoryOrder = orderByLocale[locale] ?? orderByLocale.en;

  const sorted = [...platforms].sort(
    (a, b) => (b.priority[locale] ?? 0) - (a.priority[locale] ?? 0),
  );

  const grouped = sorted.reduce(
    (acc, p) => {
      (acc[p.category] ||= []).push(p);
      return acc;
    },
    {} as Record<string, Platform[]>,
  );

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

  return (
    <section id="contact" className="section section--soft">
      <div className="section__inner text-center">
        {/* Open-to-work signal */}
        <p className="text-sm font-medium text-[color:var(--color-accent)] mb-4 inline-flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: "var(--color-accent)" }}
            aria-hidden
          />
          {t("openToWork")}
        </p>

        <p className="text-base md:text-lg font-medium text-[color:var(--color-ink-soft)] mb-4">
          {t("accepting")}
        </p>

        <h2 className="display display--xl mb-8 text-balance max-w-3xl mx-auto">
          {t("headline")}
        </h2>
        <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl mx-auto mb-10">
          {t("body")}
        </p>

        {/* Domain chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {domains.map((d) => (
            <span key={d} className="chip">
              {d}
            </span>
          ))}
        </div>

        {/* Email CTA pill */}
        <a
          href={`mailto:${t("email")}`}
          className="btn-pill text-lg px-8 py-4"
          style={{ fontSize: "1.0625rem" }}
        >
          {t("email")}
          <span aria-hidden>→</span>
        </a>

        {/* All social platforms grouped by category */}
        <div className="mt-16 grid gap-10 md:grid-cols-3 text-left">
          {categoryOrder.map((category) => {
            const list = grouped[category] || [];
            if (list.length === 0) return null;
            return (
              <div key={category}>
                <p className="text-xs uppercase tracking-wider text-[color:var(--color-ink-muted)] font-medium mb-4 text-center">
                  {tHeroCategories(category)}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {list.map((p) => {
                    const isQR = !!p.qrCode;
                    const showQR =
                      (p.id === "wechat" && showWeChatQR) ||
                      (p.id === "whatsapp" && showWhatsAppQR);

                    const renderIcon = () =>
                      p.icon ? (
                        <p.icon size={16} />
                      ) : p.iconPath ? (
                        <Image
                          src={p.iconPath}
                          alt={p.name}
                          width={16}
                          height={16}
                          sizes="16px"
                          className="w-4 h-4"
                        />
                      ) : null;

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
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-soft)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] text-[color:var(--color-ink)] transition-colors"
                            aria-label={p.name}
                          >
                            {renderIcon()}
                          </button>
                          {showQR && (
                            <>
                              <div
                                className="fixed inset-0 bg-[color:var(--color-ink)]/40 z-40"
                                onClick={() =>
                                  p.id === "wechat"
                                    ? setShowWeChatQR(false)
                                    : setShowWhatsAppQR(false)
                                }
                              />
                              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 bg-[color:var(--color-bg)] border border-[color:var(--color-rule)] rounded-2xl z-50 max-w-sm mx-4 shadow-2xl">
                                <h3 className="text-lg font-semibold tracking-tight text-[color:var(--color-ink)] mb-4 text-center">
                                  {p.id === "wechat"
                                    ? tSocialActions("wechatQR")
                                    : tSocialActions("whatsappQR")}
                                </h3>
                                <div className="bg-white p-3 rounded-lg">
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
                                  className="mt-4 w-full px-4 py-2 rounded-full border border-[color:var(--color-rule)] text-[color:var(--color-ink)] text-sm hover:bg-[color:var(--color-bg-soft)] transition-colors"
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
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-soft)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] text-[color:var(--color-ink)] transition-colors"
                        aria-label={p.name}
                      >
                        {renderIcon()}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
