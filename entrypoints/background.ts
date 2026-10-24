import type { Browser } from "wxt/browser";
import { authItem } from "@/lib/spotify/auth";
import {
  getCurrentlyPlaying,
  getProfile,
  getRecentlyPlayed,
} from "@/lib/spotify/api";
import {
  clearSpotifyState,
  nowPlayingItem,
  profileItem,
  recentItem,
} from "@/lib/spotify/store";

const POLL_MS = 5000;

export default defineBackground(() => {
  const watchers = new Set<Browser.runtime.Port>();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let busy = false;
  let recentStale = true;

  async function sync() {
    if (!(await authItem.getValue())) {
      await clearSpotifyState();
      return;
    }

    const previous = await nowPlayingItem.getValue();
    const nowPlaying = await getCurrentlyPlaying();
    await nowPlayingItem.setValue(nowPlaying);

    if (previous?.isPlaying && !nowPlaying?.isPlaying) recentStale = true;
    if (recentStale && !nowPlaying?.isPlaying) {
      await recentItem.setValue(await getRecentlyPlayed());
      recentStale = false;
    }

    if (!(await profileItem.getValue())) {
      await profileItem.setValue(await getProfile());
    }
  }

  async function poll() {
    if (busy) return;
    busy = true;
    clearTimeout(timeoutId);

    try {
      await sync();
    } catch (error) {
      console.error("Spotify sync failed:", error);
    } finally {
      busy = false;
    }

    if (watchers.size > 0) timeoutId = setTimeout(poll, POLL_MS);
  }

  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== "spotify-watch") return;

    watchers.add(port);
    port.onDisconnect.addListener(() => {
      watchers.delete(port);
      if (watchers.size === 0) clearTimeout(timeoutId);
    });

    recentStale = true;
    poll();
  });

  authItem.watch((auth) => {
    if (auth) {
      recentStale = true;
      poll();
    } else {
      clearSpotifyState();
    }
  });
});
