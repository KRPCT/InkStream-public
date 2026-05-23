import { useMemo, useState } from "react";
import { GitCommitHorizontal, GitCompareArrows } from "lucide-react";

interface GitCommit {
  id: string;
  shortHash: string;
  branch: string;
  message: string;
  author: string;
  time: string;
  lane: number;
  files: GitFileChange[];
}

interface GitFileChange {
  path: string;
  status: "modified" | "added" | "deleted";
  additions: number;
  deletions: number;
}

const commits: GitCommit[] = [
  {
    id: "c6f2a91",
    shortHash: "c6f2a91",
    branch: "master",
    message: "feat(editor): establish codemirror kernel",
    author: "SakuraRed",
    time: "2026-05-22 10:19",
    lane: 0,
    files: [
      { path: "src/editor/live-preview.ts", status: "modified", additions: 148, deletions: 12 },
      { path: "src/components/layout/EditorArea.tsx", status: "modified", additions: 64, deletions: 18 },
    ],
  },
  {
    id: "763f179",
    shortHash: "763f179",
    branch: "phase-2",
    message: "docs(ui): align syntax orange with oracle",
    author: "SakuraRed",
    time: "2026-05-22 10:51",
    lane: 1,
    files: [
      { path: "../UI-SPEC.md", status: "modified", additions: 1, deletions: 1 },
    ],
  },
  {
    id: "011b9a1",
    shortHash: "011b9a1",
    branch: "phase-2",
    message: "docs(planning): capture phase 2 retrospective",
    author: "SakuraRed",
    time: "2026-05-22 10:57",
    lane: 1,
    files: [
      { path: "../.planning/phases/02-v0-2/02-RETROSPECTIVE.md", status: "added", additions: 153, deletions: 0 },
    ],
  },
];

function changeLabel(status: GitFileChange["status"]) {
  if (status === "added") return "A";
  if (status === "deleted") return "D";
  return "M";
}

export default function GitGraphView() {
  const [activeCommitId, setActiveCommitId] = useState(commits[0].id);
  const activeCommit = useMemo(
    () => commits.find((commit) => commit.id === activeCommitId) ?? commits[0],
    [activeCommitId],
  );

  return (
    <section className="ink-git-graph" aria-label="Git Graph">
      <section className="ink-git-graph__history" aria-label="Commit history">
        <header className="ink-git-graph__toolbar">
          <div>
            <div className="ink-git-graph__title">Git Graph</div>
            <div className="ink-git-graph__subtitle">Phase 4 frontend shell</div>
          </div>
        </header>

        <div className="ink-git-graph__rows">
          {commits.map((commit) => (
            <button
              key={commit.id}
              type="button"
              className={`ink-git-row${commit.id === activeCommit.id ? " ink-git-row--active" : ""}`}
              onClick={() => setActiveCommitId(commit.id)}
            >
              <span className={`ink-git-row__rail ink-git-row__rail--lane-${commit.lane}`}>
                <span className="ink-git-row__node" />
              </span>
              <span className="ink-git-row__body">
                <span className="ink-git-row__message">{commit.message}</span>
                <span className="ink-git-row__meta">
                  {commit.shortHash} · {commit.branch} · {commit.time}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="ink-git-graph__detail" aria-label="Commit detail">
        <div className="ink-git-detail__head">
          <GitCommitHorizontal size={18} />
          <div>
            <div className="ink-git-detail__message">{activeCommit.message}</div>
            <div className="ink-git-detail__meta">
              {activeCommit.shortHash} by {activeCommit.author} on {activeCommit.branch}
            </div>
          </div>
        </div>

        <div className="ink-git-detail__files">
          {activeCommit.files.map((file) => (
            <div key={file.path} className="ink-git-file">
              <span className={`ink-git-file__status ink-git-file__status--${file.status}`}>
                {changeLabel(file.status)}
              </span>
              <span className="ink-git-file__path">{file.path}</span>
              <span className="ink-git-file__stats">
                +{file.additions} -{file.deletions}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="ink-git-graph__diff" aria-label="File diff preview">
        <div className="ink-git-diff__head">
          <GitCompareArrows size={16} />
          <span>Diff Preview</span>
        </div>
        <div className="ink-git-diff__body">
          <div className="ink-git-diff__line ink-git-diff__line--context">@@ selected commit preview @@</div>
          <div className="ink-git-diff__line ink-git-diff__line--remove">- legacy editor surface</div>
          <div className="ink-git-diff__line ink-git-diff__line--add">+ CodeMirror centered editing surface</div>
          <div className="ink-git-diff__line ink-git-diff__line--add">+ git graph shell ready for git2 data</div>
        </div>
      </section>
    </section>
  );
}
