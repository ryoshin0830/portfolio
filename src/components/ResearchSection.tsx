import { getTranslations } from "next-intl/server";

type Publication = {
  authors: string;
  year: number;
  title: string;
  venue: string;
  volume?: string;
  pages?: string;
  doi?: string;
  link?: string;
  type: "journal" | "conference";
};

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

const ResearchSection = async () => {
  const t = await getTranslations("research");
  const pubT = await getTranslations("publications");

  const peerReviewed = t.raw("peerReviewedList") as PeerReviewedListItem[];
  const conferencePresentations = t.raw(
    "conferencePresentationsList",
  ) as ConferenceListItem[];

  const publications: Publication[] = [
    ...peerReviewed.map((item) => ({
      authors: item.authors,
      year: Number(item.year),
      title: item.title,
      venue: item.journal,
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
      venue: item.conference,
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
    <section id="research" className="py-24 bg-[color:var(--color-paper)]">
      <div className="container mx-auto px-6 sm:px-10 max-w-5xl">
        <header className="mb-12">
          <p className="meta">
            {t("academicResearch")}
            <span aria-hidden="true" className="mx-2 opacity-60">·</span>
            {t("publications")}
          </p>
          <h2 className="headline-italic text-3xl sm:text-4xl text-[color:var(--color-ink)] mt-2 leading-tight max-w-3xl">
            {t("title")} &mdash; {t("subtitle")}
          </h2>
        </header>

        <ol className="divide-y divide-[color:var(--color-rule-soft)]">
          {publications.map((pub, index) => {
            const num = String(index + 1).padStart(2, "0");
            return (
              <li
                key={index}
                className="grid grid-cols-[3rem_1fr] sm:grid-cols-[5rem_1fr] gap-4 sm:gap-8 py-6"
              >
                <div>
                  <p className="meta">{num}</p>
                  <p className="meta mt-1 text-[color:var(--color-ink)]">
                    {pub.year}
                  </p>
                  <p className="meta mt-1 opacity-70">
                    {pub.type === "journal"
                      ? t("peerReviewedPapers")
                      : t("conferencePresentations")}
                  </p>
                </div>
                <div className="pl-2 sm:pl-0">
                  <p className="text-[color:var(--color-ink)] leading-[1.6]">
                    <span className="text-[color:var(--color-ink-soft)]">
                      {pub.authors}
                    </span>
                    .{" "}
                    <span className="text-[color:var(--color-ink)]">
                      {pub.title}
                    </span>
                    .{" "}
                    <span className="headline-italic text-[color:var(--color-ink)]">
                      {pub.venue}
                    </span>
                    {pub.volume && `, ${pub.volume}`}
                    {pub.pages && `, pp. ${pub.pages}`}.
                  </p>
                  {(pub.doi || pub.link) && (
                    <p className="meta mt-2">
                      {pub.doi && (
                        <a
                          href={pub.doi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[color:var(--color-teal-ink)] hover:underline underline-offset-2 mr-4"
                        >
                          {t("doi")}
                        </a>
                      )}
                      {pub.link && (
                        <a
                          href={pub.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[color:var(--color-teal-ink)] hover:underline underline-offset-2"
                        >
                          {pubT("viewPaper")} ↗
                        </a>
                      )}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default ResearchSection;
