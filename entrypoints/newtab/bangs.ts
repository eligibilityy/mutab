export interface Bang {
  trigger: string;
  name: string;
  url: string;
}

export const BANGS: Bang[] = [
  {
    trigger: "!g",
    name: "Google",
    url: "https://www.google.com/search?q={q}",
  },
  {
    trigger: "!yt",
    name: "YouTube",
    url: "https://www.youtube.com/results?search_query={q}",
  },
  {
    trigger: "!sp",
    name: "Spotify",
    url: "https://open.spotify.com/search/{q}",
  },
  { trigger: "!gh", name: "GitHub", url: "https://github.com/search?q={q}" },
];

export function parseBang(text: string) {
  if (!text.startsWith("!")) return null;

  const spaceIndex = text.indexOf(" ");
  const trigger = spaceIndex === -1 ? text : text.slice(0, spaceIndex);
  const query = spaceIndex === -1 ? "" : text.slice(spaceIndex + 1).trim();

  const bang = BANGS.find((b) => b.trigger === trigger.toLowerCase());
  return bang ? { bang, query } : null;
}
