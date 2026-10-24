import { getAccessToken } from "./auth";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string | null;
  thumbUrl: string | null;
  url: string;
  uri: string;
};

export type NowPlaying = Track & { isPlaying: boolean };

type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  external_urls: { spotify: string };
};

type CurrentlyPlayingResponse = {
  is_playing: boolean;
  item: SpotifyTrack | null;
};

type RecentlyPlayedResponse = {
  items: { track: SpotifyTrack; played_at: string }[];
};

function toTrack(item: SpotifyTrack): Track {
  const images = item.album.images;
  return {
    id: item.id,
    title: item.name,
    artist: item.artists.map((a) => a.name).join(", "),
    album: item.album.name,
    coverUrl: images[0]?.url ?? null,
    thumbUrl: images[1]?.url ?? images[0]?.url ?? null,
    url: item.external_urls.spotify,
    uri: item.uri,
  };
}

async function spotifyFetch<T>(path: string): Promise<T | null> {
  const token = await getAccessToken();

  if (!token) return null;

  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 204) return null;
  if (!response.ok) {
    throw new Error(`Spotify ${path} failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getCurrentlyPlaying(): Promise<NowPlaying | null> {
  const data = await spotifyFetch<CurrentlyPlayingResponse>(
    "/me/player/currently-playing",
  );
  if (!data?.item) return null;
  return { ...toTrack(data.item), isPlaying: data.is_playing };
}

export async function getRecentlyPlayed(): Promise<Track[]> {
  const data = await spotifyFetch<RecentlyPlayedResponse>(
    "/me/player/recently-played?limit=20",
  );
  if (!data) return [];

  const seen = new Set<string>();
  return data.items
    .map((item) => item.track)
    .filter((track) => {
      if (seen.has(track.id)) return false;
      seen.add(track.id);
      return true;
    })
    .slice(0, 5)
    .map(toTrack);
}
