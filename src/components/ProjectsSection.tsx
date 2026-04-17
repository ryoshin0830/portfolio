import { getTranslations } from "next-intl/server";

type ProjectStatus = "ongoing" | "active" | "completed";

type ProjectMeta = {
  id: string;
  status: ProjectStatus;
  period: { startYear: string; endYear?: string };
};

const projectMeta: ProjectMeta[] = [
  { id: "sokudoku-gorilla", status: "ongoing", period: { startYear: "2025" } },
  { id: "nichiu-nichigo", status: "completed", period: { startYear: "2022", endYear: "2023" } },
  { id: "matsunoha", status: "active", period: { startYear: "2023", endYear: "2024" } },
  { id: "lands-english", status: "completed", period: { startYear: "2021", endYear: "2022" } },
  { id: "llm-research", status: "ongoing", period: { startYear: "2023" } },
  { id: "llm-vocab-difficulty", status: "active", period: { startYear: "2024" } },
  { id: "edu-llm", status: "ongoing", period: { startYear: "2024" } },
  { id: "vocab-question-gen", status: "active", period: { startYear: "2024" } },
];

const ProjectsSection = async () => {
  const t = await getTranslations("projects");
  const tDates = await getTranslations("dates");
  const tStatus = await getTranslations("status");

  const projectsList = t.raw("projectsList") as Array<{
    title: string;
    description: string;
    technologies: string[];
    features: string[];
  }>;

  const leadership = t.raw("leadership") as {
    title: string;
    description: string;
    skills: string[];
  };

  const projects = projectsList.map((project, index) => {
    const meta = projectMeta[index];
    if (!meta) {
      return { ...project, id: `project-${index + 1}`, status: null as ProjectStatus | null, period: null as string | null };
    }
    const period =
      meta.status === "ongoing"
        ? tDates("yearToPresent", { year: meta.period.startYear })
        : tDates("yearRange", {
            start: meta.period.startYear,
            end: meta.period.endYear ?? meta.period.startYear,
          });
    return { ...project, id: meta.id, status: meta.status, period };
  });

  return (
    <section id="projects" className="py-24 bg-[color:var(--color-paper)]">
      <div className="container mx-auto px-6 sm:px-10 max-w-5xl">
        <header className="mb-12">
          <p className="meta">{t("title")} · 2021 —</p>
        </header>

        <blockquote className="border-l border-[color:var(--color-teal-ink)] pl-6 my-16 max-w-3xl">
          <p className="headline-italic text-xl sm:text-2xl text-[color:var(--color-ink)] leading-[1.35]">
            &ldquo;{leadership.description}&rdquo;
          </p>
          <footer className="meta mt-3">
            {leadership.title}
            {leadership.skills.length > 0 && (
              <>
                <span aria-hidden="true" className="mx-2 opacity-60">·</span>
                <span>{leadership.skills.join(" · ")}</span>
              </>
            )}
          </footer>
        </blockquote>

        <ol className="divide-y divide-[color:var(--color-rule-soft)]">
          {projects.map((project, index) => {
            const ord = String(index + 1).padStart(2, "0");
            return (
              <li
                key={project.id}
                className="grid grid-cols-[auto_1fr] sm:grid-cols-[7rem_1fr] gap-6 sm:gap-10 py-10"
              >
                <div>
                  <p className="headline-italic text-5xl sm:text-6xl text-[color:var(--color-ink)] leading-none">
                    {ord}
                  </p>
                  {project.period && (
                    <p className="meta mt-2">{project.period}</p>
                  )}
                  {project.status && (
                    <p
                      className={`meta mt-1 ${
                        project.status === "ongoing"
                          ? "text-[color:var(--color-teal-ink)]"
                          : "text-[color:var(--color-ink-soft)]"
                      }`}
                    >
                      {tStatus(project.status)}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl text-[color:var(--color-ink)] mb-3 leading-tight">
                    {project.title}
                  </h3>
                  <p className="text-base sm:text-lg text-[color:var(--color-ink)] leading-[1.65] mb-5 max-w-prose">
                    {project.description}
                  </p>

                  {project.features.length > 0 && (
                    <ul className="space-y-1 mb-5 text-[color:var(--color-ink-soft)] leading-relaxed max-w-prose">
                      {project.features.map((feature, i) => (
                        <li key={i} className="flex gap-3">
                          <span aria-hidden="true" className="text-[color:var(--color-teal-ink)]">&mdash;</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="meta text-[color:var(--color-ink-soft)]">
                    {t("techStack")}
                    <span aria-hidden="true" className="mx-2 opacity-60">·</span>
                    <span className="text-[color:var(--color-ink)]">
                      {project.technologies.join(" · ")}
                    </span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default ProjectsSection;
