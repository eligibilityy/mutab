import {
  useState,
  type SubmitEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { faviconUrl, parseBang, BANGS, type Bang } from "./bangs";
import { fetchSuggestions } from "./suggest";

type Suggestion = { kind: "bang"; bang: Bang } | { kind: "web"; text: string };

function parseUrl(text: string): URL | null {
  const hasProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(text);

  const isDomain =
    /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(
      text,
    );
  const isLocalhost = /^localhost(?::\d+)?(?:\/|$)/i.test(text);
  const isIpAddress = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/|$)/.test(text);

  if (!hasProtocol && !isDomain && !isLocalhost && !isIpAddress) {
    return null;
  }

  try {
    const url = new URL(
      hasProtocol
        ? text
        : isLocalhost || isIpAddress
          ? `http://${text}`
          : `https://${text}`,
    );

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function suggestionQuery(text: string) {
  const bangMatch = parseBang(text);
  if (bangMatch) return bangMatch.query;
  return text.startsWith("!") ? "" : text;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [webSuggestions, setWebSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const typing = document.activeElement === inputRef.current;
      if (
        (event.ctrlKey && event.key === "k") ||
        (event.key === "/" && !typing)
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const searchText = suggestionQuery(query.trim());
    if (!searchText) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchSuggestions(searchText, controller.signal)
        .then(setWebSuggestions)
        .catch((error) => {
          if (error.name !== "AbortError")
            console.error("Suggestions failed:", error);
        });
    }, 150);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const activeBang = parseBang(query)?.bang;

  const bangSuggestions =
    query.startsWith("!") && !query.includes(" ")
      ? BANGS.filter((bang) =>
          bang.trigger.startsWith(query.toLowerCase()),
        ).slice(0, 5)
      : [];

  const text = query.trim();
  const showWeb = suggestionQuery(text) !== "";

  const suggestions: Suggestion[] =
    bangSuggestions.length > 0
      ? bangSuggestions.map((bang) => ({ kind: "bang" as const, bang }))
      : showWeb
        ? webSuggestions.map((text) => ({ kind: "web" as const, text }))
        : [];

  const showSuggestions = focused && suggestions.length > 0;

  const highlighted = showSuggestions ? suggestions[selected] : undefined;

  function valueOf(suggestion: Suggestion) {
    if (suggestion.kind === "bang") return suggestion.bang.trigger + " ";
    return activeBang
      ? `${activeBang.trigger} ${suggestion.text}`
      : suggestion.text;
  }

  const inputValue = highlighted ? valueOf(highlighted) : query;

  async function navigate(text: string) {
    const bangMatch = parseBang(text);
    if (bangMatch) {
      const { bang, query: bangQuery } = bangMatch;

      if (!bangQuery) {
        window.location.assign(new URL(bang.url).origin);
        return;
      }

      window.location.assign(
        bang.url.replace("{q}", encodeURIComponent(bangQuery)),
      );
      return;
    }

    if (text.startsWith("!")) {
      window.location.assign(
        `https://duckduckgo.com/?q=${encodeURIComponent(text)}`,
      );
      return;
    }

    const url = parseUrl(text);
    if (url) {
      window.location.assign(url.href);
      return;
    }

    try {
      await browser.search.query({ text, disposition: "CURRENT_TAB" });
    } catch (error) {
      console.error("Search failed:", error);
    }
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setQuery("");
      setSelected(-1);
      return;
    }
    if (!showSuggestions) return;

    const forward =
      event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey);
    const backward =
      event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey);

    if (!forward && !backward) return;
    const last = suggestions.length - 1;
    event.preventDefault();

    setSelected((current) =>
      forward
        ? current >= last
          ? 0
          : current + 1
        : current <= 0
          ? last
          : current - 1,
    );
  }

  function pickSuggestion(suggestion: Suggestion) {
    const value = valueOf(suggestion);
    setQuery(value);
    setSelected(-1);
    if (suggestion.kind === "web") navigate(value);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (highlighted) {
      pickSuggestion(highlighted);
      return;
    }
    const text = query.trim();
    if (text) navigate(text);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="w-full max-w-md relative"
    >
      <div className="search-box relative flex items-center">
        {activeBang ? (
          <img
            src={faviconUrl(new URL(activeBang.url).origin)}
            alt=""
            className="search-icon rounded-full"
          />
        ) : (
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(-1);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls="suggestions"
          aria-activedescendant={
            highlighted ? `suggestion-${selected}` : undefined
          }
          type="text"
          placeholder="Search or type a URL"
          aria-label="Search or enter a URL"
          autoFocus
          autoComplete="off"
          className="search-input"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      {showSuggestions && (
        <ul id="suggestions" className="suggestions" role="listbox">
          {suggestions.map((suggestion, index) => (
            <li
              className={`suggestion ${index === selected ? "selected" : ""}`}
              id={`suggestion-${index}`}
              key={
                suggestion.kind === "bang"
                  ? suggestion.bang.trigger
                  : suggestion.text
              }
              role="option"
              aria-selected={index === selected}
              onMouseDown={(event) => {
                event.preventDefault();
                pickSuggestion(suggestion);
              }}
            >
              {suggestion.kind === "bang" ? (
                <>
                  <img
                    src={faviconUrl(new URL(suggestion.bang.url).origin)}
                    alt=""
                    className="size-4 rounded-full"
                  />
                  <span className="bang-trigger">
                    {suggestion.bang.trigger}
                  </span>
                  <div className="text-sm text-white/60">
                    Search on {suggestion.bang.name}
                  </div>
                </>
              ) : (
                <>
                  <svg
                    className="size-4 shrink-0 text-white/40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span className="truncate">{suggestion.text}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
