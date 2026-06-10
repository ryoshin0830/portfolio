import { getTranslations } from "next-intl/server";
import SocialLinks from "./SocialLinks";

/**
 * All contact methods (locale-ordered icon grid with QR dialogs), at the end
 * of the page. Moved out of the hero: the hero keeps only the three primary
 * channels and anchors here via #contact.
 */
const ContactSection = async () => {
  const t = await getTranslations("contact");

  return (
    <section id="contact" className="section section--soft">
      <div className="section__inner text-center">
        <header className="mb-12">
          <h2 className="display display--lg mb-4">{t("title")}</h2>
          <p className="prose-body text-[color:var(--color-ink-soft)]">
            {t("subtitle")}
          </p>
        </header>
        <SocialLinks />
      </div>
    </section>
  );
};

export default ContactSection;
