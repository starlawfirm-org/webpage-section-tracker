import type { Transport, TransportResult } from "../types";

export const beaconTransport: Transport = async (url, payload): Promise<TransportResult> => {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
    return { ok: false };
  }
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const ok = navigator.sendBeacon(url, blob);
    return { ok };
  } catch {
    return { ok: false };
  }
};