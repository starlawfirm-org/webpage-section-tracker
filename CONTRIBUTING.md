# Contributing to Webpage Section Tracker

감사합니다! 이 프로젝트에 기여하고 싶으시다니 환영합니다. 🎉

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9 (권장)

### Setup

```bash
# Clone repository
git clone https://github.com/starlawfirm-org/webpage-section-tracker.git
cd webpage-section-tracker

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## 📦 Monorepo Structure

이 프로젝트는 pnpm workspace로 관리되는 모노레포입니다:

```
webpage-section-tracker/
├── packages/
│   ├── core/                 # Core library
│   └── react/                # React hooks
└── examples/
    └── react-test-app/       # Demo application
```

## 🔨 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-fix
```

### 2. Make Changes

```bash
# Watch mode for development
pnpm dev

# Or build specific package
pnpm build:core
pnpm build:react
```

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Lint code
pnpm lint

# Test examples
pnpm serve:examples
# Open http://localhost:5173
```

### 4. Create Changeset

변경사항을 배포할 때는 changeset을 생성해야 합니다:

```bash
pnpm changeset
```

대화형 프롬프트가 나타나면:
1. 변경된 패키지 선택 (space로 선택)
2. Semantic version 선택:
   - **patch**: 버그 수정 (0.1.3 → 0.1.4)
   - **minor**: 새 기능 (0.1.3 → 0.2.0)
   - **major**: Breaking changes (0.1.3 → 1.0.0)
3. 변경사항 설명 입력

### 5. Commit and Push

```bash
git add .
git commit -m "feat: add awesome feature"
git push origin feature/my-feature
```

### 6. Create Pull Request

GitHub에서 Pull Request를 생성하세요.

## 📝 Commit Message Guidelines

[Conventional Commits](https://www.conventionalcommits.org/) 스타일을 따릅니다:

```
type(scope): subject

[optional body]

[optional footer]
```

**Types:**
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링
- `perf`: 성능 개선
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

**Examples:**
```bash
feat(core): add immediate trigger mode
fix(react): resolve hook cleanup issue
docs(readme): update installation instructions
```

## 🧪 Testing

### Unit Tests

```bash
pnpm test
```

### Manual Testing

1. **HTML Examples**: `pnpm serve:examples`
2. **React App**: `cd examples/react-test-app && pnpm dev`
3. **Performance**: `http://localhost:5173/performance-test.html`

## 📚 Code Style

### TypeScript

- Strict mode 사용
- 명시적 타입 선언 선호
- JSDoc 주석으로 API 문서화

### Formatting

```bash
# Lint code
pnpm lint

# Auto-fix
pnpm lint --fix
```

## 🔄 Release Process

### For Maintainers

1. **Merge PR with changeset**
2. **Changeset bot creates version PR**
3. **Review and merge version PR**
4. **GitHub Actions automatically publishes to npm**

### Manual Release

```bash
# Bump versions
pnpm version

# Build
pnpm build

# Publish
pnpm release
```

## 🐛 Reporting Bugs

버그를 발견하셨나요? [GitHub Issues](https://github.com/starlawfirm-org/webpage-section-tracker/issues)에 제보해주세요.

**포함해주세요:**
- 명확한 제목과 설명
- 재현 방법 (step-by-step)
- 예상 동작 vs 실제 동작
- 환경 정보 (브라우저, Node.js 버전 등)
- 코드 샘플이나 스크린샷

## 💡 Feature Requests

새로운 기능 제안은 [GitHub Discussions](https://github.com/starlawfirm-org/webpage-section-tracker/discussions)에 작성해주세요.

## 📄 License

이 프로젝트에 기여하면 MIT 라이선스 하에 배포됩니다.

## 🙏 Questions?

궁금한 점이 있으시면:
- [GitHub Discussions](https://github.com/starlawfirm-org/webpage-section-tracker/discussions)
- [Issues](https://github.com/starlawfirm-org/webpage-section-tracker/issues)

---

다시 한번 감사드립니다! 🎉

