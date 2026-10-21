export async function fetchSuggestions(
  query: string,
  signal: AbortSignal,
): Promise<string[]> {
  const url = new URL("https://suggestqueries.google.com/complete/search");
  url.searchParams.set("client", "chrome");
  url.searchParams.set("ie", "utf-8");
  url.searchParams.set("oe", "utf-8");
  url.searchParams.set("q", query);

  const response = await fetch(url, { signal });
  if (!response.ok) return [];

  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1]))
    return [];

  return data[1]
    .filter((item): item is string => typeof item === "string")
    .slice(0, 5);
}
