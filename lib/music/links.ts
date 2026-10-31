const NOISY_SUFFIX =
  /\s+-\s+.*\b(?:remaster(?:ed)?|version|explicit|live|edit|mix|mono|stereo)\b.*$/i;
const NOISY_BRACKETS =
  /\s*[([][^)\]]*\b(?:feat\.?|ft\.?|remaster(?:ed)?|explicit|version|live)[^)\]]*[)\]]/gi;

function searchTitle(title: string) {
  return (
    title.replace(NOISY_BRACKETS, "").replace(NOISY_SUFFIX, "").trim() || title
  );
}

export function spotifySearchUrl(artist: string, title: string) {
  const query = `${artist} ${searchTitle(title)}`;
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}
