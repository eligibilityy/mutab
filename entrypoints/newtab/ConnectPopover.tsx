import { Popover } from "@base-ui/react/popover";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import { useId, type SubmitEvent } from "react";
import { getUserInfo, LastfmError } from "@/lib/lastfm/api";
import { lastfmUserItem } from "@/lib/lastfm/source";
import { profileItem, signOutReasonItem } from "@/lib/music/store";
import { AnimatedHeight, useSwapAnimation } from "./motion";

type View = "choose" | "lastfm";

type ConnectPopoverProps = {
  // Set while a Spotify login is in progress, e.g. "Opening Spotify..."
  busyLabel: string | null;
  onSpotify: () => void;
};

export function ConnectPopover({ busyLabel, onSpotify }: ConnectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("choose");
  const swap = useSwapAnimation();
  const busy = busyLabel !== null;

  function handleOpenChange(
    next: boolean,
    details: Popover.Root.ChangeEventDetails,
  ) {
    // Esc in the Last.fm form goes back to the choice instead of closing
    if (!next && details.reason === "escape-key" && view === "lastfm") {
      details.cancel();
      setView("choose");
      return;
    }
    setOpen(next);
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    // Reset only after the exit animation, so the content doesn't swap mid-fade
    if (!isOpen) setView("choose");
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <Popover.Trigger
        className="connect-button"
        disabled={busy}
        aria-busy={busy}
      >
        {busy && (
          <LoaderCircle
            className="size-3.5 animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]"
            aria-hidden="true"
          />
        )}
        {busyLabel ?? "Connect"}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8}>
          <Popover.Popup
            className="connect-popup"
            aria-label="Connect an account"
          >
            <AnimatedHeight className="popup-content">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div key={view} className="swap" {...swap}>
                  {view === "choose" ? (
                    <>
                      <button
                        type="button"
                        className="quick-dial-link"
                        onClick={() => {
                          // Spotify opens its own login window; don't leave
                          // this popover hanging open behind it
                          setOpen(false);
                          onSpotify();
                        }}
                      >
                        <span className="service-dot service-dot-spotify" />
                        Spotify
                      </button>
                      <button
                        type="button"
                        className="quick-dial-link"
                        onClick={() => setView("lastfm")}
                      >
                        <span className="service-dot service-dot-lastfm" />
                        Last.fm
                      </button>
                    </>
                  ) : (
                    <LastfmForm onBack={() => setView("choose")} />
                  )}
                </motion.div>
              </AnimatePresence>
            </AnimatedHeight>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function LastfmForm({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string>();
  const errorId = useId();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = name.trim();
    if (!username || checking) return;

    setChecking(true);
    setError(undefined);
    try {
      // Checking the name first means a typo is never saved and polled
      const profile = await getUserInfo(username);
      await signOutReasonItem.removeValue();
      // Username before profile: while logged out the background clears
      // state every poll, so a lone profile could be wiped in between
      await lastfmUserItem.setValue(username);
      await profileItem.setValue(profile);
      // Saving the profile logs in, which unmounts this popover; nothing to close
    } catch (error) {
      setError(
        error instanceof LastfmError && error.code === 6
          ? "No Last.fm user with that name."
          : "Couldn't reach Last.fm. Please try again.",
      );
      setChecking(false);
    }
  }

  return (
    <form className="connect-form" onSubmit={handleSubmit} noValidate>
      <div className="connect-form-header">
        <button
          type="button"
          className="icon-button"
          aria-label="Back"
          onClick={onBack}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        Last.fm
      </div>
      <input
        className="quick-dial-input"
        placeholder="Username"
        aria-label="Last.fm username"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      {error && (
        <p id={errorId} className="quick-dial-error" role="alert">
          {error}
        </p>
      )}
      <div className="quick-dial-form-actions">
        <button type="submit" className="quick-dial-button" disabled={checking}>
          {checking ? "Checking…" : "Connect"}
        </button>
      </div>
    </form>
  );
}
