# Webpage Section Tracker

웹 페이지 요소의 노출 시간과 사용자 상호작용을 추적하는 경량 분석 라이브러리입니다.  
IntersectionObserver + 적응형 하트비트 기반으로 효율적으로 dwell(체류) 시간을 수집합니다.

## 🎉 v1.0.0 - First Stable Release!

### 주요 기능
- 🚀 **V2 스키마 지원**: 더 구조화되고 효율적인 데이터 스키마
  - 듀얼 모드: V1/V2 동시 지원
  - 배치 최적화: 30-50% 데이터 크기 감소
  - 논리적 그룹화: 세션, 환경, 이벤트 분리
  - 타입 안정성 향상
- 📏 **개선된 요소 추적 메트릭**:
  - `viewportBottomPct`: 요소 하단의 뷰포트 위치
  - `viewportCoverage`: 요소가 뷰포트를 차지하는 비율
  - `isOversized`: 요소가 뷰포트보다 큰지 여부
  - 뷰포트보다 큰 요소에 대한 정확한 coverage 계산
  - 하트비트/스크롤/리사이즈 시 실시간 메트릭 업데이트
  - **immediate 모드 추가**: 1px이라도 보이면 즉시 추적 시작
  - **viewportPosition 모드 단순화**: 큰 요소는 뷰포트 coverage로 판단
  - **margin 옵션**: IntersectionObserver처럼 요소 내부 마진 설정 가능

- 🔐 **세션 관리**: Browser Session + View Session, 암호학적으로 안전한 ID
- ⚛️ **React 지원**: `@starlawfirm/webpage-section-tracker-react` 별도 패키지
- 🎯 **3가지 트리거 모드**: immediate, elementCoverage, viewportPosition
- 📦 **모노레포**: pnpm workspaces, 자동 배포 (Changesets + GitHub Actions)
- ⚡ **성능 최적화**: 동적 threshold, 메모리 누수 방지, 번들 최적화

### What's New in v1.0.0
- 🆕 Immediate trigger mode (1px detection + px/% margin)
- 🆕 Dynamic threshold calculation (최대 10개 자동 최적화)
- 🆕 Enhanced metrics (viewportBottomPct, viewportCoverage, visibleHeightPx)
- 🆕 Real-time metric updates (heartbeat, scroll, resize)
- 🆕 Pixel margin support with consistent detection
- 🆕 Production-ready error handling with TODO annotations
- 🆕 Comprehensive testing tools (Performance Monitor, Trigger Test)

자세한 변경사항은 [CHANGELOG](../../CHANGELOG.md) 참조

## 목차
- [설치](#설치)
- [빠른 시작](#빠른-시작)
- [주요 기능](#주요-기능)
- [API 레퍼런스](#api-레퍼런스)
  - [Tracker](#tracker)
  - [Element Dwell Monitoring](#element-dwell-monitoring)
  - [Event Queue](#event-queue)
  - [Transport](#transport)
- [고급 설정](#고급-설정)
- [예제](#예제)
- [성능 최적화](#성능-최적화)
- [디버깅](#디버깅)
- [브라우저 지원](#브라우저-지원)
- [라이선스](#라이선스)
- [기여하기](#기여하기)
- [지원](#지원)

## 설치

```bash
npm install webpage-section-tracker
```

### 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/starlawfirm-org/webpage-section-tracker.git
cd webpage-section-tracker

# 의존성 설치
npm install

# 개발 모드 (watch)
npm run dev

# 프로덕션 빌드
npm run build

# 개발 빌드 (디버깅용)
npm run build:dev

# 예제 실행
npm run dev:examples
```

## 빠른 시작

### CommonJS/Node.js
```javascript
const { createTracker, monitorElementDwell } = require('webpage-section-tracker');

const tracker = createTracker({
  endpoint: '/collect',
  appId: 'my-app',
  batchSize: 20,
  flushIntervalMs: 5000
});

// 페이지뷰 추적
tracker.pageView();

// 사용자 식별
tracker.identify('user123', { name: 'John Doe' });
```

### Browser (IIFE)
```html
<script src="https://unpkg.com/webpage-section-tracker/dist/index.iife.js"></script>
<script>
  // window.StlTracker 글로벌 객체로 제공됨
  const { createTracker, monitorElementDwell } = window.StlTracker;
  
  const tracker = createTracker({
    endpoint: '/collect',
    appId: 'my-app'
  });
</script>
```

### ES Modules
```javascript
import { createTracker, monitorElementDwell } from 'webpage-section-tracker';

const tracker = createTracker({
  endpoint: '/collect',
  appId: 'my-app'
});
```

## 주요 기능

### 1. **이벤트 추적**
- 페이지뷰, 사용자 식별, 커스텀 이벤트 추적
- 자동 배치 처리 및 큐 관리
- 오프라인 지원 (로컬 스토리지 지속성)
- 페이지 가시성 기반 스마트 전송 제어

### 2. **요소 노출 시간 측정 (Element Dwell)**
- 특정 요소의 뷰포트 노출 시간 자동 측정
- IntersectionObserver 기반 정밀 추적
- 적응형 하트비트로 효율적인 리소스 사용
- 스크롤 컨테이너 지원 (커스텀 루트 요소)
- 사용자 상호작용 감지 및 조건부 보고

### 3. **안정적인 데이터 전송**
- 자동 재시도 (지터 백오프)
- sendBeacon 우선 사용 (페이지 이탈 시에도 안정적)
- 페이지 가시성/포커스 기반 스마트 플러싱
- Retry-After 헤더 지원

### 4. **세션 관리**
- 암호학적으로 안전한 세션 ID 생성
- 브라우저 세션 동안 지속 (sessionStorage)
- 자동 세션 추적 및 통계
- 30분 비활성 후 자동 갱신

### 5. **V2 스키마 지원 (v0.1.3+)**
- 구조화된 데이터: 세션, 환경, 이벤트 논리적 분리
- 배치 최적화: 공통 정보 중복 제거로 30-50% 크기 감소
- 타입 안정성: TypeScript 지원 강화
- 하위 호환성: V1/V2 듀얼 모드 지원

### 6. **개발자 경험**
- TypeScript 완벽 지원
- 다양한 모듈 시스템 지원 (CJS, ESM, IIFE)
- 상세한 디버깅 로그
- 유연한 설정 옵션

## API 레퍼런스

### Tracker

#### `createTracker(options: TrackerOptions): Tracker`

새로운 Tracker 인스턴스를 생성합니다.

**옵션:**

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `endpoint` | `string` | **필수** | 데이터 수집 엔드포인트 URL |
| `appId` | `string` | **필수** | 애플리케이션 식별자 |
| `schemaVersion` | `'v1' \| 'v2'` | `'v1'` | 스키마 버전 (v2 권장) |
| `useBeacon` | `boolean` | `true` | sendBeacon API 우선 사용 여부 |
| `batchSize` | `number` | `20` | 배치당 최대 이벤트 수 |
| `flushIntervalMs` | `number` | `5000` | 자동 플러시 주기 (밀리초) |
| `maxQueueSize` | `number` | `1000` | 큐의 최대 크기 |
| `retryBaseDelayMs` | `number` | `1000` | 재시도 기본 지연 시간 |
| `retryMaxDelayMs` | `number` | `30000` | 재시도 최대 지연 시간 |
| `sampleRate` | `number` | `1` | 샘플링 비율 (0-1) |
| `getConsent` | `() => boolean` | `() => true` | 동의 확인 함수 |
| `context` | `Partial<BaseContext>` | `{}` | 기본 컨텍스트 정보 |

### 주요 메서드
- track(type, data?, ctx?) → 커스텀 이벤트 기록
- pageView(extra?) → 페이지뷰 이벤트
- identify(userId, traits?) → 사용자 식별
- flush() → 큐 즉시 전송
- pauseFlushing() / resumeFlushing() → 전송 제어
- isEnabled() / setEnabled(flag) → 추적 on/off
- destroy() → 리소스 정리 및 추적 중지

**예제 (V1 스키마):**
```javascript
const tracker = createTracker({
  endpoint: 'https://analytics.example.com/collect',
  appId: 'ecommerce-site',
  batchSize: 10,
  flushIntervalMs: 3000,
  sampleRate: 0.8, // 80% 샘플링
  getConsent: () => localStorage.getItem('consent') === 'true'
});
```

**예제 (V2 스키마 - 권장):**
```javascript
const tracker = createTracker({
  endpoint: 'https://analytics.example.com/collect',
  appId: 'ecommerce-site',
  schemaVersion: 'v2',  // V2 스키마 활성화
  batchSize: 10,
  flushIntervalMs: 3000
});

// V2는 자동으로 구조화된 페이로드 생성
// {
//   type: "event_type",
//   timestamp: 1234567890,
//   session: { browser: {...}, view: {...} },
//   environment: { app: {...}, page: {...}, device: {...} },
//   data: {...}
// }
```

#### `tracker.track(type: string, data?: any, ctx?: any): void`

커스텀 이벤트를 추적합니다.

**매개변수:**
- `type`: 이벤트 타입
- `data`: 이벤트 데이터 (선택)
- `ctx`: 추가 컨텍스트 (선택)

**예제:**
```javascript
// 버튼 클릭 추적
tracker.track('button_click', {
  buttonId: 'cta-main',
  buttonText: 'Sign Up',
  location: 'header'
});

// 폼 제출 추적
tracker.track('form_submit', {
  formId: 'contact-form',
  fields: ['name', 'email', 'message']
});
```

#### `tracker.pageView(extra?: Record<string, unknown>): void`

페이지뷰 이벤트를 추적합니다.

**예제:**
```javascript
tracker.pageView({
  title: document.title,
  category: 'blog',
  author: 'Jane Doe'
});
```

#### `tracker.identify(userId: string, traits?: Record<string, unknown>): void`

사용자를 식별합니다.

**예제:**
```javascript
tracker.identify('user_123', {
  email: 'user@example.com',
  plan: 'premium',
  signUpDate: '2024-01-01'
});
```

#### `tracker.flush(): Promise<void>`

큐에 있는 모든 이벤트를 즉시 전송합니다.

**예제:**
```javascript
// 중요한 이벤트 후 즉시 전송
await tracker.flush();
```

#### `tracker.pauseFlushing(): void` / `tracker.resumeFlushing(): void`

이벤트 전송을 일시정지/재개합니다.

**예제:**
```javascript
// 민감한 작업 중 전송 일시정지
tracker.pauseFlushing();
// ... 작업 수행 ...
tracker.resumeFlushing();
```

#### `tracker.isEnabled(): boolean` / `tracker.setEnabled(flag: boolean): void`

추적 활성화 상태를 확인/설정합니다.

#### `tracker.destroy(): void`

트래커를 완전히 정리합니다. 모든 이벤트 리스너를 제거하고 큐를 중지합니다.

**예제:**
```javascript
// 앱 종료 시 또는 컴포넌트 언마운트 시
tracker.destroy();

// React Hook 예제
useEffect(() => {
  const tracker = createTracker({ /* ... */ });
  return () => tracker.destroy();
}, []);
```

### 세션 관리 (Session Management)

#### `getSessionId(): string`

현재 세션 ID를 가져옵니다. 세션이 없으면 자동으로 생성합니다.

**세션 ID 형식:**
- Format: `{timestamp}-{random}-{counter}`
- 예: `lgk9c12ef-4f3a2b1c8d9e0fa3-0001`
- 암호학적으로 안전한 랜덤 값 사용 (crypto.randomUUID 또는 crypto.getRandomValues)

**예제:**
```javascript
import { getSessionId } from 'webpage-section-tracker';

const sessionId = getSessionId();
console.log('Current Session:', sessionId);

// 모든 이벤트에 세션 ID 포함
tracker.track('button_click', {
  buttonId: 'cta',
  sessionId: getSessionId()
});
```

#### `getSessionMetadata(): SessionData | null`

현재 세션의 상세 정보를 가져옵니다.

**반환 값:**
```typescript
interface SessionData {
  sessionId: string;        // 세션 ID
  startedAt: number;        // 시작 시간 (타임스탬프)
  lastActivityAt: number;   // 마지막 활동 시간
  pageViews: number;        // 페이지뷰 수
  isNew: boolean;          // 새 세션 여부
}
```

**예제:**
```javascript
const metadata = getSessionMetadata();
if (metadata) {
  console.log('Session started:', new Date(metadata.startedAt));
  console.log('Page views in session:', metadata.pageViews);
}
```

#### `getSessionStats()`

세션 통계 정보를 가져옵니다.

**반환 값:**
```javascript
{
  sessionId: string,
  duration: number,              // 밀리초
  durationFormatted: string,     // "2h 30m" 형식
  idleTime: number,              // 비활성 시간 (밀리초)
  idleTimeFormatted: string,     // "5m 30s" 형식
  pageViews: number,
  avgTimePerPage: number,        // 평균 페이지 체류 시간
  willExpireIn: number           // 세션 만료까지 남은 시간
}
```

**예제:**
```javascript
const stats = getSessionStats();
console.log(`Session duration: ${stats.durationFormatted}`);
console.log(`Average time per page: ${stats.avgTimePerPage}ms`);

// 세션 만료 경고
if (stats.willExpireIn < 5 * 60 * 1000) { // 5분 미만
  console.warn('Session will expire soon');
}
```

#### `getSessionContext(): Record<string, unknown>`

세션 정보를 컨텍스트 객체로 가져옵니다. (Tracker 이벤트에 포함용)

**예제:**
```javascript
const sessionContext = getSessionContext();
// {
//   sessionId: "lgk9c12ef-4f3a2b1c8d9e0fa3-0001",
//   sessionStart: "2024-01-01T10:00:00.000Z",
//   sessionDuration: 120000,
//   pageViews: 5,
//   isNewSession: false
// }

tracker.track('purchase', {
  amount: 99.99,
  ...getSessionContext()
});
```

#### `resetSession(): void`

현재 세션을 강제로 리셋합니다. (테스트 또는 로그아웃 시 사용)

**예제:**
```javascript
// 로그아웃 시 세션 리셋
function logout() {
  resetSession();
  // 새로운 세션 ID가 생성됨
  const newSessionId = getSessionId();
}
```

### 세션 자동 관리

세션은 다음과 같이 자동으로 관리됩니다:

1. **세션 생성**: 첫 페이지 방문 시 자동 생성
2. **세션 유지**: sessionStorage 사용 (탭 닫기 전까지 유지)
3. **세션 갱신**: 사용자 활동 시 자동 갱신 (클릭, 스크롤 등)
4. **세션 만료**: 30분 비활성 후 자동 새 세션 생성
5. **이벤트 통합**: 모든 추적 이벤트에 세션 정보 자동 포함

**자동 포함되는 세션 정보:**
```javascript
// BaseContext에 자동 포함
{
  sessionId: "lgk9c12ef-4f3a2b1c8d9e0fa3-0001",
  sessionStart: "2024-01-01T10:00:00.000Z",
  sessionPageViews: 5,
  isNewSession: false
}
```

### Element Dwell Monitoring

#### `monitorElementDwell(tracker: Tracker, configs: ElementDwellConfig[]): ElementDwellController`

요소의 노출 시간을 모니터링합니다.

**설정 옵션 (ElementDwellConfig):**

| 속성 | 타입 | 설명 |
|------|------|------|
| `selector` | `string` | CSS 선택자 (정확히 1개 요소와 매칭) |
| `trigger.mode` | `"elementCoverage" \| "viewportPosition"` | 가시성 판단 모드 |
| `trigger.value` | `number` | 임계값 (0-1) |
| `throttleMs` | `number` | 진행 이벤트 쓰로틀링 (기본: 500ms) |
| `allowOversizeFallback` | `boolean` | 뷰포트보다 큰 요소 자동 처리. true일 때 요소/뷰포트 coverage 중 하나만 만족해도 트리거 (기본: true) |
| `observer` | `object` | IntersectionObserver 옵션 |
| `heartbeat` | `object` | 하트비트 설정 |
| `meta` | `object` | 메타데이터 수집 설정 |
| `initialReport` | `string` | 초기 보고 모드 (아래 참조) |
| `initialGuard` | `object` | 초기 보고 가드 설정 |

**Trigger 모드:**
- `immediate` (v0.1.3+): 1px이라도 보이면 즉시 트리거
  - `margin` 옵션: 요소 내부 마진 설정 (% 또는 px 단위 지원)
    - `"-20%"`: 요소의 20% 안쪽에서만 감지
    - `"-100px"`: 100px 이상 보일 때만 감지
  - 큰 요소도 동일하게 작동
- `elementCoverage`: 요소의 특정 비율이 보일 때
  - 일반 요소: 요소의 X%가 보일 때 (예: 50% 이상)
  - 큰 요소 (`allowOversizeFallback=true`): 요소의 X% 또는 뷰포트의 X%를 채울 때
- `viewportPosition`: 요소가 뷰포트의 특정 위치에 도달할 때
  - 일반 요소: 요소 상단이 뷰포트 Y% 위치에 도달 (예: 상단 50%)
  - 큰 요소: 뷰포트의 X%를 채울 때 (v0.1.3+에서 단순화됨)

**초기 보고 모드 (initialReport):**
- `"none"` (기본값): 첫 보고를 하지 않고 하트비트부터 시작
- `"progress"`: 요소가 보이면 즉시 첫 progress 이벤트 발생
- `"snapshot"`: 요소가 보이면 스냅샷 이벤트 발생 (dwell 시간 없음)
- `"guarded"`: initialGuard 조건을 만족한 후 첫 보고

**초기 가드 설정 (initialGuard):**
```javascript
initialGuard: {
  minStableMs: 400,          // 최소 안정 시간 (밀리초)
  afterInteraction: true,     // 사용자 상호작용 후에만 보고
  initialMinCoverage: 0.7,    // 초기 최소 커버리지 요구사항
  rafPasses: 2                // requestAnimationFrame 대기 횟수
}

**하트비트 설정:**
```javascript
heartbeat: {
  enabled: true,              // 하트비트 활성화 (기본: true)
  intervalMs: 1000,           // 기본 주기 (밀리초)
  flushPolicy: 'debounce',   // 'batch' | 'debounce' | 'immediate'
  debounceMs: 1000,           // 디바운스 시간 (flushPolicy가 'debounce'일 때)
  adaptive: {
    enabled: true,            // 적응형 주기 활성화
    baseMs: 800,              // 시작 주기
    factor: 1.6,              // 주기 증가 배수
    maxMs: 5000,              // 최대 주기
    resetOnScroll: true,      // 스크롤 시 리셋
    scrollDebounceMs: 150     // 스크롤 디바운스
  }
}
```

**메타데이터 설정:**
```javascript
meta: {
  collectStableSelector: true,    // 안정적인 선택자 수집
  collectNthPath: true,            // nth-child 경로 수집
  collectDataAttrs: true,          // data-* 속성 수집
  dataAttrAllowlist: ['data-testid', 'data-qa'],  // 허용할 data 속성
  maxDataAttrs: 5                  // 최대 data 속성 수
}
```

**전체 예제:**
```javascript
const controller = monitorElementDwell(tracker, [
  {
    selector: '#hero-section',
    trigger: {
      mode: 'elementCoverage',
      value: 0.5  // 50% 이상 보일 때
    },
    throttleMs: 500,
    initialReport: 'guarded',  // 안정적인 첫 보고
    initialGuard: {
      minStableMs: 300,
      afterInteraction: false,
      rafPasses: 1
    },
    heartbeat: {
      enabled: true,
      intervalMs: 1000,
      adaptive: {
        enabled: true,
        baseMs: 800,
        factor: 1.5,
        maxMs: 5000,
        resetOnScroll: true
      }
    },
    meta: {
      collectDataAttrs: true,
      dataAttrAllowlist: ['data-section', 'data-id']
    }
  },
  {
    selector: '#cta-button',
    trigger: {
      mode: 'viewportPosition',
      value: 0.8  // 뷰포트 상단 80% 지점에 도달
    },
    observer: {
      rootMargin: '0px 0px -20% 0px',  // 하단 20% 마진
      thresholds: [0, 0.25, 0.5, 0.75, 1]
    }
  }
]);

// 컨트롤러 메서드
controller.stop();                    // 모니터링 중지
const snapshots = controller.getSnapshots();  // 현재 스냅샷 가져오기
```

### Event Queue

EventQueue는 내부적으로 사용되며, 다음 기능을 제공합니다:

- **자동 배치 처리**: 설정된 크기만큼 이벤트를 모아서 전송
- **로컬 스토리지 지속성**: 페이지 새로고침 시에도 큐 유지
- **스마트 재시도**: 지터 백오프를 사용한 재시도
- **페이지 상태 인식**: 페이지 숨김/포커스 상태에 따른 전송 제어

### Transport

두 가지 전송 방식을 지원합니다:

#### 1. **Beacon Transport** (기본)
- `navigator.sendBeacon` API 사용
- 페이지 이탈 시에도 안정적 전송
- 브라우저가 백그라운드에서 처리

#### 2. **Fetch Transport** (폴백)
- `fetch` API 사용
- 타임아웃 지원
- Retry-After 헤더 지원
- keepalive 옵션으로 안정성 향상

## 고급 설정

### 샘플링 설정
```javascript
const tracker = createTracker({
  endpoint: '/collect',
  appId: 'my-app',
  sampleRate: 0.1,  // 10% 트래픽만 추적
});
```

### 동의 관리
```javascript
const tracker = createTracker({
  endpoint: '/collect',
  appId: 'my-app',
  getConsent: () => {
    // GDPR 동의 확인
    return document.cookie.includes('consent=true');
  }
});
```

### 커스텀 컨텍스트
```javascript
const tracker = createTracker({
  endpoint: '/collect',
  appId: 'my-app',
  context: {
    environment: 'production',
    version: '2.0.0',
    region: 'asia'
  }
});
```

### 뷰포트보다 큰 요소 추적
```javascript
// 긴 기사나 히어로 섹션처럼 뷰포트보다 큰 요소 추적
monitorElementDwell(tracker, [{
  selector: '#long-article',
  trigger: { 
    mode: 'elementCoverage', 
    value: 0.3  // 요소의 30%가 보이거나 뷰포트의 30%를 채울 때
  },
  allowOversizeFallback: true,  // 큰 요소 자동 처리
  heartbeat: { enabled: true }
}]);

// 🎯 개선된 트리거 로직 (v0.1.3+)

// 1. Immediate 모드 - 가장 간단한 추적
monitorElementDwell(tracker, [{
  selector: '#hero',
  trigger: { 
    mode: 'immediate',     // 1px이라도 보이면 시작
    value: 0,
    margin: '-10%'        // 옵션: 10% 안쪽에서만 감지
  }
}]);

// 픽셀 단위 마진도 지원
monitorElementDwell(tracker, [{
  selector: '#cta-button',
  trigger: { 
    mode: 'immediate',
    value: 0,
    margin: '-50px'       // 50px 이상 보일 때 추적
  }
}]);

// 2. ViewportPosition 모드 - 큰 요소는 이제 단순함
monitorElementDwell(tracker, [{
  selector: '#long-article',
  trigger: { 
    mode: 'viewportPosition',
    value: 0.3  // 큰 요소: 뷰포트의 30%를 채울 때
  }
}]);

// 콜백으로 추가 메트릭 확인
const controller = monitorElementDwell(tracker, [...]);
setInterval(() => {
  const snapshots = controller.getSnapshots();
  snapshots.forEach(s => {
    if (s.isOversized) {
      console.log(`📏 ${s.selector} Oversized Metrics:`);
      console.log(`  Element Coverage: ${(s.elementCoverage * 100).toFixed(1)}%`);
      console.log(`  Viewport Coverage: ${(s.viewportCoverage * 100).toFixed(1)}%`);
      console.log(`  Position: ${(s.viewportTopPct * 100).toFixed(1)}% ~ ${(s.viewportBottomPct * 100).toFixed(1)}%`);
    }
  });
}, 1000);
```

### 스크롤 컨테이너 모니터링
```javascript
// 특정 스크롤 컨테이너 내의 요소 추적
monitorElementDwell(tracker, [
  {
    selector: '.article-section',
    trigger: { mode: 'elementCoverage', value: 0.5 },
    observer: {
      rootSelector: '#scroll-container',  // 스크롤 컨테이너 지정
      rootMargin: '100px 0px',            // 100px 여백으로 미리 로드
      thresholds: [0, 0.25, 0.5, 0.75, 1] // 정밀한 임계값 설정
    },
    initialReport: 'guarded',               // 안정화된 후 첫 보고
    initialGuard: {
      minStableMs: 400,
      rafPasses: 2                          // 렌더링 안정화 대기
    }
  }
]);
```

### 사용자 상호작용 기반 추적
```javascript
// 사용자가 페이지와 상호작용한 후에만 추적 시작
monitorElementDwell(tracker, [
  {
    selector: '#premium-content',
    trigger: { mode: 'elementCoverage', value: 0.3 },
    initialReport: 'guarded',
    initialGuard: {
      afterInteraction: true,     // 스크롤, 클릭, 키입력 등 감지
      minStableMs: 500,
      initialMinCoverage: 0.5     // 초기에는 더 높은 커버리지 요구
    }
  }
]);
```

## 이벤트 페이로드 구조

### 기본 이벤트 구조
```typescript
{
  type: string;           // 이벤트 타입
  ts: number;             // 타임스탬프 (밀리초)
  data?: Record<string, unknown>;  // 이벤트 데이터
  ctx?: {
    appId: string;        // 앱 ID
    page: string;         // 현재 페이지 URL
    referrer?: string;    // 리퍼러
    tz: string;           // 타임존 (IANA)
    lang?: string;        // 브라우저 언어
    ua?: string;          // User Agent
    screen?: {
      w: number;          // 화면 너비
      h: number;          // 화면 높이
      dpr?: number;       // 디바이스 픽셀 비율
    };
  };
}
```

### Element Dwell 이벤트
```typescript
{
  type: 'element_dwell_progress' | 'element_dwell_final', // element_dwell_progress: 요소가 가시 상태일 때 주기적으로 발생 /  element_dwell_final: 요소가 더 이상 보이지 않게 되거나, 모니터링이 중지될 때 마지막으로 발생
  data: {
    selector: string;          // CSS 선택자
    tag: string;               // HTML 태그
    id?: string;               // 요소 ID
    className?: string;        // 클래스명
    stableSelector?: string;   // 안정적인 선택자
    nthPath?: string;          // nth-child 경로
    dataAttrs?: Record<string, string>;  // data 속성들
    elementSize: { w: number; h: number };  // 요소 크기
    viewport: { w: number; h: number };     // 뷰포트 크기
    firstVisibleAt: string | null;  // 최초 노출 시간 (ISO)
    trackingStartedAt: string;      // 추적 시작 시간 (ISO)
    collectedAt: string;            // 수집 시간 (ISO)
    dwellMs: number;                // 누적 노출 시간 (밀리초)
    visibleNow: boolean;            // 현재 보이는지
    pageVisible: boolean;           // 페이지 보이는지
    windowFocused: boolean;         // 창 포커스 상태
    basis: 'elementCoverage' | 'viewportPosition';  // 판단 기준
    elementCoverage: number;        // 요소 기준: 요소의 몇%가 보이는지 (0-1)
    viewportTopPct: number;         // 요소 상단의 뷰포트 위치 (0=top, 1=bottom)
    viewportBottomPct: number;      // 요소 하단의 뷰포트 위치
    viewportCoverage: number;       // 뷰포트 기준: 요소가 뷰포트의 몇%를 차지하는지
    isOversized: boolean;           // 요소가 뷰포트보다 큰지 여부
  }
}
```

## 테스트 도구

프로젝트에는 다양한 테스트 및 디버깅 도구가 포함되어 있습니다:

### 1. Performance Monitor (성능 모니터링)
**URL**: `http://localhost:5173/performance-test.html`

실시간 성능 모니터링 대시보드:
- **FPS & 메모리**: 프레임레이트, 프레임 타임, JS Heap 메모리 사용량
- **Observer 분석**: 콜백 빈도, 처리 시간, threshold 개수
- **트래킹 통계**: 요소별 가시성, 이벤트 발생률
- **동적 제어**: 1-50개 요소 생성, 모드/마진 실시간 변경
- **이벤트 로그**: 시간별 이벤트 기록 및 성능 경고

**권장 사용법**:
- 스트레스 테스트: 요소 개수를 늘려가며 성능 한계 확인
- Threshold 최적화: 다양한 설정으로 콜백 빈도 비교
- 메모리 누수 테스트: 장시간 실행하며 메모리 증가 모니터링

### 2. Trigger Test (트리거 모드 테스트)
**URL**: `http://localhost:5173/trigger-test.html`

모든 트리거 모드와 값 조합을 쉽게 테스트:
- Immediate 모드 (퍼센트/픽셀 마진)
- ElementCoverage 모드 (다양한 threshold)
- ViewportPosition 모드 (다양한 위치)
- iframe으로 격리된 테스트 환경

### 3. Oversized Element Test (큰 요소 디버깅)
**URL**: `http://localhost:5173/oversized-element-test.html`

뷰포트보다 큰 요소의 실시간 메트릭 확인:
- Coverage, Position, Viewport 메트릭
- 트리거 조건 시각화
- URL 파라미터로 설정 제어

### 4. React Test App (React 통합 테스트)
**경로**: `examples/react-test-app/`

React + TypeScript + Vite 기반 고급 테스트 앱:
- **React Hooks**: `useTracker`, `useElementDwell`로 간편한 통합
- **실시간 대시보드**: 통계, 설정, 메트릭 시각화
- **동적 요소**: 1-20개 요소 실시간 생성/제거
- **타입 안전**: 완벽한 TypeScript 지원

```bash
cd examples/react-test-app
npm install
npm run dev
```

자세한 내용은 [React App README](examples/react-test-app/README.md) 참조

## 예제

### Immediate 모드 고급 활용
```javascript
// 반응형 디자인을 고려한 마진 설정
const isMobile = window.innerWidth < 768;

monitorElementDwell(tracker, [
  {
    selector: '.product-card',
    trigger: { 
      mode: 'immediate',
      value: 0,
      // 모바일에서는 적은 픽셀, 데스크톱에서는 많은 픽셀 요구
      margin: isMobile ? '-50px' : '-150px'
    }
  },
  {
    selector: '.hero-section',
    trigger: { 
      mode: 'immediate',
      value: 0,
      margin: '-20%'  // 퍼센트는 요소 크기에 비례해서 자동 조절
    }
  },
  {
    selector: '.footer',
    trigger: { 
      mode: 'immediate',
      value: 0
      // margin 없음 = 1px이라도 보이면 즉시
    }
  }
]);
```

### 세션 기반 사용자 추적
```javascript
import { createTracker, getSessionId, getSessionStats } from 'webpage-section-tracker';

const tracker = createTracker({
  endpoint: '/analytics',
  appId: 'my-app'
});

// 세션 ID 확인
console.log('User Session:', getSessionId());

// 세션별 이벤트 추적
tracker.track('user_action', {
  action: 'search',
  query: 'javascript',
  sessionId: getSessionId()  // 자동으로 포함되지만 명시적으로도 가능
});

// 세션 통계 모니터링
setInterval(() => {
  const stats = getSessionStats();
  if (stats && stats.willExpireIn < 5 * 60 * 1000) {
    // 세션 만료 5분 전 알림
    showNotification('Your session will expire soon');
  }
}, 60000);

// 로그아웃 시 세션 리셋
document.getElementById('logout').addEventListener('click', () => {
  resetSession();
  window.location.href = '/login';
});
```

### 전자상거래 사이트 추적
```javascript
const tracker = createTracker({
  endpoint: 'https://analytics.mystore.com/collect',
  appId: 'mystore',
  batchSize: 10,
  flushIntervalMs: 3000
});

// 제품 노출 추적
monitorElementDwell(tracker, [
  {
    selector: '.product-card',
    trigger: { mode: 'elementCoverage', value: 0.5 },
    meta: {
      collectDataAttrs: true,
      dataAttrAllowlist: ['data-product-id', 'data-price']
    }
  }
]);

// 구매 이벤트
tracker.track('purchase', {
  orderId: 'ORD-123456',
  total: 99.99,
  items: [
    { id: 'PROD-001', name: 'T-Shirt', price: 29.99, quantity: 2 }
  ]
});
```

### 블로그 읽기 시간 추적
```javascript
const tracker = createTracker({
  endpoint: '/analytics',
  appId: 'blog'
});

// 각 섹션별 읽기 시간 추적
const sections = document.querySelectorAll('article section');
const configs = Array.from(sections).map((_, index) => ({
  selector: `article section:nth-child(${index + 1})`,
  trigger: { mode: 'viewportPosition', value: 0.5 },
  heartbeat: {
    enabled: true,
    intervalMs: 2000,
    adaptive: {
      enabled: true,
      baseMs: 1000,
      maxMs: 10000,
      factor: 2
    }
  }
}));

monitorElementDwell(tracker, configs);
```

### 동영상 플레이어 영역 추적
```javascript
// 비디오 플레이어 노출 및 체류 시간 추적
const controller = monitorElementDwell(tracker, [
  {
    selector: '#video-player',
    trigger: { 
      mode: 'elementCoverage', 
      value: 0.8  // 80% 이상 보일 때
    },
    initialReport: 'guarded',
    initialGuard: {
      minStableMs: 1000,        // 1초간 안정화
      afterInteraction: true,    // 사용자 상호작용 후
      initialMinCoverage: 0.9   // 초기에는 90% 이상 요구
    },
    heartbeat: {
      enabled: true,
      intervalMs: 5000,  // 5초마다 보고
      adaptive: {
        enabled: true,
        baseMs: 5000,
        maxMs: 30000,    // 최대 30초
        factor: 1.5
      }
    },
    meta: {
      collectDataAttrs: true,
      dataAttrAllowlist: ['data-video-id', 'data-duration']
    }
  }
]);
```

### SPA (Single Page Application) 통합
```javascript
// React/Vue/Angular 등과 함께 사용
const tracker = createTracker({
  endpoint: '/collect',
  appId: 'spa-app'
});

// 라우트 변경 시 페이지뷰 추적
router.afterEach((to) => {
  tracker.pageView({
    path: to.path,
    title: to.meta.title
  });
});

// 컴포넌트 마운트 시 요소 추적
onMounted(() => {
  const controller = monitorElementDwell(tracker, [
    {
      selector: '#dynamic-content',
      trigger: { mode: 'elementCoverage', value: 0.3 }
    }
  ]);
  
  // 컴포넌트 언마운트 시 정리
  onUnmounted(() => {
    controller.stop();
  });
});
```

## Best Practices

### 1. 초기 보고 전략 선택
```javascript
// 빠른 피드백이 중요한 경우
{ initialReport: 'progress' }

// 정확성이 중요한 경우
{ 
  initialReport: 'guarded',
  initialGuard: {
    minStableMs: 500,
    rafPasses: 2
  }
}

// 사용자 참여 확인이 필요한 경우
{
  initialReport: 'guarded',
  initialGuard: {
    afterInteraction: true
  }
}
```

### 2. 효율적인 요소 선택
- ID가 있는 요소 우선 사용 (안정적인 선택자)
- 너무 많은 요소를 동시에 추적하지 않기 (최대 10개 권장)
- 중요한 요소에 집중하기

### 3. 네트워크 최적화
```javascript
// 배치 크기와 플러시 주기 조정
const tracker = createTracker({
  endpoint: '/collect',
  appId: 'app',
  batchSize: 30,        // 더 큰 배치
  flushIntervalMs: 10000 // 덜 빈번한 전송
});
```

## 성능 최적화

### 1. 적절한 쓰로틀링 설정
```javascript
// 덜 중요한 요소는 더 긴 쓰로틀링
{
  selector: '.footer',
  trigger: { mode: 'elementCoverage', value: 0.5 },
  throttleMs: 2000  // 2초마다 업데이트
}
```

### 2. 적응형 하트비트 사용
```javascript
// 사용자 활동이 없을 때 자동으로 빈도 감소
heartbeat: {
  adaptive: {
    enabled: true,
    baseMs: 500,
    factor: 2,  // 매번 2배씩 증가
    maxMs: 10000  // 최대 10초
  }
}
```

### 3. 실시간 메트릭 동기화
IntersectionObserver가 트리거되지 않는 상황에서도 메트릭이 정확하게 업데이트됩니다:
- **하트비트**: 주기적으로 위치/coverage 재계산
- **스크롤 이벤트**: 150ms 디바운스로 메트릭 업데이트  
- **리사이즈 이벤트**: 200ms 디바운스로 뷰포트 변경 반영

이를 통해 느린 스크롤이나 정적인 페이지에서도 일관된 데이터를 제공합니다.

### 4. 샘플링 활용
```javascript
// 높은 트래픽 사이트에서 샘플링 사용
const tracker = createTracker({
  endpoint: '/collect',
  appId: 'high-traffic',
  sampleRate: 0.05  // 5% 샘플링
});
```

## 내부 아키텍처

### 유틸리티 모듈

#### 재시도 로직 (Retry Utilities)
```javascript
// 지터가 포함된 지수 백오프
jitteredBackoff(attempt, baseMs, maxMs)
// Decorrelated 지터 (선택적)
decorrelatedJitter(prev, baseMs, maxMs)
```

#### 스토리지 (Storage)
- 로컬스토리지 기반 큐 지속성
- 페이지 새로고침 후에도 이벤트 유지
- 자동 복구 및 오류 처리

#### 고유 ID 생성 (UID)
- 암호학적으로 안전한 랜덤 ID
- 16바이트 기본 길이
- crypto.getRandomValues 사용

### 가시성 계산 알고리즘
- **elementCoverage**: IntersectionRatio 기반
- **viewportPosition**: 요소 상단 위치 기반
- **오버사이즈 폴백**: 뷰포트보다 큰 요소 자동 처리
- **루트 요소 지원**: 커스텀 스크롤 컨테이너 기준 계산

## 디버깅

### 콘솔 로그 관리
- **개발 빌드** (`npm run build:dev`): 디버깅을 위한 콘솔 로그 포함
- **프로덕션 빌드** (`npm run build`): 모든 console 문과 debugger 자동 제거
- 빌드 타입에 따라 자동으로 최적화됨

### 디버깅 팁

1. **스냅샷 확인**
```javascript
const controller = monitorElementDwell(tracker, configs);
// 현재 추적 상태 확인
console.log(controller.getSnapshots());
```

2. **이벤트 큐 모니터링**
```javascript
// 로컬스토리지에서 큐 상태 확인
const queue = JSON.parse(localStorage.getItem('__yt_queue_v1') || '{}');
console.log('Pending events:', queue.events?.length);
```

3. **강제 플러시**
```javascript
// 즉시 모든 이벤트 전송
await tracker.flush();
```

## 브라우저 지원

- Chrome 58+
- Firefox 55+
- Safari 12.1+
- Edge 79+

주요 요구사항:
- IntersectionObserver API
- localStorage API
- fetch API
- sendBeacon API (선택)

## 라이선스

MIT License
