import { useEffect, useRef } from 'react';
import { createTracker, type TrackerOptionsV1, type TrackerOptionsV2, type Tracker } from 'webpage-section-tracker';

export function useTracker(options: TrackerOptionsV1 | TrackerOptionsV2) {
  const trackerRef = useRef<Tracker | null>(null);

  useEffect(() => {
    trackerRef.current = createTracker(options);

    return () => {
      trackerRef.current?.destroy?.();
    };
  }, []);

  return trackerRef.current;
}

