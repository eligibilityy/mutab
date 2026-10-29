import { parseUrl } from "./url";

export type QuickLink = {
  id: string;
  title: string;
  url: string;
};

export type LinkDraft = {
  title: string;
  url: string;
};

export const MAX_QUICK_LINKS = 5;

export const quickLinksItem = storage.defineItem<QuickLink[]>(
  "sync:quickLinks",
  { fallback: [] },
);

type LinkResult =
  | { ok: true; links: QuickLink[] }
  | { ok: false; error: string };

const INVALID_URL = "Enter a valid web address.";

function cleanDraft(draft: LinkDraft) {
  const url = parseUrl(draft.url.trim());
  if (!url) return null;
  return { title: draft.title.trim(), url: url.href };
}

export function addLink(links: QuickLink[], draft: LinkDraft): LinkResult {
  if (links.length >= MAX_QUICK_LINKS) {
    return { ok: false, error: `You can add up to ${MAX_QUICK_LINKS} links.` };
  }
  const clean = cleanDraft(draft);
  if (!clean) return { ok: false, error: INVALID_URL };

  return { ok: true, links: [...links, { id: crypto.randomUUID(), ...clean }] };
}

export function updateLink(
  links: QuickLink[],
  id: string,
  draft: LinkDraft,
): LinkResult {
  const clean = cleanDraft(draft);
  if (!clean) return { ok: false, error: INVALID_URL };

  return {
    ok: true,
    links: links.map((link) => (link.id === id ? { ...link, ...clean } : link)),
  };
}

export function removeLink(links: QuickLink[], id: string) {
  return links.filter((link) => link.id !== id);
}

export function moveLink(links: QuickLink[], id: string, direction: -1 | 1) {
  const from = links.findIndex((link) => link.id === id);
  const to = from + direction;
  // Out-of-range indexes (including a missing id) read as undefined
  const moving = links[from];
  const other = links[to];
  if (!moving || !other) return links;

  const next = [...links];
  next[from] = other;
  next[to] = moving;
  return next;
}

export function hostnameOf(link: QuickLink) {
  return new URL(link.url).hostname.replace(/^www\./, "");
}

export function displayTitle(link: QuickLink) {
  return link.title || hostnameOf(link);
}
