import { Tracker } from "../core/tracker";
import type { ElementDwellConfig, ElementDwellSnapshot } from "./element-dwell.types";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));


function nthPath(el: Element): string | undefined {
  try {
    const parts: string[] = [];
    let cur: Element | null = el;
    while (cur && cur.parentElement) {
      const tag = cur.tagName.toLowerCase();
      const sibs = Array.from(cur.parentElement.children)
        .filter(c => (c as Element).tagName === cur!.tagName);
      const idx = sibs.indexOf(cur) + 1;
      parts.push(`${tag}[${idx}]`);
      cur = cur.parentElement;
    }
    return parts.reverse().join("/");
  } catch { return undefined; }
}

function collectDataAttrs(
  el: Element,
  allow: string[] = [],
  maxCount = 5
): Record<string, string> {
  const out: Record<string, string> = {};
  const attrs = Array.from(el.attributes)
    .filter(a => a.name.startsWith("data-"));
  for (const a of attrs) {
    if (allow.length && !allow.includes(a.name)) continue; // 허용리스트
    out[a.name] = a.value.slice(0, 200); // 값 길이 제한 (예: 200자)
    if (Object.keys(out).length >= maxCount) break;
  }
  return out;
}

function buildStableSelector(el: Element): string | undefined {
  try {
    const id = (el as HTMLElement).id;
    if (id) return `#${id}`;
    // 간단 nth-of-type 체인
    let s = el.tagName.toLowerCase();
    let cur: Element | null = el;
    while (cur && cur.parentElement && cur !== document.body) {
      const tag = cur.tagName.toLowerCase();
      const sibs = Array.from(cur.parentElement.children)
        .filter(c => (c as Element).tagName === cur!.tagName);
      const idx = sibs.indexOf(cur) + 1;
      s = `${tag}:nth-of-type(${idx})${s ? " > " + s : ""}`;
      cur = cur.parentElement;
    }
    return s;
  } catch { return undefined; }
}


export interface ElementDwellController {
  stop(): void;
  getSnapshots(): ElementDwellSnapshot[];
}

type Internal = {
  el: Element;
  cfg: Required<ElementDwellConfig> & { heartbeat: { enabled: boolean; intervalMs: number } };
  state: ElementDwellSnapshot & { lastVisibleAtMs?: number; lastProgressAtMs?: number, hiddenAtMs?: number; };
  lastEntry?: IntersectionObserverEntry;
  hbId?: number; // heartbeat interval id
  hbCurrentMs?: number;     // ← 현재 하트비트 주기(적응형)
  lastScrollAt?: number;    // ← 최근 스크롤 감지 시각(공유 리셋 기준)
  hbTid?: number;          // heartbeat timeout id (setTimeout)
  hbNextMs?: number;       // 다음 틱까지 남은 주기
  firstEmitTimer?: number;
  firstEmitArming?: boolean;   // 가드 진행 중
  interacted?: boolean;        // 사용자 상호작용 감지
};



// 동적 threshold 계산 함수
function calculateThresholds(config: ElementDwellConfig): number[] {
  const baseThresholds = [0, 0.25, 0.5, 0.75, 1];
  
  if (config.trigger.mode === 'immediate') {
    if (config.trigger.margin) {
      if (config.trigger.margin.includes('px')) {
        // 픽셀 마진: 정밀한 threshold 계산
        const marginPx = Math.abs(parseFloat(config.trigger.margin));
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
        const marginRatio = marginPx / viewportHeight;
        
        // 마진 영역을 제외한 내부 영역의 경계점들
        return [
          0,                    // 완전히 보이기 시작
          marginRatio * 0.5,    // 마진 경계 근처
          marginRatio,          // 마진 경계 도달
          0.5,                  // 중간점
          1 - marginRatio,      // 반대편 마진 경계
          1 - marginRatio * 0.5, // 반대편 마진 경계 근처
          1                     // 완전히 보임
        ].filter(t => t >= 0 && t <= 1);
      } else if (config.trigger.margin.includes('%')) {
        // 퍼센트 마진: coverage 기반 threshold
        const marginPct = Math.abs(parseFloat(config.trigger.margin)) / 100;
        return [0, marginPct * 0.5, marginPct, 0.5, 1 - marginPct, 1 - marginPct * 0.5, 1]
          .filter(t => t >= 0 && t <= 1);
      }
    }
    // margin 없으면 간단한 threshold
    return [0, 0.1, 0.5, 0.9, 1];
  }
  
  if (config.trigger.mode === 'elementCoverage') {
    // elementCoverage: trigger.value 주변에 집중
    const target = config.trigger.value;
    return [
      0,
      Math.max(0, target - 0.15),
      Math.max(0, target - 0.05),
      target,
      Math.min(1, target + 0.05),
      Math.min(1, target + 0.15),
      1
    ].filter(t => t >= 0 && t <= 1);
  }
  
  if (config.trigger.mode === 'viewportPosition') {
    // viewportPosition: trigger.value 주변에 집중
    const target = config.trigger.value;
    return [
      0,
      Math.max(0, target - 0.15),
      Math.max(0, target - 0.05),
      target,
      Math.min(1, target + 0.05),
      Math.min(1, target + 0.15),
      1
    ].filter(t => t >= 0 && t <= 1);
  }
  
  return baseThresholds;
}

// Threshold 병합 및 최적화 (최대 10개로 제한)
function optimizeThresholds(allThresholds: number[][]): number[] {
  // 모든 설정의 threshold를 병합하고 중복 제거
  const merged = Array.from(new Set(allThresholds.flat())).sort((a, b) => a - b);
  
  // 10개 이하면 그대로 사용
  if (merged.length <= 10) {
    return merged;
  }
  
  // 중요한 값들 (0, 1, 0.5)은 항상 포함
  const important = [0, 1, 0.5];
  const others = merged.filter(t => !important.includes(t));
  
  // 균등 분할로 7개 선택 (important 3개 + 7개 = 10개)
  const step = Math.ceil(others.length / 7);
  const selected = others.filter((_, i) => i % step === 0).slice(0, 7);
  
  return [...important, ...selected].sort((a, b) => a - b);
}

export function monitorElementDwell(tracker: Tracker, configs: ElementDwellConfig[]): ElementDwellController {
  const items: Internal[] = [];
  const page = { visible: true, focused: true };

  const ioRoot: Element | null = (() => {
    const rootSel = configs.find(c => c.observer?.rootSelector)?.observer?.rootSelector;
    return rootSel ? document.querySelector(rootSel) : null;
  })();

  // 동적으로 계산된 threshold 사용
  const calculatedThresholds = configs.map(c => 
    c.observer?.thresholds ?? calculateThresholds(c)
  );
  const thresholds = optimizeThresholds(calculatedThresholds);
  
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log('[ElementDwell] Optimized thresholds:', thresholds, `(${thresholds.length} points)`);
  }

  const observer = new IntersectionObserver((entries) => {
    const now = Date.now();  // 한 번만 호출
    for (const entry of entries) {
      const it = items.find(x => x.el === entry.target);
      if (!it) continue;
      const s = it.state;

      const {
        visible: shouldBeVisible,
        coverage,
        viewportTopPct,
        viewportBottomPct,
        viewportCoverage,
        isOversized,
        visibleHeightPx
      } = computeVisibleByMode(entry, it.cfg as Required<ElementDwellConfig>);

      // 상태에 모든 정보 반영 (페이로드용)
      s.elementCoverage = coverage;
      s.viewportTopPct = viewportTopPct;
      s.viewportBottomPct = viewportBottomPct;
      s.viewportCoverage = viewportCoverage;
      s.isOversized = isOversized;
      s.visibleHeightPx = visibleHeightPx;

      if (shouldBeVisible && !s.visibleNow) {
        s.visibleNow = true;
        if (!s.firstVisibleAtMs) s.firstVisibleAtMs = now;  // 위에서 정의한 now 사용

        if (page.visible && page.focused) {
          s.lastVisibleAtMs = now;
          s.hiddenAtMs = undefined;
          if (it.cfg.heartbeat.enabled) startHeartbeat(it);

          // ★ 즉시 emit 지우고 ↓ 가드 기반 첫 보고
          if (it.cfg.initialReport === "progress") {
            s.collectedAtMs = now;
            updateElementMetrics(it); // 위치 메트릭 즉시 업데이트
            emitProgress(it); // 즉시 보고 원하는 팀만
            s.lastProgressAtMs = now;
          } else if (it.cfg.initialReport === "snapshot") {
            updateElementMetrics(it); // 위치 메트릭 즉시 업데이트
            tracker.track("element_dwell_snapshot", {
              selector: s.selector, tag: s.tag, id: s.id, className: s.className,
              elementSize: s.elementSize, viewport: s.viewport,
              trackingStartedAt: new Date(s.trackingStartedAtMs).toISOString()
            });
          } else if (it.cfg.initialReport === "guarded") {
            armFirstEmitIfNeeded(it);
          }
        }
      } else if (!shouldBeVisible && s.visibleNow) {
        if (s.lastVisibleAtMs) {  // 위에서 정의한 now 사용
          s.dwellMs += now - s.lastVisibleAtMs; // 보이던 구간만 마감
          s.lastVisibleAtMs = undefined;
        }
        s.visibleNow = false;
        s.hiddenAtMs = undefined;
        if (it.firstEmitTimer) { clearTimeout(it.firstEmitTimer); it.firstEmitTimer = undefined; it.firstEmitArming = false; }
        stopHeartbeat(it);
      }
    }
  }, { root: ioRoot, threshold: thresholds, rootMargin: configs[0].observer?.rootMargin });

  // 초기화: 요소 매칭
  for (const cfg of configs) {
    const el = document.querySelector(cfg.selector);
    if (!el) continue;
    const normalizedHeartbeat = {
      enabled: cfg.heartbeat?.enabled ?? true,
      intervalMs: cfg.heartbeat?.intervalMs ?? (cfg.throttleMs ?? 500),
      flushPolicy: cfg.heartbeat?.flushPolicy ?? "batch",
      debounceMs: cfg.heartbeat?.debounceMs ?? 800,
      adaptive: {
        enabled: cfg.heartbeat?.adaptive?.enabled ?? true,
        baseMs: cfg.heartbeat?.adaptive?.baseMs ?? (cfg.heartbeat?.intervalMs ?? cfg.throttleMs ?? 500),
        maxMs: cfg.heartbeat?.adaptive?.maxMs ?? 4000,
        factor: cfg.heartbeat?.adaptive?.factor ?? 1.5,
        resetOnScroll: cfg.heartbeat?.adaptive?.resetOnScroll ?? true,
        scrollDebounceMs: cfg.heartbeat?.adaptive?.scrollDebounceMs ?? 150,
      }
    };
    const normalized: Required<ElementDwellConfig> & { heartbeat: { enabled: boolean; intervalMs: number } } = {
      throttleMs: cfg.throttleMs ?? 500,
      allowOversizeFallback: cfg.allowOversizeFallback ?? true,
      observer: cfg.observer ?? {},
      heartbeat: normalizedHeartbeat,
      meta: {
        collectStableSelector: cfg.meta?.collectStableSelector ?? true,
        collectNthPath: cfg.meta?.collectNthPath ?? true,
        collectDataAttrs: cfg.meta?.collectDataAttrs ?? false,
        dataAttrAllowlist: cfg.meta?.dataAttrAllowlist ?? [],
        maxDataAttrs: cfg.meta?.maxDataAttrs ?? 5
      },
      ...cfg
    } as Required<ElementDwellConfig> & { heartbeat: { enabled: boolean; intervalMs: number } };
    const rect = el.getBoundingClientRect();
    const snapshot: ElementDwellSnapshot = {
      selector: cfg.selector,
      tag: (el as HTMLElement).tagName,
      id: (el as HTMLElement).id || undefined,
      className: (el as HTMLElement).className || undefined,
      stableSelector: normalized.meta.collectStableSelector ? buildStableSelector(el) : undefined,
      nthPath: normalized.meta.collectNthPath ? nthPath(el) : undefined,
      dataAttrs: normalized.meta.collectDataAttrs
        ? collectDataAttrs(el, normalized.meta.dataAttrAllowlist, normalized.meta.maxDataAttrs)
        : undefined,
      elementSize: { w: rect.width, h: rect.height },
      // viewport: { w: window.innerWidth, h: window.innerHeight },
      viewport: ioRoot
        ? (() => { const rb = ioRoot.getBoundingClientRect(); return { w: rb.width, h: rb.height }; })()
        : { w: window.innerWidth, h: window.innerHeight },
      trackingStartedAtMs: Date.now(),
      collectedAtMs: Date.now(),
      dwellMs: 0,
      visibleNow: false,
      pageVisible: true,
      windowFocused: true,
      basis: cfg.trigger.mode,
      elementCoverage: 0,
      viewportTopPct: 0
    };
    items.push({ el, cfg: normalized, state: snapshot });
    observer.observe(el);
  }

  // 요소의 현재 위치/coverage 메트릭을 수동으로 업데이트
  function updateElementMetrics(it: Internal) {
    const el = it.el;
    const s = it.state;

    // 요소의 현재 위치 가져오기
    const rect = el.getBoundingClientRect();

    // 루트(뷰포트 또는 스크롤 컨테이너) 정보
    const rootTop = ioRoot ? ioRoot.getBoundingClientRect().top : 0;
    const rootBottom = ioRoot ? ioRoot.getBoundingClientRect().bottom : window.innerHeight;
    const rootHeight = ioRoot ? ioRoot.getBoundingClientRect().height : window.innerHeight;

    const elementHeight = rect.height;
    const elementBottom = rect.bottom;

    // 위치 메트릭 계산
    const topPct = (rect.top - rootTop) / rootHeight;
    const bottomPct = (elementBottom - rootTop) / rootHeight;

    // 요소가 뷰포트보다 큰지 확인
    const isOversized = elementHeight > rootHeight;

    // 교차 영역 계산
    const intersectTop = Math.max(rect.top, rootTop);
    const intersectBottom = Math.min(elementBottom, rootBottom);
    const intersectHeight = Math.max(0, intersectBottom - intersectTop);

    // Coverage 계산
    let elementCoverage = 0;
    let viewportCoverage = 0;

    if (intersectHeight > 0 && elementHeight > 0) {
      // 요소 기준: 요소의 몇%가 보이는지
      elementCoverage = intersectHeight / elementHeight;

      // 뷰포트 기준: 뷰포트의 몇%를 차지하는지
      viewportCoverage = Math.min(1, intersectHeight / rootHeight);
    }

    // 상태 업데이트
    s.elementCoverage = elementCoverage;
    s.viewportTopPct = topPct;
    s.viewportBottomPct = bottomPct;
    s.viewportCoverage = viewportCoverage;
    s.isOversized = isOversized;
    s.visibleHeightPx = intersectHeight;

    // 요소 크기나 뷰포트 크기가 변경되었을 수도 있으므로 업데이트
    s.elementSize = { w: rect.width, h: rect.height };
    s.viewport = ioRoot
      ? (() => { const rb = ioRoot.getBoundingClientRect(); return { w: rb.width, h: rb.height }; })()
      : { w: window.innerWidth, h: window.innerHeight };
  }

  // --- scrollTargets & onAnyScroll ---
  const scrollTargets: (Element | Window)[] = [window];
  if (ioRoot) scrollTargets.push(ioRoot);

  let scrollDebTimer: number | undefined;
  const scrollDebounceMs = items[0]?.cfg.heartbeat?.adaptive?.scrollDebounceMs ?? 150;

  function onAnyScroll() {
    if (scrollDebTimer) clearTimeout(scrollDebTimer);
    scrollDebTimer = window.setTimeout(() => {
      // 보이는 항목들의 메트릭 업데이트 및 어댑티브 리셋
      for (const it of items) {
        if (it.state.visibleNow) {
          updateElementMetrics(it);  // 스크롤 시 위치 메트릭 업데이트
          resetAdaptive(it);
        }
      }
    }, scrollDebounceMs);
  }

  for (const t of scrollTargets) t.addEventListener("scroll", onAnyScroll, { passive: true });

  const userEvents = ["scroll", "pointermove", "keydown", "touchstart"];
  const markInteraction = () => {
    for (const it of items) it.interacted = true;
  };
  const interactionListeners = userEvents.map(ev => {
    window.addEventListener(ev, markInteraction, { passive: true, once: true });
    return () => window.removeEventListener(ev, markInteraction);
  });


  function emitProgress(it: Internal) {
    const s = it.state;
    tracker.track("element_dwell_progress", {
      selector: s.selector,
      tag: s.tag,
      id: s.id,
      className: s.className,
      stableSelector: s.stableSelector,
      nthPath: s.nthPath,
      dataAttrs: s.dataAttrs,
      elementSize: s.elementSize,
      viewport: s.viewport,
      firstVisibleAt: s.firstVisibleAtMs ? new Date(s.firstVisibleAtMs).toISOString() : null,
      trackingStartedAt: new Date(s.trackingStartedAtMs).toISOString(),
      collectedAt: new Date(s.collectedAtMs).toISOString(),
      dwellMs: s.dwellMs,
      visibleNow: s.visibleNow,
      pageVisible: s.pageVisible,
      windowFocused: s.windowFocused,
      basis: s.basis,
      elementCoverage: s.elementCoverage,
      viewportTopPct: s.viewportTopPct,
      viewportBottomPct: s.viewportBottomPct,
      viewportCoverage: s.viewportCoverage,
      isOversized: s.isOversized,
      visibleHeightPx: s.visibleHeightPx
    });
  }


  function armFirstEmitIfNeeded(it: Internal) {
    const { initialReport, initialGuard, trigger } = it.cfg;
    if (initialReport !== "guarded") return;

    // 상호작용 가드
    if (initialGuard?.afterInteraction && !it.interacted) {
      it.firstEmitArming = true;
      return; // 상호작용 올 때까지 대기
    }

    // 안정 시간 + RAF 가드
    const minStable = initialGuard?.minStableMs ?? 400;
    const rafPasses = initialGuard?.rafPasses ?? 1;

    const start = Date.now();
    let rafLeft = rafPasses;

    const tick = () => {
      // 조건 확인: 여전히 가시 + 페이지 보임/포커스
      const s = it.state;
      if (!s.visibleNow || !page.visible || !page.focused) { it.firstEmitArming = false; return; }

      // 초기 전용 커버리지 상향 조건(선택)
      if (initialGuard?.initialMinCoverage != null &&
        s.elementCoverage < initialGuard.initialMinCoverage) {
        // 커버리지 낮으면 다음 프레임로 연기
        it.firstEmitTimer = window.setTimeout(tick, 50);
        return;
      }

      if (rafLeft > 0) { rafLeft--; requestAnimationFrame(tick); return; }
      if (Date.now() - start < minStable) { it.firstEmitTimer = window.setTimeout(tick, 50); return; }

      s.collectedAtMs = Date.now();
      emitProgress(it);
      it.state.lastProgressAtMs = Date.now();
      it.firstEmitArming = false;
    };

    it.firstEmitArming = true;
    tick();
  }

  // function startHeartbeat(it: Internal) {
  //   if (it.hbId) return;
  //   const s = it.state;
  //   it.hbId = window.setInterval(() => {
  //     if (!s.visibleNow) return;
  //     if (!page.visible || !page.focused) return;
  //     const now = Date.now();
  //     if (s.lastVisibleAtMs) {
  //       s.dwellMs += now - s.lastVisibleAtMs;
  //       s.lastVisibleAtMs = now;
  //       s.collectedAtMs = now;
  //       emitProgress(it);
  //       s.lastProgressAtMs = now;
  //     }
  //   }, it.cfg.heartbeat.intervalMs);
  // }

  function scheduleHeartbeat(it: Internal) {
    // setInterval 대신 setTimeout(재귀) — 주기 변경에 안전
    stopHeartbeat(it);
    const delay = clamp(it.hbNextMs ?? it.cfg.heartbeat!.intervalMs, 100, it.cfg.heartbeat!.adaptive?.maxMs ?? 5000);
    it.hbTid = window.setTimeout(() => onHeartbeatTick(it), delay);
  }

  function onHeartbeatTick(it: Internal) {
    const s = it.state;
    const hb = it.cfg.heartbeat!;
    const ad = hb.adaptive ?? { enabled: false };
    const factor = ad.factor ?? 1.5;
    const maxMs = ad.maxMs ?? 5000;

    // ★ 보이지 않거나, 페이지 숨김/비포커스면 절대 누적/전송하지 않음
    if (!s.visibleNow || !page.visible || !page.focused || !s.lastVisibleAtMs) {
      // 다음 주기만 스케줄 (주기는 유지하되, 보고는 안 함)
      if (ad.enabled) {
        const next = Math.min(maxMs, Math.floor((it.hbNextMs ?? hb.intervalMs) * (factor)));
        it.hbNextMs = clamp(next, 100, maxMs);
      } else {
        it.hbNextMs = hb.intervalMs;
      }
      scheduleHeartbeat(it);
      return;
    }

    const now = Date.now();
    // 숨김 구간 방어: hiddenAtMs가 찍혀있으면 그 이후는 누적 금지
    const effectiveNow = s.hiddenAtMs ? Math.min(now, s.hiddenAtMs) : now;

    s.dwellMs += effectiveNow - s.lastVisibleAtMs;
    s.lastVisibleAtMs = now;           // 복귀/정상 시에는 now로 기준점 갱신
    s.collectedAtMs = now;

    // ★ 하트비트 시점에 위치/coverage 메트릭 업데이트
    updateElementMetrics(it);

    emitProgress(it);
    s.lastProgressAtMs = now;

    // 어댑티브 주기 증분
    if (ad.enabled) {
      const next = Math.min(maxMs, Math.floor((it.hbNextMs ?? hb.intervalMs) * (factor)));
      it.hbNextMs = clamp(next, 100, maxMs);
    } else {
      it.hbNextMs = hb.intervalMs;
    }

    scheduleHeartbeat(it);
  }


  function startHeartbeat(it: Internal) {
    if (it.hbTid) return; // 이미 동작 중
    const hb = it.cfg.heartbeat!;
    const ad = hb.adaptive ?? { enabled: false };
    // 시작 주기
    it.hbNextMs = ad.enabled ? (ad.baseMs ?? hb.intervalMs) : hb.intervalMs;
    // 최소/최대 안전 캡
    it.hbNextMs = clamp(it.hbNextMs!, 100, ad.maxMs ?? 5000);
    scheduleHeartbeat(it);
  }


  function resetAdaptive(it: Internal) {
    const hb = it.cfg.heartbeat!;
    const ad = hb.adaptive ?? { enabled: false };
    if (!ad.enabled || ad.resetOnScroll === false) return;
    it.hbNextMs = clamp(ad.baseMs ?? hb.intervalMs, 100, ad.maxMs ?? 5000);
    // 즉시 다음 스케줄로 교체
    stopHeartbeat(it);
    scheduleHeartbeat(it);
  }


  function stopHeartbeat(it: Internal) {
    if (it.hbTid) { clearTimeout(it.hbTid); it.hbTid = undefined; }
  }


  function applyPageStateChange() {
    const now = Date.now();
    for (const it of items) {
      const s = it.state;
      // 페이지/창이 보이지 않거나 포커스 잃음 → 즉시 델타 마감 + 하트비트 중지
      if (!page.visible || !page.focused) {
        if (s.visibleNow) {
          if (s.lastVisibleAtMs) {
            s.dwellMs += now - s.lastVisibleAtMs;
            s.lastVisibleAtMs = undefined;
          }
          s.hiddenAtMs = now;
          stopHeartbeat(it);
          s.collectedAtMs = now;
          emitProgress(it);        // ★ 보이던 항목에 한해 1회 마감 보고
        } else {
          // stopHeartbeat(it);       // 보이지 않던 항목은 보고 X
          if (it.firstEmitTimer) { clearTimeout(it.firstEmitTimer); it.firstEmitTimer = undefined; it.firstEmitArming = false; }
          stopHeartbeat(it);
        }
        continue;
      }

      // 다시 보이게 됨 → 기준점 재설정(숨김 기간은 누적하지 않음)
      if (s.visibleNow) {
        s.lastVisibleAtMs = now;  // ★ 복귀 기준점
        s.hiddenAtMs = undefined;
        if (it.cfg.heartbeat.enabled && !it.hbTid) startHeartbeat(it);
      }
    }
  }

  const onVis = () => {
    const visible = document.visibilityState === "visible";
    page.visible = visible;
    visible ? tracker.resumeFlushing() : tracker.pauseFlushing();
    applyPageStateChange();
  };

  // 포커스는 dwell 계산만 반영, 전송 제어 제거
  const onFocus = () => { page.focused = true; applyPageStateChange(); };
  const onBlur = () => { page.focused = false; applyPageStateChange(); };

  const onHide = () => { page.visible = false; page.focused = false; applyPageStateChange(); };

  // 리사이즈 시 메트릭 업데이트 (디바운스)
  let resizeDebTimer: number | undefined;
  const onResize = () => {
    if (resizeDebTimer) clearTimeout(resizeDebTimer);
    resizeDebTimer = window.setTimeout(() => {
      // 보이는 항목들의 메트릭 업데이트
      for (const it of items) {
        if (it.state.visibleNow) {
          updateElementMetrics(it);
        }
      }
    }, 200); // 200ms 디바운스
  };

  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("focus", onFocus);
  window.addEventListener("blur", onBlur);
  window.addEventListener("pagehide", onHide);
  window.addEventListener("beforeunload", onHide);
  window.addEventListener("resize", onResize);

  function finalize() {
    for (const it of items) { stopHeartbeat(it); observer.unobserve(it.el); }
    observer.disconnect();
  }

  return {
    stop() {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      window.removeEventListener("resize", onResize);
      for (const t of scrollTargets) t.removeEventListener("scroll", onAnyScroll);
      interactionListeners.forEach(cleanup => cleanup());
      if (scrollDebTimer) clearTimeout(scrollDebTimer);
      if (resizeDebTimer) clearTimeout(resizeDebTimer);
      finalize();
    },
    getSnapshots() { return items.map(it => it.state); }
  };

  // 가시성 판정 헬퍼: "최소 1px 가시 + 모드별 조건"을 강제
  function computeVisibleByMode(
    entry: IntersectionObserverEntry,
    cfg: Required<ElementDwellConfig>
  ): {
    visible: boolean;
    coverage: number;
    viewportTopPct: number;
    viewportBottomPct: number;
    viewportCoverage: number;
    isOversized: boolean;
    visibleHeightPx: number;
  } {
    const rootTop = entry.rootBounds?.top ?? 0;
    const rootBottom = entry.rootBounds?.bottom ?? window.innerHeight;
    const rootH = entry.rootBounds?.height ?? (window.innerHeight || 1);

    const rect = entry.boundingClientRect;
    const elementHeight = rect.height;
    const elementBottom = rect.bottom;

    // 요소의 상단과 하단이 뷰포트의 어느 위치에 있는지 (음수 = 뷰포트 위, 1 이상 = 뷰포트 아래)
    const topPct = (rect.top - rootTop) / rootH;
    const bottomPct = (elementBottom - rootTop) / rootH;

    // 요소가 뷰포트보다 큰지 확인
    const isOversized = elementHeight > rootH;

    // Coverage 계산 개선
    let elementCoverage = entry.intersectionRatio; // 요소 기준 coverage (요소 중 얼마나 보이는지)
    let viewportCoverage = 0; // 뷰포트 기준 coverage (뷰포트를 얼마나 차지하는지)

    if (entry.isIntersecting && entry.intersectionRect) {
      const intersectHeight = entry.intersectionRect.height;

      // 뷰포트 기준: 교차 영역이 뷰포트의 몇 %를 차지하는지
      viewportCoverage = Math.min(1, intersectHeight / rootH);

      // 요소가 뷰포트보다 큰 경우, elementCoverage를 보정
      if (isOversized) {
        // 실제 보이는 부분 / 전체 요소 크기
        elementCoverage = intersectHeight / elementHeight;
      }
    }

    // 실제 보이는 높이 (픽셀 단위)
    const visibleHeightPx = entry.intersectionRect?.height || 0;

    // immediate 모드: 1px이라도 보이면 즉시 트리거
    if (cfg.trigger.mode === "immediate") {
      // margin 옵션 적용 (예: "-20%" = 요소의 20% 안쪽, "-100px" = 100px 안쪽)
      let visible = entry.isIntersecting;

      if (visible && cfg.trigger.margin) {
        // rootMargin처럼 작동: 음수면 축소, 양수면 확대
        // percentage와 px 단위 모두 지원
        const percentMatch = cfg.trigger.margin.match(/^(-?\d+(?:\.\d+)?)%$/);
        const pixelMatch = cfg.trigger.margin.match(/^(-?\d+(?:\.\d+)?)px$/);
        if (percentMatch) {
          // 퍼센트 마진
          const marginPct = parseFloat(percentMatch[1]) / 100;

          if (marginPct < 0) {
            // 음수 마진: 요소가 더 많이 보여야 트리거
            const requiredCoverage = Math.abs(marginPct);
            visible = entry.isIntersecting && (
              isOversized
                ? viewportCoverage >= requiredCoverage
                : elementCoverage >= requiredCoverage
            );
          }
        } else if (pixelMatch) {
          // 픽셀 마진
          const marginPx = parseFloat(pixelMatch[1]);

          if (marginPx < 0) {
            // 음수 픽셀 마진: IntersectionObserver의 rootMargin(-Xpx)과 동일하게 동작
            const absMargin = Math.abs(marginPx);

            // "축소된" 뷰포트 영역 계산 (상/하단 absMargin 만큼 제외)
            const shrunkTop = rootTop + absMargin;
            const shrunkBottom = rootBottom - absMargin;

            // 요소가 축소된 뷰포트와 교차하는지 여부
            const intersectsShrunk =
              entry.boundingClientRect.bottom > shrunkTop &&
              entry.boundingClientRect.top < shrunkBottom;

            visible = intersectsShrunk;

            if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
              const vTop = Math.round(entry.boundingClientRect.top - rootTop);
              const vBot = Math.round(rootBottom - entry.boundingClientRect.bottom);
              console.log(
                `[Pixel Margin] margin=${absMargin}px, topDist=${vTop}px, bottomDist=${vBot}px,` +
                ` intersectsShrunk=${intersectsShrunk}`
              );
            }
          }
        }
      }

      return {
        visible,
        coverage: elementCoverage,
        viewportTopPct: topPct,
        viewportBottomPct: bottomPct,
        viewportCoverage,
        isOversized,
        visibleHeightPx
      };
    }
    else if (cfg.trigger.mode === "elementCoverage") {
      let visible = false;

      if (isOversized && cfg.allowOversizeFallback) {
        // 뷰포트보다 큰 요소: 두 가지 조건 중 하나만 만족해도 OK
        // 1) 요소의 X% 이상이 보임 (스크롤 많이 한 경우)
        // 2) 뷰포트의 X% 이상을 차지 (요소가 화면을 채운 경우)
        const elementThreshold = cfg.trigger.value;
        const viewportThreshold = Math.min(cfg.trigger.value, 0.8); // 뷰포트 기준은 최대 80%

        visible = entry.isIntersecting && (
          elementCoverage >= elementThreshold ||  // 요소의 X%가 보임
          viewportCoverage >= viewportThreshold   // 또는 뷰포트의 X%를 차지
        );
      } else {
        // 일반 요소: 기존 로직
        visible = entry.isIntersecting && elementCoverage >= cfg.trigger.value;
      }

      return {
        visible,
        coverage: elementCoverage,
        viewportTopPct: topPct,
        viewportBottomPct: bottomPct,
        viewportCoverage,
        isOversized,
        visibleHeightPx
      };
    }
    else {
      // viewportPosition 모드 - 단순화
      let visible = false;

      if (isOversized) {
        // 큰 요소: 더 단순한 로직
        // trigger.value를 뷰포트 coverage로 사용
        visible = entry.isIntersecting && viewportCoverage >= cfg.trigger.value;
      } else {
        // 일반 요소: 요소 상단이 뷰포트의 trigger.value 위치에 도달
        const reached = topPct <= cfg.trigger.value;
        visible = entry.isIntersecting && reached;
      }

      return {
        visible,
        coverage: elementCoverage,
        viewportTopPct: topPct,
        viewportBottomPct: bottomPct,
        viewportCoverage,
        isOversized,
        visibleHeightPx
      };
    }
  }
}


