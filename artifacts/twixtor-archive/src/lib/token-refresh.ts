const REFRESH_ENDPOINT = "https://dramavers-production.up.railway.app/api/auth/refresh";

/**
 * Exchanges the stored refresh token for a brand-new access token + refresh
 * token pair, and writes both back to localStorage.
 *
 * Returns the new access token on success. Returns null if there was no
 * refresh token to use, or if the server rejected it (in which case the
 * stored tokens are cleared, so the user will be asked to log in again).
 * A network hiccup does NOT clear anything — we just give up silently and
 * let the caller keep using whatever token it already has.
 */
export async function refreshTwixtorToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("twixtor_refresh_token");
  if (!refreshToken) return null;

  try {
    const res = await fetch(REFRESH_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem("twixtor_token");
      localStorage.removeItem("twixtor_refresh_token");
      return null;
    }

    const data = await res.json();
    localStorage.setItem("twixtor_token", data.token);
    localStorage.setItem("twixtor_refresh_token", data.refreshToken);
    return data.token as string;
  } catch {
    return null;
  }
}
