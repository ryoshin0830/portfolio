import { getTranslations } from "next-intl/server";

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
    <section id="projects" className="section section--soft">
      <div className="section__inner">
        <header className="mb-16">
          <h2 className="display display--xl mb-6">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl mb-3">
            {t("subtitle")}
          </p>
          <p className="text-sm text-[color:var(--color-ink-muted)] max-w-2xl">
            {t("intro")}
          </p>
        </header>

        <div className="space-y-20 md:space-y-28">
          {projects.map((p, i) => (
            <article key={i}>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                {p.title}
              </h3>
              <p className="prose-body text-[color:var(--color-ink-soft)] max-w-3xl mb-10">
                {p.description}
              </p>

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
