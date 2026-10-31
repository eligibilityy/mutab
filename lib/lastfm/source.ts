import type { MusicSource } from "@/lib/music/source";
import { getNowPlaying, getRecentTracks, getUserInfo } from "./api";

export const lastfmUserItem = storage.defineItem<string>("local:lastfmUser");

async function username() {
  const user = await lastfmUserItem.getValue();
  if (!user) throw new Error("No Last.fm user connected");
  return user;
}

export const lastfmSource: MusicSource = {
  name: "Last.fm",
  pollMs: 15_000,
  isConnected: async () => (await lastfmUserItem.getValue()) !== null,
  getNowPlaying: async () => getNowPlaying(await username()),
  getRecent: async () => getRecentTracks(await username()),
  getProfile: async () => getUserInfo(await username()),
};
