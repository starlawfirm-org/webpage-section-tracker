import { saveQueue, loadQueue } from "../utils/storage";
import { jitteredBackoff, delay } from "../utils/retry";
import { mapEventToV2, mapBatchToV2 } from "./mapper";
import type { EventPayload, TrackerOptions, Transport } from "../types";

export class EventQueue {
  private q: EventPayload[] = [];
  private flushing = false;
  private stopped = false;
  private attempt = 0;
  private paused = false;

  constructor(
    private opts: Required<Pick<TrackerOptions, "endpoint" | "batchSize" | "retryBaseDelayMs" | "retryMaxDelayMs" | "schemaVersion">> & {
      transportPrimary: Transport;
      transportFallback: Transport;
    }
  ) {
    // restore persisted
    const restored = loadQueue();
    if (Array.isArray(restored)) this.q.push(...(restored as EventPayload[]));
    this.persist();
  }

  enqueue(ev: any, maxQueueSize: number) {
    this.q.push(ev);
    if (this.q.length > maxQueueSize) this.q.shift();
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
      } catch { }
      await delay(intervalMs); // 기존 딜레이 유틸
    }
  }

  async flushOnce() {
    if (this.flushing || this.q.length === 0) return;

    this.flushing = true;
    try {
      const batch = this.q.slice(0, this.opts.batchSize);
      
      // V2 스키마로 변환 (필요한 경우)
      const payload = this.opts.schemaVersion === 'v2' 
        ? mapBatchToV2({ events: batch })
        : { events: batch };

      // V2의 경우 엔드포인트에 버전 표시
      const endpoint = this.opts.schemaVersion === 'v2'
        ? this.opts.endpoint + (this.opts.endpoint.includes('?') ? '&' : '?') + 'schema=v2'
        : this.opts.endpoint;

      let res = await this.opts.transportPrimary(endpoint, payload);
      if (!res.ok) res = await this.opts.transportFallback(endpoint, payload);

      if (res.ok) {
        this.q.splice(0, batch.length);
        this.persist();
        this.attempt = 0;
      } else {
        this.attempt++;
        const serverRetry = res.retryAfterMs ?? 0;
        const backoff = jitteredBackoff(this.attempt, this.opts.retryBaseDelayMs, this.opts.retryMaxDelayMs);
        const wait = Math.max(serverRetry, backoff);
        await delay(wait);
      }
    } finally {
      this.flushing = false;
    }
  }

  private persist() {
    try {
      saveQueue(this.q);
    } catch { 
      // localStorage 비활성화 또는 쿼터 초과 처리
    }
  }
}