import { getCurrentlyPlaying, type NowPlaying } from "./api";

export function useNowPlaying(intervalMs = 5000) {
  const [track, setTrack] = useState<NowPlaying | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let stopped = false;
    let busy = false;

    async function poll() {
      if (busy) return;
      busy = true;
      clearTimeout(timeoutId);

      try {
        if (document.visibilityState === "visible") {
          const next = await getCurrentlyPlaying();
          if (!stopped) setTrack(next);
        }
      } catch (error) {
        console.error("Now playing failed:", error);
      } finally {
        busy = false;
      }

      if (!stopped) timeoutId = setTimeout(poll, intervalMs);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") poll();
    }

    poll();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs]);

  return track;
}
