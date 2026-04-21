import { getTranslations } from "next-intl/server";
import type { HighlightStat } from "@/types/content";

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
        {/* Apple "Big number" hero metric */}
        <div className="mb-20 fade-up">
          <p
            className="display num mb-6"
            style={{
              fontSize: "clamp(4rem, 13vw, 10rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
              color: "var(--color-accent)",
            }}
          >
            {hero.value}
            <span
              className="text-[color:var(--color-ink-soft)]"
              style={{ fontSize: "0.4em", fontWeight: 500, marginLeft: "0.15em" }}
            >
              {hero.unit}
            </span>
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            {hero.label}
          </h2>
          {hero.context && (
            <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl mx-auto">
              {hero.context}
            </p>
          )}
        </div>

        {/* Supporting metrics — 5 column grid, generous, no borders */}
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
      </div>
    </section>
  );
};

export default HighlightsStrip;
