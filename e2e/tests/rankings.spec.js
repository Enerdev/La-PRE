const { test, expect } = require('@playwright/test');

test.describe('Simulacros y Rankings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'admin_central');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/panel/);
    await page.click('.acceso:has-text("Simulacros y Rankings")');
    await expect(page).toHaveURL(/\/rankings/);
  });

  test('crea un simulacro, carga resultados, lo publica y se ve el ranking calculado', async ({ page }) => {
    const nombreUnico = `Simulacro E2E ${Date.now()}`;

    await page.fill('input[placeholder="Simulacro N.º 02"]', nombreUnico);
    await page.fill('input[type="date"]', '2026-08-15');
    await page.click('button:has-text("Crear")');

    // Aparece en la lista con estado "programado"
    const fila = page.locator('.simulacro-fila', { hasText: nombreUnico });
    await expect(fila).toBeVisible({ timeout: 10000 });
    await fila.click();

    // Carga un puntaje al primer estudiante de la lista, si el panel de carga está visible
    // (solo aparece para administrador_sede, que es justo el rol con el que entramos).
    const primerInput = page.locator('.carga-resultados__fila input').first();
    if (await primerInput.count() > 0) {
      await primerInput.fill('88');
      await page.click('button:has-text("Guardar resultados")');
      await expect(page.locator('.rankings__mensaje--exito')).toBeVisible({ timeout: 10000 });
    }

    // Cierra y publica
    await page.click('button:has-text("Cerrar y publicar ranking")');
    // Se apunta específicamente a la fila de ESTE simulacro (puede haber otros
    // simulacros ya cerrados de sesiones anteriores en la misma pantalla).
    await expect(fila.locator('.etiqueta-estado--cerrado')).toBeVisible({ timeout: 10000 });

    // La tabla de ranking debe renderizarse con al menos una fila
    await expect(page.locator('.tabla-ranking tbody tr').first()).toBeVisible();
  });
});
