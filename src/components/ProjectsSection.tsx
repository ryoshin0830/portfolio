import { getTranslations } from "next-intl/server";
import VocabScatter from "@/components/VocabScatter";

const ProjectsSection = async () => {
  const t = await getTranslations("projects");

  const projects = t.raw("projectsList") as Array<{
    title: string;
    description: string;
    technologies: string[];
    features: string[];
  }>;

  const featuresLabel = t.raw("mainFeatures") as string;
  const stackLabel = t.raw("techStack") as string;

  return (
    <section id="projects" className="section">
      <div className="section__inner">
        <header className="mb-16">
          <p className="meta text-[color:var(--color-accent)] mb-3">{t("kicker")}</p>
          <h2 className="display display--xl mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>

        <div className="space-y-20 md:space-y-28">
          {projects.map((p, i) => (
            <article key={i}>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                {p.title}
              </h3>
              <div className="mb-10 grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1fr)_24rem] md:gap-16">
                <p className="prose-body text-[color:var(--color-ink-soft)] max-w-3xl">
                  {p.description}
                </p>
                {/* Word2Vec scatter — the embedding-space neighbourhood the
                    project computes. Anchored to the paragraph's top edge so
                    it reads as a placed figure, not a floating ornament. Only
                    the first (vocabulary) project gets it. */}
                {i === 0 && (
                  <VocabScatter className="hidden w-full md:block md:mt-1" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-3">
                    {featuresLabel}
                  </p>
                  <ul className="space-y-2 text-base text-[color:var(--color-ink)]">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="text-[color:var(--color-accent)] shrink-0">·</span>
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--color-ink-muted)] mb-3">
                    {stackLabel}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.technologies.map((tech) => (
                      <span key={tech} className="chip">{tech}</span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
