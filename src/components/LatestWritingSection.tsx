import { getLocale, getTranslations } from "next-intl/server";
import { LuArrowDown as ArrowDown, LuArrowUpRight as ArrowUpRight } from "react-icons/lu";
import Link from "next/link";
import type { FeedItem, FeedSource } from "@/types/articles";
import { BRAND_LABEL, SourceIcon } from "@/components/icons/BrandIcons";

// Monochrome brand mark as a source indicator (matches the editorial palette).
const SourceMark = ({ source }: { source: FeedSource }) => (
  <span className="inline-flex items-center text-[color:var(--color-ink-soft)]">
    <SourceIcon source={source} className="h-3.5 w-3.5" />
    <span className="sr-only">{BRAND_LABEL[source]}</span>
  </span>
);

/**
 * Latest articles / posts, directly below the hero (moved out of it so the
 * hero stays a single-purpose identity screen). Fully server-rendered from
 * props — content is in the initial HTML, no loading states, no animation
 * loops. The full date-sorted archive lives in WritingFeed (#blog).
 */
const LatestWritingSection = async ({
  latestArticles,
  latestPosts,
}: {
  latestArticles: FeedItem[];
  latestPosts: FeedItem[];
}) => {
  const t = await getTranslations("heroWriting");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  if (latestArticles.length === 0 && latestPosts.length === 0) return null;

  const formatDate = (s: string) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(s));

  const renderColumn = (label: string, columnItems: FeedItem[]) => (
    <div>
      <p className="meta mb-3 border-b border-[color:var(--color-rule)] pb-2">
        {label}
      </p>
      <ul className="flex flex-col">
        {columnItems.map((i) => (
          <li key={i.id}>
            <Link
              href={i.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1 border-b border-[color:var(--color-rule-soft)] py-3 last:border-b-0"
            >
              <span className="flex items-start gap-2">
                <span className="flex shrink-0 translate-y-0.5 items-center gap-1">
                  {i.sources.map((s) => (
                    <SourceMark key={s} source={s} />
                  ))}
                </span>
                <span className="text-sm font-medium leading-snug text-[color:var(--color-ink)] transition-colors line-clamp-2 group-hover:text-[color:var(--color-accent)]">
                  {i.text}
                  <span className="sr-only"> — {tc("opensInNewTab")}</span>
                </span>
              </span>
              <span className="flex items-center gap-1.5 pl-[1.4rem] text-xs text-[color:var(--color-ink-muted)] num">
                {formatDate(i.date)}
                <ArrowUpRight
                  size={11}
                  aria-hidden
                  className="transition-colors group-hover:text-[color:var(--color-accent)]"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section
      id="writing"
      className="section section--pt-tight border-t border-[color:var(--color-rule-soft)]"
    >
      <div className="section__inner">
        <header className="mb-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <h2 className="display display--lg">{t("title")}</h2>
          {/* In-page jump to the full archive (#blog) — hence the down arrow,
              distinct from each row's ↗ which opens the item off-site. */}
          <a href="#blog" className="link-accent text-sm">
            {t("viewAll")}
            <ArrowDown size={14} aria-hidden />
          </a>
        </header>

        <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
          {latestArticles.length > 0 &&
            renderColumn(t("latestArticles"), latestArticles)}
          {latestPosts.length > 0 && (
            <div
              className={
                latestArticles.length > 0
                  ? "md:border-l md:border-[color:var(--color-rule)] md:pl-12"
                  : undefined
              }
            >
              {renderColumn(t("latestPosts"), latestPosts)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LatestWritingSection;
