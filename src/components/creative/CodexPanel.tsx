import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';

export default function CodexPanel() {
  const { mockCreativeCodex } = useAppStore();
  const [activeTab, setActiveTab] = useState<'character' | 'location' | 'setting'>('character');

  const filteredCodex = mockCreativeCodex.filter((entry) => entry.type === activeTab);

  return (
    <div className="codex-panel flex flex-col h-full">
      <div className="ink-tabs">
        <div
          className={`ink-tabs__tab ${activeTab === 'character' ? 'ink-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('character')}
        >
          角色
        </div>
        <div
          className={`ink-tabs__tab ${activeTab === 'location' ? 'ink-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('location')}
        >
          地点
        </div>
        <div
          className={`ink-tabs__tab ${activeTab === 'setting' ? 'ink-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('setting')}
        >
          设定
        </div>
      </div>

      <div className="panel-content flex-1 overflow-y-auto p-2">
        <div className="codex-list space-y-2">
          {filteredCodex.map((entry) => (
            <div
              key={entry.id}
              className="codex-item p-2 rounded"
              style={{
                backgroundColor: 'var(--ink-bg)',
                borderLeft: '3px solid var(--mode-creative)',
              }}
            >
              <h4 className="codex-name text-sm font-medium mb-1" style={{ color: 'var(--ink-text)' }}>
                {entry.name}
              </h4>
              <p className="codex-description text-xs" style={{ color: 'var(--ink-text-muted)' }}>
                {entry.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
