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
      className="section section--rule bg-[color:var(--color-paper)]"
    >
      <div className="section__inner">
        <header className="border-b border-[color:var(--color-rule)] pb-4 mb-10 flex items-baseline justify-between">
          <div className="kicker">{t("kicker")}</div>
          <div className="kicker">{t("title")}</div>
        </header>

        {/* Hero metric — large */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-12 items-end">
          <article className="hs-fade">
            <div
              className="display num"
              style={{
                fontSize: "clamp(3rem, 9vw, 7rem)",
                lineHeight: 0.95,
                color: "var(--color-amber-mark)",
              }}
            >
              {hero.value}
              <span
                className="font-serif italic"
                style={{
                  fontSize: "0.4em",
                  marginLeft: "0.2em",
                  color: "var(--color-ink-soft)",
                  fontStyle: "italic",
                }}
              >
                {hero.unit}
              </span>
            </div>
            <div className="kicker mt-4">№ 01 — Hero metric</div>
            <p className="mt-2 font-serif italic text-xl text-[color:var(--color-ink)]">
              {hero.label}
            </p>
            {hero.context && (
              <p className="mt-2 text-sm text-[color:var(--color-ink-soft)] max-w-[42ch]">
                {hero.context}
              </p>
            )}
          </article>

          {/* Supporting metrics — five smaller, right column */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 border-l border-[color:var(--color-rule-soft)] pl-8">
            {supporting.map((s, i) => (
              <li
                key={s.id}
                className="hs-fade border-t border-[color:var(--color-rule-soft)] pt-3"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                <div
                  className="font-serif italic num text-[color:var(--color-ink)]"
                  style={{ fontSize: "1.75rem", lineHeight: 1.05 }}
                >
                  {s.value}
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "0.55em",
                      marginLeft: "0.3em",
                      color: "var(--color-ink-soft)",
                      fontStyle: "normal",
                      textTransform: "lowercase",
                    }}
                  >
                    {s.unit}
                  </span>
                </div>
                <div className="kicker num mt-1">№ 0{i + 2}</div>
                <p className="mt-1 text-sm text-[color:var(--color-ink)]">{s.label}</p>
                {s.context && (
                  <p className="text-xs text-[color:var(--color-ink-soft)] mt-1 leading-relaxed">
                    {s.context}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default HighlightsStrip;
