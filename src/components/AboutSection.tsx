import { getLocale, getTranslations } from "next-intl/server";
import TimelineSection from "./TimelineSection";

const AboutSection = async () => {
  const locale = await getLocale();
  const t = await getTranslations("about");
  const skillsT = await getTranslations("skills");

  const fields = t.raw("fields") as string[];
  const isLatin = locale === "en";

  return (
    <section id="about" className="py-24 bg-[color:var(--color-paper)]">
      <div className="container mx-auto px-6 sm:px-10 max-w-5xl">
        <header className="mb-12">
          <p className="meta mb-3">{t("title")}</p>
        </header>

        <div className="max-w-3xl">
          <p
            className={`${isLatin ? "dropcap" : ""} text-lg sm:text-xl leading-[1.75] text-[color:var(--color-ink)]`}
          >
            {t("subtitle")}
          </p>
        </div>

        <dl className="mt-16 grid gap-6 sm:grid-cols-[10rem_1fr] sm:gap-10 divide-y sm:divide-y-0 divide-[color:var(--color-rule-soft)]">
          <dt className="meta pt-6 sm:pt-0">{t("education")}</dt>
          <dd className="pt-2 sm:pt-0">
            <p className="text-lg text-[color:var(--color-ink)]">
              {t("kyotoUniversity")}
            </p>
            <p className="meta mt-1 opacity-80">{skillsT("jobTitle")}</p>
          </dd>

          <dt className="meta pt-6 sm:pt-0">{t("teaching")}</dt>
          <dd className="pt-2 sm:pt-0">
            <p className="text-lg text-[color:var(--color-ink)]">
              {t("japaneseTeacher")}
            </p>
            <p className="meta mt-1 opacity-80">
              {skillsT("yearsExperience", { years: "7" })}
            </p>
          </dd>

          <dt className="meta pt-6 sm:pt-0">{t("specialization")}</dt>
          <dd className="pt-2 sm:pt-0 text-[color:var(--color-ink)] leading-relaxed">
            {fields.join(" · ")}
          </dd>
        </dl>

        <TimelineSection />
      </div>
    </section>
  );
};

export default AboutSection;
