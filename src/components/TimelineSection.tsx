import { getTranslations } from "next-intl/server";

type TimelineEvent = {
  year: string;
  title: string;
  description: string;
  icon?: string;
};

const locationByIndex: Array<"china" | "japan" | undefined> = [
  "china", "japan", "china", "japan", "china", "japan", "japan",
];

const TimelineSection = async () => {
  const t = await getTranslations("about");
  const locationsT = await getTranslations("locations");

  const events = (t.raw("timelineEvents") as TimelineEvent[]).map(
    (event, index) => ({
      ...event,
      location: locationByIndex[index],
      special:
        event.icon === "rocket" ||
        event.icon === "university" ||
        event.icon === "graduation",
    }),
  );

  return (
    <div className="relative mt-20">
      <h3 className="headline-italic text-3xl sm:text-4xl text-[color:var(--color-ink)] mb-10">
        {t("timeline")}
      </h3>

      <ol className="divide-y divide-[color:var(--color-rule-soft)]">
        {events.map((event, index) => (
          <li
            key={index}
            className="grid grid-cols-[5rem_1fr] sm:grid-cols-[8rem_1fr] gap-4 sm:gap-10 py-6"
          >
            <div>
              <p className="meta text-[color:var(--color-ink)]">{event.year}</p>
              {event.location && (
                <p className="meta mt-1 opacity-70">
                  {locationsT(event.location)}
                </p>
              )}
            </div>
            <div>
              <h4
                className={`text-lg sm:text-xl mb-1 leading-tight ${
                  event.special
                    ? "text-[color:var(--color-teal-ink)]"
                    : "text-[color:var(--color-ink)]"
                }`}
              >
                {event.title}
              </h4>
              <p className="text-[color:var(--color-ink-soft)] leading-relaxed max-w-prose">
                {event.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default TimelineSection;
