import type { CSSProperties } from "react";
import type { Track } from "./api";

export function RecentlyPlayed({ tracks }: { tracks: Track[] }) {
  if (tracks.length === 0) return null;
  return (
    <section className="recent" aria-label="Recently played">
      <h2 className="recent-heading">Recently played</h2>
      <ul className="recent-list">
        {tracks.map((track, index) => (
          <li key={track.id}>
            <a
              href={track.url}
              className="recent-item"
              title={`${track.title} · ${track.artist}`}
              style={{ "--index": index } as CSSProperties}
            >
              {track.thumbUrl && (
                <img src={track.thumbUrl} alt="" className="recent-cover" />
              )}
              <span className="recent-title">{track.title}</span>
              <span className="recent-artist">{track.artist}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
