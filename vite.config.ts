import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target:
          loadEnv(mode, process.cwd(), "").API_PROXY_TARGET ||
          "http://127.0.0.1:48080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
}));
