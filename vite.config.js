import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  // Base public path when served in development or production
  base: "./",

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
  },

  // Plugins
  plugins: [
    // Copy the static files to the dist directory
    viteStaticCopy({
      targets: [
        {
          src: "web/sounds",
          dest: "web",
          recursive: true,
        },
      ],
    }),
  ],
});
