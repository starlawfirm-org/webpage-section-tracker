import { type ElementDwellSnapshot } from 'webpage-section-tracker';

interface TrackedElementProps {
  id: string;
  index: number;
  snapshot?: ElementDwellSnapshot;
}

export function TrackedElement({ id, index, snapshot }: TrackedElementProps) {
  const isTracking = snapshot?.visibleNow ?? false;
  const coverage = snapshot ? Math.round(snapshot.elementCoverage * 100) : 0;
  const dwellMs = snapshot?.dwellMs ?? 0;

  return (
    <div
      id={id}
      className={`tracked-element ${isTracking ? 'tracking' : ''}`}
      style={{
        height: `${200 + index * 80}px`,
        background: isTracking
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="element-header">
        <h3 className="element-title">Element #{index + 1}</h3>
        {isTracking && <span className="tracking-badge">🔴 TRACKING</span>}
      </div>

      <div className="element-stats">
        <div className="stat-card">
          <div className="stat-label">Coverage</div>
          <div className="stat-value">{coverage}%</div>
          <div className="stat-bar">
            <div
              className="stat-fill"
              style={{ width: `${coverage}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Dwell Time</div>
          <div className="stat-value">{dwellMs}ms</div>
        </div>

        {snapshot && (
          <>
            <div className="stat-card">
              <div className="stat-label">Viewport Top</div>
              <div className="stat-value">
                {Math.round(snapshot.viewportTopPct * 100)}%
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Viewport Bottom</div>
              <div className="stat-value">
                {Math.round((snapshot.viewportBottomPct ?? 0) * 100)}%
              </div>
            </div>

            {snapshot.isOversized && (
              <div className="stat-card warning">
                <div className="stat-label">⚠️ Oversized</div>
                <div className="stat-value">
                  {Math.round((snapshot.viewportCoverage ?? 0) * 100)}%
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="element-info">
        <div className="info-item">
          <span className="info-label">Selector:</span>
          <span className="info-value">#{id}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Height:</span>
          <span className="info-value">{200 + index * 80}px</span>
        </div>
        {snapshot && (
          <>
            <div className="info-item">
              <span className="info-label">Visible Height:</span>
              <span className="info-value">
                {Math.round(snapshot.visibleHeightPx ?? 0)}px
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Basis:</span>
              <span className="info-value">{snapshot.basis}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

