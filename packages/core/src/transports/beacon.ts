import type { Transport, TransportResult } from "../types";

export const beaconTransport: Transport = async (url, payload): Promise<TransportResult> => {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
    return { ok: false };
  }
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const ok = navigator.sendBeacon(url, blob);
    return { ok };
  } catch (error) {
    // TODO: Add error logging for beacon failures
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error('[beaconTransport] Error:', error);
    }
    return { ok: false };
  }
};