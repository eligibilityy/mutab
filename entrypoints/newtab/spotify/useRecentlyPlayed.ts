import { getRecentlyPlayed, type Track } from "./api";

export function useRecentlyPlayed(active: boolean) {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (!active) return;
    let ignore = false;

    getRecentlyPlayed()
      .then((next) => {
        if (!ignore) setTracks(next);
      })
      .catch((error) => console.error("Recently played failed:", error));

    return () => {
      ignore = true;
    };
  }, [active]);

  return tracks;
}
