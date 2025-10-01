export type { TrackerOptions, BaseContext, EventPayload } from "./types";
export { Tracker } from "./core/tracker";
export {
  getSessionId,
  getSessionMetadata,
  getSessionStats,
  getSessionContext,
  resetSession
} from "./utils/session";
export type { SessionData } from "./utils/session";
export {
  getViewSessionId,
  getCurrentViewSession,
  getViewSessionStats,
  endViewSession,
  trackViewSessionEvent
} from "./utils/view-session";
export type { ViewSessionData } from "./utils/view-session";

export function createTracker(opts: import("./types").TrackerOptions) {
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