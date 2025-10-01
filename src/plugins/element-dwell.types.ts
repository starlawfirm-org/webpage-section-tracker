export type DwellTriggerMode = "elementCoverage" | "viewportPosition" | "immediate";


export type ElementDwellConfig = {
  selector: string; // 정확히 1개 매칭 필요
  trigger: { 
    mode: DwellTriggerMode; 
    value: number; 
    // immediate 모드용 옵션: 요소 내부 마진 (음수=축소, 양수=확대)
    // 예: "-20%" = 요소의 20% 안쪽에서만 감지
    // 예: "-100px" = 100px 안쪽에서만 감지
    // 지원 단위: % 또는 px
    margin?: string;
  };
  throttleMs?: number; // 진행 이벤트 최소 간격(보고 주기); 델타 누적은 프레임리스로 동작
  allowOversizeFallback?: boolean; // 기본 true
  observer?: {
    /**
     * const root = cfg.rootSelector ? document.querySelector(cfg.rootSelector) : null;
     * const observer = new IntersectionObserver(callback,{root, threshold: thresholds});
     */
    rootSelector?: string; // ex) '#scroll-host' — IO root로 사용할 스크롤 컨테이너
    rootMargin?: string; // ex) '0px 0px -20% 0px'
    thresholds?: number[]; // ex) [0, 0.25, 0.5, 0.75, 1]
  };
  // ▶ 하트비트: IO 이벤트가 없어도 가시 상태면 주기 보고
  heartbeat?: {
    enabled?: boolean;        // default true
    intervalMs?: number;      // default throttleMs(없으면 500)
    flushPolicy?: "batch" | "debounce" | "immediate"; // ← 추가 (default "batch")
    debounceMs?: number;      // flushPolicy === "debounce"일 때 (예: 500~1000)
    // ▼ 새로 추가: 스크롤 전까지 인터벌을 점진적으로 늘림(백오프)
    adaptive?: {
      enabled?: boolean;         // 기본 true
      baseMs?: number;           // 시작 주기 (기본: heartbeat.intervalMs)
      maxMs?: number;            // 상한 (기본: 4000)
      factor?: number;           // 배수 (기본: 1.5) — tick마다 current*=factor (상한까지)
      resetOnScroll?: boolean;   // 스크롤 감지 시 base로 즉시 리셋 (기본 true)
      scrollDebounceMs?: number; // 스크롤 연속 감지 디바운스 (기본 150)
    };
  };
  meta?: {
    collectStableSelector?: boolean;     // 기본 true
    collectNthPath?: boolean;            // 기본 true
    collectDataAttrs?: boolean;          // 기본 false (보안/크기상 기본 꺼둠)
    dataAttrAllowlist?: string[];        // ex) ['data-testid', 'data-qa']
    maxDataAttrs?: number;               // ex) 5
  };
  initialReport?: "none" | "progress" | "snapshot" | "guarded"; // 기본 "none"
  initialGuard?: {
    minStableMs?: number;        // 기본 300~500 권장
    afterInteraction?: boolean;  // 기본 false
    initialMinCoverage?: number; // 기본 없음(평소 trigger.value 사용)
    rafPasses?: number;          // 기본 1 (0=즉시)
  };
};

export interface ElementDwellSnapshot {
  selector: string;
  tag: string;
  id?: string;
  className?: string;
  stableSelector?: string;
  nthPath?: string;
  dataAttrs?: Record<string, string>;
  elementSize: { w: number; h: number };
  viewport: { w: number; h: number; dpr?: number };
  firstVisibleAtMs?: number;
  trackingStartedAtMs: number;
  collectedAtMs: number;
  dwellMs: number;
  visibleNow: boolean;
  pageVisible: boolean;
  windowFocused: boolean;
  basis: DwellTriggerMode;  // "elementCoverage" | "viewportPosition" | "immediate"
  elementCoverage: number;  // 요소 기준: 요소의 몇 %가 보이는지 (0-1)
  viewportTopPct: number;    // 요소 상단이 뷰포트의 어느 위치에 있는지 (0=top, 1=bottom)
  viewportBottomPct?: number; // 요소 하단이 뷰포트의 어느 위치에 있는지
  viewportCoverage?: number; // 뷰포트 기준: 요소가 뷰포트의 몇 %를 차지하는지 (0-1)
  isOversized?: boolean;     // 요소가 뷰포트보다 큰지 여부
  visibleHeightPx?: number;  // 실제 보이는 높이 (픽셀)
}

export interface ElementDwellController {
  stop(): void;
  getSnapshots(): ElementDwellSnapshot[];
  flush(): void;
  getState(): ElementDwellSnapshot[];
}