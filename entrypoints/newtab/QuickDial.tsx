import { Popover } from "@base-ui/react/popover";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useId, type SubmitEvent } from "react";
import {
  addLink,
  displayTitle,
  hostnameOf,
  MAX_QUICK_LINKS,
  moveLink,
  quickLinksItem,
  removeLink,
  updateLink,
  type LinkDraft,
  type QuickLink,
} from "@/lib/quickLinks";
import { faviconUrl } from "./bangs";
import { useMeasuredHeight } from "./useMeasure";
import { useStorageValue } from "./useStorageValue";

// Same curve as --ease-out in style.css, so CSS and Motion feel alike
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// Springs keep their velocity when interrupted, so switching modes mid-resize
// carries on smoothly instead of restarting. No bounce: fluid, not wobbly.
const SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;
const FADE = { duration: 0.2, ease: EASE_OUT } as const;
const EMPTY_DRAFT: LinkDraft = { title: "", url: "" };

// Content swaps blur out while the container resizes, then the new content
// blurs in, so the two never visibly overlap as hard edges.
function useSwapAnimation() {
  const reduceMotion = useReducedMotion();
  const hidden = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.97, filter: "blur(4px)" };

  return {
    initial: hidden,
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: hidden,
    transition: FADE,
  };
}

type Mode = "view" | "edit";

function save(links: QuickLink[]) {
  quickLinksItem
    .setValue(links)
    .catch((error) => console.error("Failed to save quick links:", error));
}

export function QuickDial() {
  const links = useStorageValue(quickLinksItem);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("view");
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleOpenChange(
    next: boolean,
    details: Popover.Root.ChangeEventDetails,
  ) {
    // Esc steps back one level (row edit → edit mode → view) before closing
    if (!next && details.reason === "escape-key" && mode === "edit") {
      details.cancel();
      if (editingId) setEditingId(null);
      else setMode("view");
      return;
    }
    setOpen(next);
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    // Reset only after the exit animation, so the content doesn't swap mid-fade
    if (!isOpen) {
      setMode("view");
      setEditingId(null);
    }
  }

  if (links === undefined) return null;

  return (
    <div className="quick-dial">
      <Popover.Root
        open={open}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
      >
        <Popover.Trigger className="quick-dial-trigger">
          <LayoutGrid className="quick-dial-icon size-4" aria-hidden="true" />
          <span>Quick dial</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner align="start" sideOffset={8}>
            <Popover.Popup className="quick-dial-popup" aria-label="Quick dial">
              <MotionConfig reducedMotion="user">
                <QuickDialPanel
                  links={links}
                  mode={mode}
                  editingId={editingId}
                  onModeChange={setMode}
                  onEditingChange={setEditingId}
                />
              </MotionConfig>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

type PanelProps = {
  links: QuickLink[];
  mode: Mode;
  editingId: string | null;
  onModeChange: (mode: Mode) => void;
  onEditingChange: (id: string | null) => void;
};

function QuickDialPanel({
  links,
  mode,
  editingId,
  onModeChange,
  onEditingChange,
}: PanelProps) {
  const [contentRef, height] = useMeasuredHeight<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const swap = useSwapAnimation();

  return (
    <motion.div
      className="quick-dial-body"
      initial={false}
      animate={{ height: height > 0 ? height : "auto" }}
      transition={reduceMotion ? { duration: 0 } : SPRING}
    >
      <div ref={contentRef} className="quick-dial-content">
        {/* popLayout takes the outgoing mode out of the flow, so the measured
            height is already the new mode's while the old one fades away */}
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div key={mode} className="quick-dial-swap" {...swap}>
            {mode === "view" ? (
              <ViewMode links={links} onEdit={() => onModeChange("edit")} />
            ) : (
              <EditMode
                links={links}
                editingId={editingId}
                onEditingChange={onEditingChange}
                onDone={() => onModeChange("view")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Favicon({ link }: { link: QuickLink }) {
  return (
    <img src={faviconUrl(link.url)} alt="" className="size-4 shrink-0" />
  );
}

function ViewMode({
  links,
  onEdit,
}: {
  links: QuickLink[];
  onEdit: () => void;
}) {
  return (
    <>
      {links.length > 0 ? (
        <ul className="quick-dial-links">
          {links.map((link) => (
            <li key={link.id}>
              <a href={link.url} className="quick-dial-link">
                <Favicon link={link} />
                <span className="truncate">{displayTitle(link)}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="quick-dial-empty">No links yet</p>
      )}
      <div className="quick-dial-separator" />
      <button type="button" className="quick-dial-link" onClick={onEdit}>
        {links.length > 0 ? (
          <>
            <Pencil className="size-4" aria-hidden="true" />
            Edit links
          </>
        ) : (
          <>
            <Plus className="size-4" aria-hidden="true" />
            Add a link
          </>
        )}
      </button>
    </>
  );
}

type EditModeProps = {
  links: QuickLink[];
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  onDone: () => void;
};

function EditMode({
  links,
  editingId,
  onEditingChange,
  onDone,
}: EditModeProps) {
  const full = links.length >= MAX_QUICK_LINKS;
  const swap = useSwapAnimation();

  function handleAdd(draft: LinkDraft) {
    const result = addLink(links, draft);
    if (!result.ok) return result.error;
    save(result.links);
  }

  function handleUpdate(id: string, draft: LinkDraft) {
    const result = updateLink(links, id, draft);
    if (!result.ok) return result.error;
    save(result.links);
    onEditingChange(null);
  }

  return (
    <>
      <div className="quick-dial-header">
        <Popover.Title className="quick-dial-title">Quick dial</Popover.Title>
        <span className="quick-dial-count">
          {links.length} / {MAX_QUICK_LINKS}
        </span>
      </div>

      <ul className="quick-dial-rows">
        <AnimatePresence initial={false} mode="popLayout">
          {links.map((link, index) => (
            // layout="position": rows only slide. Full `layout` would also
            // animate size by scaling, squashing the text when a row
            // swaps to its edit form.
            <motion.li
              key={link.id}
              layout="position"
              {...swap}
              transition={{ ...FADE, layout: SPRING }}
              className="quick-dial-row"
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={editingId === link.id ? "form" : "row"}
                  className="quick-dial-swap"
                  {...swap}
                >
                  {editingId === link.id ? (
                    <LinkForm
                      initial={{ title: link.title, url: link.url }}
                      submitLabel="Save"
                      onSubmit={(draft) => handleUpdate(link.id, draft)}
                      onCancel={() => onEditingChange(null)}
                    />
                  ) : (
                    <LinkRow
                      link={link}
                      first={index === 0}
                      last={index === links.length - 1}
                      onMove={(direction) =>
                        save(moveLink(links, link.id, direction))
                      }
                      onEdit={() => onEditingChange(link.id)}
                      onRemove={() => {
                        if (editingId === link.id) onEditingChange(null);
                        save(removeLink(links, link.id));
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="quick-dial-separator" />
      {full ? (
        <p className="quick-dial-note">
          You've reached {MAX_QUICK_LINKS} links. Remove one to add another.
        </p>
      ) : (
        <LinkForm
          initial={EMPTY_DRAFT}
          submitLabel="Add"
          resetOnSubmit
          autoFocus={links.length === 0}
          onSubmit={handleAdd}
        />
      )}

      <div className="quick-dial-footer">
        <button type="button" className="quick-dial-button" onClick={onDone}>
          Done
        </button>
      </div>
    </>
  );
}

type LinkRowProps = {
  link: QuickLink;
  first: boolean;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onRemove: () => void;
};

function LinkRow({
  link,
  first,
  last,
  onMove,
  onEdit,
  onRemove,
}: LinkRowProps) {
  const name = displayTitle(link);

  return (
    <div className="quick-dial-row-view">
      <Favicon link={link} />
      <div className="min-w-0 flex-1">
        <div className="truncate">{name}</div>
        {link.title && (
          <div className="quick-dial-host truncate">{hostnameOf(link)}</div>
        )}
      </div>
      {/* aria-disabled instead of disabled: a disabled button drops focus,
          which would strand keyboard users when a row reaches the end */}
      <button
        type="button"
        className="icon-button"
        aria-label={`Move ${name} up`}
        aria-disabled={first}
        onClick={() => !first && onMove(-1)}
      >
        <ArrowUp className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={`Move ${name} down`}
        aria-disabled={last}
        onClick={() => !last && onMove(1)}
      >
        <ArrowDown className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={`Edit ${name}`}
        onClick={onEdit}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="icon-button icon-button-danger"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

type LinkFormProps = {
  initial: LinkDraft;
  submitLabel: string;
  // Returns an error message, or nothing when the link was saved
  onSubmit: (draft: LinkDraft) => string | undefined;
  onCancel?: () => void;
  resetOnSubmit?: boolean;
  autoFocus?: boolean;
};

function LinkForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  resetOnSubmit = false,
  autoFocus = false,
}: LinkFormProps) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string>();
  const urlRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = onSubmit(draft);
    setError(message);
    if (message) {
      urlRef.current?.focus();
    } else if (resetOnSubmit) {
      setDraft(EMPTY_DRAFT);
      urlRef.current?.focus();
    }
  }

  return (
    <form className="quick-dial-form" onSubmit={handleSubmit} noValidate>
      <input
        ref={urlRef}
        className="quick-dial-input"
        placeholder="Web address"
        aria-label="Web address"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        autoFocus={autoFocus || onCancel !== undefined}
        autoComplete="off"
        spellCheck={false}
        value={draft.url}
        onChange={(event) => setDraft({ ...draft, url: event.target.value })}
      />
      <input
        className="quick-dial-input"
        placeholder="Title (optional)"
        aria-label="Title (optional)"
        autoComplete="off"
        value={draft.title}
        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
      />
      {error && (
        <p id={errorId} className="quick-dial-error" role="alert">
          {error}
        </p>
      )}
      <div className="quick-dial-form-actions">
        {onCancel && (
          <button
            type="button"
            className="quick-dial-button quick-dial-button-quiet"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button type="submit" className="quick-dial-button">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
