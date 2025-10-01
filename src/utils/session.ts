/**
 * 세션 관리 유틸리티
 * 브라우저 세션 동안 유지되는 고유하고 안전한 세션 ID를 생성/관리합니다.
 */

const SESSION_KEY = "__stl_tracker_session_v1";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30분 비활성 후 새 세션

export interface SessionData {
  sessionId: string;
  startedAt: number;
  lastActivityAt: number;
  pageViews: number;
  isNew: boolean;
  lastHeartbeatAt?: number;
  heartbeatCount?: number;
}

/**
 * 암호학적으로 안전한 고유 세션 ID 생성
 * Format: {timestamp}-{random}-{counter}
 * 예: 17a8b9c12ef-4f3a2b1c8d9e-0001
 */
function generateSecureSessionId(): string {
  // 1. 타임스탬프 부분 (36진법으로 변환하여 길이 단축)
  const timestamp = Date.now().toString(36);
  
  // 2. 암호학적으로 안전한 랜덤 부분
  let randomPart: string;
  
  // crypto.randomUUID 지원 확인 (대부분의 최신 브라우저)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // UUID v4 사용 (충돌 가능성 극히 낮음)
    randomPart = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // 폴백: crypto.getRandomValues 사용
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    randomPart = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    // 최후의 폴백 (보안성 낮음, 개발 환경용)
    console.warn('[Session] crypto API not available, using Math.random (not secure)');
    randomPart = Math.random().toString(36).substring(2, 18) + 
                 Math.random().toString(36).substring(2, 18);
    randomPart = randomPart.substring(0, 16);
  }
  
  // 3. 카운터 부분 (동일 밀리초 내 중복 방지)
  const counter = getSessionCounter();
  
  // 조합: timestamp-random-counter
  return `${timestamp}-${randomPart}-${counter.toString(36).padStart(4, '0')}`;
}

/**
 * 세션 내 카운터 관리 (동일 밀리초 내 중복 방지)
 */
let sessionCounter = 0;
let lastCounterReset = 0;

function getSessionCounter(): number {
  const now = Date.now();
  if (now !== lastCounterReset) {
    sessionCounter = 0;
    lastCounterReset = now;
  }
  return ++sessionCounter;
}

/**
 * 세션 데이터 로드
 */
function loadSession(): SessionData | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored) as SessionData;
    
    // 세션 만료 체크 (30분 비활성)
    const now = Date.now();
    if (now - session.lastActivityAt > SESSION_TTL_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    
    return session;
  } catch (error) {
    // sessionStorage 접근 실패 또는 파싱 오류
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error('[Session] Failed to load session:', error);
    }
    return null;
  }
}

/**
 * 세션 데이터 저장
 */
function saveSession(session: SessionData): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    // sessionStorage 쓰기 실패 (용량 초과 등)
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error('[Session] Failed to save session:', error);
    }
  }
}

/**
 * 세션 초기화 또는 기존 세션 로드
 * @param incrementPageView - pageView를 증가시킬지 여부 (기본값: false)
 */
export function initSession(incrementPageView: boolean = false): SessionData {
  // 기존 세션 확인
  let session = loadSession();
  
  if (!session) {
    // 새 세션 생성
    const now = Date.now();
    session = {
      sessionId: generateSecureSessionId(),
      startedAt: now,
      lastActivityAt: now,
      pageViews: 1,
      isNew: true
    };
    saveSession(session);
  } else {
    // 기존 세션 업데이트
    session.lastActivityAt = Date.now();
    if (incrementPageView) {
      session.pageViews++;
    }
    session.isNew = false;
    saveSession(session);
  }
  
  return session;
}

/**
 * 현재 세션 ID 가져오기 (세션이 없으면 생성)
 */
export function getSessionId(): string {
  const session = initSession(false);  // pageView 증가하지 않음
  return session.sessionId;
}

/**
 * 세션 활동 업데이트 (타임아웃 방지)
 */
export function touchSession(): void {
  const session = loadSession();
  if (session) {
    session.lastActivityAt = Date.now();
    saveSession(session);
  }
}

/**
 * 페이지뷰 수동 증가
 */
export function incrementPageView(): void {
  const session = loadSession();
  if (session) {
    session.pageViews++;
    session.lastActivityAt = Date.now();
    saveSession(session);
    
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log('[Session] PageView incremented to', session.pageViews);
    }
  }
}

/**
 * 세션 하트비트 - 페이지가 활성 상태일 때만 동작
 */
let heartbeatInterval: number | undefined;
let lastHeartbeat = 0;

function startSessionHeartbeat() {
  // 이미 실행 중이면 중단
  if (heartbeatInterval) return;
  
  // 5초마다 세션 갱신 (페이지가 보이는 동안)
  heartbeatInterval = window.setInterval(() => {
    // 페이지가 숨겨져 있으면 하트비트 스킵
    if (document.visibilityState === 'hidden') {
      return;
    }
    
    // 페이지가 백그라운드 탭이어도 visible 상태면 세션 유지
    const now = Date.now();
    
    // 마지막 하트비트로부터 5초 이상 지났을 때만
    if (now - lastHeartbeat > 5000) {
      const session = loadSession();
      if (session) {
        session.lastActivityAt = now;
        session.lastHeartbeatAt = now;
        session.heartbeatCount = (session.heartbeatCount || 0) + 1;
        saveSession(session);
        lastHeartbeat = now;
        
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.log('[Session] Heartbeat #' + session.heartbeatCount + ' - keeping session alive');
        }
      }
    }
  }, 5000);
}

function stopSessionHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = undefined;
  }
}

/**
 * 세션 메타데이터 가져오기
 */
export function getSessionMetadata(): SessionData | null {
  return loadSession();
}

/**
 * 세션 강제 리셋 (테스트용)
 */
export function resetSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * 세션 정보를 컨텍스트 객체로 변환
 */
export function getSessionContext(): Record<string, unknown> {
  const session = loadSession();
  if (!session) return {};
  
  return {
    sessionId: session.sessionId,
    sessionStart: new Date(session.startedAt).toISOString(),
    sessionDuration: Date.now() - session.startedAt,
    pageViews: session.pageViews,
    isNewSession: session.isNew
  };
}

/**
 * 세션 통계 정보 가져오기
 */
export function getSessionStats() {
  const session = loadSession();
  if (!session) return null;
  
  const now = Date.now();
  const duration = now - session.startedAt;
  const idleTime = now - session.lastActivityAt;
  const timeSinceLastHeartbeat = session.lastHeartbeatAt ? now - session.lastHeartbeatAt : null;
  
  return {
    sessionId: session.sessionId,
    duration,
    durationFormatted: formatDuration(duration),
    idleTime,
    idleTimeFormatted: formatDuration(idleTime),
    pageViews: session.pageViews,
    avgTimePerPage: Math.round(duration / session.pageViews),
    willExpireIn: SESSION_TTL_MS - idleTime,
    heartbeatCount: session.heartbeatCount || 0,
    lastHeartbeatAt: session.lastHeartbeatAt,
    timeSinceLastHeartbeat,
    heartbeatActive: heartbeatInterval !== undefined,
    pageVisible: typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  };
}

/**
 * 시간 포맷팅 헬퍼
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// 페이지 활동 시 자동으로 세션 갱신
if (typeof window !== 'undefined') {
  // 사용자 상호작용 시 세션 터치 (하트비트와 별개로 동작)
  const activityEvents = ['click', 'scroll', 'keypress', 'pointermove', 'touchstart'];
  let lastActivity = 0;
  
  const handleActivity = () => {
    const now = Date.now();
    // 10초마다 한 번씩만 업데이트 (과도한 쓰기 방지)
    if (now - lastActivity > 10000) {
      touchSession();
      lastActivity = now;
      
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.log('[Session] User activity detected - session refreshed');
      }
    }
  };
  
  activityEvents.forEach(event => {
    window.addEventListener(event, handleActivity, { passive: true, capture: true });
  });
  
  // 페이지 가시성 변화에 따른 하트비트 관리
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // 페이지가 보이면 세션 체크 및 하트비트 시작 (pageView 증가 안 함)
      const session = initSession(false);
      startSessionHeartbeat();
      
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.log('[Session] Page visible - heartbeat started');
      }
    } else {
      // 페이지가 숨겨지면 하트비트 중지 (세션은 유지)
      stopSessionHeartbeat();
      touchSession(); // 마지막 활동 시간 기록
      
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.log('[Session] Page hidden - heartbeat stopped');
      }
    }
  });
  
  // 창 포커스/블러 이벤트 (보조)
  window.addEventListener('focus', () => {
    // 포커스를 받으면 하트비트 재개
    if (document.visibilityState === 'visible') {
      startSessionHeartbeat();
    }
  });
  
  window.addEventListener('blur', () => {
    // 포커스를 잃어도 visible이면 하트비트 유지
    // (다른 창으로 전환해도 화면에 보이면 세션 유지)
  });
  
  // 페이지 언로드 시 정리
  window.addEventListener('beforeunload', () => {
    stopSessionHeartbeat();
    touchSession(); // 마지막 활동 기록
  });
  
  // 초기 실행: 페이지 로드 시 pageView 증가 및 하트비트 시작
  if (document.visibilityState === 'visible') {
    // 페이지 로드 시에만 pageView 증가
    initSession(true);
    startSessionHeartbeat();
    
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log('[Session] Page loaded - session initialized with pageView increment');
    }
  }
}
