import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';

export default function CitationPanel() {
  const { mockAcademicCitations } = useAppStore();
  const [activeTab, setActiveTab] = useState<'citations' | 'preview'>('citations');

  return (
    <div className="citation-panel flex flex-col h-full">
      <div className="ink-tabs">
        <div
          className={`ink-tabs__tab ${activeTab === 'citations' ? 'ink-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('citations')}
        >
          引用
        </div>
        <div
          className={`ink-tabs__tab ${activeTab === 'preview' ? 'ink-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Typst 预览
        </div>
      </div>

      <div className="panel-content flex-1 overflow-y-auto p-2">
        {activeTab === 'citations' && (
          <div className="citation-list space-y-2">
            {mockAcademicCitations.filter((c) => c.resolved).map((item) => (
              <div
                key={item.key}
                className="citation-item p-2 rounded text-xs"
                style={{
                  backgroundColor: 'var(--ink-bg)',
                  borderLeft: '3px solid var(--mode-academic)',
                }}
              >
                <div className="citation-key font-mono text-xs mb-1" style={{ color: 'var(--mode-academic)' }}>
                  [@{item.key}]
                </div>
                <div className="citation-title font-medium mb-1" style={{ color: 'var(--ink-text)' }}>
                  {item.title}
                </div>
                <div className="citation-meta text-xs" style={{ color: 'var(--ink-text-muted)' }}>
                  {item.authors.join(', ')} ({item.year})
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'preview' && (
          <div className="typst-preview">
            <p className="placeholder text-sm p-4 text-center" style={{ color: 'var(--ink-text-muted)' }}>
              Typst 预览占位（Phase 3 实现）
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
