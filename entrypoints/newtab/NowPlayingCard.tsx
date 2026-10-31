import type { NowPlaying } from "@/lib/music/types";
import { useProgress } from "./useProgress";

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function NowPlayingCard({ track }: { track: NowPlaying }) {
  const progressMs = useProgress(track);
  const fraction = track.durationMs > 0 ? progressMs / track.durationMs : 0;

  return (
    <a
      href={track.url}
      className={`now-playing ${track.isPlaying ? "" : "is-paused"}`}
    >
      {track.coverUrl && (
        <img
          src={track.coverUrl}
          alt={`${track.album} cover`}
          className="cover"
        />
      )}
      <div className="track-title">{track.title}</div>
      <div className="track-artist">{track.artist}</div>
      <div
        key={track.id}
        className="progress"
        role="progressbar"
        aria-label="Track progress"
        aria-valuemin={0}
        aria-valuemax={track.durationMs}
        aria-valuenow={progressMs}
        aria-valuetext={`${formatTime(progressMs)} of ${formatTime(track.durationMs)}`}
      >
        <div
          className="progress-fill"
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
      <div className="progress-times">
        <span>{formatTime(progressMs)}</span>
        <span>{formatTime(track.durationMs)}</span>
      </div>
    </a>
  );
}
