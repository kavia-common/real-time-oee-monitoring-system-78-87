function withNoTrailingSlash(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

// PUBLIC_INTERFACE
export function buildApiUrls(apiBase) {
  /** Builds API URLs for the optional backend integration.
   *
   * Params:
   *  - apiBase: value from REACT_APP_API_BASE or REACT_APP_BACKEND_URL
   *
   * Returns:
   *  - { baseUrl: string }
   */
  const baseUrl = withNoTrailingSlash(apiBase || "");
  return { baseUrl };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// PUBLIC_INTERFACE
export async function safeJsonFetch(url, options = {}) {
  /** Safely fetches JSON from a URL; returns null for non-OK responses.
   *
   * This helper intentionally avoids throwing on non-200 to keep optional
   * integrations from breaking the app.
   */
  const res = await fetchWithTimeout(url, options);
  if (!res.ok) return null;

  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
