import { spotifySearchUrl } from "@/lib/music/links";
import type { NowPlaying, Profile, Track } from "@/lib/music/types";

const API_KEY = import.meta.env.WXT_LASTFM_API_KEY;
const API_URL = "https://ws.audioscrobbler.com/2.0/";

export class LastfmError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = "LastfmError";
    this.code = code;
  }
}

type ErrorBody = { error?: number; message?: string } | null;

async function lastfmFetch<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    ...params,
    api_key: API_KEY,
    format: "json",
  }).toString();

  const response = await fetch(url);
  const body = (await response.json().catch(() => null)) as ErrorBody;
  if (body?.error) {
    throw new LastfmError(body.message || "An error occurred", body.error);
  }
  if (!response.ok) {
    throw new LastfmError(
      `An error occurred: ${response.status}`,
      response.status,
    );
  }
  return body as T;
}

const PLACEHOLDER_IMAGE = "2a96cbd8b46e442fc41c2b86b821562f";

type LastfmImage = { size: string; "#text": string };

type LastfmTrack = {
  name: string;
  url: string;
  artist: { "#text": string };
  album: { "#text": string };
  image: LastfmImage[];
  "@attr"?: { nowplaying?: string };
};

type RecentTracksResponse = {
  recenttracks: { track: LastfmTrack[] | LastfmTrack };
};

type UserInfoResponse = {
  user: { name: string; realname: string; url: string; image: LastfmImage[] };
};

function imageUrl(images: LastfmImage[], size: string) {
  const url = images.find((image) => image.size === "extralarge")?.["#text"];
  if (!url || url.includes(PLACEHOLDER_IMAGE)) return null;
  return url.replace("/300x300/", `/${size}/`);
}

function trackList(data: RecentTracksResponse) {
  const tracks = data.recenttracks.track;
  return Array.isArray(tracks) ? tracks : [tracks];
}

function toTrack(item: LastfmTrack): Track {
  const artist = item.artist["#text"];
  return {
    id: item.url,
    title: item.name,
    artist,
    album: item.album["#text"],
    coverUrl: imageUrl(item.image, "770x0"),
    thumbUrl: imageUrl(item.image, "174s"),
    url: spotifySearchUrl(artist, item.name),
    via: { name: "Last.fm", url: item.url },
  };
}

export async function getNowPlaying(
  username: string,
): Promise<NowPlaying | null> {
  const data = await lastfmFetch<RecentTracksResponse>({
    method: "user.getrecenttracks",
    user: username,
    limit: "1",
  });
  const latest = trackList(data)[0];
  if (latest?.["@attr"]?.nowplaying !== "true") return null;

  const now = Date.now();
  return {
    ...toTrack(latest),
    isPlaying: true,
    timing: null,
    updatedAt: now,
    changedAt: now,
  };
}

export async function getRecentTracks(username: string): Promise<Track[]> {
  const data = await lastfmFetch<RecentTracksResponse>({
    method: "user.getrecenttracks",
    user: username,
    limit: "20",
  });

  const seen = new Set<string>();
  return trackList(data)
    .filter((item) => item["@attr"]?.nowplaying !== "true")
    .map(toTrack)
    .filter((track) => {
      if (seen.has(track.id)) return false;
      seen.add(track.id);
      return true;
    })
    .slice(0, 5);
}

export async function getUserInfo(username: string): Promise<Profile> {
  const { user } = await lastfmFetch<UserInfoResponse>({
    method: "user.getinfo",
    user: username,
  });
  return {
    name: user.realname.trim() || user.name,
    avatarUrl: imageUrl(user.image, "174s") ?? undefined,
    url: user.url,
  };
}
