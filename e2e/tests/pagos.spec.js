const { test, expect } = require('@playwright/test');

test.describe('Pagos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'admin_central');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/panel/);
  });

  test('registrar un pago actualiza el estado de cuenta en pantalla', async ({ page }) => {
    await page.click('.acceso:has-text("Pagos")');
    await expect(page).toHaveURL(/\/pagos/);

    // Selecciona el primer estudiante disponible de la lista (no depende de un nombre fijo).
    const selectEstudiante = page.locator('#estudiante');
    await expect(selectEstudiante).toBeVisible();
    await selectEstudiante.selectOption({ index: 1 }); // índice 0 es "Selecciona un estudiante…"

    await expect(page.locator('.estado-cuenta')).toBeVisible({ timeout: 10000 });
    const cantidadAntes = await page.locator('.estado-cuenta__cantidad').textContent();

    await page.fill('#monto', '35');
    await page.selectOption('#metodo', 'efectivo');
    await page.click('button:has-text("Registrar pago")');

    await expect(page.locator('.pagos__mensaje--exito')).toBeVisible({ timeout: 10000 });

    const cantidadDespues = await page.locator('.estado-cuenta__cantidad').textContent();
    expect(cantidadDespues).not.toBe(cantidadAntes);
  });

  test('rechaza un monto vacío (validación del formulario)', async ({ page }) => {
    await page.click('.acceso:has-text("Pagos")');
    await page.locator('#estudiante').selectOption({ index: 1 });
    await expect(page.locator('.estado-cuenta')).toBeVisible({ timeout: 10000 });

    // El campo monto es "required" y type="number" min="0.01": el navegador
    // debe impedir el envío con el campo vacío.
    await page.locator('#monto').fill('');
    await page.click('button:has-text("Registrar pago")');

    // Sigue en la misma pantalla, sin mensaje de éxito.
    await expect(page.locator('.pagos__mensaje--exito')).toHaveCount(0);
  });
});
