export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string | null;
  thumbUrl: string | null;
  url: string;
  uri: string;
};

export type NowPlaying = Track & {
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  updatedAt: number;
  changedAt: number;
};

export type Profile = {
  name: string;
  avatarUrl?: string;
};
