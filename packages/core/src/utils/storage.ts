/**
 * 이벤트 큐 저장소 (v2.0)
 * 
 * v2.0 변경사항:
 * - localStorage → sessionStorage (탭별 격리)
 * - 탭별 독립적인 큐 관리
 * - 탭 간 오염 방지
 */
const QUEUE_KEY_V2 = "__stl_tracker_queue_v2";
const QUEUE_KEY_V1 = "__stl_tracker_queue_v1";  // 마이그레이션용

export type Persisted = { events: unknown[] };

export function loadQueue(): unknown[] {
  try {
    // v2 sessionStorage에서 로드 (탭별 격리)
    const raw = sessionStorage.getItem(QUEUE_KEY_V2);
    if (raw) {
      const data = JSON.parse(raw) as Persisted;
      return Array.isArray(data.events) ? data.events : [];
    }
    
    // v1 마이그레이션: localStorage에서 한 번만 가져오고 삭제
    const v1Raw = localStorage.getItem(QUEUE_KEY_V1);
    if (v1Raw) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.log('[Storage] Migrating v1 queue from localStorage to sessionStorage');
      }
      
      const data = JSON.parse(v1Raw) as Persisted;
      const events = Array.isArray(data.events) ? data.events : [];
      
      // v1 localStorage 삭제 (더 이상 사용 안 함)
      try {
        localStorage.removeItem(QUEUE_KEY_V1);
      } catch {
        // Ignore
      }
      
      // v2 sessionStorage에 저장
      if (events.length > 0) {
        sessionStorage.setItem(QUEUE_KEY_V2, JSON.stringify({ events }));
      }
      
      return events;
    }
    
    return [];
  } catch (error) {
    // 오류 발생 시 sessionStorage 클리어
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error('[Storage] Failed to load queue:', error);
    }
    try {
      sessionStorage.removeItem(QUEUE_KEY_V2);
    } catch (clearError) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.error('[Storage] Failed to clear corrupted data:', clearError);
      }
    }
    return [];
  }
}

export function saveQueue(events: unknown[]) {
  try {
    // 이벤트 개수 제한
    const MAX_EVENTS = 1000;
    const eventsToSave = events.slice(-MAX_EVENTS);
    const payload: Persisted = { events: eventsToSave };
    
    // sessionStorage 사용 (탭별 격리)
    sessionStorage.setItem(QUEUE_KEY_V2, JSON.stringify(payload));
  } catch (error) {
    // quota 초과 시 오래된 이벤트 삭제
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[Storage] Quota exceeded, attempting to save half:', error);
    }
    try {
      const halfEvents = events.slice(Math.floor(events.length / 2));
      sessionStorage.setItem(QUEUE_KEY_V2, JSON.stringify({ events: halfEvents }));
    } catch (retryError) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.error('[Storage] Failed to save even after reducing size:', retryError);
      }
    }
  }
}