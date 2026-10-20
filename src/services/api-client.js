/**
 * CampusEats API Client Helper
 * Enforces standard response envelope: { success, data, error, meta }
 */

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

export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
