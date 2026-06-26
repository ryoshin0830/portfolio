import { getTranslations } from "next-intl/server";
import SchedulingChat from "./SchedulingChat";

/**
 * AI 日程調整セクション（#scheduling）。
 *
 * Server Component。見出しはサーバーで描画し、対話的なチャット本体だけを
 * クライアント（SchedulingChat）に委ねる。訪問者は自然言語で要望を書き、
 * /api/schedule/* 経由でサーバー側 → Google Calendar API (OAuth2 直接) と流れる。
 */
export default async function SchedulingSection() {
  const t = await getTranslations("scheduling");

  return (
    <section id="scheduling" className="section">
      <div className="section__inner">
        <header className="mb-16">
          <p className="meta text-[color:var(--color-accent)] mb-3">{t("kicker")}</p>
          <h2 className="display display--xl mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>
        <SchedulingChat />
      </div>
    </section>
  );
}
