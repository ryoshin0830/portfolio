import { getTranslations } from "next-intl/server";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { SiX } from "react-icons/si";

const ContractCTA = async () => {
  const t = await getTranslations("contactCTA");
  const domains = t.raw("domains") as string[];

  return (
    <section id="contact" className="section section--soft">
      <div className="section__inner text-center">
        {/* Open-to-work signal */}
        <p className="text-sm font-medium text-[color:var(--color-accent)] mb-4 inline-flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: "var(--color-accent)" }}
            aria-hidden
          />
          {t("openToWork")}
        </p>

        <h2 className="display display--xl mb-6 text-balance max-w-3xl mx-auto">
          {t("headline")}
        </h2>
        <p className="prose-body text-[color:var(--color-ink-soft)] max-w-2xl mx-auto mb-10">
          {t("body")}
        </p>

        {/* Domain chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {domains.map((d) => (
            <span key={d} className="chip">{d}</span>
          ))}
        </div>

        <a
          href={`mailto:${t("email")}`}
          className="btn-pill text-lg px-8 py-4"
          style={{ fontSize: "1.0625rem" }}
        >
          {t("email")}
          <span aria-hidden>→</span>
        </a>

        <div className="mt-12 flex justify-center gap-4">
          <a
            href="https://github.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-soft)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] text-[color:var(--color-ink)] transition-colors"
            aria-label="GitHub"
          >
            <FaGithub size={18} />
          </a>
          <a
            href="https://x.com/ryoshin0830"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-soft)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] text-[color:var(--color-ink)] transition-colors"
            aria-label="X"
          >
            <SiX size={16} />
          </a>
          <a
            href="https://www.linkedin.com/in/ryoshin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[color:var(--color-bg)] border border-[color:var(--color-rule-soft)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] text-[color:var(--color-ink)] transition-colors"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={18} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default ContractCTA;
