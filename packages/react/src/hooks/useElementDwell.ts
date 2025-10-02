import { useEffect, useRef, useState } from 'react';
import { monitorElementDwell, type Tracker, type ElementDwellConfig, type ElementDwellSnapshot } from 'webpage-section-tracker';

export function useElementDwell(
  tracker: Tracker | null,
  configs: ElementDwellConfig[]
) {
  const controllerRef = useRef<{ stop: () => void; getSnapshots: () => ElementDwellSnapshot[] } | null>(null);
  const [snapshots, setSnapshots] = useState<ElementDwellSnapshot[]>([]);

  useEffect(() => {
    if (!tracker || configs.length === 0) return;

    controllerRef.current = monitorElementDwell(tracker, configs);

    const interval = setInterval(() => {
      if (controllerRef.current) {
        setSnapshots(controllerRef.current.getSnapshots());
      }
    }, 100);

    return () => {
      clearInterval(interval);
      controllerRef.current?.stop();
    };
  }, [tracker, configs]);

  return snapshots;
}

