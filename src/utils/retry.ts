/** 안전한 난수 (가능하면 crypto 사용) */
function rand(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const u = new Uint32Array(1);
    crypto.getRandomValues(u);
    return u[0] / 2 ** 32; // [0,1)
  }
  return Math.random();
}

/**
 * Exponential Backoff with Full Jitter (권장)
 * 참고: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 *
 * attempt: 1부터 시작하는 재시도 횟수
 * baseMs : 기본 지연(예: 1000ms)
 * maxMs  : 상한(예: 30000ms)
 *
 * 결과: 0 ~ min(maxMs, baseMs * 2^(attempt-1)) 사이의 랜덤 값
 */
export function jitteredBackoff(attempt: number, baseMs: number, maxMs: number): number {
  const a = Math.max(1, Math.floor(attempt));
  const base = Math.max(0, Math.floor(baseMs));
  const cap = Math.max(base, Math.floor(maxMs));
  const exp = Math.min(cap, base * (2 ** (a - 1)));
  return Math.floor(rand() * exp);
}

/** Decorrelated Jitter (선호 시 대체 사용)
 * prev: 이전 지연값, 없으면 baseMs
 * return: min(maxMs, rand(baseMs, prev*3))
 */
export function decorrelatedJitter(prev: number | undefined, baseMs: number, maxMs: number): number {
  const base = Math.max(0, Math.floor(baseMs));
  const cap = Math.max(base, Math.floor(maxMs));
  const low = base;
  const high = Math.max(base, Math.floor((prev ?? base) * 3));
  const next = Math.floor(low + rand() * (high - low));
  return Math.min(cap, next);
}

/** Promise 기반 sleep */
export function delay(ms: number): Promise<void> {
  const t = Math.max(0, Math.floor(ms));
  return new Promise<void>((resolve) => setTimeout(resolve, t));
}