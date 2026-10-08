
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

let staticFromEntry: Set<string> | null = null;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
    emptyOutDir: true,
    // Two stable files: the visitor app and one panel file (admin, specialist,
    // partner, voice). Visitors never download panel code; deploys keep the
    // previous release's files so an open panel can still load its file.
    cssCodeSplit: true,
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      defaultIsModuleExports: "auto",
    },
    rollupOptions: {
      output: {
        entryFileNames: "assets/app-[hash].js",
        chunkFileNames: (chunk) => (chunk.name === "panel" ? "assets/panel-[hash].js" : "assets/app-core-[hash].js"),
        // Visitor files: app-*.js (tiny entry) + app-core-*.js (everything reached
        // through static imports). Everything reached only through a dynamic
        // import (panels and their lazy libraries) goes into one panel-*.js.
        manualChunks(id, { getModuleInfo, getModuleIds }) {
          if (!staticFromEntry) {
            staticFromEntry = new Set();
            const entries = [...getModuleIds()].filter((m) => getModuleInfo(m)?.isEntry);
            const stack = [...entries];
            while (stack.length) {
              const m = stack.pop()!;
              if (staticFromEntry.has(m)) continue;
              staticFromEntry.add(m);
              for (const dep of getModuleInfo(m)?.importedIds || []) stack.push(dep);
            }
          }
          // Statik olarak ulaşılan her şey açıkça "core"a atanır; aksi halde Rollup
          // paylaşılan bağımlılıkları (React vb.) panel dosyasına çeker.
          return staticFromEntry.has(id) ? "core" : "panel";
        },
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  optimizeDeps: {
    include: ["react-dropzone", "attr-accept"],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
