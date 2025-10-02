import { useEffect, useRef } from 'react';
import { createTracker, type TrackerOptions, type Tracker } from 'webpage-section-tracker';

export function useTracker(options: TrackerOptions) {
  const trackerRef = useRef<Tracker | null>(null);

  useEffect(() => {
    trackerRef.current = createTracker(options);

    return () => {
      trackerRef.current?.destroy?.();
    };
  }, []);

  return trackerRef.current;
}

