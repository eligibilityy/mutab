import type { MusicSource } from "@/lib/music/source";
import { getCurrentlyPlaying, getProfile, getRecentlyPlayed } from "./api";
import { authItem } from "./auth";

export const spotifySource: MusicSource = {
  pollMs: 5000,
  isConnected: async () => (await authItem.getValue()) !== null,
  getNowPlaying: getCurrentlyPlaying,
  getRecent: getRecentlyPlayed,
  getProfile,
};
