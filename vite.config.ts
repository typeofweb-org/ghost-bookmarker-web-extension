import { defineConfig } from "vite";

export default defineConfig({
  base: "/dist/",
  root: "src",
  appType: "mpa",
  build: {
    outDir: "../dist",
    minify: false,
    rollupOptions: {
      input: {
        options: "src/pages/options.html",
        popup: "src/pages/popup.html",
        background: "src/background.js",
      },
      output: {
        assetFileNames: "[name].[ext]",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
      },
    },
  },
});
