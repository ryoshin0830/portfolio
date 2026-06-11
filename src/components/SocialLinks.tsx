"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * All contact methods as a compact, centered, wrapped row of icon circles.
 * WeChat / WhatsApp open an accessible QR dialog (focus-trapped, Esc to close).
 * Used in the ContactModal — ordering is locale-aware (priority desc).
 */
export default function SocialLinks() {
  const tSocialActions = useTranslations("socialActions");
  const tCommon = useTranslations("common");
  const tEmail = useTranslations("email");
  const tCategories = useTranslations("heroCategories");
  const locale = useLocale() as Locale;

  const [showWeChatQR, setShowWeChatQR] = useState(false);
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false);
  const qrDialogRef = useRef<HTMLDivElement>(null);
  const qrTriggerRef = useRef<HTMLButtonElement | null>(null);

  const openQR = (id: string, trigger: HTMLButtonElement) => {
    qrTriggerRef.current = trigger;
    // exclusive — only one QR dialog open at a time
    setShowWeChatQR(id === "wechat");
    setShowWhatsAppQR(id === "whatsapp");
  };
  const closeQR = () => {
    setShowWeChatQR(false);
    setShowWhatsAppQR(false);
  };

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

  // Grouped by category (fixed order), each group ordered by locale priority.
  const CATEGORY_ORDER = ["professional", "social", "messaging"] as const;
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    label: tCategories(category),
    items: platforms
      .filter((p) => p.category === category)
      .sort((a, b) => (b.priority[locale] ?? 0) - (a.priority[locale] ?? 0)),
  })).filter((g) => g.items.length > 0);

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

  // QR dialog: Escape to close, move focus in on open, trap Tab within it, and
  // return focus to the trigger button on close (keyboard accessibility).
  useEffect(() => {
    if (!showWeChatQR && !showWhatsAppQR) return;
    const node = qrDialogRef.current;
    const trigger = qrTriggerRef.current;
    const getFocusable = () =>
      node
        ? Array.from(
            node.querySelectorAll<HTMLElement>(
              'button, a[href], [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null)
        : [];
    getFocusable()[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeQR();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [showWeChatQR, showWhatsAppQR]);

  const renderItem = (p: Platform) => {
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
            onClick={(e) => (showQR ? closeQR() : openQR(p.id, e.currentTarget))}
            className="group flex w-[4.5rem] flex-col items-center gap-1.5 text-[color:var(--color-ink)]"
            aria-haspopup="dialog"
            aria-expanded={showQR}
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-rule-soft)] bg-[color:var(--color-bg)] transition-colors group-hover:border-[color:var(--color-accent)] group-hover:text-[color:var(--color-accent)]">
              {renderIcon()}
            </span>
            <span className="w-full truncate text-center text-xs leading-tight text-[color:var(--color-ink-soft)] transition-colors group-hover:text-[color:var(--color-accent)]">
              {p.name}
            </span>
          </button>
          {showQR && (
            <>
              {/* z-index は ContactModal (z-[120]) より上に置く */}
              <div
                className="fixed inset-0 bg-[color:var(--color-ink)]/40 z-[140]"
                onClick={closeQR}
              />
              <div
                ref={qrDialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={
                  p.id === "wechat"
                    ? tSocialActions("wechatQR")
                    : tSocialActions("whatsappQR")
                }
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 bg-[color:var(--color-bg)] border border-[color:var(--color-rule)] rounded-2xl z-[150] max-w-sm mx-4"
              >
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
                  onClick={closeQR}
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

    const isExternal = p.href.startsWith("http");
    // Visible label under every icon — a wall of unlabeled circles forced the
    // visitor to hover-guess which circle does what.
    return (
      <a
        key={p.id}
        href={p.href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="group flex w-[4.5rem] flex-col items-center gap-1.5 text-[color:var(--color-ink)]"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-rule-soft)] bg-[color:var(--color-bg)] transition-colors group-hover:border-[color:var(--color-accent)] group-hover:text-[color:var(--color-accent)]">
          {renderIcon()}
        </span>
        <span className="w-full truncate text-center text-xs leading-tight text-[color:var(--color-ink-soft)] transition-colors group-hover:text-[color:var(--color-accent)]">
          {p.name}
        </span>
      </a>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch md:justify-center md:gap-0">
      {groups.map((g, i) => (
        <div
          key={g.category}
          className={`flex flex-col items-center gap-2.5 md:px-6 ${
            i > 0 ? "md:border-l md:border-[color:var(--color-rule-soft)]" : ""
          }`}
        >
          <p className="meta">
            {g.label}
          </p>
          <div className="flex flex-wrap items-start justify-center gap-x-1 gap-y-3">
            {g.items.map(renderItem)}
          </div>
        </div>
      ))}
    </div>
  );
}
