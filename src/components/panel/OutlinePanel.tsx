import { useAppStore } from "@/stores/appStore";

export default function OutlinePanel() {
  const currentFile = useAppStore((s) => s.currentFile);

  // Mock outline data - in real implementation, extract from TipTap editor JSON
  const mockOutline = currentFile
    ? [
        { level: 1, text: "第一章", id: "h1" },
        { level: 2, text: "1.1 背景", id: "h1-1" },
        { level: 2, text: "1.2 方法", id: "h1-2" },
        { level: 3, text: "1.2.1 实验设计", id: "h1-2-1" },
        { level: 1, text: "第二章", id: "h2" },
      ]
    : [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium">大纲</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {mockOutline.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 p-2">暂无标题</p>
        ) : (
          <ul className="space-y-0.5">
            {mockOutline.map((item) => (
              <li
                key={item.id}
                className="text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-0.5 cursor-pointer truncate"
                style={{ paddingLeft: `${(item.level - 1) * 16 + 4}px` }}
              >
                {item.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
