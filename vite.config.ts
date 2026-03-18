
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function reactCjsInterop() {
  return {
    name: "react-cjs-interop",
    enforce: "pre" as const,
    resolveId(source: string, importer: string | undefined) {
      // Force react and react-dom to resolve from local node_modules
      if (
        importer &&
        (source === "react" ||
          source === "react-dom" ||
          source === "react/jsx-runtime" ||
          source === "react/jsx-dev-runtime")
      ) {
        const resolved = path.resolve(
          __dirname,
          "node_modules",
          source.includes("/") ? source + ".js" : source + "/index.js"
        );
        return resolved;
      }
      return null;
    },
  };
}

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
  },
  plugins: [
    reactCjsInterop(),
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
