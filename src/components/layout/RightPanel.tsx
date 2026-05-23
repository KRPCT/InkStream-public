import { useState } from "react";
import { useAppStore } from "@/stores/appStore";

export default function RightPanel() {
  const mode = useAppStore((s) => s.mode);

  if (mode === "standard") return <StandardRightPanel />;
  if (mode === "academic") return <AcademicRightPanel />;
  if (mode === "creative") return <CreativeRightPanel />;
  return null;
}

function StandardRightPanel() {
  const [tab, setTab] = useState<"outline" | "backlinks" | "graph">("outline");
  return (
    <aside className="ink-right">
      <div className="ink-right__tabs">
        <button
          type="button"
          className={`ink-right__tab${tab === "outline" ? " ink-right__tab--active" : ""}`}
          onClick={() => setTab("outline")}
        >
          大纲
        </button>
        <button
          type="button"
          className={`ink-right__tab${tab === "backlinks" ? " ink-right__tab--active" : ""}`}
          onClick={() => setTab("backlinks")}
        >
          反链
        </button>
        <button
          type="button"
          className={`ink-right__tab${tab === "graph" ? " ink-right__tab--active" : ""}`}
          onClick={() => setTab("graph")}
        >
          图谱
        </button>
      </div>
      <div className="ink-right__body">
        {tab === "outline" && (
          <>
            <div className="ink-right__head">Outline · 思考-笔记</div>
            <div className="ink-right__row">
              <span className="ink-right__row-dot ink-right__row-dot--accent" />
              思考-笔记
            </div>
            <div className="ink-right__row" style={{ paddingLeft: 14 }}>
              <span className="ink-right__row-dot" />
              公式块示例
            </div>
          </>
        )}
        {tab === "backlinks" && (
          <>
            <div className="ink-right__head">Backlinks · 0</div>
            <div style={{ color: "var(--text-faint)" }}>暂无反向链接</div>
          </>
        )}
        {tab === "graph" && (
          <>
            <div className="ink-right__head">Local Graph</div>
            <div style={{ color: "var(--text-faint)" }}>图谱视图占位</div>
          </>
        )}
      </div>
    </aside>
  );
}

function AcademicRightPanel() {
  const [tab, setTab] = useState<"citation" | "typst">("citation");
  const mockAcademicCitations = useAppStore((s) => s.mockAcademicCitations);

  return (
    <aside className="ink-right">
      <div className="ink-right__tabs">
        <button
          type="button"
          className={`ink-right__tab${tab === "citation" ? " ink-right__tab--active" : ""}`}
          onClick={() => setTab("citation")}
        >
          引用
        </button>
        <button
          type="button"
          className={`ink-right__tab${tab === "typst" ? " ink-right__tab--active" : ""}`}
          onClick={() => setTab("typst")}
        >
          Typst 预览
        </button>
      </div>
      <div className="ink-right__body">
        {tab === "citation" && (
          <>
            <div className="ink-right__head">Citations · {mockAcademicCitations.length}</div>
            {mockAcademicCitations.map((c) => (
              <div
                key={c.key}
                className={`ink-citation-card${!c.resolved ? " ink-citation-card--unresolved" : ""}`}
              >
                <div className="ink-citation-card__key">[@{c.key || "UNRESOLVED"}]</div>
                {c.resolved && (
                  <>
                    <div className="ink-citation-card__title">{c.title}</div>
                    <div className="ink-citation-card__meta">
                      {c.authors.join(", ")} · {c.year}
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}
        {tab === "typst" && (
          <>
            <div className="ink-right__head">Typst Preview</div>
            <div style={{ color: "var(--text-faint)" }}>编译预览占位</div>
          </>
        )}
      </div>
    </aside>
  );
}

function CreativeRightPanel() {
  const [tab, setTab] = useState<"character" | "location" | "setting">("character");
  const mockCreativeCodex = useAppStore((s) => s.mockCreativeCodex);
  const characters = mockCreativeCodex.filter((e) => e.type === "character");
  const locations = mockCreativeCodex.filter((e) => e.type === "location");
  const settings = mockCreativeCodex.filter((e) => e.type === "setting");

  return (
    <aside className="ink-right">
      <div className="ink-right__tabs">
        <button
          type="button"
          className={`ink-right__tab${tab === "character" ? " ink-right__tab--active" : ""}`}
          onClick={() => setTab("character")}
        >
          角色
        </button>
        <button
          type="button"
          className={`ink-right__tab${tab === "location" ? " ink-right__tab--active" : ""}`}
          onClick={() => setTab("location")}
        >
          地点
        </button>
        <button
          type="button"
          className={`ink-right__tab${tab === "setting" ? " ink-right__tab--active" : ""}`}
          onClick={() => setTab("setting")}
        >
          设定
        </button>
      </div>
      <div className="ink-right__body">
        {tab === "character" && (
          <>
            <div className="ink-right__head">Characters · {characters.length}</div>
            {characters.map((e) => (
              <div key={e.id} className="ink-right__row">
                <span className="ink-right__row-dot ink-right__row-dot--accent" />
                <div>
                  <div style={{ color: "var(--text-normal)", fontWeight: 500 }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{e.description}</div>
                </div>
              </div>
            ))}
          </>
        )}
        {tab === "location" && (
          <>
            <div className="ink-right__head">Locations · {locations.length}</div>
            {locations.map((e) => (
              <div key={e.id} className="ink-right__row">
                <span className="ink-right__row-dot" />
                <div>
                  <div style={{ color: "var(--text-normal)", fontWeight: 500 }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{e.description}</div>
                </div>
              </div>
            ))}
          </>
        )}
        {tab === "setting" && (
          <>
            <div className="ink-right__head">Settings · {settings.length}</div>
            {settings.map((e) => (
              <div key={e.id} className="ink-right__row">
                <span className="ink-right__row-dot" />
                <div>
                  <div style={{ color: "var(--text-normal)", fontWeight: 500 }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{e.description}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
