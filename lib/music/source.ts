import type { NowPlaying, Profile, Track } from "./types";

export interface MusicSource {
  pollMs: number;
  isConnected(): Promise<boolean>;
  getNowPlaying(): Promise<NowPlaying | null>;
  getRecent(): Promise<Track[]>;
  getProfile(): Promise<Profile | null>;
}
