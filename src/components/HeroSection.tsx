import { getLocale, getTranslations } from "next-intl/server";
import {
  LuArrowDown as ArrowDown,
  LuArrowUpRight as ArrowUpRight,
} from "react-icons/lu";
import { FaEnvelope, FaGithub } from "react-icons/fa";
import { SiX } from "react-icons/si";
import type { FeedItem } from "@/types/articles";
import { SourceIcon } from "@/components/icons/BrandIcons";
import { formatRelativeTime } from "@/lib/relativeTime";

/**
 * Editorial, asymmetric hero — fully static (async Server Component).
 *
 * - The kanji brand mark「梁 震」is the single fixed h1 in display mincho;
 *   the other readings live in a permanent small meta line (no rotation,
 *   no timers, no CLS reservations, stable LCP).
 * - Left column: identity + tagline + CTA. Right column: a bottom-aligned
 *   fact list (current role / degree / primary contacts).
 * - The full 12-icon SocialLinks live in the ContactModal — the #contact hash
 *   opens it (plain anchor keeps this a Server Component).
 * - A slim "latest writing" teaser (3 most-recent items) sits at the foot of the
 *   hero; the full date-sorted archive is WritingFeed (#blog). Static links only —
 *   no loading state, no animation — so the hero LCP stays stable.
 * - CTA is a plain anchor: CSS scroll-behavior handles smooth scrolling and
 *   the prefers-reduced-motion reset in globals.css turns it off.
 */

const PRIMARY_CONTACTS = [
  { id: "github", label: "GitHub", href: "https://github.com/ryoshin0830", Icon: FaGithub },
  // The X logo IS the letter X, so a service-name label would be a tautology —
  // the handle identifies the account while the glyph identifies the service.
  { id: "x", label: "@ryoshin0830", href: "https://x.com/ryoshin0830", Icon: SiX },
] as const;

const HeroSection = async ({
  latestItems = [],
}: {
  latestItems?: FeedItem[];
}) => {
  const t = await getTranslations("hero");
  const tNames = await getTranslations("names");
  const tEmail = await getTranslations("email");
  const tWriting = await getTranslations("heroWriting");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  const writingTeaser = latestItems.slice(0, 3);

  // The reader's own locale comes first in the alternate-readings line.
  const readingOrder =
    locale === "en"
      ? (["english", "japaneseFurigana", "chinese"] as const)
      : locale === "zh"
        ? (["chinese", "japaneseFurigana", "english"] as const)
        : (["japaneseFurigana", "english", "chinese"] as const);
  const readings = readingOrder.map((key) => tNames(key));

  // The canonical name contains an ideographic space (梁 震). At display
  // size a full 1em gap reads as a hole, so render the parts with a tight
  // optical gap instead.
  const nameParts = tNames("japanese").split(/\s+/).filter(Boolean);

  const facts = [
    { label: t("metaNow"), value: t("currentlyAt") },
    { label: t("metaDegree"), value: t("description") },
  ];

  return (
    <section
      id="hero"
      className="relative flex min-h-svh flex-col justify-center bg-[color:var(--color-bg)] gutter-x pb-16 pt-28"
    >
      <div className="grid w-full items-end gap-14 lg:grid-cols-12 lg:gap-10">
        {/* Identity column */}
        <div className="lg:col-span-8">
          <p className="meta mb-6 flex flex-wrap items-center gap-x-3 gap-y-1">
            {readings.map((reading, i) => (
              <span key={reading} className="flex items-center gap-x-3">
                {i > 0 && <span aria-hidden>·</span>}
                {reading}
              </span>
            ))}
          </p>

          <h1 className="display-serif hero-name mb-6 whitespace-nowrap">
            {nameParts.map((part, i) => (
              <span key={part} className={i > 0 ? "ml-[0.16em]" : undefined}>
                {part}
              </span>
            ))}
          </h1>

          <p className="mb-10 text-lg font-medium text-[color:var(--color-ink-soft)] md:text-xl">
            {t("role")}
          </p>

          <p className="hero-tagline mb-12 max-w-3xl text-balance">
            {t("subtitle")}
          </p>

          <a href="#highlights" className="btn-pill">
            {t("viewWork")}
            <ArrowDown size={16} aria-hidden />
          </a>
        </div>

        {/* Fact column — bottom-aligned against the identity block */}
        <aside className="lg:col-span-4">
          <dl className="border-t border-[color:var(--color-rule)]">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-baseline justify-between gap-6 border-b border-[color:var(--color-rule-soft)] py-4"
              >
                <dt className="meta shrink-0">{fact.label}</dt>
                <dd className="text-right text-sm font-medium text-[color:var(--color-ink)]">
                  {fact.value}
                </dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-6 py-4">
              <dt className="meta shrink-0">{t("metaContact")}</dt>
              <dd className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm font-medium">
                <a
                  href={`mailto:${tEmail("address")}`}
                  className="inline-flex items-center gap-1.5 text-[color:var(--color-ink)] transition-colors hover:text-[color:var(--color-accent)]"
                >
                  <FaEnvelope size={13} aria-hidden />
                  {t("metaEmail")}
                </a>
                {PRIMARY_CONTACTS.map(({ id, label, href, Icon }) => (
                  <a
                    key={id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[color:var(--color-ink)] transition-colors hover:text-[color:var(--color-accent)]"
                  >
                    <Icon size={13} aria-hidden />
                    {label}
                    <span className="sr-only"> — {tc("opensInNewTab")}</span>
                  </a>
                ))}
              </dd>
            </div>
          </dl>
          {/* #contact ハッシュは ContactModal を開く（スクロールしない） */}
          <a href="#contact" className="link-accent text-sm" aria-haspopup="dialog">
            {t("allContacts")}
            <ArrowUpRight size={14} aria-hidden />
          </a>
        </aside>
      </div>

      {/* Latest-writing teaser — a slim taste of recent output at the hero foot.
          Static links (no animation/loading) so the hero LCP stays stable; the
          full archive is WritingFeed (#blog). */}
      {writingTeaser.length > 0 && (
        <div className="mt-16 w-full border-t border-[color:var(--color-rule-soft)] pt-6">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <p className="meta">{tWriting("title")}</p>
            <a href="#blog" className="link-accent text-xs">
              {tWriting("viewAll")}
              <ArrowDown size={12} aria-hidden />
            </a>
          </div>
          <ul className="grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {writingTeaser.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 py-1"
                >
                  <span className="flex shrink-0 translate-y-0.5 items-center gap-1 text-[color:var(--color-ink-soft)]">
                    {item.sources.map((s) => (
                      <SourceIcon key={s} source={s} className="h-3.5 w-3.5" />
                    ))}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="line-clamp-1 text-sm font-medium leading-snug text-[color:var(--color-ink)] transition-colors group-hover:text-[color:var(--color-accent)]">
                      {item.text}
                      <span className="sr-only"> — {tc("opensInNewTab")}</span>
                    </span>
                    <span className="num text-xs text-[color:var(--color-ink-muted)]">
                      {formatRelativeTime(item.date, locale)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
