import { recentItem } from "@/lib/spotify/store";
import { Background } from "./Background";
import { Clock } from "./Clock";
import { NowPlayingCard } from "./NowPlayingCard";
import { RecentlyPlayed } from "./RecentlyPlayed";
import { SearchBar } from "./SearchBar";
import { SpotifyStatus } from "./SpotifyStatus";
import { useNowPlaying } from "./useNowPlaying";
import { useSpotifyWatcher } from "./useSpotifyWatcher";
import { useStorageValue } from "./useStorageValue";

function App() {
  useSpotifyWatcher();
  const nowPlaying = useNowPlaying();
  const recent = useStorageValue(recentItem) ?? [];

  if (nowPlaying === undefined) return null;

  const hasTrack = nowPlaying !== null;
  const playing = nowPlaying?.isPlaying === true;

  return (
    <>
      <Background
        visible={hasTrack}
        coverUrl={nowPlaying?.coverUrl ?? null}
        animate={playing}
      />
      <main className={`layout ${hasTrack ? "is-playing" : "is-idle"}`}>
        <SpotifyStatus />
        <div className="spacer-outer" />
        <Clock compact={hasTrack} />
        <div className="spacer-center">
          {nowPlaying && <NowPlayingCard track={nowPlaying} />}
        </div>
        <SearchBar />
        {!hasTrack && <RecentlyPlayed tracks={recent} />}
        <div className="spacer-outer" />
      </main>
    </>
  );
}

export default App;
