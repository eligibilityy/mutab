export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string | null;
  thumbUrl: string | null;
  url: string;
};

export type Timing = {
  progressMs: number;
  durationMs: number;
};

export type NowPlaying = Track & {
  isPlaying: boolean;
  timing: Timing | null;
  updatedAt: number;
  changedAt: number;
};

export type Profile = {
  name: string;
  avatarUrl?: string;
};
