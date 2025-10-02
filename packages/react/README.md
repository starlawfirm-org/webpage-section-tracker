# @webpage-section-tracker/react

React hooks and utilities for [webpage-section-tracker](../core).

## Installation

```bash
npm install webpage-section-tracker @webpage-section-tracker/react
# or
yarn add webpage-section-tracker @webpage-section-tracker/react
# or
pnpm add webpage-section-tracker @webpage-section-tracker/react
```

## Quick Start

```tsx
import { useTracker, useElementDwell } from '@webpage-section-tracker/react';

function App() {
  // Initialize tracker
  const tracker = useTracker({
    endpoint: '/api/collect',
    appId: 'my-app',
    batchSize: 10
  });

  // Configure element tracking
  const configs = [
    {
      selector: '#hero',
      trigger: { 
        mode: 'immediate', 
        value: 0, 
        margin: '-100px' 
      },
      heartbeat: { enabled: true, intervalMs: 1000 }
    }
  ];

  // Get real-time snapshots
  const snapshots = useElementDwell(tracker, configs);

  return (
    <div>
      {snapshots.map(snapshot => (
        <div key={snapshot.selector}>
          <h3>{snapshot.selector}</h3>
          <p>Visible: {snapshot.visibleNow ? 'Yes' : 'No'}</p>
          <p>Coverage: {(snapshot.elementCoverage * 100).toFixed(0)}%</p>
          <p>Dwell Time: {snapshot.dwellMs}ms</p>
        </div>
      ))}
    </div>
  );
}
```

## API

### `useTracker(options: TrackerOptions)`

Creates and manages a tracker instance.

**Parameters:**
- `options`: Tracker configuration (see [core docs](../core/README.md#api-reference))

**Returns:**
- `Tracker | null`: Tracker instance

**Features:**
- Automatic cleanup on unmount
- Singleton pattern per component

### `useElementDwell(tracker, configs)`

Monitors element visibility and dwell time.

**Parameters:**
- `tracker`: Tracker instance from `useTracker`
- `configs`: Array of element configurations

**Returns:**
- `ElementDwellSnapshot[]`: Real-time snapshots (updates every 100ms)

**Features:**
- Automatic observer cleanup
- Real-time state updates
- TypeScript support

## Examples

### Basic Usage

```tsx
import { useTracker, useElementDwell } from '@webpage-section-tracker/react';

function ProductList() {
  const tracker = useTracker({
    endpoint: '/analytics',
    appId: 'shop'
  });

  const configs = [
    { selector: '.product-card', trigger: { mode: 'immediate', value: 0 } }
  ];

  const snapshots = useElementDwell(tracker, configs);

  return (
    <div>
      {snapshots.filter(s => s.visibleNow).map(s => (
        <div key={s.selector}>Product visible: {s.selector}</div>
      ))}
    </div>
  );
}
```

### Advanced: Dynamic Configuration

```tsx
function DynamicTracker() {
  const [mode, setMode] = useState<'immediate' | 'elementCoverage'>('immediate');
  
  const tracker = useTracker({ 
    endpoint: '/api/collect', 
    appId: 'test' 
  });

  const configs = useMemo(() => [
    {
      selector: '#target',
      trigger: { mode, value: mode === 'immediate' ? 0 : 0.5 }
    }
  ], [mode]);

  const snapshots = useElementDwell(tracker, configs);

  return (
    <div>
      <button onClick={() => setMode('immediate')}>Immediate</button>
      <button onClick={() => setMode('elementCoverage')}>Coverage</button>
      {/* ... */}
    </div>
  );
}
```

### With TypeScript

```tsx
import type { ElementDwellSnapshot } from '@webpage-section-tracker/react';

interface TrackedElementProps {
  snapshot: ElementDwellSnapshot;
}

const TrackedElement: React.FC<TrackedElementProps> = ({ snapshot }) => {
  return (
    <div className={snapshot.visibleNow ? 'visible' : 'hidden'}>
      <h3>{snapshot.selector}</h3>
      <div>Coverage: {(snapshot.elementCoverage * 100).toFixed(1)}%</div>
      <div>Dwell: {snapshot.dwellMs}ms</div>
    </div>
  );
};
```

## TypeScript

All hooks and types are fully typed:

```typescript
import type {
  Tracker,
  TrackerOptions,
  ElementDwellConfig,
  ElementDwellSnapshot,
  DwellTriggerMode
} from '@webpage-section-tracker/react';
```

## Best Practices

### 1. Memoize Configs

```tsx
const configs = useMemo(() => [
  { selector: '#hero', trigger: { mode: 'immediate', value: 0 } }
], [/* dependencies */]);
```

### 2. Conditional Tracking

```tsx
const tracker = useTracker({
  endpoint: '/api/collect',
  appId: 'my-app',
  getConsent: () => userHasConsented
});
```

### 3. Cleanup

Hooks automatically handle cleanup, but you can also call `destroy()`:

```tsx
useEffect(() => {
  return () => {
    tracker?.destroy?.();
  };
}, [tracker]);
```

## Performance

- Snapshots update every **100ms** (configurable in source)
- Minimal re-renders using React refs
- Automatic observer management
- Tree-shakeable builds

## License

MIT © STARLAWFIRM

## Related

- [Core Package](../core) - Core tracking library
- [Examples](../../examples/react-test-app) - Full React test app
- [Main Documentation](../../README.md) - Project overview

