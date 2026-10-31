import { AccessRevokedError, SpotifyError } from "./errors";
import { clearMusicState } from "../music/store";

const CLIENT_ID = import.meta.env.WXT_SPOTIFY_CLIENT_ID;
const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-recently-played",
];

type SpotifyAuth = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

export const authItem = storage.defineItem<SpotifyAuth>("local:spotifyAuth");

function randomString(length: number) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (value) => chars[value % chars.length]).join("");
}

async function codeChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function requestToken(params: Record<string, string>) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...params }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (body?.error === "invalid_grant") throw new AccessRevokedError();
    throw new SpotifyError(
      `Spotify token request failed: ${response.status}`,
      response.status,
    );
  }
  return (await response.json()) as TokenResponse;
}

async function saveTokens(tokens: TokenResponse, oldRefreshToken = "") {
  const auth: SpotifyAuth = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? oldRefreshToken,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };

  await authItem.setValue(auth);
  return auth;
}

export async function expireAccessToken() {
  const auth = await authItem.getValue();
  if (auth) await authItem.setValue({ ...auth, expiresAt: 0 });
}

export async function login(onAuthorized?: () => void) {
  const verifier = randomString(64);
  const state = randomString(16);
  const redirectUri = browser.identity.getRedirectURL();

  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: await codeChallenge(verifier),
    state,
  }).toString();

  const resultUrl = await browser.identity.launchWebAuthFlow({
    url: url.href,
    interactive: true,
  });
  if (!resultUrl) throw new Error("Authentication failed: Login cancelled");

  const result = new URL(resultUrl).searchParams;
  const error = result.get("error");
  if (error) {
    throw new Error(`Spotify authentication error: ${error}`);
  }
  if (result.get("state") !== state)
    throw new Error("Spotify authentication error: State mismatch");
  const code = result.get("code");
  if (!code) throw new Error("Spotify authentication error: No code returned");

  onAuthorized?.();

  const tokens = await requestToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  return saveTokens(tokens);
}

let refreshing: Promise<SpotifyAuth> | null = null;

export async function getAccessToken() {
  const auth = await authItem.getValue();
  if (!auth) return null;

  if (Date.now() < auth.expiresAt - 60_000) return auth.accessToken;

  refreshing ??= requestToken({
    grant_type: "refresh_token",
    refresh_token: auth.refreshToken,
  })
    .then((tokens) => saveTokens(tokens, auth.refreshToken))
    .finally(() => {
      refreshing = null;
    });

  return (await refreshing).accessToken;
}

export async function logout() {
  await authItem.removeValue();
  await clearMusicState();
}
