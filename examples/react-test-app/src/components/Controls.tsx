interface ControlsProps {
  elementCount: number;
  config: {
    mode: 'immediate' | 'elementCoverage' | 'viewportPosition';
    value: number;
    margin?: string;
  };
  onElementCountChange: (count: number) => void;
  onConfigChange: (config: Partial<ControlsProps['config']>) => void;
  onReset: () => void;
}

export function Controls({
  elementCount,
  config,
  onElementCountChange,
  onConfigChange,
  onReset
}: ControlsProps) {
  return (
    <div className="controls">
      <div className="section">
        <h3 className="section-title">🎮 Controls</h3>

        <div className="control-group">
          <label className="control-label">
            Element Count: {elementCount}
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={elementCount}
            onChange={(e) => onElementCountChange(Number(e.target.value))}
            className="control-range"
          />
        </div>

        <div className="control-group">
          <label className="control-label">Trigger Mode</label>
          <select
            value={config.mode}
            onChange={(e) => onConfigChange({ 
              mode: e.target.value as any,
              value: e.target.value === 'immediate' ? 0 : 0.3
            })}
            className="control-select"
          >
            <option value="immediate">Immediate</option>
            <option value="elementCoverage">Element Coverage</option>
            <option value="viewportPosition">Viewport Position</option>
          </select>
        </div>

        {config.mode !== 'immediate' && (
          <div className="control-group">
            <label className="control-label">
              Trigger Value: {config.value}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.value}
              onChange={(e) => onConfigChange({ value: Number(e.target.value) })}
              className="control-range"
            />
          </div>
        )}

        {config.mode === 'immediate' && (
          <div className="control-group">
            <label className="control-label">Margin (px)</label>
            <input
              type="number"
              value={config.margin?.replace('px', '').replace('-', '') || '100'}
              onChange={(e) => onConfigChange({ margin: `-${e.target.value}px` })}
              className="control-input"
            />
          </div>
        )}

        <button onClick={onReset} className="btn btn-danger">
          Reset Stats
        </button>
      </div>

      <div className="section">
        <h3 className="section-title">📖 Guide</h3>
        <div className="guide">
          <p><strong>Immediate Mode:</strong> Triggers when element enters viewport (with optional margin)</p>
          <p><strong>Element Coverage:</strong> Triggers when X% of element is visible</p>
          <p><strong>Viewport Position:</strong> Triggers when element reaches Y% of viewport height</p>
          <br />
          <p>🔴 Red badge = Currently tracking</p>
          <p>🟢 Green gradient = Visible</p>
          <p>🟣 Purple gradient = Not visible</p>
        </div>
      </div>
    </div>
  );
}

