import { getProfile } from "@/lib/spotify/api";
import { login, logout } from "@/lib/spotify/auth";
import { profileItem, signOutReasonItem } from "@/lib/music/store";
import { useStorageValue } from "./useStorageValue";
import { Menu } from "@base-ui/react/menu";
import { Ellipsis, LoaderCircle, LogOut, Settings } from "lucide-react";
import { SettingsDialog } from "./SettingsDialog";

const STEP_LABELS = {
  opening: "Opening Spotify...",
  finishing: "Finishing up...",
} as const;

const AUTH_FLOW_BUSY = "only one web auth flow";

function isAuthFlowBusy(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes(AUTH_FLOW_BUSY)
  );
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("did not approve")) return undefined;
  if (isAuthFlowBusy(error)) {
    return "Spotify is already open in another tab. Please finish the login there.";
  }
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function handleLogin() {
    setStep("opening");
    setError(undefined);
    try {
      await signOutReasonItem.removeValue();
      await login(() => setStep("finishing"));
      await profileItem.setValue(await getProfile());
    } catch (error) {
      if (!isAuthFlowBusy(error)) await logout();
      setError(friendlyError(error));
    } finally {
      setStep(null);
    }
  }

  if (profile === undefined) return null;
  const connecting = step !== null;

  return (
    <div className="spotify-status" aria-live="polite">
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <div className="flex items-center gap-2">
        {!profile && (
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

        <Menu.Root>
          <Menu.Trigger className="account-trigger">
            {profile ? (
              <>
                {profile.avatarUrl && (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="avatar rounded-full size-6"
                  />
                )}
                <span>{profile.name}</span>
              </>
            ) : (
              <Ellipsis className="size-4" aria-label="Menu" />
            )}
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align="end" sideOffset={8}>
              <Menu.Popup className="menu-popup">
                <Menu.Item
                  className="menu-item"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="size-4" aria-hidden="true" />
                  Settings
                </Menu.Item>
                {profile && (
                  <>
                    <Menu.Separator className="menu-separator" />
                    <Menu.Item className="menu-item" onClick={logout}>
                      <LogOut className="size-4" aria-hidden="true" />
                      Log out
                    </Menu.Item>
                  </>
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>
      {!profile && (error ?? signOutReason) && (
        <p className="status-error" role="alert">
          {error ?? signOutReason}
        </p>
      )}
    </div>
  );
}
