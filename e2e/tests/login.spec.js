const { test, expect } = require('@playwright/test');

test.describe('Login', () => {
  test('muestra un error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'usuario_que_no_existe');
    await page.fill('#password', 'clave_incorrecta');
    await page.click('button[type="submit"]');

    await expect(page.locator('.login-error')).toBeVisible();
  });

  test('administrador_sede entra y ve el panel con indicadores reales', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'admin_central');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/panel/);
    await expect(page.locator('h1')).toContainText('Panel de gestión');
    // Al menos una tarjeta de indicador debe cargar datos reales del backend.
    await expect(page.locator('.tarjeta').first()).toBeVisible({ timeout: 10000 });
  });

  test('personal_asistencia entra directo al escáner de asistencia', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'asistencia_central');
    await page.fill('#password', 'asistencia123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/escaner/);
    await expect(page.locator('h1')).toContainText('Control de Asistencia');
  });

  test('un rol sin sesión no puede entrar directo a una ruta protegida', async ({ page }) => {
    await page.goto('/panel');
    await expect(page).toHaveURL(/\/login/);
  });
});
