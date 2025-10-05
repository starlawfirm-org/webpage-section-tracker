// Hooks
export { useTracker } from './hooks/useTracker';
export { useElementDwell } from './hooks/useElementDwell';

// Components
export { Dashboard } from './components/Dashboard';
export { TrackedElement } from './components/TrackedElement';
export { Controls } from './components/Controls';

// Re-export types from tracker
export type {
  Tracker,
  TrackerOptionsV1,
  TrackerOptionsV2,
  ElementDwellConfig,
  ElementDwellSnapshot,
  BaseContext,
  EventPayload
} from 'webpage-section-tracker';

