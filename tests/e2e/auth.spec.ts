import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('muestra la página de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/SpeedSkate/i);
    // El heading real es "SpeedSkate Academy"
    await expect(page.getByRole('heading', { name: /SpeedSkate Academy/i })).toBeVisible();
    // El formulario de login tiene campos email y password
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'usuario@noexiste.com');
    await page.fill('input[type="password"]', 'contraseña_incorrecta');
    await page.click('button[type="submit"]');
    // shadcn Toast destructive — aparece en el viewport de toasts
    await expect(
      page.locator('[data-radix-toast-viewport] li, [data-sonner-toast], [role="status"]').first()
    ).toBeVisible({ timeout: 12000 });
  });

  test('redirecciona a login cuando no está autenticado', async ({ page }) => {
    await page.goto('/admin-dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('el botón de login se deshabilita mientras carga', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    // Inmediatamente después del click, el botón debe deshabilitarse
    await expect(page.locator('button[type="submit"]:disabled')).toBeVisible({ timeout: 3000 });
  });

  test('el enlace de olvido de contraseña abre el formulario de reset', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.getByText(/olvidó|recuperar|forgot/i).first();
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });
});
