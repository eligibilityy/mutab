import { Clock } from "./Clock";
import { SearchBar } from "./SearchBar";
import { SpotifyStatus } from "./SpotifyStatus";

import { NowPlayingCard } from "./NowPlayingCard";
import { useNowPlaying } from "./spotify/useNowPlaying";
import { Background } from "./Background";

function App() {
  const nowPlaying = useNowPlaying();
  const playing = nowPlaying?.isPlaying === true;

  return (
    <>
      <Background coverUrl={nowPlaying?.coverUrl ?? null} active={playing} />
      <main className={`layout ${playing ? "is-playing" : "is-idle"}`}>
        <SpotifyStatus />
        <div className="spacer-outer" />
        <Clock compact={playing} />
        <div className="spacer-center">
          {nowPlaying?.isPlaying && <NowPlayingCard track={nowPlaying} />}
        </div>
        <SearchBar />
        <div className="spacer-outer" />
      </main>
    </>
  );
}

export default App;
