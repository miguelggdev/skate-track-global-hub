import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('muestra la página de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/SpeedSkate/i);
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'usuario@noexiste.com');
    await page.fill('input[type="password"]', 'contraseña_incorrecta');
    await page.click('button[type="submit"]');
    // Espera algún mensaje de error
    await expect(page.locator('[role="alert"], .text-destructive, [data-variant="destructive"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('redirecciona a login cuando no está autenticado', async ({ page }) => {
    await page.goto('/admin-dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
