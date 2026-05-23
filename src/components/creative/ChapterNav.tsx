import { useAppStore } from '@/stores/appStore';
import { ChevronRight, FileText } from 'lucide-react';

export default function ChapterNav() {
  const { mockCreativeNovel } = useAppStore();

  return (
    <div className="chapter-nav flex flex-col h-full">
      <h3 className="panel-title text-sm font-medium p-2 border-b" style={{ borderColor: 'var(--ink-border)', fontFamily: 'var(--font-ui)' }}>
        {mockCreativeNovel.title}
      </h3>
      <div className="chapter-tree flex-1 overflow-y-auto p-2 space-y-2">
        {mockCreativeNovel.parts.map((part) => (
          <div key={part.id} className="part-node">
            <div className="part-title text-xs font-semibold mb-1 px-2 py-1" style={{ color: 'var(--mode-creative)' }}>
              {part.title}
            </div>
            {part.chapters.map((chapter) => (
              <div key={chapter.id} className="chapter-node mb-2">
                <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium" style={{ color: 'var(--ink-text)' }}>
                  <ChevronRight size={14} />
                  <span className="chapter-title">{chapter.title}</span>
                </div>
                <div className="scene-list ml-4 space-y-1">
                  {chapter.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="scene-node flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-[var(--ink-hover)] cursor-pointer"
                      style={{ color: 'var(--ink-text-muted)' }}
                    >
                      <FileText size={12} />
                      <span className="scene-title flex-1">{scene.title}</span>
                      <span className="scene-wordcount text-xs" style={{ color: 'var(--ink-text-faint)' }}>
                        {scene.wordCount}字
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
