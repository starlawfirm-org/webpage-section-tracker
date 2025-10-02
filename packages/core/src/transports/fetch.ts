import type { Transport, TransportResult } from "../types";

export const fetchTransport: Transport = async (url, payload, opts): Promise<TransportResult> => {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 5000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      signal: ctrl.signal
    });
    clearTimeout(t);
    const retryAfter = parseInt(res.headers.get("Retry-After") || "", 10);
    return { ok: res.ok, status: res.status, retryAfterMs: isFinite(retryAfter) ? retryAfter * 1000 : undefined };
  } catch (error) {
    // TODO: Add error logging/monitoring in development mode
    // TODO: Consider retry logic for network errors
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error('[fetchTransport] Error:', error);
    }
    return { ok: false };
  }
};