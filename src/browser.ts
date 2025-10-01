// src/browser.ts
import { Tracker, createTracker } from "./index";
import { monitorElementDwell } from "./plugins/element-dwell";
import { getSessionId, getSessionMetadata, getSessionStats, resetSession } from "./utils/session";
import { getViewSessionId, getCurrentViewSession, getViewSessionStats, endViewSession } from "./utils/view-session";

(() => {
  if (typeof window === "undefined") return;
  (window as any).StlTracker = {
    Tracker,
    createTracker,
    monitorElementDwell,
    // Browser Session 관련 함수
    getSessionId,
    getSessionMetadata,
    getSessionStats,
    resetSession,
    // View Session 관련 함수 (페이지 단위 세션)
    getViewSessionId,
    getCurrentViewSession,
    getViewSessionStats,
    endViewSession,
    // 별칭
    create: createTracker,
  };
})();
