"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { m, AnimatePresence } from "framer-motion";
import { LuX as X } from "react-icons/lu";
import SocialLinks from "./SocialLinks";

/**
 * すべての連絡先を表示するモーダル。URL ハッシュ `#contact` で開く。
 *
 * 以前は最下部の ContactSection (#contact) へアンカースクロールしていたが、
 * 途中の WritingFeed が batch 描画でページを伸ばすためスクロールが目的地に
 * 届かないバグが構造的に起きていた。スクロールを廃してモーダルにする。
 *
 * ハッシュ駆動にする理由:
 * - Hero の「すべての連絡先」は静的な <a href="#contact"> のままで動く
 *   （Server Component を保てる）
 * - 旧 URL /{locale}/contact → /{locale}#contact のリダイレクト（next.config.ts）
 *   がそのままディープリンクとして機能する
 *
 * 閉じるときはハッシュを replaceState で消す（履歴を汚さず、再クリックで
 * 再び hashchange が発火する）。
 */

const CONTACT_HASH = "#contact";

export default function ContactModal() {
  const t = useTranslations("contact");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    if (window.location.hash === CONTACT_HASH) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  // #contact ハッシュで開く: 初回マウント時（/{locale}/contact リダイレクト等で
  // ハッシュ付きで着地したケース）と、ページ内リンククリック時（hashchange）。
  useEffect(() => {
    const syncWithHash = () => {
      if (window.location.hash === CONTACT_HASH) {
        triggerRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        setOpen(true);
      }
    };
    syncWithHash();
    window.addEventListener("hashchange", syncWithHash);
    return () => window.removeEventListener("hashchange", syncWithHash);
  }, []);

  // 背景スクロールのロック
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // フォーカス管理: 開いたらパネル内へ、Tab をトラップ、閉じたらトリガーへ戻す。
  // Esc で閉じる（ただし内側の QR ダイアログが開いているときはそちらに任せる）。
  useEffect(() => {
    if (!open) return;
    const node = panelRef.current;
    if (!node) return;
    const hasInnerDialog = () =>
      node.querySelector('[role="dialog"]') !== null;
    const getFocusable = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
    getFocusable()[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (hasInnerDialog()) return; // QR ダイアログが自分で Esc / Tab を処理する
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
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
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* 背景オーバーレイ — クリックで閉じる */}
          <div
            className="absolute inset-0 bg-[color:var(--color-ink)]/40"
            onClick={close}
            aria-hidden
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="relative w-[min(44rem,100%)] max-h-[85svh] overflow-y-auto rounded-2xl border border-[color:var(--color-rule)] bg-[color:var(--color-bg)] px-6 py-10 md:px-10"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 inline-flex min-h-11 min-w-11 items-center justify-center text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
              aria-label={tCommon("close")}
            >
              <X size={20} />
            </button>
            <header className="mb-10 text-center">
              <h2
                id="contact-modal-title"
                className="display display--lg mb-3"
              >
                {t("title")}
              </h2>
              <p className="prose-body text-[color:var(--color-ink-soft)]">
                {t("subtitle")}
              </p>
            </header>
            <SocialLinks />
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
