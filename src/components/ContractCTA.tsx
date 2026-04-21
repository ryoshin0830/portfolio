import { getTranslations } from "next-intl/server";
import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";
import { SiX } from "react-icons/si";
import type { ContactCTAContent } from "@/types/content";

const ContractCTA = async () => {
  const t = await getTranslations("contactCTA");
  const cta = {
    kicker: t("kicker"),
    accepting: t("accepting"),
    headline: t("headline"),
    body: t("body"),
    domains: t.raw("domains") as string[],
    emailLabel: t("emailLabel"),
    email: t("email"),
    socialLabel: t("socialLabel"),
    openToWork: t("openToWork"),
  } satisfies ContactCTAContent & { kicker: string; openToWork: string };

  return (
    <section
      id="contact"
      className="section section--rule bg-[color:var(--color-paper)]"
    >
      <div className="section__inner">
        <div className="border-b border-[color:var(--color-rule)] pb-4 mb-10 flex items-baseline justify-between flex-wrap gap-3">
          <div className="kicker">{cta.kicker}</div>
          <div className="kicker text-[color:var(--color-amber-mark)]">
            ● {cta.openToWork}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-12 items-start">
          <div>
            <p className="kicker mb-3">{cta.accepting}</p>
            <h2 className="display display--xl mb-6">{cta.headline}</h2>
            <p className="text-base leading-relaxed text-[color:var(--color-ink)] max-w-[60ch]">
              {cta.body}
            </p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {cta.domains.map((d) => (
                <li key={d}>
                  <span className="tag-mono">{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="border-l border-[color:var(--color-rule)] pl-8">
            <div className="kicker mb-3">{cta.emailLabel}</div>
            <a
              href={`mailto:${cta.email}`}
              className="focus-edit inline-flex items-center gap-2 text-base font-mono text-[color:var(--color-ink)] hover:text-[color:var(--color-amber-mark)] underline-offset-4 hover:underline"
            >
              <FaEnvelope size={14} />
              {cta.email}
            </a>

            <div className="kicker mt-8 mb-3">{cta.socialLabel}</div>
            <ul className="flex flex-wrap gap-2">
              <li>
                <a
                  href="https://github.com/ryoshin0830"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-edit inline-flex items-center justify-center w-9 h-9 border border-[color:var(--color-rule-soft)] hover:border-[color:var(--color-ink)] transition-colors text-[color:var(--color-ink)] rounded-[2px]"
                  aria-label="GitHub"
                >
                  <FaGithub size={16} />
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/ryoshin0830"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-edit inline-flex items-center justify-center w-9 h-9 border border-[color:var(--color-rule-soft)] hover:border-[color:var(--color-ink)] transition-colors text-[color:var(--color-ink)] rounded-[2px]"
                  aria-label="X"
                >
                  <SiX size={14} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/ryoshin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-edit inline-flex items-center justify-center w-9 h-9 border border-[color:var(--color-rule-soft)] hover:border-[color:var(--color-ink)] transition-colors text-[color:var(--color-ink)] rounded-[2px]"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin size={16} />
                </a>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ContractCTA;
