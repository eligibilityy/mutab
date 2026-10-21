import { useState, type SubmitEvent } from "react";
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

// What to fetch web suggestions for: the part after a known bang ("!yt lofi" → "lofi"),
// or the whole text. Empty means don't suggest ("!y", "!yt", unknown bangs).
function suggestionQuery(text: string) {
  const bangMatch = parseBang(text);
  if (bangMatch) return bangMatch.query;
  return text.startsWith("!") ? "" : text;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [webSuggestions, setWebSuggestions] = useState<string[]>([]);

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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = query.trim();

    if (text) navigate(text);
  }

  function pickSuggestion(suggestion: Suggestion) {
    if (suggestion.kind === "bang") {
      setQuery(suggestion.bang.trigger + " ");
    } else {
      // Keep the active bang so "!yt lofi" → "lofi girl" searches YouTube, not Google.
      const target = activeBang
        ? `${activeBang.trigger} ${suggestion.text}`
        : suggestion.text;
      setQuery(target);
      navigate(target);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="w-full max-w-lg relative"
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
            className="search-icon text-gray-500"
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
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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
        <ul className="suggestions" role="listbox">
          {suggestions.map((suggestion) => (
            <li
              className="suggestion"
              key={
                suggestion.kind === "bang"
                  ? suggestion.bang.trigger
                  : suggestion.text
              }
              role="option"
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
