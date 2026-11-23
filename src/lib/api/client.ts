export const CAPABILITIES_CHANGED_EVENT = "ikbs:capabilities-changed";
export const SESSION_LOST_EVENT = "ikbs:session-lost";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryAfter: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  origin = "",
): Promise<T> {
  const headers = new Headers(options.headers);
  const method = (options.method ?? "GET").toUpperCase();
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-IKBS-Request", "1");
  }

  const response = await fetch(origin + "/api/v1" + endpoint, {
    ...options,
    headers,
    cache: "no-store",
    credentials: "same-origin",
    redirect: "error",
  });

  if (!response.ok) {
    const body: { error?: unknown; message?: unknown } | null = await response.json().catch(() => null);
    const code = typeof body?.error === "string" ? body.error : "HTTP_" + response.status;
    const message = typeof body?.message === "string" ? body.message : "Erreur API (" + response.status + ")";
    if (typeof window !== "undefined" && response.status === 401 && !endpoint.startsWith("/auth/")) {
      window.dispatchEvent(new Event(SESSION_LOST_EVENT));
    }
    if (typeof window !== "undefined" && endpoint.startsWith("/organizations") &&
        !endpoint.startsWith("/organizations/public") && (response.status === 403 || response.status === 404)) {
      window.dispatchEvent(new Event(CAPABILITIES_CHANGED_EVENT));
    }
    throw new ApiError(response.status, code, message, response.headers.get("Retry-After"));
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
