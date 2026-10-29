export const showRecentItem = storage.defineItem<boolean>("sync:showRecent", {
  fallback: true,
});

export type ClockFormat = "12h" | "24h";

const hourCycle = Intl.DateTimeFormat(undefined, {
  hour: "numeric",
}).resolvedOptions().hourCycle;

export const clockFormatItem = storage.defineItem<ClockFormat>(
  "sync:clockFormat",
  { fallback: hourCycle === "h11" || hourCycle === "h12" ? "12h" : "24h" },
);

export const showDateItem = storage.defineItem<boolean>("sync:showDate", {
  fallback: true,
});

export const animateBackgroundItem = storage.defineItem<boolean>(
  "sync:animateBackground",
  {
    fallback: true,
  },
);
