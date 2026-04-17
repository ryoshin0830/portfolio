"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

type Props = {
  platformId: "wechat" | "whatsapp";
  label: string;
  qrSrc: string;
};

const HeroQRTrigger = ({ platformId, label, qrSrc }: Props) => {
  const [open, setOpen] = useState(false);
  const tSocial = useTranslations("socialActions");
  const tCommon = useTranslations("common");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogTitleId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = triggerRef.current;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  const dialogLabel =
    platformId === "wechat" ? tSocial("wechatQR") : tSocial("whatsappQR");

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex items-baseline gap-1 text-[color:var(--color-ink)] hover:text-[color:var(--color-teal-ink)] underline-offset-4 decoration-transparent hover:decoration-[color:var(--color-teal-ink)] underline transition-colors"
      >
        <span>{label}</span>
        <span aria-hidden="true" className="meta">QR</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <button
            type="button"
            aria-label={tCommon("close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative z-10 bg-[color:var(--color-paper)] border border-[color:var(--color-rule)] p-8 max-w-sm w-[92vw] mx-4 shadow-none">
            <h3 id={dialogTitleId} className="meta mb-6 text-[color:var(--color-ink)] opacity-100">
              {dialogLabel}
            </h3>
            <Image
              src={qrSrc}
              alt={`${label} QR`}
              width={256}
              height={256}
              sizes="256px"
              className="w-full h-auto"
            />
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full py-3 border border-[color:var(--color-rule)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-deep)] transition-colors text-sm font-medium"
            >
              {tCommon("close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HeroQRTrigger;
