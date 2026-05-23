import { useAppStore } from '@/stores/appStore';
import type { FileNode } from '@/types';
import { openDocumentFromDialog } from '@/services/workflows';
import { File, Folder, FolderOpen, Plus, Search, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function FileTree() {
  const fileTree = useAppStore((s) => s.fileTree);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1', '2', '3']));

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isDir = node.type === 'directory';
    const isOpen = expanded.has(node.id);

    if (search && !node.name.toLowerCase().includes(search.toLowerCase())) {
      return null;
    }

    return (
      <div key={node.id}>
        <button
          onClick={() => {
            if (isDir) toggleExpand(node.id);
            else if (node.path) void openDocumentFromDialog(node.path);
          }}
          className="w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-[var(--ink-hover)] truncate transition-colors"
          style={{
            paddingLeft: `${8 + depth * 16}px`,
            color: 'var(--ink-text)',
            fontFamily: 'var(--font-ui)',
            fontSize: '13px',
          }}
        >
          {isDir ? (
            isOpen ? (
              <FolderOpen className="w-4 h-4 shrink-0" style={{ color: '#eab308' }} />
            ) : (
              <Folder className="w-4 h-4 shrink-0" style={{ color: '#eab308' }} />
            )
          ) : (
            <File className="w-4 h-4 shrink-0" style={{ color: 'var(--ink-text-muted)' }} />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isDir && isOpen && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className="flex items-center justify-between p-2 border-b shrink-0"
        style={{ borderColor: 'var(--ink-border)' }}
      >
        <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-ui)' }}>
          文件
        </span>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-[var(--ink-hover)] rounded" title="新建文件">
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-[var(--ink-hover)] rounded"
            title="折叠侧边栏"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-2 shrink-0">
        <div
          className="flex items-center gap-1 px-2 py-1 rounded text-sm"
          style={{ backgroundColor: 'var(--ink-bg)' }}
        >
          <Search className="w-3 h-3" style={{ color: 'var(--ink-text-muted)' }} />
          <input
            className="bg-transparent outline-none flex-1 text-xs"
            style={{ fontFamily: 'var(--font-ui)' }}
            placeholder="搜索文件..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{fileTree?.map((node) => renderNode(node))}</div>
    </div>
  );
}
