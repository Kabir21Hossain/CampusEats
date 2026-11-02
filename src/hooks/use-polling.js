"use client";

import { useEffect, useRef } from "react";

/**
 * Function usePolling.
 * @param {*} callback - Input value used by the operation.
 * @param {*} intervalMs - Input value used by the operation.
 * @returns {*} The operation result.
 */
export function usePolling(callback, intervalMs) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        callbackRef.current();
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);
}
