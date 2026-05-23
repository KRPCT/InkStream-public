/// <reference types="vite/client" />

interface Window {
  MathJax?: unknown;
}

declare module "*?url" {
  const url: string;
  export default url;
}
