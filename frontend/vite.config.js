import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O backend Express roda em http://localhost:3000 e expõe as rotas sob /api.
// O proxy evita CORS e permite chamar "/api/..." direto do front em desenvolvimento.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    exclude: ["e2e/**", "node_modules/**"],
    // O primeiro teste de cada arquivo inclui a partida do jsdom/React; em máquina
    // lenta isso passa dos 5s padrão e o teste cai por tempo, não por erro.
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,jsx}"],
      // main.jsx só monta o React no DOM; data/ é JSON gerado; test/ é configuração.
      exclude: ["src/main.jsx", "src/test/**", "src/data/**", "src/**/*.test.{js,jsx}"],
      reporter: ["text", "html"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
