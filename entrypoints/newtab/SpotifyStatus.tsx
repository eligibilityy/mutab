import { LoaderCircle } from "lucide-react";
import { getAccessToken, login, logout } from "./spotify/auth";

type Status =
  | { kind: "checking" }
  | { kind: "signed-out"; error?: string }
  | { kind: "connecting"; step: "opening" | "finishing" }
  | { kind: "signed-in"; name: string };

const STEP_LABELS = {
  opening: "Opening Spotify...",
  finishing: "Finishing up...",
} as const;

async function fetchProfileName() {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 403) {
    throw new Error(
      "This account isn't on the allowlist. Please double check with the developer.",
    );
  }
  if (!response.ok) {
    throw new Error(`Couldn't load your profile (${response.status}).`);
  }
  const profile: { display_name: string } = await response.json();
  return profile.display_name;
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("did not approve")) return undefined;
  if (message.includes("could not be loaded")) {
    return "Couldn't reach Spotify. Please check your connection.";
  }
  return message;
}

export function SpotifyStatus() {
  const [status, setStatus] = useState<Status>({ kind: "checking" });

  useEffect(() => {
    let ignore = false;
    fetchProfileName()
      .then((name) => {
        if (ignore) return;
        setStatus(name ? { kind: "signed-in", name } : { kind: "signed-out" });
      })
      .catch((error) => {
        if (!ignore)
          setStatus({ kind: "signed-out", error: friendlyError(error) });
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleLogin() {
    setStatus({ kind: "connecting", step: "opening" });
    try {
      await login(() => setStatus({ kind: "connecting", step: "finishing" }));
      const name = await fetchProfileName();
      setStatus(name ? { kind: "signed-in", name } : { kind: "signed-out" });
    } catch (error) {
      setStatus({ kind: "signed-out", error: friendlyError(error) });
    }
  }

  async function handleLogout() {
    await logout();
    setStatus({ kind: "signed-out" });
  }

  if (status.kind === "checking") return null;
  const connecting = status.kind === "connecting";

  return (
    <div className="spotify-status" aria-live="polite">
      {status.kind === "signed-in" ? (
        <div className="account">
          <span>{status.name}</span>
          <button onClick={handleLogout} className="logout">
            Log out
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          disabled={connecting}
          aria-busy={connecting}
          className="connect-button cursor-pointer"
        >
          {connecting && (
            <LoaderCircle
              className="size-3.5 animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]"
              aria-hidden="true"
            />
          )}
          {connecting ? STEP_LABELS[status.step] : "Connect Spotify"}
        </button>
      )}
      {status.kind === "signed-out" && status.error && (
        <p className="status-error" role="alert">
          {status.error}
        </p>
      )}
    </div>
  );
}
