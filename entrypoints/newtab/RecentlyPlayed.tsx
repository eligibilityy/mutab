import type { CSSProperties } from "react";
import { profileItem } from "@/lib/music/store";
import type { Track } from "@/lib/music/types";
import { useStorageValue } from "./useStorageValue";

export function RecentlyPlayed({ tracks }: { tracks: Track[] }) {
  const profile = useStorageValue(profileItem);

  if (tracks.length === 0) return null;
  const via = tracks[0]?.via;

  return (
    <section className="recent" aria-label="Recently played">
      <div className="recent-header">
        <h2 className="recent-heading">Recently played</h2>
        {via && profile?.url && (
          <a href={profile.url} className="via-link">
            via {via.name}
          </a>
        )}
      </div>
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
