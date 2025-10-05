// React Hooks
export { useTracker } from './hooks/useTracker';
export { useElementDwell } from './hooks/useElementDwell';

// Re-export types from core package
export type {
  Tracker,
  TrackerOptionsV1,
  TrackerOptionsV2,
  ElementDwellConfig,
  ElementDwellSnapshot,
  ElementDwellController,
  DwellTriggerMode,
  BaseContext,
  EventPayload,
  SessionData,
  ViewSessionData
} from 'webpage-section-tracker';

