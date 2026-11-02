const configuredApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
if (!configuredApiUrl && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL must point to the deployed CampusEats backend and end in /api."
  );
}

/**
 * Exports API_BASE_URL.
 * @type {*} Exported application value.
*/
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
/**
 * Exports AUTH_BASE_URL.
 * @type {*} Exported application value.
*/
export const AUTH_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

/**
 * Function createSuccessResponse.
 * @param {*} data - Input value used by the operation.
 * @param {*} meta - Input value used by the operation.
 * @returns {*} The operation result.
 */
export function createSuccessResponse(data, meta = {}) {
  return {
    success: true,
    data,
    error: null,
    meta,
  };
}

/**
 * Function createErrorResponse.
 * @param {*} code - Input value used by the operation.
 * @param {*} message - Input value used by the operation.
 * @param {*} status - Input value used by the operation.
 * @returns {*} The operation result.
 */
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

/**
 * Function apiRequest.
 * @param {*} endpoint - Input value used by the operation.
 * @param {*} options - Input value used by the operation.
 * @returns {Promise<*>} Resolves with the operation result.
 */
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

    return createSuccessResponse(payload, {
      status: response.status,
      ...(payload?.notificationsSent === false
        ? { notificationWarning: "This action completed, but one or more in-app notifications could not be saved." }
        : {}),
    });
  } catch (error) {
    return createErrorResponse(
      "NETWORK_ERROR",
      error.message || "Unable to reach the CampusEats backend.",
      0
    );
  }
}
