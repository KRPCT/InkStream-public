import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
const require = createRequire(import.meta.url);

function mathjaxVendorPlugin() {
  const mathjaxPath = require.resolve("mathjax/tex-svg.js");
  const speechWorkerPath = require.resolve("mathjax/sre/speech-worker.js");
  const mathmapsDir = path.dirname(require.resolve("mathjax/sre/mathmaps/en.json"));
  const publicPath = "/vendor/mathjax/tex-svg.js";
  const srePrefix = "/vendor/mathjax/sre/";
  return {
    name: "inkstream-mathjax-vendor",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "vendor/mathjax/tex-svg.js",
        source: readFileSync(mathjaxPath),
      });
      this.emitFile({
        type: "asset",
        fileName: "vendor/mathjax/sre/speech-worker.js",
        source: readFileSync(speechWorkerPath),
      });
      for (const entry of readdirSync(mathmapsDir)) {
        if (!entry.endsWith(".json")) continue;
        this.emitFile({
          type: "asset",
          fileName: `vendor/mathjax/sre/mathmaps/${entry}`,
          source: readFileSync(path.join(mathmapsDir, entry)),
        });
      }
    },
    configureServer(server) {
      server.middlewares.use(publicPath, (_req, res) => {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.end(readFileSync(mathjaxPath));
      });
      server.middlewares.use(`${srePrefix}speech-worker.js`, (_req, res) => {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.end(readFileSync(speechWorkerPath));
      });
      server.middlewares.use(`${srePrefix}mathmaps/`, (req, res, next) => {
        const name = req.url?.replace(/^\//, "") ?? "";
        if (!/^[\w-]+\.json$/.test(name)) {
          next();
          return;
        }
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(readFileSync(path.join(mathmapsDir, name)));
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  base: "./",
  plugins: [mathjaxVendorPlugin(), react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development
  clearScreen: false,
  server: {
    port: 1430,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
