# Webpage Section Tracker

<div align="center">

**🎯 웹 분석 라이브러리 - 요소 추적, 세션 관리, 이벤트 수집**

[![npm version](https://img.shields.io/npm/v/webpage-section-tracker.svg)](https://www.npmjs.com/package/webpage-section-tracker)
[![npm downloads](https://img.shields.io/npm/dm/webpage-section-tracker.svg)](https://www.npmjs.com/package/webpage-section-tracker)
[![CI](https://github.com/starlawfirm-org/webpage-section-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/starlawfirm-org/webpage-section-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)

</div>

---

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| [webpage-section-tracker](./packages/core) | 1.0.1 | 🎯 Core tracking library |
| [@starlawfirm/webpage-section-tracker-react](./packages/react) | 1.0.0 | ⚛️ React hooks & components |

### Core Package
\`\`\`bash
npm install webpage-section-tracker
\`\`\`

[Core 문서 보기 →](./packages/core/README.md)

### React Package
```bash
npm install @starlawfirm/webpage-section-tracker-react
```

[React 문서 보기 →](./packages/react/README.md)

## 🚀 Quick Start

### Vanilla JS
\`\`\`html
<script src="https://unpkg.com/webpage-section-tracker/dist/index.iife.js"></script>
<script>
  const { createTracker, monitorElementDwell } = window.StlTracker;
  // ...
</script>
\`\`\`

### React
\`\`\`tsx
import { useTracker, useElementDwell } from '@starlawfirm/webpage-section-tracker-react';
// ...
\`\`\`

## 🛠️ Development

### Quick Setup

```bash
# Install pnpm (if not installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Watch mode (development)
pnpm dev
```

### Available Scripts

```bash
pnpm build          # Build all packages
pnpm build:core     # Build core package only
pnpm build:react    # Build react package only
pnpm dev            # Watch mode for all packages
pnpm test           # Run all tests
pnpm lint           # Lint all packages
pnpm serve:examples # Serve HTML examples (port 5173)
pnpm dev:examples   # Build core + serve examples
pnpm clean          # Clean all dist and node_modules
```

### Release Workflow

```bash
# 1. Create changeset
pnpm changeset

# 2. Commit and push
git add .
git commit -m "feat: add new feature"
git push

# 3. Merge PR → GitHub Actions auto-publishes
```

자세한 내용은 [CONTRIBUTING.md](./CONTRIBUTING.md) 및 [RELEASE.md](./RELEASE.md) 참조

## 📄 License

MIT © STARLAWFIRM
