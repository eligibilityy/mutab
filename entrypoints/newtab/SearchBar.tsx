import { useState, type SubmitEvent } from "react";
import { parseBang } from "./bangs";

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

export function SearchBar() {
  const [query, setQuery] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = query.trim();
    if (!text) return;

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

  return (
    <form onSubmit={handleSubmit} role="search" className="w-full max-w-lg">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search or type a URL"
        aria-label="Search or enter a URL"
        autoFocus
        autoComplete="off"
        className="search-input"
      />
    </form>
  );
}
