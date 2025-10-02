import { useEffect, useRef, useState } from 'react';
import { monitorElementDwell, type Tracker, type ElementDwellConfig, type ElementDwellSnapshot } from 'webpage-section-tracker';

/**
 * Event-based Element Dwell tracking hook
 * 
 * Core의 onChange 이벤트를 구독하여 폴링 없이 실시간 업데이트
 * throttleMs와 heartbeat 설정에 따라 자동으로 업데이트됨
 */
export function useElementDwell(
  tracker: Tracker | null,
  configs: ElementDwellConfig[]
) {
  const [snapshots, setSnapshots] = useState<ElementDwellSnapshot[]>([]);

  useEffect(() => {
    if (!tracker || configs.length === 0) {
      setSnapshots([]);
      return;
    }

    const controller = monitorElementDwell(tracker, configs);

    // onChange 이벤트 구독 (폴링 제거!)
    const unsubscribe = controller.onChange((newSnapshots) => {
      setSnapshots(newSnapshots);
    });

    return () => {
      unsubscribe();
      controller.stop();
    };
  }, [tracker, configs]);

  return snapshots;
}

