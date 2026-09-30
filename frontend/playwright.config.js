import { defineConfig } from "@playwright/test";

// Testes E2E de layout: usa o Chrome instalado e um servidor Vite próprio na 5174.
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:5174", channel: "chrome" },
  webServer: {
    command: "npx vite --port 5174 --strictPort",
    url: "http://localhost:5174",
    reuseExistingServer: false,
    env: { VITE_DATA_SOURCE: "planilha", VITE_TMDB_API_KEY: "" },
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
});
