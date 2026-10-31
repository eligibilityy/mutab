import type { NowPlaying, Profile, Track } from "../music/types";
import { expireAccessToken, getAccessToken } from "./auth";
import { AccessRevokedError, SpotifyError } from "./errors";

type ProfileResponse = {
  display_name: string;
  images?: { url: string }[];
};

type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  external_urls: { spotify: string };
  duration_ms: number;
};

type CurrentlyPlayingResponse = {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number | null;
  timestamp: number;
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

async function spotifyFetch<T>(
  path: string,
  retried = false,
): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 204) return null;

  if (response.status === 401 && !retried) {
    await expireAccessToken();
    return spotifyFetch<T>(path, true);
  }
  if (response.status === 401) throw new AccessRevokedError();
  if (response.status === 403) {
    throw new AccessRevokedError(
      "This account isn't on the allowlist. Please double check with the developer.",
      403,
    );
  }
  if (response.status === 429) {
    const seconds = Number(response.headers.get("Retry-After")) || 30;
    throw new SpotifyError("Rate limited by Spotify", 429, seconds * 1000);
  }
  if (!response.ok) {
    throw new SpotifyError(
      `Spotify ${path} failed: ${response.status}`,
      response.status,
    );
  }
  return (await response.json()) as T;
}

export async function getCurrentlyPlaying(): Promise<NowPlaying | null> {
  const data = await spotifyFetch<CurrentlyPlayingResponse>(
    "/me/player/currently-playing",
  );
  if (!data?.item) return null;
  return {
    ...toTrack(data.item),
    isPlaying: data.is_playing,
    progressMs: data.progress_ms ?? 0,
    durationMs: data.item.duration_ms,
    updatedAt: Date.now(),
    changedAt: data.timestamp,
  };
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

export async function getProfile(): Promise<Profile | null> {
  const data = await spotifyFetch<ProfileResponse>("/me");
  if (!data) return null;
  return { name: data.display_name, avatarUrl: data.images?.[0]?.url };
}
