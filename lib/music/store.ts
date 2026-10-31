import type { NowPlaying, Profile, Track } from "./types";

export const profileItem = storage.defineItem<Profile>("local:spotifyProfile");
export const signOutReasonItem = storage.defineItem<string>(
  "local:signOutReason",
);

export const nowPlayingItem =
  storage.defineItem<NowPlaying>("local:nowPlaying");
export const recentItem = storage.defineItem<Track[]>("local:recentlyPlayed", {
  fallback: [],
});

export async function clearMusicState() {
  await Promise.all([
    profileItem.removeValue(),
    nowPlayingItem.removeValue(),
    recentItem.removeValue(),
  ]);
}
