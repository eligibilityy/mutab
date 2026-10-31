import { authItem } from "@/lib/spotify/auth";
import { spotifySource } from "@/lib/spotify/source";
import { lastfmSource, lastfmUserItem } from "@/lib/lastfm/source";
import type { MusicSource } from "./source";
import { clearMusicState } from "./store";

export async function activeSource(): Promise<MusicSource> {
  return (await lastfmUserItem.getValue()) ? lastfmSource : spotifySource;
}

export async function signOut() {
  await Promise.all([authItem.removeValue(), lastfmUserItem.removeValue()]);
  await clearMusicState();
}
