// src/browser.ts
import { Tracker, createTracker } from "./index";
import { monitorElementDwell } from "./plugins/element-dwell";
import { 
  getSessionId, 
  getSessionMetadata, 
  resetSession,
  logSessionInfo,
  getSessionDebugInfo
} from "./utils/session";

(() => {
  if (typeof window === "undefined") return;
  (window as any).StlTracker = {
    Tracker,
    createTracker,
    monitorElementDwell,
    
    // 3계층 세션 관리 (v2.0)
    getSessionId,           // Browser Session ID
    getSessionMetadata,     // 전체 세션 데이터
    resetSession,           // 세션 초기화
    logSessionInfo,         // 세션 정보 로깅
    getSessionDebugInfo,    // 디버그 정보
    
    // 별칭
    create: createTracker,
  };
})();
