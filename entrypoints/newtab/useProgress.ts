import type { NowPlaying, Timing } from "@/lib/music/types";

const TICK_MS = 1000;

export function useProgress(track: NowPlaying, timing: Timing) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!track.isPlaying) return;
    const intervalId = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(intervalId);
  }, [track.isPlaying]);

  if (!track.isPlaying) return timing.progressMs;

  const elapsed = Math.max(0, now - track.updatedAt);
  return Math.min(timing.durationMs, timing.progressMs + elapsed);
}
