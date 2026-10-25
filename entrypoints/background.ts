import type { Browser } from "wxt/browser";
import { authItem, logout } from "@/lib/spotify/auth";
import { AccessRevokedError, SpotifyError } from "@/lib/spotify/errors";
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
  signOutReasonItem,
} from "@/lib/spotify/store";

const POLL_MS = 5000;
const MAX_BACKOFF_MS = 60_000;

export default defineBackground(() => {
  const watchers = new Set<Browser.runtime.Port>();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let busy = false;
  let recentStale = true;
  let failures = 0;
  let blockedUntil = 0;

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

  function schedule(delay: number) {
    clearTimeout(timeoutId);
    if (watchers.size > 0) timeoutId = setTimeout(poll, delay);
  }

  function backoffDelay(error: unknown) {
    if (error instanceof SpotifyError && error.retryAfterMs) {
      return error.retryAfterMs;
    }
    failures += 1;
    return Math.min(POLL_MS * 2 ** failures, MAX_BACKOFF_MS);
  }

  async function poll() {
    if (busy) return;

    const wait = blockedUntil - Date.now();
    if (wait > 0) return schedule(wait);

    busy = true;
    clearTimeout(timeoutId);
    let delay = POLL_MS;

    try {
      await sync();
      failures = 0;
    } catch (error) {
      if (error instanceof AccessRevokedError) {
        await logout();
        await signOutReasonItem.setValue(error.message);
      } else {
        delay = backoffDelay(error);
        blockedUntil = Date.now() + delay;
        console.warn(
          `Spotify sync failed, retrying in ${delay / 1000}s:`,
          error,
        );
      }
    } finally {
      busy = false;
    }

    schedule(delay);
  }

  authItem.watch((auth, previous) => {
    if (auth && !previous) {
      recentStale = true;
      poll();
    } else if (!auth) {
      clearSpotifyState();
    }
  });

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
});
