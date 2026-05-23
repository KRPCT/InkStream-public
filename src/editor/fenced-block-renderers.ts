import katex from "katex";
import typstCompilerWasmUrl from "@myriaddreamin/typst-ts-web-compiler/wasm?url";
import typstRendererWasmUrl from "@myriaddreamin/typst-ts-renderer/wasm?url";
import type { WebAssemblyModuleRef } from "@myriaddreamin/typst.ts/wasm";

const mathjaxTexSvgUrl = resolveMathJaxTexSvgUrl(import.meta.env.BASE_URL, window.location.href);
const typstFontAssetsUrl = resolveTypstFontAssetsUrl(import.meta.env.BASE_URL, window.location.href);
const typstRenderTimeoutMs = 8000;

export type RenderResult =
  | { status: "loading"; message: string }
  | { status: "ready"; html: string }
  | { status: "error"; message: string };

interface MathJaxRuntime {
  tex2svg?: (source: string, options: { display: boolean }) => unknown;
  tex2svgPromise: (source: string, options: { display: boolean }) => Promise<unknown>;
  startup: {
    adaptor: {
      serializeXML?: (node: unknown) => string;
      outerHTML?: (node: unknown) => string;
    };
  };
}

type MathJaxLoader = () => Promise<MathJaxRuntime>;
type TypstLoader = () => Promise<{ svg: (options: { mainContent: string }) => Promise<string> }>;

let mathJaxPromise: Promise<MathJaxRuntime> | null = null;
let typstPromise: Promise<{ svg: (options: { mainContent: string }) => Promise<string> }> | null = null;

export async function renderMathBlock(source: string): Promise<RenderResult> {
  return renderKatex(source, true);
}

export function renderInlineMathHtml(source: string): RenderResult {
  return renderKatex(source, false);
}

function renderKatex(source: string, displayMode: boolean): RenderResult {
  try {
    return {
      status: "ready",
      html: katex.renderToString(source, {
        displayMode,
        throwOnError: true,
        trust: false,
        strict: "warn",
      }),
    };
  } catch (error) {
    return {
      status: "error",
      message: `KaTeX render failed: ${errorMessage(error)}`,
    };
  }
}

export async function renderLatexBlock(
  source: string,
  loadRuntime: MathJaxLoader = loadMathJaxRuntime,
): Promise<RenderResult> {
  try {
    const mathjax = await loadRuntime();
    const normalized = normalizeLatexMath(source);
    const node =
      mathjax.tex2svg?.(normalized, { display: true }) ??
      (await withTimeout(
        mathjax.tex2svgPromise(normalized, { display: true }),
        4000,
        "MathJax render timed out",
      ));
    const adaptor = mathjax.startup.adaptor;
    return {
      status: "ready",
      html: adaptor.serializeXML?.(node) ?? adaptor.outerHTML?.(node) ?? "",
    };
  } catch (error) {
    return {
      status: "error",
      message: `MathJax render failed: ${errorMessage(error)}`,
    };
  }
}

export async function renderTypstBlock(
  source: string,
  loadRuntime: TypstLoader = loadTypstRuntime,
): Promise<RenderResult> {
  try {
    const typst = await loadRuntime();
    const html = await withTimeout(
      typst.svg({ mainContent: source }),
      typstRenderTimeoutMs,
      "Typst render timed out",
    );
    return { status: "ready", html: normalizeTypstSvg(html) };
  } catch (error) {
    return {
      status: "error",
      message: `Typst render failed: ${errorMessage(error)}`,
    };
  }
}

function normalizeTypstSvg(html: string): string {
  return html
    .replace(/<svg\b/i, '<svg class="typst-doc"')
    .replace(/\bfill="(?:#000|#000000|black)"/gi, 'fill="currentColor"')
    .replace(/\bstroke="(?:#000|#000000|black)"/gi, 'stroke="currentColor"');
}

export function renderBlockError(message: string): string {
  return `<pre class="ink-fenced-block__error">${escapeHtml(message)}</pre>`;
}

async function loadMathJaxRuntime(): Promise<MathJaxRuntime> {
  mathJaxPromise ??= loadMathJaxScript();
  return mathJaxPromise;
}

async function loadTypstRuntime(): Promise<{ svg: (options: { mainContent: string }) => Promise<string> }> {
  typstPromise ??= import("@myriaddreamin/typst.ts").then((module) => {
    module.$typst.setCompilerInitOptions({
      beforeBuild: [
        module.loadFonts([], {
          assets: ["text"],
          assetUrlPrefix: typstFontAssetsUrl,
        }),
      ],
      getModule: () => wasmBindgenModule(typstCompilerWasmUrl),
    });
    module.$typst.setRendererInitOptions({
      getModule: () => wasmBindgenModule(typstRendererWasmUrl),
    });
    return module.$typst;
  });
  return typstPromise;
}

function wasmBindgenModule(url: string): WebAssemblyModuleRef {
  return { module_or_path: url } as unknown as WebAssemblyModuleRef;
}

function normalizeLatexMath(source: string): string {
  return source
    .replace(/\\begin\{equation\*?\}/g, "")
    .replace(/\\end\{equation\*?\}/g, "")
    .trim();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadMathJaxScript(): Promise<MathJaxRuntime> {
  const existing = window.MathJax as MathJaxRuntime | undefined;
  if (existing?.tex2svgPromise) return Promise.resolve(existing);

  window.MathJax = {
    startup: {
      typeset: false,
    },
  };

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = mathjaxTexSvgUrl;
    script.async = true;
    script.onload = () => {
      const runtime = window.MathJax as MathJaxRuntime | undefined;
      if (runtime?.tex2svgPromise) {
        resolve(runtime);
      } else {
        reject(new Error("MathJax browser runtime did not expose tex2svgPromise"));
      }
    };
    script.onerror = () => reject(new Error("MathJax browser runtime failed to load"));
    document.head.append(script);
  });
}

export function resolveMathJaxTexSvgUrl(baseUrl: string, locationHref: string): string {
  const base = new URL(baseUrl, locationHref);
  return new URL("vendor/mathjax/tex-svg.js", base).toString();
}

export function resolveTypstFontAssetsUrl(baseUrl: string, locationHref: string): string {
  const base = new URL(baseUrl, locationHref);
  return new URL("vendor/typst/fonts/", base).toString();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}
