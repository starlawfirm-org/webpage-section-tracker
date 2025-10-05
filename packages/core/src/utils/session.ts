/**
 * 3계층 세션 관리 시스템 (v2.0)
 * 
 * Architecture:
 * 1. Browser Session (localStorage): 모든 탭 공유, 30분 TTL
 * 2. Page Session (sessionStorage): 탭별 독립, 탭 닫으면 소멸
 * 3. View Session (메모리): 페이지 로드별, 새로고침마다 새로 생성
 * 
 * 참고:
 * - Google Analytics Universal Analytics 세션 모델
 * - Web Analytics Best Practices
 * - Multi-tab session isolation patterns
 */

// Storage Keys (앱별 격리)
const BROWSER_SESSION_KEY = "__stl_browser_session";
const PAGE_SESSION_KEY = "__stl_page_session";
const VIEW_SESSION_KEY = "__stl_view_session";

// Configuration
const BROWSER_SESSION_TTL_MS = 30 * 60 * 1000; // 30분 비활성 후 만료
const HEARTBEAT_INTERVAL_MS = 5000; // 5초마다 세션 갱신
const ACTIVITY_THROTTLE_MS = 10000; // 10초 단위로 활동 기록

/**
 * Browser Session (브라우저 세션)
 * - 모든 탭에서 공유
 * - 30분 비활성 시 만료
 * - localStorage에 저장
 */
export interface BrowserSessionData {
  browserId: string;           // 브라우저 고유 ID
  firstVisitAt: number;        // 최초 방문 시각
  lastActivityAt: number;      // 마지막 활동 시각
  totalPageViews: number;      // 전체 페이지뷰
  totalDuration: number;       // 총 체류 시간
  isNew: boolean;              // 신규 방문자 여부
}

/**
 * Page Session (페이지 세션)
 * - 탭별로 독립
 * - 탭 닫으면 소멸
 * - sessionStorage에 저장
 */
export interface PageSessionData {
  pageId: string;              // 페이지(탭) 고유 ID
  browserId: string;           // 연결된 브라우저 세션 ID
  openedAt: number;            // 탭 오픈 시각
  lastActivityAt: number;      // 마지막 활동 시각
  viewCount: number;           // 이 탭에서의 뷰 수
  isFirstPage: boolean;        // 브라우저 세션의 첫 페이지 여부
}

/**
 * View Session (뷰 세션)
 * - 페이지 로드별로 독립
 * - 새로고침, 뒤로가기 등 매번 새로 생성
 * - 메모리에만 저장
 */
export interface ViewSessionData {
  viewId: string;              // 뷰 고유 ID
  pageId: string;              // 연결된 페이지 세션 ID
  browserId: string;           // 연결된 브라우저 세션 ID
  loadedAt: number;            // 페이지 로드 시각
  referrer: string;            // 리퍼러
  url: string;                 // 현재 URL
  isNewView: boolean;          // 항상 true (매번 새로 생성)
}

/**
 * 통합 세션 데이터 (모든 계층 포함)
 */
export interface SessionData {
  browser: BrowserSessionData;
  page: PageSessionData;
  view: ViewSessionData;
}

// 메모리 폴백 (sessionStorage/localStorage 실패 시)
let memoryBrowserSession: BrowserSessionData | null = null;
let memoryPageSession: PageSessionData | null = null;
let memoryViewSession: ViewSessionData | null = null;

/**
 * 암호학적으로 안전한 고유 ID 생성
 */
function generateSecureId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  
  let randomPart: string;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    randomPart = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    randomPart = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    console.warn('[Session] crypto API not available, using Math.random');
    randomPart = Math.random().toString(36).substring(2, 18) + 
                 Math.random().toString(36).substring(2, 18);
    randomPart = randomPart.substring(0, 16);
  }
  
  const counter = getCounter();
  return `${prefix}_${timestamp}_${randomPart}_${counter.toString(36).padStart(4, '0')}`;
}

let sessionCounter = 0;
let lastCounterReset = 0;

function getCounter(): number {
  const now = Date.now();
  if (now !== lastCounterReset) {
    sessionCounter = 0;
    lastCounterReset = now;
  }
  return ++sessionCounter;
}

/**
 * Browser Session 관리
 */
function loadBrowserSession(): BrowserSessionData | null {
  try {
    const stored = localStorage.getItem(BROWSER_SESSION_KEY);
    if (!stored) return memoryBrowserSession;
    
    const session = JSON.parse(stored) as BrowserSessionData;
    
    // 30분 비활성 체크
    const now = Date.now();
    if (now - session.lastActivityAt > BROWSER_SESSION_TTL_MS) {
      localStorage.removeItem(BROWSER_SESSION_KEY);
      memoryBrowserSession = null;
      return null;
    }
    
    memoryBrowserSession = session;
    return session;
  } catch {
    return memoryBrowserSession;
  }
}

function saveBrowserSession(session: BrowserSessionData): void {
  memoryBrowserSession = session;
  try {
    localStorage.setItem(BROWSER_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[Session] localStorage save failed, using memory fallback');
    }
  }
}

function initBrowserSession(): BrowserSessionData {
  let session = loadBrowserSession();
  
  if (!session) {
    const now = Date.now();
    session = {
      browserId: generateSecureId('br'),
      firstVisitAt: now,
      lastActivityAt: now,
      totalPageViews: 0,
      totalDuration: 0,
      isNew: true
    };
    saveBrowserSession(session);
  }
  
  return session;
}

/**
 * Page Session 관리 (탭별 독립)
 */
function loadPageSession(): PageSessionData | null {
  try {
    const stored = sessionStorage.getItem(PAGE_SESSION_KEY);
    if (!stored) return memoryPageSession;
    
    const session = JSON.parse(stored) as PageSessionData;
    memoryPageSession = session;
    return session;
  } catch {
    return memoryPageSession;
  }
}

function savePageSession(session: PageSessionData): void {
  memoryPageSession = session;
  try {
    sessionStorage.setItem(PAGE_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[Session] sessionStorage save failed, using memory fallback');
    }
  }
}

function initPageSession(browserId: string, isFirstPage: boolean): PageSessionData {
  let session = loadPageSession();
  
  if (!session) {
    const now = Date.now();
    session = {
      pageId: generateSecureId('pg'),
      browserId,
      openedAt: now,
      lastActivityAt: now,
      viewCount: 0,
      isFirstPage
    };
    savePageSession(session);
  }
  
  return session;
}

/**
 * View Session 관리 (페이지 로드별)
 * - 새로고침, 뒤로가기 등 매번 새로 생성
 * - 메모리에만 저장
 */
function createViewSession(pageId: string, browserId: string): ViewSessionData {
  const now = Date.now();
  const viewId = generateSecureId('vw');
  
  const session: ViewSessionData = {
    viewId,
    pageId,
    browserId,
    loadedAt: now,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    url: typeof window !== 'undefined' ? window.location.href : '',
    isNewView: true
  };
  
  memoryViewSession = session;
  
  // sessionStorage에도 저장 (다른 탭과 격리)
  try {
    sessionStorage.setItem(VIEW_SESSION_KEY, JSON.stringify(session));
  } catch {
    // 메모리만 사용
  }
  
  return session;
}

function loadViewSession(): ViewSessionData | null {
  // 먼저 메모리 확인 (가장 신뢰할 수 있음)
  if (memoryViewSession) return memoryViewSession;
  
  // sessionStorage 확인
  try {
    const stored = sessionStorage.getItem(VIEW_SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored) as ViewSessionData;
      memoryViewSession = session;
      return session;
    }
  } catch {
    // Ignore
  }
  
  return null;
}

/**
 * 통합 세션 초기화
 * 
 * 호출 시점:
 * - Tracker 초기화 시 한 번 호출
 * - 이후 getSessionMetadata()로 조회
 */
export function initSession(): SessionData {
  // 1. Browser Session 초기화 (localStorage, 모든 탭 공유)
  const browserSession = initBrowserSession();
  
  // 2. Page Session 초기화 (sessionStorage, 탭별 독립)
  const isFirstPage = browserSession.isNew;
  const pageSession = initPageSession(browserSession.browserId, isFirstPage);
  
  // 3. View Session 생성 (메모리, 페이지 로드별)
  const viewSession = createViewSession(pageSession.pageId, browserSession.browserId);
  
  // Browser Session의 isNew 플래그 업데이트
  if (browserSession.isNew) {
    browserSession.isNew = false;
    saveBrowserSession(browserSession);
  }
  
  // Page Session의 viewCount 증가
  pageSession.viewCount++;
  pageSession.lastActivityAt = Date.now();
  savePageSession(pageSession);
  
  // Browser Session의 totalPageViews 증가
  browserSession.totalPageViews++;
  browserSession.lastActivityAt = Date.now();
  saveBrowserSession(browserSession);
  
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log('[Session] Initialized 3-layer session:', {
      browserId: browserSession.browserId,
      pageId: pageSession.pageId,
      viewId: viewSession.viewId,
      isNew: isFirstPage,
      viewCount: pageSession.viewCount
    });
  }
  
  return {
    browser: browserSession,
    page: pageSession,
    view: viewSession
  };
}

/**
 * 세션 메타데이터 가져오기 (항상 보장)
 */
export function getSessionMetadata(): SessionData {
  // View Session이 메모리에 있는지 확인 (가장 빠름)
  const existingView = loadViewSession();
  
  if (existingView) {
    // 기존 View Session이 있으면 Browser/Page도 로드
    const browserSession = loadBrowserSession();
    const pageSession = loadPageSession();
    
    if (browserSession && pageSession) {
      return {
        browser: browserSession,
        page: pageSession,
        view: existingView
      };
    }
  }
  
  // 세션이 없거나 불완전하면 재초기화
  return initSession();
}

/**
 * 세션 활동 업데이트
 */
let lastActivityUpdate = 0;

export function touchSession(): void {
  const now = Date.now();
  
  // 쓰로틀링: 10초에 한 번만 업데이트
  if (now - lastActivityUpdate < ACTIVITY_THROTTLE_MS) {
    return;
  }
  
  lastActivityUpdate = now;
  
  try {
    // Browser Session 업데이트
    const browserSession = loadBrowserSession();
    if (browserSession) {
      browserSession.lastActivityAt = now;
      browserSession.totalDuration = now - browserSession.firstVisitAt;
      saveBrowserSession(browserSession);
    }
    
    // Page Session 업데이트
    const pageSession = loadPageSession();
    if (pageSession) {
      pageSession.lastActivityAt = now;
      savePageSession(pageSession);
    }
  } catch (error) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error('[Session] Failed to update session activity:', error);
    }
  }
}

/**
 * 페이지뷰 증가 (Browser Session만)
 */
export function incrementPageView(): void {
  const browserSession = loadBrowserSession();
  if (browserSession) {
    browserSession.totalPageViews++;
    browserSession.lastActivityAt = Date.now();
    saveBrowserSession(browserSession);
  }
}

/**
 * View Session 증가 (Page Session)
 */
export function incrementViewCount(): void {
  const pageSession = loadPageSession();
  if (pageSession) {
    pageSession.viewCount++;
    pageSession.lastActivityAt = Date.now();
    savePageSession(pageSession);
  }
}

/**
 * 세션 하트비트 (백그라운드 유지)
 */
let heartbeatInterval: number | undefined;
let lastHeartbeat = 0;

function startSessionHeartbeat() {
  if (heartbeatInterval) return;
  
  heartbeatInterval = window.setInterval(() => {
    if (document.visibilityState === 'hidden') return;
    
    const now = Date.now();
    if (now - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
      touchSession();
      lastHeartbeat = now;
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function stopSessionHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = undefined;
  }
}

/**
 * 세션 초기화 (테스트/개발용)
 */
export function resetSession(): void {
  memoryBrowserSession = null;
  memoryPageSession = null;
  memoryViewSession = null;
  
  try {
    localStorage.removeItem(BROWSER_SESSION_KEY);
    sessionStorage.removeItem(PAGE_SESSION_KEY);
    sessionStorage.removeItem(VIEW_SESSION_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * 세션 ID 단독 조회 (하위 호환성)
 */
export function getSessionId(): string {
  const session = getSessionMetadata();
  return session.browser.browserId;
}

/**
 * 세션 컨텍스트 객체 생성 (payload용)
 */
export function getSessionContext(): Record<string, unknown> {
  const session = getSessionMetadata();
  
  return {
    // Browser Session (모든 탭 공유)
    browserId: session.browser.browserId,
    browserFirstVisit: session.browser.firstVisitAt,
    browserLastActivity: session.browser.lastActivityAt,
    browserTotalViews: session.browser.totalPageViews,
    browserDuration: session.browser.totalDuration,
    isNewBrowser: session.browser.isNew,
    
    // Page Session (탭별 독립)
    pageId: session.page.pageId,
    pageOpenedAt: session.page.openedAt,
    pageViewCount: session.page.viewCount,
    isFirstPage: session.page.isFirstPage,
    
    // View Session (페이지 로드별)
    viewId: session.view.viewId,
    viewLoadedAt: session.view.loadedAt,
    viewReferrer: session.view.referrer,
    viewUrl: session.view.url,
    isNewView: session.view.isNewView
  };
}

/**
 * 세션 정보 로깅 (디버깅용)
 */
export function logSessionInfo(): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const session = getSessionMetadata();
    console.group('[Session] 3-Layer Session Info');
    console.log('Browser Session:', {
      id: session.browser.browserId,
      age: Date.now() - session.browser.firstVisitAt,
      views: session.browser.totalPageViews,
      duration: session.browser.totalDuration
    });
    console.log('Page Session:', {
      id: session.page.pageId,
      age: Date.now() - session.page.openedAt,
      views: session.page.viewCount,
      isFirst: session.page.isFirstPage
    });
    console.log('View Session:', {
      id: session.view.viewId,
      age: Date.now() - session.view.loadedAt,
      url: session.view.url,
      referrer: session.view.referrer
    });
    console.groupEnd();
  }
}

/**
 * 자동 세션 관리 시작
 * Tracker 초기화 시 호출됩니다.
 */
export function startSessionManagement(): SessionData {
  // 세션 초기화
  const session = initSession();
  
  // 하트비트 시작
  startSessionHeartbeat();
  
  // 페이지 언로드 시 정리
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      stopSessionHeartbeat();
      
      // 최종 활동 시각 업데이트
      const now = Date.now();
      const browserSession = loadBrowserSession();
      if (browserSession) {
        browserSession.lastActivityAt = now;
        browserSession.totalDuration = now - browserSession.firstVisitAt;
        saveBrowserSession(browserSession);
      }
    });
    
    // 페이지 가시성 변경 시
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        startSessionHeartbeat();
      } else {
        stopSessionHeartbeat();
      }
    });
  }
  
  return session;
}

/**
 * 세션 정보를 간단한 객체로 반환 (하위 호환성)
 */
export interface LegacySessionData {
  sessionId: string;
  startedAt: number;
  lastActivityAt: number;
  pageViews: number;
  isNew: boolean;
}

export function getLegacySessionData(): LegacySessionData {
  const session = getSessionMetadata();
  return {
    sessionId: session.browser.browserId,
    startedAt: session.browser.firstVisitAt,
    lastActivityAt: session.browser.lastActivityAt,
    pageViews: session.browser.totalPageViews,
    isNew: session.browser.isNew
  };
}

/**
 * 디버깅: 현재 세션 상태 확인
 */
export function getSessionDebugInfo() {
  return {
    browser: loadBrowserSession(),
    page: loadPageSession(),
    view: loadViewSession(),
    memoryFallback: {
      browser: memoryBrowserSession,
      page: memoryPageSession,
      view: memoryViewSession
    },
    storage: {
      localStorage: canAccessStorage('localStorage'),
      sessionStorage: canAccessStorage('sessionStorage')
    }
  };
}

function canAccessStorage(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = type === 'localStorage' ? localStorage : sessionStorage;
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}