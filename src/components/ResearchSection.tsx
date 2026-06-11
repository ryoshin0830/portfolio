"use client";

import { useTranslations } from "next-intl";
import { LuExternalLink as ExternalLink } from "react-icons/lu";

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

function PublicationItem({
  publication: p,
  doiLabel,
  viewLabel,
}: {
  publication: Publication;
  doiLabel: string;
  viewLabel: string;
}) {
  return (
    <li className="grid grid-cols-1 md:grid-cols-[6rem_1fr] gap-3 md:gap-12">
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
                {doiLabel}
              </a>
            )}
            {p.link && (
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="link-accent text-sm"
              >
                {viewLabel}
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

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

  const byYearDesc = (a: Publication, b: Publication) => b.year - a.year;
  const journalPubs: Publication[] = peerReviewed
    .map((item) => ({
      authors: item.authors,
      year: Number(item.year),
      title: item.title,
      journal: item.journal,
      volume: item.volume,
      pages: item.pages,
      doi: item.doi,
      link: item.link,
      type: "journal" as const,
    }))
    .filter((p) => Number.isFinite(p.year))
    .sort(byYearDesc);
  const conferencePubs: Publication[] = conferencePresentations
    .map((item) => ({
      authors: item.authors,
      year: Number(item.year),
      title: item.title,
      journal: item.conference,
      link: item.link,
      type: "conference" as const,
    }))
    .filter((p) => Number.isFinite(p.year))
    .sort(byYearDesc);

  return (
    <section id="research" className="section section--soft">
      <div className="section__inner">
        <header className="mb-12 md:mb-16">
          <h2 className="display display--lg mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        {books.length > 0 && (
          <div className="mb-20">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-10">
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
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-10">
            {t("peerReviewedPapers")}
          </h3>
          <ol className="space-y-10">
            {journalPubs.map((p, i) => (
              <PublicationItem
                key={i}
                publication={p}
                doiLabel={t("doi")}
                viewLabel={pubT("viewPaper")}
              />
            ))}
          </ol>
        </div>

        {conferencePubs.length > 0 && (
          <div className="mt-20">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-10">
              {t("conferencePresentations")}
            </h3>
            <ol className="space-y-10">
              {conferencePubs.map((p, i) => (
                <PublicationItem
                  key={i}
                  publication={p}
                  doiLabel={t("doi")}
                  viewLabel={pubT("viewPaper")}
                />
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResearchSection;
