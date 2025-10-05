import { saveQueue, loadQueue } from "../utils/storage";
import { jitteredBackoff, delay } from "../utils/retry";
import { mapEventToV2, mapBatchToV2 } from "./mapper";
import type { EventPayload, TrackerOptionsV1, TrackerOptionsV2, Transport } from "../types";

/**
 * 이벤트에 고유 ID 부여 (중복 전송 방지)
 */
let eventIdCounter = 0;
function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (++eventIdCounter).toString(36).padStart(4, '0');
  const random = Math.random().toString(36).substring(2, 8);
  return `evt_${timestamp}_${random}_${counter}`;
}

interface QueuedEvent extends EventPayload {
  eventId?: string;       // 이벤트 고유 ID (track 시점에 생성, 중복 방지 1차)
  _queueId?: string;      // 큐 고유 ID (enqueue 시점에 생성, 중복 방지 2차)
  _queuedAt?: number;     // 큐 추가 시각
  _attempts?: number;     // 전송 시도 횟수
}

const SENT_IDS_STORAGE_KEY = '__stl_sent_event_ids';

export class EventQueue {
  private q: QueuedEvent[] = [];
  private flushing = false;
  private stopped = false;
  private attempt = 0;
  private paused = false;
  private sentEventIds = new Set<string>(); // 전송 완료된 이벤트 ID 추적
  private readonly MAX_SENT_IDS = 1000; // sentEventIds 최대 크기 (메모리 누수 방지)

  constructor(
    private opts: Required<Pick<TrackerOptionsV1 | TrackerOptionsV2, "endpoint" | "batchSize" | "retryBaseDelayMs" | "retryMaxDelayMs" | "schemaVersion">> & {
      transportPrimary: Transport;
      transportFallback: Transport;
    }
  ) {
    // sentEventIds 복원 (새로고침 후에도 중복 방지)
    this.loadSentIds();
    
    // restore persisted queue
    const restored = loadQueue();
    if (Array.isArray(restored)) {
      // 복원된 이벤트 중 중복 제거
      const uniqueEvents = (restored as QueuedEvent[]).filter(ev => {
        // eventId 우선 체크 (이벤트 발생 시점 ID)
        const idToCheck = ev.eventId || ev._queueId;
        
        if (idToCheck && this.sentEventIds.has(idToCheck)) {
          if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.warn('[EventQueue] ⚠️ Skipping duplicate event on restore:', idToCheck);
          }
          return false;
        }
        return true;
      });
      
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.log(`[EventQueue] Restored ${uniqueEvents.length}/${restored.length} events (${restored.length - uniqueEvents.length} duplicates removed)`);
      }
      
      this.q.push(...uniqueEvents);
    }
    this.persist();
  }

  enqueue(ev: any, maxQueueSize: number) {
    // 1차 중복 체크: eventId로 이미 큐에 있는지 확인
    if (ev.eventId) {
      const existsInQueue = this.q.some(queuedEv => queuedEv.eventId === ev.eventId);
      if (existsInQueue) {
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.warn('[EventQueue] 🚫 Duplicate eventId detected, skipping enqueue:', ev.eventId);
        }
        return; // 중복이면 큐에 추가하지 않음
      }
      
      // 2차 중복 체크: 이미 전송된 이벤트인지 확인
      if (this.sentEventIds.has(ev.eventId)) {
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.warn('[EventQueue] 🚫 Event already sent, skipping enqueue:', ev.eventId);
        }
        return; // 이미 전송됨, 큐에 추가하지 않음
      }
    }
    
    // 이벤트에 큐 메타데이터 추가
    const queuedEvent: QueuedEvent = {
      ...ev,
      _queueId: ev.eventId || generateEventId(), // eventId가 있으면 사용, 없으면 생성
      _queuedAt: Date.now(),
      _attempts: 0
    };
    
    this.q.push(queuedEvent);
    
    if (this.q.length > maxQueueSize) {
      const removed = this.q.shift();
      // 제거된 이벤트는 전송 기록에서도 제거 (큐 초과로 삭제)
      if (removed?.eventId) {
        this.sentEventIds.delete(removed.eventId);
      } else if (removed?._queueId) {
        this.sentEventIds.delete(removed._queueId);
      }
    }
    
    this.persist();
  }

  size() { return this.q.length; }

  /** 페이지 숨김/비포커스 시 호출 */
  pause() { this.paused = true; }

  /** 다시 보이기/포커스 시 호출 */
  resume() { this.paused = false; }

  stop() { this.stopped = true; }

  isPaused() { return this.paused; }
  isStopped() { return this.stopped; }

  async flushLoop(intervalMs: number) {
    while (!this.stopped) {
      try {
        // ★ pause면 flushOnce 자체를 건너뜀
        if (!this.paused) {
          await this.flushOnce();
        }
      } catch (error) {
        // TODO: Add error reporting/monitoring
        // TODO: Consider circuit breaker pattern for repeated failures
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.error('[EventQueue] Flush error:', error);
        }
      }
      await delay(intervalMs); // 기존 딜레이 유틸
    }
  }

  async flushOnce() {
    if (this.flushing || this.q.length === 0) return;

    this.flushing = true;
    try {
      const batch = this.q.slice(0, this.opts.batchSize);
      
      // 중복 전송 방지: 이미 전송된 이벤트 필터링
      const unsent = batch.filter(ev => {
        // eventId 우선 체크 (이벤트 발생 시점 ID)
        const idToCheck = ev.eventId || ev._queueId;
        
        if (idToCheck && this.sentEventIds.has(idToCheck)) {
          if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.warn('[EventQueue] 🚫 Duplicate event detected, skipping:', idToCheck);
          }
          return false;
        }
        return true;
      });
      
      if (unsent.length === 0) {
        // 모두 중복이면 큐에서 제거만 하고 종료
        this.q.splice(0, batch.length);
        this.persist();
        return;
      }
      
      // 전송 전에 이벤트 ID 수집
      const eventIds = unsent
        .map(ev => ev.eventId || ev._queueId)  // eventId 우선
        .filter((id): id is string => id !== undefined);
      
      // 내부 메타데이터 제거 (_로 시작하는 필드)
      const cleanEvents = unsent.map(ev => {
        const { _queueId, _queuedAt, _attempts, ...cleanEvent } = ev;
        return cleanEvent;
      });
      
      // V2 스키마로 변환 (필요한 경우)
      const payload = this.opts.schemaVersion === 'v2' 
        ? mapBatchToV2({ events: cleanEvents })
        : { events: cleanEvents };

      // V2의 경우 엔드포인트에 버전 표시
      const endpoint = this.opts.schemaVersion === 'v2'
        ? this.opts.endpoint + (this.opts.endpoint.includes('?') ? '&' : '?') + 'schema=v2'
        : this.opts.endpoint;

      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.log(`[EventQueue] Sending ${unsent.length} events (${eventIds.length} unique)`);
      }

      let res = await this.opts.transportPrimary(endpoint, payload);
      if (!res.ok) res = await this.opts.transportFallback(endpoint, payload);

      if (res.ok) {
        // 전송 성공: 이벤트 ID를 sentEventIds에 추가
        eventIds.forEach(id => {
          this.sentEventIds.add(id);
          
          // sentEventIds 크기 제한 (FIFO: 오래된 것부터 제거)
          if (this.sentEventIds.size > this.MAX_SENT_IDS) {
            const firstId = this.sentEventIds.values().next().value;
            this.sentEventIds.delete(firstId as string);
          }
        });
        
        // 큐에서 제거
        const removedCount = batch.length;
        this.q.splice(0, removedCount);
        
        // persist 실패 시에도 메모리 큐는 정리되었으므로 계속 진행
        try {
          this.persist();
        } catch (error) {
          if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.error('[EventQueue] persist failed after successful send, but events removed from memory queue');
          }
        }
        
        this.attempt = 0;
        
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.log(`[EventQueue] ✅ Sent ${unsent.length} events. Queue: ${this.q.length}, Sent IDs: ${this.sentEventIds.size}`);
        }
      } else {
        // 전송 실패: 재시도 횟수 증가
        batch.forEach(ev => {
          ev._attempts = (ev._attempts || 0) + 1;
        });
        
        this.attempt++;
        const serverRetry = res.retryAfterMs ?? 0;
        const backoff = jitteredBackoff(this.attempt, this.opts.retryBaseDelayMs, this.opts.retryMaxDelayMs);
        const wait = Math.max(serverRetry, backoff);
        
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.warn(`[EventQueue] Send failed (attempt ${this.attempt}), retrying in ${wait}ms`);
        }
        
        await delay(wait);
      }
    } finally {
      this.flushing = false;
    }
  }

  private persist() {
    try {
      saveQueue(this.q);
      this.persistSentIds(); // sentEventIds도 저장
    } catch (error) {
      // TODO: Implement fallback persistence strategy (IndexedDB, in-memory only)
      // TODO: Notify user about storage issues
      // localStorage 비활성화 또는 쿼터 초과 처리
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.error('[EventQueue] Failed to persist queue:', error);
      }
    }
  }

  /**
   * sentEventIds를 localStorage에 저장 (새로고침 후에도 중복 방지)
   */
  private persistSentIds() {
    try {
      const idsArray = Array.from(this.sentEventIds).slice(-this.MAX_SENT_IDS);
      localStorage.setItem(SENT_IDS_STORAGE_KEY, JSON.stringify(idsArray));
    } catch (error) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn('[EventQueue] Failed to persist sent IDs');
      }
    }
  }

  /**
   * sentEventIds를 localStorage에서 복원
   */
  private loadSentIds() {
    try {
      const stored = localStorage.getItem(SENT_IDS_STORAGE_KEY);
      if (stored) {
        const idsArray = JSON.parse(stored) as string[];
        this.sentEventIds = new Set(idsArray);
        
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.log(`[EventQueue] Loaded ${this.sentEventIds.size} sent event IDs from storage`);
        }
      }
    } catch (error) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn('[EventQueue] Failed to load sent IDs, starting fresh');
      }
    }
  }
}