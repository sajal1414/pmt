import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET?.trim();

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: apiTarget
      ? {
          port: 5174,
          proxy: {
            "/v1": {
              target: apiTarget,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : { port: 5174 },
  };
});
