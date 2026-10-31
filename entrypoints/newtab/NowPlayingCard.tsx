import type { NowPlaying, Timing } from "@/lib/music/types";
import { useProgress } from "./useProgress";

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function ProgressBar({ track, timing }: { track: NowPlaying; timing: Timing }) {
  const progressMs = useProgress(track, timing);
  const fraction = timing.durationMs > 0 ? progressMs / timing.durationMs : 0;

  return (
    <>
      <div
        className="progress"
        role="progressbar"
        aria-label="Track progress"
        aria-valuemin={0}
        aria-valuemax={timing.durationMs}
        aria-valuenow={progressMs}
        aria-valuetext={`${formatTime(progressMs)} of ${formatTime(timing.durationMs)}`}
      >
        <div
          className="progress-fill"
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
      <div className="progress-times">
        <span>{formatTime(progressMs)}</span>
        <span>{formatTime(timing.durationMs)}</span>
      </div>
    </>
  );
}

export function NowPlayingCard({ track }: { track: NowPlaying }) {
  return (
    <div className={`now-playing ${track.isPlaying ? "" : "is-paused"}`}>
      <a href={track.url} className="now-playing-link">
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
      {track.timing && (
        <ProgressBar key={track.id} track={track} timing={track.timing} />
      )}
      {track.via && (
        <a href={track.via.url} className="via-link">
          via {track.via.name}
        </a>
      )}
    </div>
  );
}
