// TODO: Make storage key configurable to support multiple tracker instances
const KEY = "__stl_tracker_queue_v1";

export type Persisted = { events: unknown[] };

export function loadQueue(): unknown[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Persisted;
    // 데이터 검증 강화
    return Array.isArray(data.events) ? data.events : [];
  } catch (error) {
    // TODO: Add structured error logging
    // TODO: Consider fallback storage (IndexedDB)
    // 오류 발생 시 로컬스토리지 클리어
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error('[Storage] Failed to load queue:', error);
    }
    try {
      localStorage.removeItem(KEY);
    } catch (clearError) {
      // TODO: Handle cases where localStorage is completely unavailable
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
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch (error) {
    // TODO: Implement quota management strategy
    // TODO: Add metrics for storage failures
    // quota 초과 시 오래된 이벤트 삭제
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[Storage] Quota exceeded, attempting to save half:', error);
    }
    try {
      const halfEvents = events.slice(Math.floor(events.length / 2));
      localStorage.setItem(KEY, JSON.stringify({ events: halfEvents }));
    } catch (retryError) {
      // TODO: Fallback to in-memory queue or disable persistence
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.error('[Storage] Failed to save even after reducing size:', retryError);
      }
    }
  }
}