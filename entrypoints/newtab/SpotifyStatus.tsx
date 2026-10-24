import { LoaderCircle } from "lucide-react";
import { getProfile } from "@/lib/spotify/api";
import { login, logout } from "@/lib/spotify/auth";
import { profileItem, signOutReasonItem } from "@/lib/spotify/store";
import { useStorageValue } from "./useStorageValue";

const STEP_LABELS = {
  opening: "Opening Spotify...",
  finishing: "Finishing up...",
} as const;

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("did not approve")) return undefined;
  if (message.includes("could not be loaded")) {
    return "Couldn't reach Spotify. Please check your connection.";
  }
  return message;
}

export function SpotifyStatus() {
  const profile = useStorageValue(profileItem);
  const signOutReason = useStorageValue(signOutReasonItem);
  const [step, setStep] = useState<"opening" | "finishing" | null>(null);
  const [error, setError] = useState<string>();

  async function handleLogin() {
    setError(undefined);
    await signOutReasonItem.removeValue();
    setStep("opening");
    try {
      await login(() => setStep("finishing"));
      await profileItem.setValue(await getProfile());
    } catch (error) {
      await logout();
      setError(friendlyError(error));
    } finally {
      setStep(null);
    }
  }

  if (profile === undefined) return null;
  const connecting = step !== null;

  return (
    <div className="spotify-status" aria-live="polite">
      {profile ? (
        <div className="account">
          <div className="flex flex-row items-center gap-2">
            {profile.avatarUrl && (
              <img
                src={profile.avatarUrl}
                alt=""
                className="avatar rounded-full size-6"
              />
            )}
            <span>{profile.name}</span>
          </div>
          <button onClick={logout} className="logout">
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
          {step ? STEP_LABELS[step] : "Connect Spotify"}
        </button>
      )}
      {!profile && (error ?? signOutReason) && (
        <p className="status-error" role="alert">
          {error ?? signOutReason}
        </p>
      )}
    </div>
  );
}
