import { describe, expect, it, vi } from "vitest";
import {
  renderLatexBlock,
  renderMathBlock,
  renderTypstBlock,
  resolveMathJaxTexSvgUrl,
  resolveTypstFontAssetsUrl,
} from "./fenced-block-renderers";

describe("fenced block renderers", () => {
  it("renders math blocks with KaTeX html", async () => {
    const result = await renderMathBlock("E=mc^2");

    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("expected ready render result");
    expect(result.html).toContain("katex");
  });

  it("returns structured math errors", async () => {
    const result = await renderMathBlock("\\notacommand{");

    expect(result.status).toBe("error");
    if (result.status !== "error") throw new Error("expected error render result");
    expect(result.message).toContain("KaTeX");
  });

  it("renders latex blocks through injected MathJax runtime", async () => {
    const runtime = {
      tex2svgPromise: vi.fn(async () => document.createElement("mjx-container")),
      startup: {
        adaptor: {
          serializeXML: () => "<svg><text>E</text></svg>",
        },
      },
    };

    const result = await renderLatexBlock("\\begin{equation}E=mc^2\\end{equation}", () =>
      Promise.resolve(runtime),
    );

    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("expected ready render result");
    expect(result.html).toContain("<svg");
  });

  it("returns typst initialization errors as visible renderer state", async () => {
    const result = await renderTypstBlock("$ x $", async () => {
      throw new Error("wasm missing");
    });

    expect(result.status).toBe("error");
    if (result.status !== "error") throw new Error("expected error render result");
    expect(result.message).toContain("Typst");
  });

  it("returns a visible Typst error when the wasm renderer stalls", async () => {
    vi.useFakeTimers();
    const resultPromise = renderTypstBlock("$ x $", async () => ({
      svg: () => new Promise<string>(() => undefined),
    }));

    await vi.advanceTimersByTimeAsync(8000);
    const result = await resultPromise;

    expect(result.status).toBe("error");
    if (result.status !== "error") throw new Error("expected error render result");
    expect(result.message).toContain("timed out");
    vi.useRealTimers();
  });

  it("resolves MathJax vendor URLs from the production base path", () => {
    expect(resolveMathJaxTexSvgUrl("./", "https://tauri.local/index.html")).toBe(
      "https://tauri.local/vendor/mathjax/tex-svg.js",
    );
    expect(resolveMathJaxTexSvgUrl("/app/", "https://example.test/app/index.html")).toBe(
      "https://example.test/app/vendor/mathjax/tex-svg.js",
    );
  });

  it("resolves Typst font assets from the production base path", () => {
    expect(resolveTypstFontAssetsUrl("./", "http://tauri.localhost/")).toBe(
      "http://tauri.localhost/vendor/typst/fonts/",
    );
    expect(resolveTypstFontAssetsUrl("/app/", "https://example.test/app/index.html")).toBe(
      "https://example.test/app/vendor/typst/fonts/",
    );
  });
});
