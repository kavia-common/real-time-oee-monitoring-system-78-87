function withNoTrailingSlash(url) {
  return url && url.endsWith("/") ? url.slice(0, -1) : url || "";
}

function getApiBase() {
  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";
  return withNoTrailingSlash(apiBase);
}

// PUBLIC_INTERFACE
export function apiUrl(path) {
  /** Build a backend API URL.
   *
   * The backend is expected to be configured via:
   * - REACT_APP_API_BASE or REACT_APP_BACKEND_URL (e.g., http://localhost:5000)
   *
   * This function automatically prefixes `/api` if the passed path doesn't start with it.
   */
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  const finalPath = p.startsWith("/api/") || p === "/api" ? p : `/api${p}`;
  return `${base}${finalPath}`;
}

function safeJsonParse(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function readBody(res) {
  const text = await res.text();
  const json = safeJsonParse(text);
  return { text, json };
}

// PUBLIC_INTERFACE
export async function apiRequest(path, { method = "GET", token = "", body = null, headers = {} } = {}) {
  /** Perform a backend request with optional JWT token.
   *
   * Returns: { ok, status, json, text }
   */
  const url = apiUrl(path);
  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const { text, json } = await readBody(res);
  return { ok: res.ok, status: res.status, json, text };
}

// PUBLIC_INTERFACE
export async function apiDownload(path, { token = "" } = {}) {
  /** Download a file (e.g., PDF) from the backend.
   *
   * Returns: { ok, status, blob, filename }
   */
  const url = apiUrl(path);
  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const cd = res.headers.get("content-disposition") || "";
  const match = /filename="([^"]+)"/.exec(cd);
  const filename = match?.[1] || "download.bin";

  const blob = await res.blob();
  return { ok: res.ok, status: res.status, blob, filename };
}
