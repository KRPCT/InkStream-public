import { Quote, Hash, BookMarked } from 'lucide-react';

export default function AcademicToolbar() {
  return (
    <div className="academic-toolbar flex gap-1 p-1">
      <button className="toolbar-btn p-1.5 hover:bg-[var(--ink-hover)] rounded" title="插入引用">
        <Quote size={16} />
      </button>
      <button className="toolbar-btn p-1.5 hover:bg-[var(--ink-hover)] rounded" title="插入脚注">
        <Hash size={16} />
      </button>
      <button className="toolbar-btn p-1.5 hover:bg-[var(--ink-hover)] rounded" title="插入参考文献">
        <BookMarked size={16} />
      </button>
    </div>
  );
}
