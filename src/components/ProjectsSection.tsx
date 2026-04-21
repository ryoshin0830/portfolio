import { getTranslations } from "next-intl/server";

const ProjectsSection = async () => {
  const t = await getTranslations("projects");

  const projects = t.raw("projectsList") as Array<{
    title: string;
    description: string;
    technologies: string[];
    features: string[];
  }>;

  return (
    <section id="projects" className="section section--soft">
      <div className="section__inner">
        <header className="mb-20">
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
              <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl mb-6">
                {p.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {p.technologies.slice(0, 6).map((tech) => (
                  <span key={tech} className="chip">
                    {tech}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
