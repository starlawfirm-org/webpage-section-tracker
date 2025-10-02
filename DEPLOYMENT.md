# Deployment Guide

## 🚢 배포 프로세스 요약

### Automated (권장)

1. **Changeset 생성**
   ```bash
   pnpm changeset
   ```

2. **PR 생성 및 머지**
   - PR을 main으로 머지
   - Changeset bot이 자동으로 version PR 생성

3. **Version PR 머지**
   - Version PR 리뷰 및 머지
   - GitHub Actions가 자동으로 npm에 배포

### Manual

```bash
# 1. 버전 업데이트
pnpm version

# 2. 빌드
pnpm build

# 3. 배포
pnpm release
```

## 📋 Pre-deployment Checklist

### Code Quality
- [ ] 모든 tests 통과
- [ ] Lint 에러 없음
- [ ] TypeScript 컴파일 성공
- [ ] 빌드 성공 (`pnpm build`)

### Documentation
- [ ] README 업데이트
- [ ] CHANGELOG 작성
- [ ] API 문서 정확
- [ ] Migration guide (Breaking changes)

### Testing
- [ ] HTML examples 동작
- [ ] React app 빌드 & 실행
- [ ] 브라우저 호환성 확인
- [ ] Performance test 통과

### Package Configuration
- [ ] package.json 버전 정확
- [ ] files 필드 정확
- [ ] publishConfig 설정
- [ ] peerDependencies 정확 (React package)

## 🔐 npm Authentication

### 1. npm 계정 생성/로그인

```bash
npm login
```

### 2. 2FA 설정 (필수)

npm 웹사이트에서 2FA 활성화:
- https://www.npmjs.com/settings/YOUR_USERNAME/twofa

### 3. Access Token 생성

**Automation 토큰** (GitHub Actions용):
1. https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. "Generate New Token" → "Automation"
3. 토큰 복사

**GitHub Secrets 설정:**
1. Repository Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `NPM_TOKEN`
4. Value: npm 토큰 붙여넣기

## 📦 배포 명령어

### Core Package

```bash
cd packages/core

# 배포 전 체크
npm run build
npm pack --dry-run

# 배포
npm publish --access public
```

### React Package

```bash
cd packages/react

# 배포 전 체크
npm run build
npm pack --dry-run

# 배포
npm publish --access public
```

## 🔄 Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH
```

**MAJOR (1.0.0)**
- Breaking API changes
- 기존 코드가 동작하지 않을 수 있음

**MINOR (0.2.0)**
- 새 기능 추가
- 하위 호환성 유지

**PATCH (0.1.4)**
- 버그 수정
- 사소한 개선

### Changeset Types

```bash
pnpm changeset

# 선택 예시:
# - webpage-section-tracker: minor
# - @webpage-section-tracker/react: patch
```

## 🎯 Release Workflows

### Feature Release

```bash
# 1. Feature 개발
git checkout -b feature/new-trigger-mode

# 2. Changeset 생성
pnpm changeset
# → minor 선택

# 3. PR 생성
git push origin feature/new-trigger-mode

# 4. Merge → Auto-publish
```

### Hotfix Release

```bash
# 1. Hotfix 브랜치
git checkout -b hotfix/critical-bug

# 2. 수정 후 changeset
pnpm changeset
# → patch 선택

# 3. PR 생성 (긴급)
git push origin hotfix/critical-bug

# 4. Fast-track merge → Auto-publish
```

### Beta Release

```bash
# package.json 수동 수정
"version": "0.2.0-beta.1"

# Tag 지정해서 배포
npm publish --tag beta

# 사용자가 설치
npm install webpage-section-tracker@beta
```

## 📊 Post-deployment

### 1. 배포 확인

```bash
# npm에서 확인
npm view webpage-section-tracker
npm view @webpage-section-tracker/react

# 버전 확인
npm view webpage-section-tracker version
```

### 2. 설치 테스트

```bash
# 새 디렉토리에서
mkdir test-install && cd test-install
npm init -y
npm install webpage-section-tracker @webpage-section-tracker/react

# 정상 설치 확인
ls node_modules/webpage-section-tracker
ls node_modules/@webpage-section-tracker/react
```

### 3. CDN 확인

```html
<!-- unpkg -->
<script src="https://unpkg.com/webpage-section-tracker@latest/dist/index.iife.js"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/webpage-section-tracker@latest/dist/index.iife.js"></script>
```

### 4. GitHub Release

- [ ] Release notes 작성
- [ ] Assets 첨부 (선택)
- [ ] Tag 생성

## 🐛 Rollback

### npm Unpublish (24시간 이내만 가능)

```bash
npm unpublish webpage-section-tracker@0.1.4
```

### Deprecate Version

```bash
npm deprecate webpage-section-tracker@0.1.4 "Critical bug - use 0.1.5 instead"
```

### 새 버전 배포

```bash
# 버그 수정 후 새 patch 버전
pnpm changeset  # patch 선택
# ... PR 머지 → 자동 배포
```

## 📈 Monitoring

### npm Stats

- https://npm-stat.com/charts.html?package=webpage-section-tracker
- https://www.npmjs.com/package/webpage-section-tracker

### GitHub Analytics

- Repository Insights
- Traffic
- Stars/Forks

## 🔒 Security

### Package Audit

```bash
pnpm audit
```

### Dependency Updates

```bash
# Check outdated packages
pnpm outdated

# Update dependencies
pnpm update --latest
```

## ⚠️ Troubleshooting

### "403 Forbidden" 에러

```bash
# npm 로그인 확인
npm whoami

# 재로그인
npm logout
npm login
```

### "Package name too similar" 에러

- 패키지명 충돌
- npm support 문의 필요

### "Version already exists" 에러

- 이미 배포된 버전
- 버전 번호 증가 필요

### GitHub Actions 실패

1. Secrets 확인 (`NPM_TOKEN`)
2. Workflow permissions 확인
3. 로그 확인

---

질문이 있으시면 [Issues](https://github.com/starlawfirm-org/webpage-section-tracker/issues)를 열어주세요!

