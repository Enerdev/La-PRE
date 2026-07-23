// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  workers: 1, // los tests comparten la BD real (no hay una BD de pruebas aislada); correr en serie evita interferencia entre ellos
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    // Le da permiso de cámara al navegador para que el escáner no se quede
    // esperando un permiso que nadie va a aceptar en modo automatizado.
    permissions: ['camera'],
    screenshot: 'only-on-failure',
  },
});
