# 🚀 v1.0.0 배포 가이드

## ✅ 준비 완료

- ✅ 패키지명: `webpage-section-tracker`, `@starlawfirm/webpage-section-tracker-react`
- ✅ 버전: 1.0.0
- ✅ 빌드 성공
- ✅ Organization: starlawfirm (이미 존재)
- ✅ 패키지명 사용 가능 (404 확인 완료)

## 📋 배포 전 체크리스트

### npm 계정
- [ ] npm 로그인 완료 (`npm whoami`)
- [ ] starlawfirm organization 멤버
- [ ] 2FA 활성화 (권장)

### 패키지 준비
- [x] Core 빌드 성공 (29.21 KB)
- [x] React 빌드 성공 (1.26 KB)
- [x] TypeScript 타입 생성
- [x] README 작성
- [x] LICENSE 파일

### 문서
- [x] CHANGELOG.md - v1.0.0 추가
- [x] README.md - 패키지명 업데이트
- [x] packages/core/README.md - 전체 문서
- [x] packages/react/README.md - React 가이드

## 🎯 배포 명령어

### 1단계: 최종 빌드 확인

```bash
cd /Users/choeyeong-ung/Documents/GitHub/webpage-section-tracker

# 클린 빌드
pnpm clean
pnpm install
pnpm build

# Core & React 빌드 성공 확인
# (examples/react-test-app는 나중에 수정 가능)
```

### 2단계: Dry-run 테스트

```bash
# Core 패키지 dry-run
cd packages/core
npm publish --dry-run --access public

# React 패키지 dry-run
cd ../react
npm publish --dry-run --access public
```

**확인 사항**:
- 포함될 파일 목록
- package.json 정확성
- 경고 메시지

### 3단계: 실제 배포 🚀

```bash
# Core 패키지 배포
cd packages/core
npm publish --access public
# → 🎉 webpage-section-tracker@1.0.0 published!

# React 패키지 배포
cd ../react
npm publish --access public
# → 🎉 @starlawfirm/webpage-section-tracker-react@1.0.0 published!
```

### 4단계: 배포 확인

```bash
# npm에서 확인
npm view webpage-section-tracker
npm view @starlawfirm/webpage-section-tracker-react

# 버전 확인
npm view webpage-section-tracker version
# → 1.0.0

npm view @starlawfirm/webpage-section-tracker-react version
# → 1.0.0
```

### 5단계: 설치 테스트

```bash
# 새 디렉토리에서 테스트
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y

# Core 설치
npm install webpage-section-tracker
# → should install v1.0.0

# React 설치
npm install @starlawfirm/webpage-section-tracker-react react
# → should install v1.0.0

# 확인
ls -la node_modules/webpage-section-tracker
ls -la node_modules/@starlawfirm/webpage-section-tracker-react
```

### 6단계: CDN 확인 (약 5분 후)

```html
<!-- unpkg -->
<script src="https://unpkg.com/webpage-section-tracker@1.0.0/dist/index.iife.js"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/webpage-section-tracker@1.0.0/dist/index.iife.js"></script>
```

## 🔐 GitHub Actions 자동 배포 설정

배포 후:

### 1. npm Automation Token 생성

```bash
# 1. npm 웹사이트에서
https://www.npmjs.com/settings/YOUR_USERNAME/tokens

# 2. Generate New Token → Automation
# 3. Packages and scopes 설정:
#    - Read and write
#    - Packages: webpage-section-tracker, @starlawfirm/webpage-section-tracker-react

# 4. 토큰 복사
```

### 2. GitHub Secrets 추가

```
Repository Settings
→ Secrets and variables
→ Actions
→ New repository secret

Name: NPM_TOKEN
Value: [복사한 토큰]
```

### 3. 자동 배포 테스트

```bash
# Changeset 생성
pnpm changeset
# → patch 선택
# → "Fix: test issue" 입력

# Commit & Push
git add .
git commit -m "chore: test automated release"
git push

# PR 생성 → Merge
# → Changesets bot이 Version PR 생성 (v1.0.1)
# → Version PR Merge
# → 🤖 GitHub Actions가 자동 배포!
```

## 📊 배포 결과

### npm 페이지
- https://www.npmjs.com/package/webpage-section-tracker
- https://www.npmjs.com/package/@starlawfirm/webpage-section-tracker-react

### 통계
- Downloads
- Dependents
- Versions

### README
- npm에서 자동으로 README 표시
- Badges, 문서 링크 모두 작동

## 🎉 v1.0.0 릴리즈 노트

### 주요 기능
- ✨ Element Dwell Tracking (3가지 트리거 모드)
- 🔐 Session Management (Browser + View)
- 📦 Event Queue & Offline Support
- 🚀 V2 Schema (30-50% 크기 감소)
- ⚛️ React Hooks (`useTracker`, `useElementDwell`)
- 📏 Dynamic Threshold Optimization
- 🎯 Pixel/Percent Margin Support

### 패키지 정보
- **Core**: 29KB (gzip: ~9KB)
- **React**: 1.2KB (gzip: ~0.5KB)
- **TypeScript**: 완벽 지원
- **Formats**: ESM, CJS, IIFE
- **Node**: >=20
- **Browsers**: Chrome 58+, Firefox 55+, Safari 12.1+

## 🔄 배포 후 할 일

### 즉시
- [ ] npm 페이지 확인
- [ ] 설치 테스트
- [ ] CDN 동작 확인
- [ ] GitHub Release 생성

### 곧
- [ ] npm Automation token 생성
- [ ] GitHub Secrets 설정
- [ ] 자동 배포 테스트 (v1.0.1)

### 나중에
- [ ] 소셜 미디어 공지
- [ ] 블로그 포스트
- [ ] 커뮤니티 공유

## ⚠️ 문제 해결

### "403 Forbidden"
```bash
# 재로그인
npm logout
npm login
```

### "Package name too similar"
- 패키지명이 기존 패키지와 유사
- 하지만 404 확인했으므로 문제 없음

### "You must be logged in"
```bash
npm login
npm whoami
```

## 📝 배포 스크립트

간편하게 사용할 수 있는 스크립트:

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Publishing v1.0.0..."

# Build
echo "📦 Building packages..."
pnpm build

# Core
echo "📤 Publishing core..."
cd packages/core
npm publish --access public

# React
echo "📤 Publishing react..."
cd ../react
npm publish --access public

echo "✅ All packages published!"
echo "Check: https://www.npmjs.com/package/webpage-section-tracker"
echo "Check: https://www.npmjs.com/package/@starlawfirm/webpage-section-tracker-react"
```

실행:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🎊 축하합니다!

v1.0.0 정규 릴리즈 준비가 완료되었습니다!

**이제 실행하시면 됩니다**:
```bash
cd packages/core && npm publish --access public
cd ../react && npm publish --access public
```

🚀 Happy Publishing! 🎉

