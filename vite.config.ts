
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function fixCjsInterop(): Plugin {
  return {
    name: "fix-cjs-interop",
    enforce: "pre",
    resolveId(source, importer) {
      // Force react resolution from local node_modules
      if (
        importer &&
        (source === "react" ||
          source === "react-dom" ||
          source === "react/jsx-runtime" ||
          source === "react/jsx-dev-runtime")
      ) {
        return path.resolve(
          __dirname,
          "node_modules",
          source.includes("/") ? source + ".js" : source + "/index.js"
        );
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
    fixCjsInterop(),
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-helmet-async": path.resolve(__dirname, "node_modules/react-helmet-async/lib/index.esm.js"),
    },
  },
}));
