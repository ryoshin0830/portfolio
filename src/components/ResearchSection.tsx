"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ExternalLink } from "lucide-react";

type PeerReviewedListItem = {
  authors: string;
  year: string | number;
  title: string;
  journal: string;
  volume?: string;
  pages?: string;
  doi?: string;
  link?: string;
};

type ConferenceListItem = {
  authors: string;
  year: string | number;
  title: string;
  conference: string;
  link?: string;
};

type BookListItem = {
  authors: string;
  year: string | number;
  title: string;
  publisher: string;
  role?: string;
  isbn?: string;
  printIsbn?: string;
  link?: string;
};

type Publication = {
  authors: string;
  year: number;
  title: string;
  journal: string;
  volume?: string;
  pages?: string;
  doi?: string;
  link?: string;
  type: "journal" | "conference";
};

const ResearchSection = () => {
  const t = useTranslations("research");
  const tBadges = useTranslations("badges");
  const pubT = useTranslations("publications");
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  const peerReviewed = t.raw("peerReviewedList") as PeerReviewedListItem[];
  const conferencePresentations = t.raw("conferencePresentationsList") as ConferenceListItem[];
  const booksRaw = t.raw("booksList") as BookListItem[] | undefined;

  const books = (booksRaw ?? [])
    .map((b) => ({ ...b, year: Number(b.year) }))
    .filter((b) => Number.isFinite(b.year))
    .sort((a, b) => b.year - a.year);

  const publications: Publication[] = [
    ...peerReviewed.map((item) => ({
      authors: item.authors,
      year: Number(item.year),
      title: item.title,
      journal: item.journal,
      volume: item.volume,
      pages: item.pages,
      doi: item.doi,
      link: item.link,
      type: "journal" as const,
    })),
    ...conferencePresentations.map((item) => ({
      authors: item.authors,
      year: Number(item.year),
      title: item.title,
      journal: item.conference,
      link: item.link,
      type: "conference" as const,
    })),
  ]
    .filter((p) => Number.isFinite(p.year))
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (a.type !== b.type) return a.type === "journal" ? -1 : 1;
      return 0;
    });

  return (
    <section
      id="research"
      ref={ref}
      className="section section--rule"
    >
      <div className="section__inner">
        {/* Editorial section header */}
        <header className="border-b border-[color:var(--color-rule)] pb-6 mb-12">
          <div className="kicker mb-3">{tBadges("academicResearch")}</div>
          <h2 className="display display--xl">{t("title")}</h2>
          <p className="mt-4 max-w-2xl text-base text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
        </header>

        {/* Books */}
        {books.length > 0 && (
          <m.section
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <div className="kicker mb-4">{t("books")}</div>
            <ol className="border-t border-[color:var(--color-rule-soft)]">
              {books.map((book, i) => (
                <li
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-[6rem_1fr] gap-2 md:gap-12 border-b border-[color:var(--color-rule-soft)] py-6"
                >
                  <div>
                    <span className="font-mono num text-[15px] text-[color:var(--color-amber-mark)] tracking-wider">
                      {book.year}
                    </span>
                    {book.role && (
                      <div className="kicker mt-1">{t(book.role)}</div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-serif italic text-xl text-[color:var(--color-ink)] leading-tight mb-1">
                      {book.title}
                    </h4>
                    <p className="text-sm text-[color:var(--color-ink-soft)] mb-1">
                      {book.authors}
                    </p>
                    <p className="text-sm italic text-[color:var(--color-ink-soft)]">
                      {book.publisher}
                    </p>
                    {(book.isbn || book.printIsbn) && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[color:var(--color-ink-soft)] font-mono">
                        {book.isbn && (
                          <span>
                            <span className="uppercase tracking-[0.12em] mr-1">
                              {t("ebookIsbn")}:
                            </span>
                            {book.isbn}
                          </span>
                        )}
                        {book.printIsbn && (
                          <span>
                            <span className="uppercase tracking-[0.12em] mr-1">
                              {t("printIsbn")}:
                            </span>
                            {book.printIsbn}
                          </span>
                        )}
                      </div>
                    )}
                    {book.link && (
                      <a
                        href={book.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-edit mt-3 inline-flex items-center gap-1 text-sm font-mono uppercase tracking-[0.12em] text-[color:var(--color-amber-mark)] hover:underline underline-offset-4"
                      >
                        {t("viewOnSpringer")} <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </m.section>
        )}

        {/* Publications */}
        <m.section
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="kicker mb-4">{t("publications")}</div>
          <ol className="border-t border-[color:var(--color-rule-soft)]">
            {publications.map((p, i) => (
              <li
                key={i}
                className="grid grid-cols-1 md:grid-cols-[6rem_1fr] gap-2 md:gap-12 border-b border-[color:var(--color-rule-soft)] py-5"
              >
                <div>
                  <span className="font-mono num text-[15px] text-[color:var(--color-amber-mark)] tracking-wider">
                    {p.year}
                  </span>
                  <div className="kicker mt-1">
                    {p.type === "journal"
                      ? t("peerReviewedPapers")
                      : t("conferencePresentations")}
                  </div>
                </div>
                <div>
                  <h4 className="font-serif italic text-lg text-[color:var(--color-ink)] leading-tight mb-1">
                    {p.title}
                  </h4>
                  <p className="text-sm text-[color:var(--color-ink-soft)] mb-1">
                    {p.authors}
                  </p>
                  <p className="text-sm italic text-[color:var(--color-ink-soft)]">
                    {p.journal}
                    {p.volume && `, ${p.volume}`}
                    {p.pages && `, pp. ${p.pages}`}
                  </p>
                  {(p.doi || p.link) && (
                    <div className="mt-2 flex gap-4">
                      {p.doi && (
                        <a
                          href={p.doi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="focus-edit text-xs font-mono uppercase tracking-[0.12em] text-[color:var(--color-teal-ink)] hover:underline underline-offset-4"
                        >
                          {t("doi")}
                        </a>
                      )}
                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="focus-edit text-xs font-mono uppercase tracking-[0.12em] text-[color:var(--color-teal-ink)] hover:underline underline-offset-4 inline-flex items-center gap-1"
                        >
                          {pubT("viewPaper")} <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </m.section>
      </div>
    </section>
  );
};

export default ResearchSection;
