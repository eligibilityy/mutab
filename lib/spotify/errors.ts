export class SpotifyError extends Error {
  status: number;
  retryAfterMs?: number;

  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message);
    this.name = "SpotifyError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export class AccessRevokedError extends Error {
  status: number;

  constructor(message = "Access revoked. Please log in again.", status = 401) {
    super(message);
    this.name = "AccessRevokedError";
    this.status = status;
  }
}
