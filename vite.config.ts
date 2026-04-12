
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const LOCAL_RESOLVE: Record<string, string> = {
  "react": "node_modules/react/index.js",
  "react-dom": "node_modules/react-dom/index.js",
  "react-dom/client": "node_modules/react-dom/client.js",
  "react/jsx-runtime": "node_modules/react/jsx-runtime.js",
  "react/jsx-dev-runtime": "node_modules/react/jsx-dev-runtime.js",
  "react-helmet-async": "node_modules/react-helmet-async/lib/index.esm.js",
  "shallowequal": "node_modules/shallowequal/index.js",
  "react-fast-compare": "node_modules/react-fast-compare/index.js",
  "invariant": "node_modules/invariant/browser.js",
  "@supabase/postgrest-js": "node_modules/@supabase/postgrest-js/dist/index.mjs",
};

function fixCjsInterop(): Plugin {
  return {
    name: "fix-cjs-interop",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer) return null;
      const local = LOCAL_RESOLVE[source];
      if (local) return path.resolve(__dirname, local);
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
    modulePreload: {
      resolveDependencies: (_filename, deps, { hostId, hostType }) => {
        // Don't preload heavy chunks that are only used in admin/lazy pages
        return deps.filter(dep => 
          !dep.includes('pdf.') && 
          !dep.includes('html2canvas') &&
          !dep.includes('docx.')
        );
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Isolate heavy PDF/document libraries into their own chunks
          if (id.includes('node_modules/jspdf')) return 'pdf';
          if (id.includes('node_modules/html2canvas')) return 'html2canvas';
          if (id.includes('node_modules/docx')) return 'docx';
          // Keep react vendor separate
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-vendor';
          // Supabase in its own chunk
          if (id.includes('node_modules/@supabase/')) return 'supabase';
          // Radix UI in its own chunk
          if (id.includes('node_modules/@radix-ui/')) return 'radix-ui';
          return undefined;
        },
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      defaultIsModuleExports: "auto",
    },
  },
  optimizeDeps: {
    include: ["react-dropzone", "attr-accept"],
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
