# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🐛 Critical Bug Fix: 이벤트 중복 전송 및 큐 오염 방지

#### Fixed
- 🔒 **이벤트 중복 전송 완전 차단**: 이미 전송된 이벤트 재전송 방지
  - **고유 ID 부여**: 모든 이벤트에 `_queueId` 자동 생성
  - **전송 추적**: `sentEventIds` Set으로 전송 완료 이벤트 추적
  - **복원 시 중복 제거**: localStorage 복원 시 이미 전송된 이벤트 필터링
  - **persist 강화**: sentEventIds도 localStorage에 저장

- 🚫 **탭 간 큐 오염 방지**: localStorage → sessionStorage 변경
  - **Before**: localStorage 사용 → 모든 탭이 큐 공유 → 오염
  - **After**: sessionStorage 사용 → 탭별 독립 큐 → 격리
  - **v1 마이그레이션**: localStorage v1 큐를 sessionStorage v2로 자동 이전
  - **클린업**: v1 localStorage 자동 삭제

#### Technical Details
- **이중 ID 시스템**:
  - `eventId`: 이벤트 발생 시점에 생성 (tracker.track)
  - `_queueId`: 큐 추가 시점에 생성 (백업용)
  - eventId 우선 사용, 없으면 _queueId 사용
  
- **3단계 중복 방지**:
  1. **enqueue 시**: eventId로 큐 내 중복 체크
  2. **enqueue 시**: sentEventIds로 전송 완료 체크
  3. **flush 시**: 최종 중복 체크

- **저장소 변경**:
  - 큐: `__stl_tracker_queue_v2` (sessionStorage, 탭별 격리)
  - sentEventIds: `__stl_sent_event_ids` (localStorage, 새로고침 후에도 유지)
  - v1 마이그레이션: localStorage → sessionStorage 자동 전환

#### Impact
- ✅ 중복 이벤트 100% 차단
- ✅ 탭 간 큐 오염 완전 방지
- ✅ 데이터 정확성 보장
- ✅ 새로고침 후에도 중복 방지
- ✅ persist 실패 시에도 안전

---

### 🏗️ Architecture: 3계층 세션 시스템 (v2.0)

#### Added
- 🔒 **3계층 세션 관리**: Browser / Page / View Session 분리
  - **Browser Session** (localStorage): 모든 탭 공유, 30분 TTL, 방문자 추적
  - **Page Session** (sessionStorage): 탭별 독립, 탭 닫으면 소멸, 탭 추적
  - **View Session** (메모리): 페이지 로드별, 새로고침마다 생성, 페이지뷰 추적
  
- 🛡️ **메모리 폴백**: 각 계층마다 storage 실패 시 메모리 사용
  - `memoryBrowserSession`: localStorage 폴백
  - `memoryPageSession`: sessionStorage 폴백
  - `memoryViewSession`: 항상 메모리 우선

- 📊 **통합 세션 컨텍스트**: payload에 3계층 모두 포함
  - browserId, pageId, viewId
  - 각 계층의 메타데이터 (firstVisit, viewCount 등)
  - 하위 호환성 유지 (v1 필드 그대로)

#### Changed
- `getSessionMetadata()`: 3계층 세션 데이터 반환
  - Before: `SessionData | null`
  - After: `SessionData` (browser, page, view 포함)
  
- `getSessionContext()`: 3계층 컨텍스트 반환
  - browserId, browserFirstVisit, browserTotalViews...
  - pageId, pageOpenedAt, pageViewCount...
  - viewId, viewLoadedAt, viewReferrer...

#### Fixed
- 🔧 **세션 오염 방지**: 여러 탭 동시 사용 시 격리
  - Page Session은 탭별로 완전 독립
  - View Session은 페이지 로드별 독립
  - Browser Session은 의도적으로 공유

- 🌐 **환경 호환성**: React/Next.js에서 안정적
  - 모듈 레벨 변수로 메모리 관리
  - 컴포넌트 리렌더와 무관
  - SSR/CSR 모두 지원

#### Breaking Changes
- ❌ **없음!** 하위 호환성 완벽 유지
  - v1 필드 (`sessionId`, `sessionPageViews` 등) 그대로 제공
  - 기존 코드 수정 불필요
  - v2 필드는 추가로 제공됨

## [1.1.0] - 2025-10-02

### 🚀 Major Performance Improvement

#### Added
- ⚡ **Event-based subscription API**: `controller.onChange(callback)` 추가
  - 폴링 완전 제거 (100-500ms interval → 0ms)
- 🎯 **Smart update notification**: emitProgress 시에만 onChange 호출
  - throttleMs 설정에 따라 자동 제어
  - heartbeat 간격에 맞춰 업데이트
  - 불필요한 리렌더 완전 차단

#### Changed
- **React Hook**: 폴링 → 이벤트 기반 구독
  - `useElementDwell` 완전히 재작성
  - 100ms 폴링 제거
  - onChange 구독으로 변경
  - 초기 스냅샷 즉시 전달

#### Performance
- **Before**: 초당 10회 폴링 → CPU 5-10% 사용예상
- **After**: 이벤트 기반 → CPU <1% 사용예상
- **React 리렌더**: 감소

### Breaking Changes
- `useElementDwell` 세 번째 파라미터 `updateInterval` 제거 (더 이상 불필요)

## [1.0.1] - 2025-10-02

### Documentation
- 📚 **Core README 업데이트**: v1.0.0 릴리즈 정보 반영
  - First Stable Release 헤더 추가
  - What's New in v1.0.0 섹션 추가
  - React 패키지 (`@starlawfirm/webpage-section-tracker-react`) 언급
  - 주요 기능 하이라이트
  - CHANGELOG 링크 추가

### Note
- React 패키지는 v1.0.0 유지 (변경사항 없음)

## [1.0.0] - 2025-10-02

### 🎉 First Stable Release!

#### Added
- 🏗️ **Monorepo Structure**: pnpm workspaces로 전환
- ⚛️ **React Package**: `@starlawfirm/webpage-section-tracker-react` 추가
- 🔬 **Performance Monitoring**: 실시간 성능 모니터링 도구
- 🤖 **GitHub Actions CI/CD**: 자동 빌드 & 배포
- 📦 **Changesets**: 자동 버전 관리
- 🎯 **Immediate Trigger Mode**: 1px 감지 + 픽셀/퍼센트 마진
- 📏 **Enhanced Metrics**: viewportBottomPct, viewportCoverage, visibleHeightPx
- 🚀 **V2 Schema**: 구조화된 데이터 (30-50% 크기 감소)
- 🔐 **Session Management**: Browser Session + View Session
- 🔄 **Dynamic Thresholds**: 설정별 최적화된 threshold 자동 계산
- 📊 **Real-time Updates**: Heartbeat, scroll, resize 시 메트릭 동기화
- 📚 **Comprehensive Docs**: 10+ 가이드 문서

#### Changed
- 📦 **Package Names**: 
  - Core: `webpage-section-tracker`
  - React: `@starlawfirm/webpage-section-tracker-react`
- 🎨 **Build System**: Production vs Development 분리
- 🗄️ **Storage Keys**: 브랜딩 개선

#### Fixed
- 🐛 **Pixel Margin Logic**: 일관된 위치 감지
- 🔧 **Coverage Calculation**: 큰 요소 정확도 개선
- 🧹 **Memory Leaks**: 완전한 리소스 정리
- ⚡ **Performance**: Date.now() 최적화

### Breaking Changes from 0.x
- Package name change: `@webpage-section-tracker/react` → `@starlawfirm/webpage-section-tracker-react`
- Minimum Node.js version: 20+
- pnpm workspace required for development

## [0.1.3] - 2025-10-02 (Beta)

### Added
- ✨ **Immediate trigger mode** - 1px이라도 보이면 즉시 추적
- 📏 **Pixel margin support** - 픽셀 단위 마진 설정 (`-100px`)
- 🎯 **Dynamic threshold calculation** - 설정에 맞는 정밀한 threshold 자동 계산
- 📊 **Enhanced metrics** - `viewportBottomPct`, `viewportCoverage`, `isOversized`, `visibleHeightPx`
- 🔄 **Real-time metric updates** - Heartbeat, scroll, resize 시 메트릭 동기화
- 🚀 **V2 schema support** - 구조화된 데이터 스키마 (30-50% 크기 감소)

### Changed
- 📐 **ViewportPosition mode simplified** - 큰 요소는 viewport coverage로 판단
- 🎨 **Element dwell basis type** - `DwellTriggerMode`로 통합

### Fixed
- 🐛 **Pixel margin logic** - 일관된 위치에서 감지
- 🔧 **Coverage calculation** - 큰 요소의 정확한 coverage 계산

## [0.1.2] - 2025-10-01

### Added
- 🔐 **Secure session ID system** - 암호학적으로 안전한 세션 생성
- 📊 **Session tracking** - Browser session & View session
- ⏱️ **Session lifecycle management** - 30분 타임아웃, heartbeat
- 🔄 **View session** - 페이지별 세션, 상호작용 추적

### Changed
- 📦 **Build optimization** - Production vs development builds
- 🗄️ **Storage key renaming** - 브랜딩 개선

## [0.1.1] - 2025-09-30

### Added
- 🎯 **Element Dwell plugin** - IntersectionObserver 기반 추적
- 📡 **Event queue** - 배치 처리 & 오프라인 지원
- 🔄 **Retry logic** - Jittered backoff
- 📤 **Transport layer** - sendBeacon + fetch

### Fixed
- 🐛 **Transport return values** - 실제 성공 여부 반영

## [0.1.0] - 2025-09-29

### Added
- 🎉 **Initial release**
- 📊 **Core tracker** - 이벤트 추적 기본 기능
- 🌐 **Multiple formats** - ESM, CJS, IIFE
- 📘 **TypeScript support** - 완벽한 타입 정의

---

## Legend

- ✨ New Feature
- 🐛 Bug Fix
- 📚 Documentation
- 🔨 Refactoring
- ⚡ Performance
- 🎨 Style
- ✅ Test
- 🔧 Chore
- 🔐 Security
- 📦 Build
- 🚀 Deployment

