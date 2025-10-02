# React Test App - Element Dwell Tracker

React + TypeScript + Vite 기반의 고급 Element Dwell 트래커 테스트 애플리케이션입니다.

## 🚀 **시작하기**

```bash
# 의존성 설치 (이미 완료됨)
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프리뷰
npm run preview
```

## 📦 **포함된 기능**

### 1. React Hooks
- **`useTracker`**: Tracker 인스턴스를 React 컴포넌트에서 사용
- **`useElementDwell`**: Element Dwell 모니터링을 React 스타일로 구현

### 2. 컴포넌트
- **Dashboard**: 실시간 통계 및 설정 정보 표시
- **TrackedElement**: 추적되는 요소를 시각적으로 표현
- **Controls**: 설정을 동적으로 변경할 수 있는 컨트롤

### 3. 주요 특징
- **타입 안전성**: TypeScript로 완벽한 타입 지원
- **실시간 업데이트**: 100ms마다 스냅샷 갱신
- **반응형 UI**: 다크 모드 기반의 세련된 인터페이스
- **동적 설정**: 요소 개수, 트리거 모드, 마진 실시간 변경

## 🎯 **사용 예제**

### Hook 기본 사용법

```tsx
import { useTracker } from './hooks/useTracker';
import { useElementDwell } from './hooks/useElementDwell';

function MyComponent() {
  // 1. Tracker 초기화
  const tracker = useTracker({
    endpoint: '/api/collect',
    appId: 'my-app',
    batchSize: 10,
    fetcher: async (url, payload) => {
      console.log('Event:', payload);
      return { ok: true };
    }
  });

  // 2. Element Dwell 설정
  const configs = [
    {
      selector: '#hero',
      trigger: { mode: 'immediate', value: 0, margin: '-100px' },
      heartbeat: { enabled: true, intervalMs: 1000 }
    }
  ];

  // 3. 실시간 스냅샷 받기
  const snapshots = useElementDwell(tracker, configs);

  // 4. 상태 사용
  return (
    <div>
      {snapshots.map(snapshot => (
        <div key={snapshot.selector}>
          {snapshot.visibleNow ? '👁️ Visible' : '❌ Hidden'}
          - Coverage: {(snapshot.elementCoverage * 100).toFixed(0)}%
          - Dwell: {snapshot.dwellMs}ms
        </div>
      ))}
    </div>
  );
}
```

## 📊 **테스트 시나리오**

### 1. 기본 동작 확인
- Element Count를 5로 설정
- 스크롤하면서 요소들이 트래킹되는지 확인
- 녹색 테두리가 표시되는지 확인

### 2. 다양한 모드 테스트
- **Immediate**: margin 값을 변경하며 테스트
- **Element Coverage**: value를 0.1~0.9로 조정
- **Viewport Position**: value를 0.1~0.9로 조정

### 3. 성능 테스트
- Element Count를 20으로 증가
- 빠르게 스크롤하면서 버벅임 확인
- 브라우저 개발자 도구로 메모리 확인

### 4. React 통합 확인
- 컴포넌트가 언마운트될 때 정리되는지 확인
- 설정 변경 시 재초기화가 올바른지 확인
- 상태 업데이트가 정상적인지 확인

## 🎨 **UI 가이드**

### 컬러 코딩
- 🟢 **Green (Tracking)**: 현재 추적 중인 요소
- 🟣 **Purple**: 추적 중이지 않은 요소
- 🔴 **Red Badge**: 실시간 트래킹 표시

### 메트릭 설명
- **Coverage**: 요소의 몇 %가 보이는지 (0-100%)
- **Dwell Time**: 추적 시작부터의 누적 시간 (ms)
- **Viewport Top/Bottom**: 요소의 상/하단이 뷰포트의 어디에 있는지 (0-100%)
- **Visible Height**: 실제 보이는 높이 (px)

## 🔧 **커스터마이징**

### 1. 요소 스타일 변경
`src/App.css`에서 `.tracked-element` 클래스 수정

### 2. 통계 추가
`src/components/Dashboard.tsx`에서 새로운 메트릭 추가

### 3. 커스텀 훅 생성
`src/hooks/` 디렉토리에 새로운 훅 추가

## 📖 **참고 자료**

- [Main Project README](../../README.md)
- [API Documentation](../../README.md#api-reference)
- [Element Dwell Plugin](../../src/plugins/element-dwell.ts)

## 🐛 **문제 해결**

### 빌드 에러
```bash
# 캐시 정리 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 타입 에러
```bash
# 상위 패키지 빌드 확인
cd ../..
npm run build
```

### 핫 리로드 안됨
```bash
# Vite 서버 재시작
npm run dev
```

## 🚀 **배포**

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과는 dist/ 디렉토리에 생성됨
# 정적 호스팅 서비스에 업로드 (Vercel, Netlify, etc.)
```

---

Made with ❤️ using React + TypeScript + Vite
