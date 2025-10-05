import { BatchPayloadV2 } from "./types.v2";


export type TransportResult = { ok: boolean; status?: number; retryAfterMs?: number };

export type Transport = (url: string, payload: unknown, opts?: { timeoutMs?: number }) => Promise<TransportResult>;

// TODO: Add session configuration options
// TODO: Add storage strategy configuration (localStorage, IndexedDB, memory-only)
// TODO: Add lifecycle hooks (onError, onFlush, onBatch)
type TrackerBaseType = {
  endpoint: string; // e.g. "/collect" or full URL
  appId: string; // logical app identifier
  useBeacon?: boolean; // prefer sendBeacon
  batchSize?: number; // default 20
  flushIntervalMs?: number; // default 5000
  maxQueueSize?: number; // default 1000
  retryBaseDelayMs?: number; // default 1000
  retryMaxDelayMs?: number; // default 30000
  sampleRate?: number; // 0..1 (default 1)
  getConsent?: () => boolean; // return true if allowed to track
  context?: Partial<BaseContext>;
}

export interface TrackerOptionsV1 extends TrackerBaseType {
  schemaVersion: 'v1'; // 스키마 버전 (default: 'v1')
  fetcher?: (url: string, payload: EventPayload) => Promise<TransportResult> | undefined;
  // TODO: Add these optional configs:
  // sessionTTL?: number;
  // heartbeatInterval?: number;
  // storageStrategy?: 'localStorage' | 'indexedDB' | 'memory';
  // onError?: (error: Error, context: any) => void;
  // compression?: boolean;
}

export interface TrackerOptionsV2 extends TrackerBaseType {
  schemaVersion: 'v2'; // 스키마 버전 (default: 'v1')
  fetcher?: (url: string, payload: BatchPayloadV2) => Promise<TransportResult> | undefined;
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