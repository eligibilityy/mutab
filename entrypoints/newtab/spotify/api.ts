import { getAccessToken } from "./auth";

export type NowPlaying = {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string | null;
  url: string;
  isPlaying: boolean;
};

type CurrentlyPlayingResponse = {
  is_playing: boolean;
  item: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
    external_urls: { spotify: string };
  } | null;
};

async function spotifyFetch<T>(path: string): Promise<T | null> {
  const token = await getAccessToken();

  if (!token) return null;

  const response = await fetch(`https://api.spotify.com/v1/${path}`, {
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

  const { item } = data;
  return {
    id: item.id,
    title: item.name,
    artist: item.artists.map((a) => a.name).join(", "),
    album: item.album.name,
    coverUrl: item.album.images[0]?.url || null,
    url: item.external_urls.spotify,
    isPlaying: data.is_playing,
  };
}
