import type { Browser } from "wxt/browser";
import { authItem, logout } from "@/lib/spotify/auth";
import { AccessRevokedError, SpotifyError } from "@/lib/spotify/errors";
import {
  clearMusicState,
  nowPlayingItem,
  profileItem,
  recentItem,
  signOutReasonItem,
} from "@/lib/music/store";
import type { NowPlaying } from "@/lib/music/types";
import { spotifySource } from "@/lib/spotify/source";

const PAUSE_TIMEOUT_MS = 10 * 60_000;
const MAX_BACKOFF_MS = 60_000;

function isLongPaused(nowPlaying: NowPlaying | null) {
  return (
    nowPlaying !== null &&
    !nowPlaying.isPlaying &&
    Date.now() - nowPlaying.changedAt > PAUSE_TIMEOUT_MS
  );
}

export default defineBackground(() => {
  const source = spotifySource;
  const watchers = new Set<Browser.runtime.Port>();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let busy = false;
  let recentStale = true;
  let failures = 0;
  let blockedUntil = 0;

  async function sync() {
    if (!(await source.isConnected())) {
      await clearMusicState();
      return;
    }

    const previous = await nowPlayingItem.getValue();
    const fetched = await source.getNowPlaying();
    const nowPlaying = isLongPaused(fetched) ? null : fetched;
    await nowPlayingItem.setValue(nowPlaying);

    if (previous?.isPlaying && !nowPlaying?.isPlaying) recentStale = true;
    if (recentStale && !nowPlaying?.isPlaying) {
      await recentItem.setValue(await source.getRecent());
      recentStale = false;
    }

    if (!(await profileItem.getValue())) {
      await profileItem.setValue(await source.getProfile());
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
    return Math.min(source.pollMs * 2 ** failures, MAX_BACKOFF_MS);
  }

  async function poll() {
    if (busy) return;

    const wait = blockedUntil - Date.now();
    if (wait > 0) return schedule(wait);

    busy = true;
    clearTimeout(timeoutId);
    let delay = source.pollMs;

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
      clearMusicState();
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
