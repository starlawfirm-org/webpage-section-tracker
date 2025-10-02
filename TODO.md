# TODO List - Webpage Section Tracker

## 🔴 High Priority

### Core Package

#### 1. Error Handling & Logging
- [ ] **Transport Layer** (`src/transports/`)
  - [ ] Add structured error logging for fetch failures
  - [ ] Add retry count metrics
  - [ ] Consider exponential backoff for network errors
  - [ ] Handle timeout errors separately from network errors

- [ ] **Storage** (`src/utils/storage.ts`)
  - [ ] Implement IndexedDB fallback when localStorage fails
  - [ ] Add storage quota monitoring
  - [ ] Implement LRU cache for event queue
  - [ ] Add metrics for storage failures

- [ ] **Event Queue** (`src/core/queue.ts`)
  - [ ] Add circuit breaker pattern for repeated failures
  - [ ] Implement dead letter queue for permanently failed events
  - [ ] Add queue health metrics (success rate, latency)
  - [ ] Consider compression for large payloads

#### 2. Configuration & Extensibility
- [ ] **Session Management** (`src/utils/session.ts`)
  - [ ] Make SESSION_TTL_MS configurable via TrackerOptions
  - [ ] Make HEARTBEAT_INTERVAL_MS configurable
  - [ ] Make ACTIVITY_THROTTLE_MS configurable
  - [ ] Add session lifecycle hooks (onCreate, onExpire, onRenew)

- [ ] **View Session** (`src/utils/view-session.ts`)
  - [ ] Make UPDATE_INTERVAL configurable
  - [ ] Make THROTTLE values configurable
  - [ ] Add engagement score customization
  - [ ] Add view session lifecycle hooks

#### 3. Security & Validation
- [ ] **Session ID Generation** (`src/utils/session.ts`)
  - [ ] Consider server-side session ID generation option
  - [ ] Add session ID validation
  - [ ] Implement session fixation protection

- [ ] **Data Validation** (`src/core/mapper.ts`)
  - [ ] Validate parent-child session relationship
  - [ ] Add schema validation for V2 payloads
  - [ ] Sanitize user input in custom context

#### 4. Performance
- [ ] **Element Dwell** (`src/plugins/element-dwell.ts`)
  - [ ] Optimize threshold calculation for mobile devices
  - [ ] Add performance metrics (callback time, frequency)
  - [ ] Consider virtual scrolling for many elements
  - [ ] Add memory leak detection

- [ ] **Batching** (`src/core/queue.ts`)
  - [ ] Implement adaptive batch sizing based on network conditions
  - [ ] Add payload compression (gzip/brotli)
  - [ ] Optimize common context extraction in V2 batches

## 🟡 Medium Priority

### Core Package

#### 5. Developer Experience
- [ ] Add comprehensive unit tests (target: 80% coverage)
- [ ] Add integration tests for common scenarios
- [ ] Add performance benchmarks
- [ ] Improve TypeScript types (reduce `any`, add generics)
- [ ] Add JSDoc comments for all public APIs

#### 6. Features
- [ ] **Consent Management**
  - [ ] GDPR compliance helpers
  - [ ] Cookie consent integration
  - [ ] Opt-out mechanism

- [ ] **Advanced Tracking**
  - [ ] Form submission tracking
  - [ ] Click tracking with heatmap data
  - [ ] Scroll depth milestone events
  - [ ] Custom event validators

- [ ] **Analytics**
  - [ ] User journey tracking
  - [ ] Funnel analysis helpers
  - [ ] A/B testing support
  - [ ] Cohort analysis utilities

### React Package

#### 7. React Enhancements
- [ ] Add more hooks:
  - [ ] `usePageView` - Automatic page view tracking
  - [ ] `useEvent` - Simple event tracking
  - [ ] `useSession` - Session state management
  - [ ] `useConsent` - Consent management

- [ ] Add React components:
  - [ ] `<TrackedElement>` - Wrapper for dwell tracking
  - [ ] `<TrackerProvider>` - Context provider
  - [ ] `<ConsentBanner>` - GDPR consent UI

- [ ] Add React 18 features:
  - [ ] Concurrent mode compatibility
  - [ ] Suspense support
  - [ ] Server Components compatibility (experimental)

## 🟢 Low Priority

### Documentation
- [ ] Add more code examples in README
- [ ] Create video tutorials
- [ ] Add interactive playground
- [ ] Translate docs to English
- [ ] Add cookbook with common patterns

### Tooling
- [ ] Add Storybook for React components
- [ ] Add visual regression tests
- [ ] Add bundle analyzer integration
- [ ] Create CLI tool for testing/debugging

### Ecosystem
- [ ] Vue.js adapter
- [ ] Svelte adapter
- [ ] Angular adapter
- [ ] Next.js plugin
- [ ] Nuxt.js module

## 🔵 Future Enhancements

### Advanced Features
- [ ] Real-time analytics dashboard
- [ ] Server-side rendering support
- [ ] Edge computing integration (Cloudflare Workers, etc.)
- [ ] GraphQL integration
- [ ] WebSocket real-time streaming

### AI/ML
- [ ] Predictive analytics (user behavior prediction)
- [ ] Anomaly detection (unusual patterns)
- [ ] Auto-optimization (adaptive batching, sampling)

### Privacy & Security
- [ ] End-to-end encryption option
- [ ] Differential privacy implementation
- [ ] Data anonymization utilities
- [ ] CCPA compliance helpers

## 📋 Code Quality Improvements

### Refactoring Needed
- [ ] Extract constants to configuration files
- [ ] Reduce code duplication (DRY principle)
- [ ] Improve naming consistency
- [ ] Add more descriptive error messages
- [ ] Standardize console log format

### Type Safety
- [ ] Replace `any` with proper types
- [ ] Add discriminated unions where appropriate
- [ ] Use branded types for IDs
- [ ] Add runtime type validation (zod, yup)

### Testing
- [ ] Add unit tests for all utilities
- [ ] Add integration tests for workflows
- [ ] Add E2E tests with Playwright
- [ ] Add visual regression tests
- [ ] Add performance regression tests

## 🎯 Known Issues

### Critical
- [ ] None currently

### Important
- [ ] Improve error messages in production builds
- [ ] Add graceful degradation for unsupported browsers
- [ ] Handle edge cases in element dwell (iframe, shadow DOM)

### Minor
- [ ] Optimize bundle size further (tree-shaking)
- [ ] Reduce dependency count
- [ ] Improve sourcemap accuracy

---

## 📝 Contributing

각 TODO 항목을 구현하려면:

1. Issue 생성
2. Feature 브랜치 생성
3. 구현 및 테스트
4. Changeset 생성
5. PR 제출

자세한 내용은 [CONTRIBUTING.md](./CONTRIBUTING.md) 참조

---

**Last Updated**: 2025-10-02


