import { defineConfig } from "vite";

export default defineConfig({
  base: '/',

  // Development server configuration
  server: {
    port: 8901, // Same port as your current server
    open: true, // Automatically open browser on server start
    cors: true, // Enable CORS for all requests
  },

  // Build configuration
  build: {
    outDir: "dist", // Output directory for production build
    assetsDir: "assets", // Directory for static assets
    emptyOutDir: true, // Clean the output directory before build
    sourcemap: true,
  },
});
