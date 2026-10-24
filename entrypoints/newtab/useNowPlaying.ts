import type { NowPlaying } from "@/lib/spotify/api";
import { nowPlayingItem } from "@/lib/spotify/store";

const STABLE_MS = 5 * 60_000;

export function useNowPlaying() {
  const [track, setTrack] = useState<NowPlaying | null | undefined>(undefined);

  useEffect(() => {
    let ignore = false;
    nowPlayingItem.getValue().then((cached) => {
      if (ignore) return;
      const fresh = cached && Date.now() - cached.updatedAt < STABLE_MS;
      setTrack(fresh ? cached : null);
    });
    const unwatch = nowPlayingItem.watch((next) => setTrack(next));

    return () => {
      ignore = true;
      unwatch();
    };
  }, []);

  return track;
}
