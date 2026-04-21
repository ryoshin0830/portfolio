import { getTranslations } from "next-intl/server";

const ProjectsSection = async () => {
  const t = await getTranslations("projects");
  const tBadges = await getTranslations("badges");

  const projectsList = t.raw("projectsList") as Array<{
    title: string;
    description: string;
    technologies: string[];
    features: string[];
  }>;

  return (
    <section id="projects" className="section section--rule">
      <div className="section__inner">
        {/* Editorial section header */}
        <header className="border-b border-[color:var(--color-rule)] pb-6 mb-12">
          <div className="kicker mb-3">{tBadges("featuredProjects")}</div>
          <h2 className="display display--xl">{t("title")}</h2>
          <p className="mt-4 max-w-2xl text-base text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
          <p className="mt-3 text-sm text-[color:var(--color-ink-soft)] italic max-w-2xl">
            {t("intro")}
          </p>
        </header>

        {/* Projects — 1-column editorial list with case-row pattern */}
        <div className="border-t border-[color:var(--color-rule)]">
          {projectsList.map((p, i) => (
            <article
              key={i}
              className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-4 md:gap-12 border-b border-[color:var(--color-rule-soft)] py-10"
            >
              <div>
                <div className="kicker num mb-2">№ {String(i + 1).padStart(2, "0")}</div>
                <span className="tag-mono">Personal</span>
              </div>

              <div>
                <h3 className="font-serif italic text-2xl md:text-3xl leading-tight mb-3 text-[color:var(--color-ink)]">
                  {p.title}
                </h3>
                <p className="text-base leading-relaxed text-[color:var(--color-ink-soft)] mb-6 max-w-[68ch]">
                  {p.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div>
                    <div className="kicker mb-2">{t("mainFeatures")}</div>
                    <ul className="space-y-1.5 text-sm text-[color:var(--color-ink)]">
                      {p.features.map((f, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="text-[color:var(--color-amber-mark)]">·</span>
                          <span className="leading-relaxed">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="kicker mb-2">{t("techStack")}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.technologies.map((tech) => (
                        <span key={tech} className="tag-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
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
