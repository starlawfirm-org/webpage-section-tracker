export type TransportResult = { ok: boolean; status?: number; retryAfterMs?: number };

export type Transport = (url: string, payload: unknown, opts?: { timeoutMs?: number }) => Promise<TransportResult>;

export type TrackerOptions = {
  endpoint: string; // e.g. "/collect" or full URL
  appId: string; // logical app identifier
  schemaVersion?: 'v1' | 'v2'; // 스키마 버전 (default: 'v1')
  useBeacon?: boolean; // prefer sendBeacon
  batchSize?: number; // default 20
  flushIntervalMs?: number; // default 5000
  maxQueueSize?: number; // default 1000
  retryBaseDelayMs?: number; // default 1000
  retryMaxDelayMs?: number; // default 30000
  sampleRate?: number; // 0..1 (default 1)
  getConsent?: () => boolean; // return true if allowed to track
  context?: Partial<BaseContext>;
  fetcher?: (url: string, payload: unknown) => Promise<TransportResult> | undefined;
};

export type EventPayload = {
  type: string;
  ts: number; // ms
  data?: Record<string, unknown>;
  ctx?: Partial<BaseContext>;
};

export type BaseContext = {
  appId: string;
  page: string;
  referrer?: string;
  tz: string; // IANA
  lang?: string;
  ua?: string;
  screen?: { w: number; h: number; dpr?: number };
  // Browser Session context
  sessionId?: string;
  sessionStart?: string;
  sessionPageViews?: number;
  isNewSession?: boolean;
  // View Session context (페이지 단위 세션)
  viewSessionId?: string;
  viewSessionStart?: string;
  viewDuration?: number;
  viewEngagement?: number;
};