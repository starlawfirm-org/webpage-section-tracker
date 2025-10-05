export type { TrackerOptionsV1, TrackerOptionsV2, BaseContext, EventPayload } from "./types";
export { Tracker } from "./core/tracker";

// 3계층 세션 시스템 (v2.0)
export {
  getSessionId,
  getSessionMetadata,
  getSessionContext,
  resetSession,
  touchSession,
  incrementPageView,
  incrementViewCount,
  logSessionInfo,
  getSessionDebugInfo
} from "./utils/session";
export type { 
  SessionData, 
  BrowserSessionData, 
  PageSessionData, 
  ViewSessionData,
  LegacySessionData
} from "./utils/session";

// Element Dwell Plugin
export { monitorElementDwell } from "./plugins/element-dwell";
export type {
  ElementDwellConfig,
  ElementDwellSnapshot,
  ElementDwellController,
  DwellTriggerMode
} from "./plugins/element-dwell.types";

export function createTracker(opts: import("./types").TrackerOptionsV1 | import("./types").TrackerOptionsV2) {
  return new (requireOrImportTracker())(opts);
}

function requireOrImportTracker() {
  // simple indirection to avoid bundlers tripping on constructor export in CJS
  return requireTracker();
}

function requireTracker() {
  // This function will be inlined by bundlers; here for API symmetry.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Tracker } = require("./core/tracker");
  return Tracker;
}