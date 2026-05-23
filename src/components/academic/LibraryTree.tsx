import { useAppStore } from '@/stores/appStore';
import { BookOpen } from 'lucide-react';

export default function LibraryTree() {
  const { mockAcademicCitations } = useAppStore();

  return (
    <div className="library-tree">
      <div
        className="shrink-0 overflow-hidden flex flex-col"
        style={{ borderBottom: '2px solid var(--mode-academic)' }}
      >
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--mode-academic)' }} />
          <span
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--mode-academic)', fontFamily: 'var(--font-ui)' }}
          >
            文献库
          </span>
        </div>
        <div className="px-2 pb-2 space-y-1 max-h-[160px] overflow-y-auto">
          {mockAcademicCitations.map((item) => (
            <div
              key={item.key}
              className={`library-item text-xs px-2 py-1 rounded ${!item.resolved ? 'unresolved' : ''}`}
              style={{
                backgroundColor: 'var(--ink-bg)',
                borderLeft: '3px solid var(--mode-academic)',
                color: 'var(--ink-text-muted)',
              }}
            >
              {item.resolved ? (
                <>
                  <div className="flex items-center gap-1">
                    <BookOpen size={14} style={{ color: 'var(--mode-academic)' }} />
                    <span className="library-title font-medium" style={{ color: 'var(--ink-text)' }}>
                      {item.title}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs">
                    <span>{item.authors.join(', ')}</span>
                    <span className="library-year ml-1">({item.year})</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1" style={{ color: 'var(--ink-text-muted)' }}>
                  <BookOpen size={14} />
                  <span className="library-title italic">[@{item.key}] 未解析</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
