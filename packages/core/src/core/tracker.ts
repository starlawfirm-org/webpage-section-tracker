import { now } from "../utils/time";
import { EventQueue } from "./queue";
import { beaconTransport } from "../transports/beacon";
import { fetchTransport } from "../transports/fetch";
import { startSessionManagement, getSessionContext, touchSession } from "../utils/session";
import { mapEventToV2, mapBatchToV2 } from "./mapper";
import type { BaseContext, EventPayload, TrackerOptionsV1, TrackerOptionsV2, Transport } from "../types";

/**
 * 이벤트 고유 ID 생성 (중복 이벤트 방지)
 */
let eventIdCounter = 0;
function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (++eventIdCounter).toString(36).padStart(4, '0');
  const random = Math.random().toString(36).substring(2, 8);
  return `evt_${timestamp}_${random}_${counter}`;
}

function resolveContext(appId: string, extra?: Partial<BaseContext>): BaseContext {
  const loc = typeof location !== "undefined" ? location : ({} as Location);
  const nav = typeof navigator !== "undefined" ? navigator : ({} as Navigator);
  const scr = typeof screen !== "undefined" ? screen : ({} as Screen);
  const intlTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  
  // 3계층 세션 컨텍스트 가져오기
  const sessionCtx = getSessionContext();
  
  return {
    appId,
    page: loc?.href || "",
    referrer: (document && document.referrer) || undefined,
    tz: intlTZ,
    lang: nav?.language,
    ua: nav?.userAgent,
    screen: scr ? { w: scr.width, h: scr.height, dpr: window?.devicePixelRatio } : undefined,
    
    // 3계층 세션 데이터 (v2.0)
    ...sessionCtx,
    
    // 하위 호환성 (v1 필드)
    sessionId: sessionCtx.browserId as string,
    sessionStart: new Date(sessionCtx.browserFirstVisit as number).toISOString(),
    sessionPageViews: sessionCtx.browserTotalViews as number,
    isNewSession: sessionCtx.isNewBrowser as boolean,
    
    ...extra
  };
}

export class Tracker {
  private queue: EventQueue;
  private opts: Required<TrackerOptionsV1 | TrackerOptionsV2>;
  private enabled: boolean;
  private paused = false;
  private cleanup: () => void = () => {};

  constructor(options: TrackerOptionsV1 | TrackerOptionsV2) {
    // 3계층 세션 관리 시작
    startSessionManagement();
    
    const {
      endpoint,
      appId,
      schemaVersion = 'v1',
      useBeacon = true,
      batchSize = 20,
      flushIntervalMs = 5000,
      maxQueueSize = 1000,
      retryBaseDelayMs = 1000,
      retryMaxDelayMs = 30000,
      sampleRate = 1,
      getConsent = () => true,
      context = {},
      fetcher
    } = options;

    this.opts = {
      endpoint,
      appId,
      schemaVersion,
      useBeacon,
      batchSize,
      flushIntervalMs,
      maxQueueSize,
      retryBaseDelayMs,
      retryMaxDelayMs,
      sampleRate,
      getConsent,
      context,
      fetcher
    } as Required<TrackerOptionsV1 | TrackerOptionsV2>;

    // TODO: Throw error instead of warning for conflicting options
    if (fetcher && fetcher !== undefined && useBeacon) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn("fetcher and useBeacon cannot be used together");
      }
    }

    // sampling + consent decide enable flag at runtime
    const inSample = Math.random() < sampleRate;
    const hasConsent = !!getConsent();
    this.enabled = inSample && hasConsent;

    this.queue = new EventQueue({
      endpoint,
      batchSize,
      retryBaseDelayMs,
      retryMaxDelayMs,
      schemaVersion,
      transportPrimary: fetcher && fetcher !== undefined ? fetcher as Transport :useBeacon ? beaconTransport : fetchTransport,
      transportFallback: fetchTransport
    });

    this.queue.flushLoop(flushIntervalMs);

    // 전송 제어는 'visibility'만 사용
    const applyTxState = () => {
      const visible = document.visibilityState === "visible";
      if (visible) this.queue.resume();
      else this.queue.pause();
    };

    // 초기 상태 즉시 반영
    applyTxState();


    const onFocus = () => this.queue.resume(); // ★
    const onBlur = () => this.queue.pause();  // ★


    // 가시성 변화에만 전송 일시정지/재개 연결
    document.addEventListener("visibilitychange", applyTxState);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    // 페이지 떠날 때는 마지막으로 한 번 flush 시도(가능하면 sendBeacon 경로 사용)
    const finalFlush = () => this.flush();
    window.addEventListener("pagehide", finalFlush);
    window.addEventListener("beforeunload", finalFlush);

    // 클린업 함수 저장
    this.cleanup = () => {
      document.removeEventListener("visibilitychange", applyTxState);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", finalFlush);
      window.removeEventListener("beforeunload", finalFlush);
      this.queue.stop();
    };
  }

  pauseFlushing() { this.paused = true; }
  resumeFlushing() { this.paused = false; }

  isEnabled() { return this.enabled; }

  setEnabled(flag: boolean) { this.enabled = flag; }

  track(type: string, data?: any, ctx?: any) {
    if (!this.enabled) return;
    // 이벤트 추적 시 세션 활동 업데이트 (3계층 세션)
    touchSession();
    
    // 기본 context에 세션 정보 포함 (사용자 제공 ctx와 병합)
    const fullContext = {
      ...resolveContext(this.opts.appId, this.opts.context),
      ...ctx
    };
    
    // 이벤트 고유 ID 부여 (중복 방지)
    const ev = { 
      type, 
      ts: Date.now(), 
      data, 
      ctx: fullContext,
      eventId: generateEventId()  // 이벤트 발생 시점에 ID 부여
    };
    
    this.queue.enqueue(ev, this.opts.maxQueueSize);
  }

  flush() { return this.queue.flushOnce(); }

  pageView(extra?: Record<string, unknown>) {
    this.track("page_view", extra, resolveContext(this.opts.appId, this.opts.context));
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    this.track("identify", { userId, traits }, resolveContext(this.opts.appId, this.opts.context));
  }

  destroy() {
    this.cleanup();
    this.setEnabled(false);
  }
}