import type { Browser } from "wxt/browser";
import { authItem } from "@/lib/spotify/auth";
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
import type { MusicSource } from "@/lib/music/source";
import { activeSource, signOut } from "@/lib/music/account";
import { LastfmError } from "@/lib/lastfm/api";
import { lastfmUserItem } from "@/lib/lastfm/source";

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
  let source: MusicSource = spotifySource;
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
    source = await activeSource();
    let delay = source.pollMs;

    try {
      await sync();
      failures = 0;
    } catch (error) {
      if (error instanceof AccessRevokedError) {
        await signOut();
        await signOutReasonItem.setValue(error.message);
      } else if (error instanceof LastfmError && error.code === 6) {
        await signOut();
        await signOutReasonItem.setValue(
          "That Last.fm user no longer exists. Please connect again.",
        );
      } else {
        delay = backoffDelay(error);
        blockedUntil = Date.now() + delay;
        console.warn(
          `${source.name} sync failed, retrying in ${delay / 1000}s:`,
          error,
        );
      }
    } finally {
      busy = false;
    }

    schedule(delay);
  }

  function onSourceChange() {
    recentStale = true;
    failures = 0;
    blockedUntil = 0;
    poll();
  }

  authItem.watch((auth, previous) => {
    if (Boolean(auth) !== Boolean(previous)) onSourceChange();
  });
  lastfmUserItem.watch(onSourceChange);

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
