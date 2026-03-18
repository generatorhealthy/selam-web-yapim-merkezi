
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
    cssCodeSplit: true,
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    commonjsOptions: {
      include: [/node_modules/, /template-node-modules/],
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
