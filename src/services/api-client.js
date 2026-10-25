const configuredApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
if (!configuredApiUrl && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL must point to the deployed CampusEats backend and end in /api."
  );
}

export const API_BASE_URL = (configuredApiUrl || "http://localhost:5000/api")
  .replace(/\/+$/, "");
if (!API_BASE_URL.endsWith("/api")) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL must be the backend origin followed by /api."
  );
}
if (process.env.NODE_ENV === "production") {
  let apiUrl;
  try {
    apiUrl = new URL(API_BASE_URL);
  } catch {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be a valid absolute URL.");
  }
  const isLocalBackend = ["localhost", "127.0.0.1"].includes(apiUrl.hostname);
  if (
    apiUrl.protocol !== "https:" &&
    (process.env.VERCEL || !isLocalBackend)
  ) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTPS in production.");
  }
}
export const AUTH_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

export function createSuccessResponse(data, meta = {}) {
  return {
    success: true,
    data,
    error: null,
    meta,
  };
}

export function createErrorResponse(code, message, status = 400) {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      status,
    },
    meta: {},
  };
}

export async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      return createErrorResponse(
        "INVALID_RESPONSE",
        "The backend returned an invalid response.",
        response.status || 502
      );
    }

    if (!response.ok || payload?.success === false) {
      const message =
        typeof payload?.error === "string"
          ? payload.error
          : payload?.error?.message || `Backend request failed (${response.status}).`;
      return createErrorResponse(
        payload?.code || payload?.error?.code || "REQUEST_FAILED",
        message,
        response.status
      );
    }

    return createSuccessResponse(payload, { status: response.status });
  } catch (error) {
    return createErrorResponse(
      "NETWORK_ERROR",
      error.message || "Unable to reach the CampusEats backend.",
      0
    );
  }
}
