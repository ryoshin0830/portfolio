import { getTranslations } from "next-intl/server";
import type { HighlightStat } from "@/types/content";
import HighlightsHeroMetric from "@/components/HighlightsHeroMetric";

const HighlightsStrip = async () => {
  const t = await getTranslations("highlights");
  const stats = t.raw("stats") as HighlightStat[];
  const hero = stats.find((s) => s.hero) ?? stats[0];

  return (
    <section
      id="highlights"
      className="section section--soft bg-[color:var(--color-bg-soft)]"
    >
      <div className="section__inner text-center">
        {/* Section context (uses the previously-unused title/subtitle so the
            single-metric section isn't a number floating without a frame). */}
        <header className="mb-16">
          <p className="meta text-[color:var(--color-accent)] mb-3">{t("kicker")}</p>
          <h2 className="display display--lg mb-4">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </header>

        {/* Apple "Big number" hero metric — animated neural-net treatment */}
        <HighlightsHeroMetric
          value={hero.value}
          unit={hero.unit}
          label={hero.label}
          context={hero.context}
        />
      </div>
    </section>
  );
};

export default HighlightsStrip;
