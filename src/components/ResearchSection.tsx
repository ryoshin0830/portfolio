"use client";

import { useTranslations } from "next-intl";
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
  const pubT = useTranslations("publications");

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
    <section id="research" className="section">
      <div className="section__inner">
        <header className="mb-20">
          <h2 className="display display--xl mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        {books.length > 0 && (
          <div className="mb-24">
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">
              {t("books")}
            </h3>
            <ol className="space-y-10">
              {books.map((book, i) => (
                <li
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-[6rem_1fr] gap-3 md:gap-12"
                >
                  <span className="num text-base font-semibold text-[color:var(--color-accent)]">
                    {book.year}
                  </span>
                  <div>
                    <h4 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug mb-2">
                      {book.title}
                    </h4>
                    <p className="text-base text-[color:var(--color-ink-soft)] mb-1">
                      {book.authors}
                    </p>
                    <p className="text-base text-[color:var(--color-ink-soft)]">
                      {book.publisher}
                      {book.role && ` · ${t(book.role)}`}
                    </p>
                    {book.link && (
                      <a
                        href={book.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-accent text-sm mt-3"
                      >
                        {t("viewOnSpringer")}
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div>
          <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">
            {t("publications")}
          </h3>
          <ol className="space-y-10">
            {publications.map((p, i) => (
              <li
                key={i}
                className="grid grid-cols-1 md:grid-cols-[6rem_1fr] gap-3 md:gap-12"
              >
                <span className="num text-base font-semibold text-[color:var(--color-accent)]">
                  {p.year}
                </span>
                <div>
                  <h4 className="text-xl font-semibold tracking-tight leading-snug mb-2">
                    {p.title}
                  </h4>
                  <p className="text-base text-[color:var(--color-ink-soft)] mb-1">
                    {p.authors}
                  </p>
                  <p className="text-base text-[color:var(--color-ink-soft)]">
                    {p.journal}
                    {p.volume && `, ${p.volume}`}
                    {p.pages && `, pp. ${p.pages}`}
                  </p>
                  {(p.doi || p.link) && (
                    <div className="mt-3 flex gap-4">
                      {p.doi && (
                        <a
                          href={p.doi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-accent text-sm"
                        >
                          {t("doi")}
                        </a>
                      )}
                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-accent text-sm"
                        >
                          {pubT("viewPaper")}
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default ResearchSection;
