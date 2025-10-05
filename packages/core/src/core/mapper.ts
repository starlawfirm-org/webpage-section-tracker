/**
 * V1 -> V2 스키마 변환 유틸리티
 * 기존 코드와의 호환성을 유지하면서 새로운 구조로 변환
 */

import type { BaseContext, EventPayload } from '../types';
import type { 
  EventPayloadV2, 
  BatchPayloadV2, 
  BrowserSessionInfo,
  ViewSessionInfo,
  AppInfo,
  PageInfo,
  DeviceInfo,
  UserInfo
} from '../types.v2';

/**
 * V1 Context를 V2 구조로 변환
 */
export function mapContextToV2(v1Context: Partial<BaseContext>): {
  session: EventPayloadV2['session'];
  environment: EventPayloadV2['environment'];
  user?: UserInfo;
  custom?: Record<string, unknown>;
} {
  // Browser Session 추출
  const browserSession: BrowserSessionInfo = {
    // TODO: Handle missing sessionId more gracefully (generate fallback ID?)
    id: v1Context.sessionId || 'unknown',
    startedAt: v1Context.sessionStart || new Date().toISOString(),
    pageViews: v1Context.sessionPageViews || 1,
    isNew: v1Context.isNewSession || false
  };
  
  // View Session 추출 (있는 경우만)
  let viewSession: ViewSessionInfo | undefined;
  if (v1Context.viewSessionId) {
    viewSession = {
      id: v1Context.viewSessionId,
      // TODO: Validate parent-child session relationship
      parentSessionId: v1Context.sessionId || 'unknown',
      startedAt: v1Context.viewSessionStart || new Date().toISOString(),
      duration: v1Context.viewDuration || 0,
      engagement: v1Context.viewEngagement || 0
    };
  }
  
  // App 정보
  const app: AppInfo = {
    id: v1Context.appId || 'unknown',
    env: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  };
  
  // Page 정보
  const pageUrl = v1Context.page || '';
  const page: PageInfo = {
    url: pageUrl,
    referrer: v1Context.referrer
  };
  
  // URL 파싱 시도
  try {
    const url = new URL(pageUrl);
    page.path = url.pathname;
    page.hash = url.hash;
    if (url.search) {
      page.query = Object.fromEntries(url.searchParams.entries());
    }
    if (typeof document !== 'undefined') {
      page.title = document.title;
    }
  } catch (error) {
    // TODO: Log malformed URLs for debugging
    // URL 파싱 실패 시 무시 (상대 경로나 invalid URL일 수 있음)
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[Mapper] Failed to parse URL:', pageUrl, error);
    }
  }
  
  // Device 정보
  const device: DeviceInfo = {
    timezone: v1Context.tz || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    language: v1Context.lang,
    userAgent: v1Context.ua
  };
  
  if (v1Context.screen) {
    device.screen = {
      width: v1Context.screen.w,
      height: v1Context.screen.h,
      pixelRatio: v1Context.screen.dpr
    };
  }
  
  // 나머지 필드는 custom으로
  const knownFields = new Set([
    'appId', 'page', 'referrer', 'tz', 'lang', 'ua', 'screen',
    'sessionId', 'sessionStart', 'sessionPageViews', 'isNewSession',
    'viewSessionId', 'viewSessionStart', 'viewDuration', 'viewEngagement'
  ]);
  
  const customFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(v1Context)) {
    if (!knownFields.has(key) && value !== undefined) {
      customFields[key] = value;
    }
  }
  
  return {
    session: {
      browser: browserSession,
      view: viewSession
    },
    environment: {
      app,
      page,
      device
    },
    custom: Object.keys(customFields).length > 0 ? customFields : undefined
  };
}

/**
 * V1 EventPayload를 V2로 변환
 */
export function mapEventToV2(v1Event: EventPayload): EventPayloadV2 {
  const { ...mapped } = mapContextToV2(v1Event.ctx || {});
  
  return {
    type: v1Event.type,
    timestamp: v1Event.ts,
    session: mapped.session,
    environment: mapped.environment,
    data: v1Event.data,
    user: mapped.user,
    custom: mapped.custom,
    meta: {
      sdkVersion: '0.1.2',
      transport: 'fetch' // 기본값, 실제 전송 시 업데이트
    }
  };
}

/**
 * V1 배치를 V2 BatchPayload로 변환
 */
export function mapBatchToV2(v1Batch: { events: EventPayload[] }): BatchPayloadV2 {
  if (!v1Batch.events || v1Batch.events.length === 0) {
    return {
      events: [],
      batchMeta: {
        batchId: generateBatchId(),
        batchSize: 0,
        createdAt: Date.now()
      }
    };
  }
  
  // 첫 번째 이벤트에서 공통 정보 추출
  const firstEvent = v1Batch.events[0];
  const firstMapped = mapContextToV2(firstEvent.ctx || {});
  
  // 모든 이벤트에서 공통적인 브라우저 세션 확인
  const commonBrowserSession = v1Batch.events.every(e => 
    e.ctx?.sessionId === firstEvent.ctx?.sessionId
  ) ? firstMapped.session.browser : undefined;
  
  // 모든 이벤트에서 공통적인 앱 정보 확인
  const commonApp = v1Batch.events.every(e => 
    e.ctx?.appId === firstEvent.ctx?.appId
  ) ? firstMapped.environment.app : undefined;
  
  // 모든 이벤트에서 공통적인 디바이스 정보 확인
  const commonDevice = v1Batch.events.every(e => 
    e.ctx?.ua === firstEvent.ctx?.ua && 
    e.ctx?.tz === firstEvent.ctx?.tz
  ) ? firstMapped.environment.device : undefined;
  
  // 공통 정보 구성
  const common: BatchPayloadV2['common'] = {};
  if (commonBrowserSession || commonApp || commonDevice) {
    if (commonBrowserSession) {
      common.session = { browser: commonBrowserSession };
    }
    if (commonApp || commonDevice) {
      common.environment = {};
      if (commonApp) common.environment.app = commonApp;
      if (commonDevice) common.environment.device = commonDevice;
    }
  }
  
  // 개별 이벤트 변환
  const events = v1Batch.events.map(v1Event => {
    const v2Event = mapEventToV2(v1Event);
    
    // 공통 정보와 중복되는 부분 제거
    const eventData: BatchPayloadV2['events'][0] = {
      type: v2Event.type,
      timestamp: v2Event.timestamp,
      data: v2Event.data,
      custom: v2Event.custom
    };
    
    // 공통 정보와 다른 경우만 포함
    if (!commonBrowserSession || v2Event.session.browser.id !== commonBrowserSession.id) {
      eventData.session = v2Event.session;
    } else if (v2Event.session.view) {
      // 브라우저 세션은 공통이지만 뷰 세션은 다를 수 있음
      eventData.session = { view: v2Event.session.view };
    }
    
    // 환경 정보 중 공통이 아닌 부분만 포함
    const needsEnvironment = 
      (!commonApp || v2Event.environment.app.id !== commonApp.id) ||
      (!commonDevice || v2Event.environment.device.timezone !== commonDevice.timezone) ||
      v2Event.environment.page; // page는 항상 포함 (URL이 다를 수 있음)
    
    if (needsEnvironment) {
      eventData.environment = {};
      if (!commonApp || v2Event.environment.app.id !== commonApp.id) {
        eventData.environment.app = v2Event.environment.app;
      }
      if (v2Event.environment.page) {
        eventData.environment.page = v2Event.environment.page;
      }
      if (!commonDevice || v2Event.environment.device.timezone !== commonDevice.timezone) {
        eventData.environment.device = v2Event.environment.device;
      }
    }
    
    if (v2Event.user) {
      eventData.user = v2Event.user;
    }
    
    return eventData;
  });
  
  return {
    common: Object.keys(common).length > 0 ? common : undefined,
    events,
    batchMeta: {
      batchId: generateBatchId(),
      batchSize: events.length,
      createdAt: Date.now()
    }
  };
}

/**
 * 배치 ID 생성
 */
function generateBatchId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `batch_${timestamp}_${random}`;
}

/**
 * V2를 V1으로 역변환 (백워드 호환성)
 */
export function mapV2ToV1Context(v2Event: EventPayloadV2): Partial<BaseContext> {
  const v1Context: Partial<BaseContext> = {
    appId: v2Event.environment.app.id,
    page: v2Event.environment.page.url,
    referrer: v2Event.environment.page.referrer,
    tz: v2Event.environment.device.timezone,
    lang: v2Event.environment.device.language,
    ua: v2Event.environment.device.userAgent
  };
  
  // Screen 정보
  if (v2Event.environment.device.screen) {
    v1Context.screen = {
      w: v2Event.environment.device.screen.width,
      h: v2Event.environment.device.screen.height,
      dpr: v2Event.environment.device.screen.pixelRatio
    };
  }
  
  // Browser Session
  if (v2Event.session.browser) {
    v1Context.sessionId = v2Event.session.browser.id;
    v1Context.sessionStart = v2Event.session.browser.startedAt;
    v1Context.sessionPageViews = v2Event.session.browser.pageViews;
    v1Context.isNewSession = v2Event.session.browser.isNew;
  }
  
  // View Session
  if (v2Event.session.view) {
    v1Context.viewSessionId = v2Event.session.view.id;
    v1Context.viewSessionStart = v2Event.session.view.startedAt;
    v1Context.viewDuration = v2Event.session.view.duration;
    v1Context.viewEngagement = v2Event.session.view.engagement;
  }
  
  // Custom fields
  if (v2Event.custom) {
    Object.assign(v1Context, v2Event.custom);
  }
  
  return v1Context;
}

/**
 * 스키마 버전 감지
 */
export function detectSchemaVersion(payload: any): 'v1' | 'v2' | 'unknown' {
  if (!payload || typeof payload !== 'object') {
    return 'unknown';
  }
  
  // V2 체크: session, environment, timestamp 필드가 있으면 V2
  if ('session' in payload && 'environment' in payload && 'timestamp' in payload) {
    return 'v2';
  }
  
  // V1 체크: type, ts, ctx 필드가 있으면 V1
  if ('type' in payload && 'ts' in payload) {
    return 'v1';
  }
  
  // 배치 체크
  if ('events' in payload && Array.isArray(payload.events)) {
    if (payload.events.length > 0) {
      const firstEvent = payload.events[0];
      if ('timestamp' in firstEvent) return 'v2';
      if ('ts' in firstEvent) return 'v1';
    }
  }
  
  return 'unknown';
}
