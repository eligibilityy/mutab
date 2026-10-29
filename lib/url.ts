export function parseUrl(text: string): URL | null {
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
