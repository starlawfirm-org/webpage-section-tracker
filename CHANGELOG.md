# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

