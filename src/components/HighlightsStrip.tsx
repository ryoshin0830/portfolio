import { getTranslations } from "next-intl/server";
import type { HighlightStat } from "@/types/content";
import HighlightsHeroMetric from "@/components/HighlightsHeroMetric";

const HighlightsStrip = async () => {
  const t = await getTranslations("highlights");
  const stats = t.raw("stats") as HighlightStat[];
  const hero = stats.find((s) => s.hero) ?? stats[0];
  const supporting = stats.filter((s) => s.id !== hero.id);

  return (
    <section
      id="highlights"
      className="section section--soft bg-[color:var(--color-bg-soft)]"
    >
      <div className="section__inner text-center">
        {/* Apple "Big number" hero metric — animated neural-net treatment */}
        <HighlightsHeroMetric
          value={hero.value}
          unit={hero.unit}
          label={hero.label}
          context={hero.context}
        />

        {/* Supporting metrics — 5 column grid, generous, no borders */}
        {supporting.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-12 mt-20">
            {supporting.map((s) => (
              <div key={s.id} className="text-center">
                <p
                  className="num text-[color:var(--color-ink)] mb-2"
                  style={{
                    fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                    fontWeight: 600,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {s.value}
                  <span
                    className="text-[color:var(--color-ink-muted)]"
                    style={{ fontSize: "0.5em", marginLeft: "0.2em", fontWeight: 500 }}
                  >
                    {s.unit}
                  </span>
                </p>
                <p className="text-sm text-[color:var(--color-ink-soft)] leading-snug">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HighlightsStrip;
