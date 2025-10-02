import { useState, useMemo } from 'react';
import { useTracker, useElementDwell } from '@starlawfirm/webpage-section-tracker-react';
import { Dashboard } from './components/Dashboard';
import { TrackedElement } from './components/TrackedElement';
import { Controls } from './components/Controls';
import './App.css';

interface Config {
  mode: 'immediate' | 'elementCoverage' | 'viewportPosition';
  value: number;
  margin?: string;
}

function App() {
  const [elementCount, setElementCount] = useState(5);
  const [config, setConfig] = useState<Config>({
    mode: 'immediate',
    value: 0,
    margin: '-100px'
  });
  const [eventCount, setEventCount] = useState(0);

  const tracker = useTracker({
    endpoint: '/api/collect',
    appId: 'react-test-app',
    batchSize: 1,
    flushIntervalMs: 250,
    fetcher: async (_url, payload) => {
      console.log('[Tracker] Event:', payload);
      setEventCount(prev => prev + 1);
      return { ok: true };
    }
  });

  const dwellConfigs = useMemo(() => {
    return Array.from({ length: elementCount }, (_, i) => ({
      selector: `#element-${i}`,
      trigger: {
        mode: config.mode,
        value: config.value,
        margin: config.mode === 'immediate' ? config.margin : undefined
      },
      throttleMs: 500,
      allowOversizeFallback: true,
      heartbeat: {
        enabled: true,
        intervalMs: 1000
      }
    }));
  }, [elementCount, config]);

  const snapshots = useElementDwell(tracker, dwellConfigs);

  const handleConfigChange = (newConfig: Partial<Config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <div className="app">
      <div className="sidebar">
        <h1 className="title">
          <span className="emoji">🔬</span>
          React Test App
        </h1>
        
        <Dashboard 
          snapshots={snapshots}
          eventCount={eventCount}
          config={config}
        />
        
        <Controls
          elementCount={elementCount}
          config={config}
          onElementCountChange={setElementCount}
          onConfigChange={handleConfigChange}
          onReset={() => setEventCount(0)}
        />
      </div>

      <div className="content">
        {Array.from({ length: elementCount }, (_, i) => {
          const snapshot = snapshots.find(s => s.selector === `#element-${i}`);
          return (
            <TrackedElement
              key={i}
              id={`element-${i}`}
              index={i}
              snapshot={snapshot}
            />
          );
        })}
      </div>
    </div>
  );
}

export default App;
