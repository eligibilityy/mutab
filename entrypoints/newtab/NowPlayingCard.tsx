import type { NowPlaying } from "./spotify/api";

export function NowPlayingCard({ track }: { track: NowPlaying }) {
  return (
    <a href={track.url} className="now-playing">
      {track.coverUrl && (
        <img
          src={track.coverUrl}
          alt={`${track.album} cover`}
          className="cover"
        />
      )}
      <div className="track-title">{track.title}</div>
      <div className="track-artist">{track.artist}</div>
    </a>
  );
}
