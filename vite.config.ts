
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
        chunkFileNames: "assets/panel-[hash].js",
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
