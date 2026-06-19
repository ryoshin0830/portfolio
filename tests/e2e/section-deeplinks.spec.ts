import { expect, test } from "@playwright/test";

const SECTION_IDS = [
  "about",
  "experience",
  "projects",
  "research",
  "skills",
  "scheduling",
  "blog",
] as const;

test.describe("section deep links", () => {
  for (const sectionId of SECTION_IDS) {
    test(`/${sectionId} lands with #${sectionId} at the top of the viewport`, async ({
      page,
    }) => {
      await page.goto(`/ja/${sectionId}`, { waitUntil: "networkidle" });

      await expect
        .poll(async () => {
          return page.evaluate((id) => {
            const target = document.getElementById(id);
            const top = target?.getBoundingClientRect().top ?? Number.NaN;
            const activeSection = document
              .elementFromPoint(window.innerWidth / 2, 120)
              ?.closest("section")?.id;

            return {
              activeSection,
              hash: window.location.hash,
              pathname: window.location.pathname,
              top,
              topWithinTolerance: Math.abs(top) <= 1,
            };
          }, sectionId);
        })
        .toMatchObject({
          activeSection: sectionId,
          hash: "",
          pathname: `/ja/${sectionId}`,
          topWithinTolerance: true,
        });
    });
  }
});
