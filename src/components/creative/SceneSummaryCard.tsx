export default function SceneSummaryCard() {
  return (
    <div className="scene-summary-card p-4 rounded" style={{ backgroundColor: 'var(--ink-bg)' }}>
      <h4 className="card-title text-sm font-medium mb-2" style={{ color: 'var(--ink-text)' }}>
        场景概要
      </h4>
      <p className="placeholder text-xs" style={{ color: 'var(--ink-text-muted)' }}>
        场景概要卡占位（Phase 5+ 实现）
      </p>
    </div>
  );
}
