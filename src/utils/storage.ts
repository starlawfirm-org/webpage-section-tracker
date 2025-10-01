const KEY = "__stl_tracker_queue_v1";

export type Persisted = { events: unknown[] };

export function loadQueue(): unknown[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Persisted;
    // 데이터 검증 강화
    return Array.isArray(data.events) ? data.events : [];
  } catch {
    // 오류 발생 시 로컬스토리지 클리어
    try {
      localStorage.removeItem(KEY);
    } catch { }
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
  } catch {
    // quota 초과 시 오래된 이벤트 삭제
    try {
      const halfEvents = events.slice(Math.floor(events.length / 2));
      localStorage.setItem(KEY, JSON.stringify({ events: halfEvents }));
    } catch { }
  }
}