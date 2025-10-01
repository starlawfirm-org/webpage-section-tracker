/**
 * Version 2 Types - 개선된 스키마 구조
 * 세션, 환경, 데이터를 논리적으로 분리
 */

export type TransportResultV2 = { 
  ok: boolean; 
  status?: number; 
  retryAfterMs?: number;
};

export type TransportV2 = (
  url: string, 
  payload: unknown, 
  opts?: { timeoutMs?: number }
) => Promise<TransportResultV2>;

/**
 * 브라우저 세션 정보 (탭 수준)
 */
export type BrowserSessionInfo = {
  id: string;
  startedAt: string;  // ISO 8601
  pageViews: number;
  isNew: boolean;
  lastActivityAt?: string;
};

/**
 * 뷰 세션 정보 (페이지 수준)
 */
export type ViewSessionInfo = {
  id: string;
  parentSessionId: string;  // 브라우저 세션과의 연결
  startedAt: string;  // ISO 8601
  duration: number;  // ms
  engagement: number;  // 0-100
  interactions?: {
    clicks: number;
    scrolls: number;
    keypresses: number;
    mouseMoves: number;
    touches: number;
  };
  maxScrollDepth?: number;  // 0-100
};

/**
 * 애플리케이션 정보
 */
export type AppInfo = {
  id: string;
  version?: string;
  env?: 'development' | 'staging' | 'production';
};

/**
 * 페이지 정보
 */
export type PageInfo = {
  url: string;
  title?: string;
  referrer?: string;
  path?: string;
  query?: Record<string, string>;
  hash?: string;
};

/**
 * 디바이스/브라우저 정보
 */
export type DeviceInfo = {
  screen?: {
    width: number;
    height: number;
    pixelRatio?: number;
  };
  viewport?: {
    width: number;
    height: number;
  };
  timezone: string;  // IANA
  language?: string;
  userAgent?: string;
  platform?: string;
  vendor?: string;
};

/**
 * 사용자 정보 (선택적)
 */
export type UserInfo = {
  id?: string;
  isAuthenticated?: boolean;
  traits?: Record<string, unknown>;
};

/**
 * V2 이벤트 페이로드 - 계층적 구조
 */
export type EventPayloadV2 = {
  // === 필수 필드 ===
  type: string;  // 이벤트 타입
  timestamp: number;  // Unix timestamp (ms)
  
  // === 세션 정보 (별도 최상위 필드) ===
  session: {
    browser: BrowserSessionInfo;
    view?: ViewSessionInfo;  // View Session이 없을 수도 있음
  };
  
  // === 환경 정보 ===
  environment: {
    app: AppInfo;
    page: PageInfo;
    device: DeviceInfo;
  };
  
  // === 이벤트 데이터 ===
  data?: Record<string, unknown>;  // 이벤트 고유 데이터
  
  // === 선택적 정보 ===
  user?: UserInfo;  // 사용자 정보
  
  // === 커스텀 컨텍스트 ===
  custom?: Record<string, unknown>;  // 사용자 정의 추가 정보
  
  // === 메타데이터 ===
  meta?: {
    sdkVersion?: string;
    transport?: 'beacon' | 'fetch' | 'xhr';
    attempt?: number;  // 재시도 횟수
    queuedAt?: number;  // 큐에 들어간 시간
    sentAt?: number;  // 실제 전송 시간
  };
};

/**
 * 배치 페이로드 - 여러 이벤트를 한번에 전송
 */
export type BatchPayloadV2 = {
  // 공통 정보 (모든 이벤트에 적용)
  common?: {
    session?: {
      browser: BrowserSessionInfo;
    };
    environment?: {
      app?: AppInfo;
      device?: DeviceInfo;
    };
    user?: UserInfo;
  };
  
  // 개별 이벤트 배열
  events: Array<Omit<EventPayloadV2, 'session' | 'environment' | 'user'> & {
    // 배치 내에서 공통 정보를 오버라이드할 수 있음
    session?: Partial<EventPayloadV2['session']>;
    environment?: Partial<EventPayloadV2['environment']>;
    user?: Partial<UserInfo>;
  }>;
  
  // 배치 메타데이터
  batchMeta?: {
    batchId: string;
    batchSize: number;
    createdAt: number;
    sentAt?: number;
  };
};

/**
 * Tracker 옵션 V2
 */
export type TrackerOptionsV2 = {
  // === 필수 설정 ===
  endpoint: string;
  appId: string;
  appVersion?: string;
  appEnv?: 'development' | 'staging' | 'production';
  
  // === 전송 설정 ===
  transport?: {
    primary?: 'beacon' | 'fetch' | 'xhr' | 'custom';
    fallback?: 'beacon' | 'fetch' | 'xhr';
    customTransport?: TransportV2;
    batchSize?: number;  // 기본값: 20
    flushInterval?: number;  // ms, 기본값: 5000
    maxQueueSize?: number;  // 기본값: 1000
    retryPolicy?: {
      maxAttempts?: number;  // 기본값: 3
      baseDelay?: number;  // ms, 기본값: 1000
      maxDelay?: number;  // ms, 기본값: 30000
      backoffMultiplier?: number;  // 기본값: 2
    };
  };
  
  // === 샘플링 설정 ===
  sampling?: {
    rate?: number;  // 0-1, 기본값: 1 (100%)
    sessionBased?: boolean;  // 세션 단위 샘플링, 기본값: false
  };
  
  // === 개인정보 설정 ===
  privacy?: {
    getConsent?: () => boolean | Promise<boolean>;
    anonymizeIp?: boolean;
    excludeUserAgent?: boolean;
    excludeReferrer?: boolean;
  };
  
  // === 디버깅 ===
  debug?: boolean;
  
  // === 커스텀 컨텍스트 제공자 ===
  contextProviders?: {
    custom?: () => Record<string, unknown>;
    user?: () => UserInfo;
  };
};

/**
 * 개별 이벤트와 배치 이벤트 타입 맵핑
 */
export type EventTypeMapV2 = {
  // 페이지 관련
  'page_view': {
    source?: string;
    duration?: number;
  };
  'page_exit': {
    exitType: 'navigation' | 'close' | 'refresh';
    nextUrl?: string;
  };
  
  // 사용자 식별
  'identify': {
    userId: string;
    traits?: Record<string, unknown>;
    previousId?: string;
  };
  
  // 요소 체류
  'element_dwell_progress': {
    selector: string;
    dwellMs: number;
    visibleNow: boolean;
    coverage: number;
    [key: string]: unknown;
  };
  
  // 상호작용
  'click': {
    target: string;
    targetId?: string;
    targetClass?: string;
    x?: number;
    y?: number;
  };
  'scroll': {
    depth: number;
    velocity?: number;
    direction?: 'up' | 'down';
  };
  'form_submit': {
    formId?: string;
    formName?: string;
    fields?: string[];
  };
  
  // 커스텀 이벤트
  'custom': Record<string, unknown>;
};

/**
 * 타입 안전 이벤트 생성 헬퍼
 */
export type TypedEventV2<T extends keyof EventTypeMapV2> = Omit<EventPayloadV2, 'type' | 'data'> & {
  type: T;
  data: EventTypeMapV2[T];
};

/**
 * 백워드 호환성을 위한 매퍼
 */
export type V1ToV2Mapper = {
  mapContext(v1Context: Record<string, unknown>): {
    session: EventPayloadV2['session'];
    environment: EventPayloadV2['environment'];
    custom?: EventPayloadV2['custom'];
  };
  
  mapEvent(v1Event: Record<string, unknown>): EventPayloadV2;
  
  mapBatch(v1Batch: { events: Array<Record<string, unknown>> }): BatchPayloadV2;
};
