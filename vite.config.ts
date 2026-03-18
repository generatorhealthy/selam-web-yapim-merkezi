
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Packages that must resolve from local node_modules instead of template-node-modules
const LOCAL_PACKAGES = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-helmet-async",
];

function fixCjsInterop(): Plugin {
  return {
    name: "fix-cjs-interop",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer) return null;
      
      if (LOCAL_PACKAGES.includes(source)) {
        if (source.includes("/")) {
          return path.resolve(__dirname, "node_modules", source + ".js");
        }
        try {
          // Use the package.json "module" or "main" field
          const pkgPath = path.resolve(__dirname, "node_modules", source, "package.json");
          const pkg = require(pkgPath);
          const entry = pkg.module || pkg.main || "index.js";
          return path.resolve(__dirname, "node_modules", source, entry);
        } catch {
          return path.resolve(__dirname, "node_modules", source, "index.js");
        }
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
    },
  },
}));
