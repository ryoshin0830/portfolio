import { getTranslations } from "next-intl/server";
import { LuArrowUpRight as ArrowUpRight } from "react-icons/lu";

/**
 * The page's ending — a short, centered invitation before the footer.
 * Without it the 20,000px scroll used to terminate in a one-line footer
 * straight out of the activity feed. Not a nav section (no id): the #contact
 * hash opens the ContactModal, same as the hero's "all contacts" link.
 */
const ClosingCTA = async () => {
  const t = await getTranslations("contactCTA");

  return (
    <section className="section text-center">
      <div className="section__inner">
        <h2 className="display display--lg mb-5">{t("title")}</h2>
        <p className="prose-body mx-auto mb-10 max-w-2xl text-[color:var(--color-ink-soft)]">
          {t("lead")}
        </p>
        <a href="#contact" className="cta-editorial" aria-haspopup="dialog">
          {t("action")}
          <ArrowUpRight size={16} aria-hidden />
        </a>
      </div>
    </section>
  );
};

export default ClosingCTA;
