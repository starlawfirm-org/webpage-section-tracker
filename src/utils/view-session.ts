/**
 * View Session 관리 유틸리티
 * 페이지 뷰 단위로 생성/소멸되는 임시 세션
 * - 페이지 로드 시 생성
 * - 페이지 언로드(새로고침, 뒤로가기, 탭 닫기) 시 만료
 * - 메모리에서만 관리 (Storage 사용 안 함)
 */

import { getSessionId } from "./session";

export interface ViewSessionData {
  viewSessionId: string;
  parentSessionId: string;  // 부모 세션 ID (브라우저 세션)
  startedAt: number;
  url: string;
  referrer: string;
  isActive: boolean;
  events: Array<{
    type: string;
    timestamp: number;
    data?: any;
  }>;
  interactions: {
    clicks: number;
    scrolls: number;
    keypresses: number;
    mouseMoves: number;
    touches: number;
  };
  maxScrollDepth: number;
  timeOnPage: number;
  lastActivityAt: number;
}

// 메모리에서만 관리되는 View Session
let currentViewSession: ViewSessionData | null = null;
let viewSessionTimer: number | undefined;

/**
 * View Session ID 생성
 * Format: vs_{timestamp}_{random}
 */
function generateViewSessionId(): string {
  const timestamp = Date.now().toString(36);
  
  let randomPart: string;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    randomPart = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    randomPart = Math.random().toString(36).substring(2, 14);
  }
  
  return `vs_${timestamp}_${randomPart}`;
}

/**
 * 새로운 View Session 생성
 */
export function createViewSession(): ViewSessionData {
  const now = Date.now();
  
  // 이전 세션이 있으면 종료
  if (currentViewSession) {
    endViewSession();
  }
  
  currentViewSession = {
    viewSessionId: generateViewSessionId(),
    parentSessionId: getSessionId(),  // 브라우저 세션과 연결
    startedAt: now,
    url: window.location.href,
    referrer: document.referrer || '',
    isActive: true,
    events: [],
    interactions: {
      clicks: 0,
      scrolls: 0,
      keypresses: 0,
      mouseMoves: 0,
      touches: 0
    },
    maxScrollDepth: 0,
    timeOnPage: 0,
    lastActivityAt: now
  };
  
  // View Session 타이머 시작 (1초마다 시간 업데이트)
  viewSessionTimer = window.setInterval(() => {
    if (currentViewSession && currentViewSession.isActive) {
      const now = Date.now();
      currentViewSession.timeOnPage = now - currentViewSession.startedAt;
      currentViewSession.lastActivityAt = now;
    }
  }, 1000);
  
  // 스크롤 깊이 추적
  updateScrollDepth();
  
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log('[ViewSession] Created:', currentViewSession.viewSessionId);
  }
  
  return currentViewSession;
}

/**
 * View Session 종료
 */
export function endViewSession(): ViewSessionData | null {
  if (!currentViewSession) return null;
  
  currentViewSession.isActive = false;
  const endedSession = { ...currentViewSession };
  
  // 타이머 정리
  if (viewSessionTimer) {
    clearInterval(viewSessionTimer);
    viewSessionTimer = undefined;
  }
  
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log('[ViewSession] Ended:', endedSession.viewSessionId, {
      duration: endedSession.timeOnPage,
      events: endedSession.events.length,
      interactions: endedSession.interactions
    });
  }
  
  currentViewSession = null;
  return endedSession;
}

/**
 * 현재 View Session 가져오기
 */
export function getCurrentViewSession(): ViewSessionData | null {
  return currentViewSession;
}

/**
 * View Session ID 가져오기
 */
export function getViewSessionId(): string | null {
  return currentViewSession?.viewSessionId || null;
}

/**
 * View Session에 이벤트 추가
 */
export function trackViewSessionEvent(type: string, data?: any): void {
  if (!currentViewSession || !currentViewSession.isActive) return;
  
  currentViewSession.events.push({
    type,
    timestamp: Date.now(),
    data
  });
  
  currentViewSession.lastActivityAt = Date.now();
}

/**
 * 상호작용 카운트 증가
 */
export function incrementInteraction(type: keyof ViewSessionData['interactions']): void {
  if (!currentViewSession || !currentViewSession.isActive) return;
  
  currentViewSession.interactions[type]++;
  currentViewSession.lastActivityAt = Date.now();
}

/**
 * 스크롤 깊이 업데이트
 */
function updateScrollDepth(): void {
  if (!currentViewSession || !currentViewSession.isActive) return;
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;
  
  if (scrollHeight > clientHeight) {
    const scrollPercentage = ((scrollTop + clientHeight) / scrollHeight) * 100;
    currentViewSession.maxScrollDepth = Math.max(
      currentViewSession.maxScrollDepth,
      Math.round(scrollPercentage)
    );
  }
}

/**
 * View Session 통계
 */
export function getViewSessionStats() {
  if (!currentViewSession) return null;
  
  const now = Date.now();
  const duration = now - currentViewSession.startedAt;
  
  return {
    viewSessionId: currentViewSession.viewSessionId,
    parentSessionId: currentViewSession.parentSessionId,
    url: currentViewSession.url,
    duration,
    durationFormatted: formatDuration(duration),
    eventCount: currentViewSession.events.length,
    interactions: currentViewSession.interactions,
    totalInteractions: Object.values(currentViewSession.interactions).reduce((a, b) => a + b, 0),
    maxScrollDepth: currentViewSession.maxScrollDepth,
    isActive: currentViewSession.isActive,
    engagementScore: calculateEngagementScore(currentViewSession)
  };
}

/**
 * Engagement Score 계산 (0-100)
 */
function calculateEngagementScore(session: ViewSessionData): number {
  const timeScore = Math.min(30, session.timeOnPage / 2000); // 최대 30점 (60초 = 30점)
  const scrollScore = Math.min(25, session.maxScrollDepth / 4); // 최대 25점 (100% = 25점)
  const interactionScore = Math.min(25, Object.values(session.interactions).reduce((a, b) => a + b, 0) * 2); // 최대 25점
  const eventScore = Math.min(20, session.events.length * 2); // 최대 20점
  
  return Math.round(timeScore + scrollScore + interactionScore + eventScore);
}

/**
 * 시간 포맷팅
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// 자동 초기화 및 이벤트 리스너
if (typeof window !== 'undefined') {
  // 페이지 로드 시 View Session 생성
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createViewSession();
    });
  } else {
    // 이미 로드된 경우
    createViewSession();
  }
  
  // 상호작용 추적
  let lastScrollTime = 0;
  let lastMouseMoveTime = 0;
  
  window.addEventListener('click', () => {
    incrementInteraction('clicks');
    trackViewSessionEvent('click', {
      target: event?.target ? (event.target as HTMLElement).tagName : null
    });
  }, { passive: true });
  
  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScrollTime > 1000) { // 1초에 한 번만 카운트
      incrementInteraction('scrolls');
      updateScrollDepth();
      lastScrollTime = now;
    }
  }, { passive: true });
  
  window.addEventListener('keypress', () => {
    incrementInteraction('keypresses');
  }, { passive: true });
  
  window.addEventListener('mousemove', () => {
    const now = Date.now();
    if (now - lastMouseMoveTime > 2000) { // 2초에 한 번만 카운트
      incrementInteraction('mouseMoves');
      lastMouseMoveTime = now;
    }
  }, { passive: true });
  
  window.addEventListener('touchstart', () => {
    incrementInteraction('touches');
  }, { passive: true });
  
  // 페이지 언로드 시 View Session 종료
  window.addEventListener('pagehide', () => {
    const endedSession = endViewSession();
    if (endedSession) {
      // 마지막 이벤트로 세션 종료 기록
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon('/collect/view-session-end', JSON.stringify({
          viewSession: endedSession,
          parentSessionId: endedSession.parentSessionId
        }));
      }
    }
  });
  
  window.addEventListener('beforeunload', () => {
    endViewSession();
  });
  
  // 페이지 가시성 변화 추적
  document.addEventListener('visibilitychange', () => {
    if (currentViewSession) {
      trackViewSessionEvent('visibility_change', {
        visibilityState: document.visibilityState,
        hidden: document.hidden
      });
    }
  });
}
