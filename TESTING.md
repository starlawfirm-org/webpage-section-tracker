# Testing Guide

## 🧪 테스트 전략

### 1. 자동화 테스트

#### Unit Tests
```bash
pnpm test
```

**커버리지 목표:**
- Core utilities: 80%+
- Tracker logic: 70%+
- Plugins: 60%+

#### CI/CD
- GitHub Actions에서 자동 실행
- PR마다 자동 체크
- Main 브랜치 보호

### 2. 수동 테스트

#### HTML Examples
```bash
pnpm serve:examples
```

**테스트 페이지:**
1. **Performance Test** (`/performance-test.html`)
   - [ ] FPS 60 유지
   - [ ] 메모리 누수 없음
   - [ ] Callback 빈도 적정
   - [ ] 50개 요소에서도 부드러움

2. **Trigger Test** (`/trigger-test.html`)
   - [ ] Immediate 모드 정확히 작동
   - [ ] ElementCoverage 모드 정확
   - [ ] ViewportPosition 모드 정확
   - [ ] 픽셀/퍼센트 마진 동작

3. **Oversized Element Test** (`/oversized-element-test.html`)
   - [ ] 큰 요소 메트릭 정확
   - [ ] Coverage 계산 정확
   - [ ] Threshold 최적화 확인

#### React App
```bash
cd examples/react-test-app
pnpm dev
```

**테스트 시나리오:**
- [ ] Hook 정상 동작
- [ ] 컴포넌트 언마운트 시 정리
- [ ] 설정 변경 시 재초기화
- [ ] 타입 에러 없음
- [ ] Hot reload 동작

### 3. 브라우저 호환성

#### Desktop
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

#### Mobile
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Samsung Internet

### 4. 성능 벤치마크

#### Core Package
```bash
# Bundle size
ls -lh packages/core/dist/

# Target:
# - ESM: <30KB
# - CJS: <30KB
# - IIFE: <30KB
```

#### React Package
```bash
# Bundle size
ls -lh packages/react/dist/

# Target:
# - ESM: <2KB
# - CJS: <2KB
```

## 🎯 테스트 시나리오

### Scenario 1: 기본 추적

```javascript
const tracker = createTracker({
  endpoint: '/api/collect',
  appId: 'test'
});

monitorElementDwell(tracker, [{
  selector: '#test',
  trigger: { mode: 'immediate', value: 0 }
}]);

// 확인:
// - 요소가 보이면 즉시 이벤트 발생
// - visibleNow가 true로 변경
// - dwellMs 증가
```

### Scenario 2: 픽셀 마진

```javascript
monitorElementDwell(tracker, [{
  selector: '#test',
  trigger: { mode: 'immediate', value: 0, margin: '-100px' }
}]);

// 확인:
// - 100px 이상 보일 때만 트리거
// - 콘솔에 정확한 픽셀 수 출력
// - 일관된 위치에서 감지
```

### Scenario 3: 큰 요소

```javascript
monitorElementDwell(tracker, [{
  selector: '#hero',  // 2000px 높이
  trigger: { mode: 'viewportPosition', value: 0.3 },
  allowOversizeFallback: true
}]);

// 확인:
// - isOversized가 true
// - viewportCoverage 30% 이상일 때 트리거
// - 메트릭 정확히 계산
```

### Scenario 4: React 통합

```tsx
const tracker = useTracker({ endpoint: '/api', appId: 'test' });
const snapshots = useElementDwell(tracker, configs);

// 확인:
// - 컴포넌트 마운트 시 추적 시작
// - 언마운트 시 정리
// - 상태 업데이트 반영
```

## 🔍 디버깅

### 콘솔 로그 활성화

개발 모드에서는 자동으로 활성화:
```bash
pnpm build:dev
```

### Chrome DevTools

1. **Performance Tab**
   - Long tasks 확인
   - FPS 모니터링
   - Memory 프로파일링

2. **Console**
   - `[ElementDwell]` 로그 확인
   - `[Session]` 로그 확인
   - `[Pixel Margin]` 로그 확인

3. **Network Tab**
   - Beacon 요청 확인
   - Payload 크기 확인
   - Retry 동작 확인

## 📊 성능 기준

### Core Package

| Metric | Target | Actual |
|--------|--------|--------|
| Bundle (ESM) | <30KB | ~28KB ✅ |
| Bundle (Gzip) | <10KB | ~8KB ✅ |
| FPS (50 elements) | ≥55 | ~60 ✅ |
| Memory (10min) | <50MB | ~30MB ✅ |

### React Package

| Metric | Target | Actual |
|--------|--------|--------|
| Bundle (ESM) | <5KB | ~1.2KB ✅ |
| Bundle (Gzip) | <1KB | ~0.5KB ✅ |
| Re-renders | Minimal | ✅ |

## 🐛 Known Issues

현재 알려진 이슈는 [GitHub Issues](https://github.com/starlawfirm-org/webpage-section-tracker/issues)를 참조하세요.

## ✅ Test Checklist (Release 전)

### Core Package
- [ ] 모든 unit tests 통과
- [ ] HTML examples 동작
- [ ] 브라우저 호환성 확인
- [ ] Bundle size 확인
- [ ] TypeScript types 정확

### React Package
- [ ] Hooks 정상 동작
- [ ] TypeScript 에러 없음
- [ ] Peer dependencies 정확
- [ ] React 18, 19 호환
- [ ] Demo app 빌드 성공

### Documentation
- [ ] README 업데이트
- [ ] API 문서 정확
- [ ] 예제 코드 동작
- [ ] CHANGELOG 업데이트
- [ ] Migration guide (Breaking changes 시)

---

문제가 발견되면 즉시 [Issue](https://github.com/starlawfirm-org/webpage-section-tracker/issues)를 생성해주세요!

