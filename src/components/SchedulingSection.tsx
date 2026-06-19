import { getTranslations } from "next-intl/server";
import SchedulingCalendar from "./SchedulingCalendar";

/**
 * AI 日程調整セクション（#scheduling）。
 *
 * Server Component。見出しはサーバーで描画し、対話的なカレンダー本体だけを
 * クライアント（SchedulingCalendar）に委ねる。空き状況の取得・予約確定は
 * /api/schedule/* 経由でサーバー側 → Hermes(自宅Mac) → Google Calendar と流れる。
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
        <SchedulingCalendar />
      </div>
    </section>
  );
}
