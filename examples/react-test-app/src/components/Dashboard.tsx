import { type ElementDwellSnapshot } from 'webpage-section-tracker';

interface DashboardProps {
  snapshots: ElementDwellSnapshot[];
  eventCount: number;
  config: {
    mode: string;
    value: number;
    margin?: string;
  };
}

export function Dashboard({ snapshots, eventCount, config }: DashboardProps) {
  const visibleCount = snapshots.filter(s => s.visibleNow).length;
  const avgDwell = snapshots.length > 0
    ? Math.round(snapshots.reduce((sum, s) => sum + s.dwellMs, 0) / snapshots.length)
    : 0;
  const avgCoverage = snapshots.length > 0
    ? Math.round(snapshots.reduce((sum, s) => sum + s.elementCoverage * 100, 0) / snapshots.length)
    : 0;

  return (
    <div className="dashboard">
      <div className="section">
        <h3 className="section-title">📊 Real-time Stats</h3>
        
        <div className="metric">
          <span className="metric-label">Tracked Elements</span>
          <span className="metric-value">{snapshots.length}</span>
        </div>
        
        <div className="metric">
          <span className="metric-label">Currently Visible</span>
          <span className="metric-value highlight">{visibleCount}</span>
        </div>
        
        <div className="metric">
          <span className="metric-label">Total Events</span>
          <span className="metric-value">{eventCount}</span>
        </div>
        
        <div className="metric">
          <span className="metric-label">Avg Dwell Time</span>
          <span className="metric-value">{avgDwell}ms</span>
        </div>
        
        <div className="metric">
          <span className="metric-label">Avg Coverage</span>
          <span className="metric-value">{avgCoverage}%</span>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">⚙️ Current Config</h3>
        <div className="config-display">
          <div className="config-item">
            <span className="config-label">Mode:</span>
            <span className="config-value">{config.mode}</span>
          </div>
          <div className="config-item">
            <span className="config-label">Value:</span>
            <span className="config-value">{config.value}</span>
          </div>
          {config.margin && (
            <div className="config-item">
              <span className="config-label">Margin:</span>
              <span className="config-value">{config.margin}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

