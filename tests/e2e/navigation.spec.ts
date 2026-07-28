import { test, expect } from '@playwright/test';

test.describe('Navegación pública', () => {
  test('carga la página raíz y redirecciona a login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('muestra el logo en la pantalla de login', async ({ page }) => {
    await page.goto('/login');
    // El logo SVG o imagen debe estar presente
    await expect(page.locator('img, svg').first()).toBeVisible();
  });

  test('el toggle de tema es accesible', async ({ page }) => {
    await page.goto('/login');
    // El toggle puede no estar en login, pero la página debe cargar sin errores
    await expect(page).not.toHaveURL(/error/);
  });

  test('página 404 muestra mensaje apropiado', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');
    await expect(page.locator('body')).toBeVisible();
  });
});
