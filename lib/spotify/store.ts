import type { NowPlaying, Profile, Track } from "./api";

export const profileItem = storage.defineItem<Profile>("local:spotifyProfile");
export const nowPlayingItem =
  storage.defineItem<NowPlaying>("local:nowPlaying");
export const recentItem = storage.defineItem<Track[]>("local:recentlyPlayed", {
  fallback: [],
});

export async function clearSpotifyState() {
  await Promise.all([
    profileItem.removeValue(),
    nowPlayingItem.removeValue(),
    recentItem.removeValue(),
  ]);
}
