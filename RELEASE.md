# Release Guide

## 📋 Pre-release Checklist

- [ ] 모든 테스트 통과
- [ ] 문서 업데이트 (README, CHANGELOG)
- [ ] 예제 코드 동작 확인
- [ ] 빌드 성공 (`pnpm build`)
- [ ] Bundle size 확인
- [ ] Breaking changes 문서화

## 🚀 Release Process

### 1. Create Changeset

```bash
pnpm changeset
```

변경사항에 맞는 버전 선택:
- **patch**: 버그 수정, 사소한 개선
- **minor**: 새 기능, 하위 호환 유지
- **major**: Breaking changes

### 2. Commit Changeset

```bash
git add .changeset
git commit -m "chore: add changeset for X feature"
git push
```

### 3. Merge to Main

PR을 main 브랜치로 머지합니다.

### 4. Automated Release

GitHub Actions가 자동으로:
1. Version PR 생성
2. CHANGELOG 업데이트
3. package.json 버전 증가

### 5. Publish

Version PR을 머지하면 자동으로:
1. 패키지 빌드
2. npm에 배포
3. GitHub Release 생성

## 🔧 Manual Release (필요시)

### 로컬에서 배포

```bash
# 1. 버전 업데이트
pnpm version

# 2. 빌드
pnpm build

# 3. 배포
cd packages/core
npm publish

cd ../react
npm publish
```

### npm 로그인

```bash
npm login
# Username, Password, Email 입력
# OTP (2FA) 입력
```

## 📦 Package Versions

현재 패키지들은 독립적으로 버전 관리됩니다:

- **core**: `webpage-section-tracker@0.1.3`
- **react**: `@webpage-section-tracker/react@0.1.3`

### Versioning Strategy

[Semantic Versioning](https://semver.org/)을 따릅니다:

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking API changes
- **MINOR**: 새 기능, 하위 호환
- **PATCH**: 버그 수정, 사소한 개선

## 🔐 Secrets Configuration

GitHub Actions에서 배포하려면 다음 secrets가 필요합니다:

### NPM_TOKEN

1. npm 웹사이트에서 토큰 생성:
   - https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - "Automation" 타입 선택

2. GitHub repository settings에 추가:
   - Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `NPM_TOKEN`
   - Value: npm 토큰 붙여넣기

## 📊 Release Checklist

배포 전 확인사항:

### Core Package
- [ ] TypeScript 빌드 성공
- [ ] ESM/CJS/IIFE 모두 생성
- [ ] Types 파일 생성
- [ ] README 업데이트
- [ ] Example 동작 확인

### React Package  
- [ ] TypeScript 빌드 성공
- [ ] Hooks 타입 정의
- [ ] Peer dependencies 정확
- [ ] README 업데이트
- [ ] Demo app 동작 확인

### Examples
- [ ] HTML examples 동작
- [ ] React app 빌드 성공
- [ ] Performance test 통과

## 🐛 Rollback

배포 후 문제 발견 시:

### npm에서 버전 제거 (24시간 이내)

```bash
npm unpublish webpage-section-tracker@0.1.4
npm unpublish @webpage-section-tracker/react@0.1.4
```

### Deprecate 버전

```bash
npm deprecate webpage-section-tracker@0.1.4 "This version has critical bugs"
```

### 새 패치 버전 배포

```bash
# 버그 수정 후
pnpm changeset
# patch 선택, "Fix critical bug in X" 입력
git add .
git commit -m "fix: critical bug in X"
git push
```

## 📈 Post-release

배포 후:
1. GitHub Release notes 확인/수정
2. npm에서 패키지 확인
3. 소셜 미디어 공지 (선택)
4. 이슈/PR에 릴리스 버전 태그

## 🎯 Beta/Alpha Releases

### Pre-release 배포

```bash
# package.json 버전을 수동으로 변경
"version": "0.2.0-beta.1"

# tag 지정해서 배포
npm publish --tag beta
```

### 설치

```bash
npm install webpage-section-tracker@beta
```

