import type { Browser } from "wxt/browser";

export function useSpotifyWatcher() {
  useEffect(() => {
    let port: Browser.runtime.Port | null = null;
    let retryId: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    function connect() {
      if (stopped || port || document.visibilityState !== "visible") return;
      port = browser.runtime.connect({ name: "spotify-watch" });
      port.onDisconnect.addListener(() => {
        port = null;
        retryId = setTimeout(connect, 1000);
      });
    }

    function disconnect() {
      port?.disconnect();
      port = null;
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") connect();
      else disconnect();
    }

    connect();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      clearTimeout(retryId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      disconnect();
    };
  }, []);
}
