import { useState } from "react";
import { Clock } from "./Clock";
import { SearchBar } from "./SearchBar";
import { SpotifyStatus } from "./SpotifyStatus";

function App() {
  const [playing, setPlaying] = useState(false);

  return (
    <main className={`layout ${playing ? "is-playing" : "is-idle"}`}>
      <SpotifyStatus />
      <div className="spacer-outer" />
      <Clock compact={playing} />
      <div className="spacer-center">
        {playing && <div className="cover-placeholder" />}
      </div>
      <SearchBar />
      <div className="spacer-outer" />

      {import.meta.env.DEV && (
        <button
          onClick={() => setPlaying((p) => !p)}
          className="fixed right-4 bottom-4 rounded-lg bg-black/30 px-3 py-2 text-sm"
        >
          Toggle playing
        </button>
      )}
    </main>
  );
}

export default App;
