import { defineConfig } from '@playwright/test';

// Pruebas E2E: la web exportada (dist/) contra el backend levantado con docker compose.
// Variables: E2E_BASE_URL (web), E2E_API_URL (gateway) y E2E_BACKEND_DIR (carpeta del compose).
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  // Un solo worker: el gateway limita los intentos de login por minuto.
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    // Ancho de celular: la barra de pestañas solo se ve en pantallas angostas.
    viewport: { width: 390, height: 844 },
    locale: 'es-CO',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      // Cámara falsa: la pantalla de traducción la pide al entrar.
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    },
  },
  webServer: {
    // Sin linking la URL siempre es "/", así que basta un servidor estático.
    command: 'python3 -m http.server 4173 -d dist',
    url: baseURL,
    reuseExistingServer: true,
  },
});
