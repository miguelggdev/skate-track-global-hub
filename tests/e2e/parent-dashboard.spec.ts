import { test, expect } from '@playwright/test';
import { loginAsParent } from './helpers/auth';

test.describe('Portal de Padres', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page);
  });

  test('redirecciona al dashboard de padres', async ({ page }) => {
    await expect(page).toHaveURL(/\/parent-dashboard/, { timeout: 12000 });
  });

  test('dashboard de padres muestra información del atleta', async ({ page }) => {
    const content = page.locator('h1, h2').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });

  test('muestra card de estado médico o mensaje de sin restricciones', async ({ page }) => {
    // La card de estado médico debe estar presente (ya sea con restricciones o sin ellas)
    const medicalCard = page.locator('text=/médico|salud|restricción|sin restriccion/i').first();
    await expect(medicalCard).toBeVisible({ timeout: 10000 });
  });

  test('tiene acceso a mensajes del club', async ({ page }) => {
    // Debe haber un link o botón para ir a mensajes
    const msgLink = page.locator('a[href*="mensajes"], button').filter({ hasText: /mensaje|comunica/i }).first();
    await expect(msgLink).toBeVisible({ timeout: 8000 });
  });

  test('puede navegar a mensajes', async ({ page }) => {
    const msgLink = page.locator('a[href*="mensajes"], button').filter({ hasText: /mensaje/i }).first();
    if (await msgLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await msgLink.click();
      await expect(page).toHaveURL(/\/mensajes/, { timeout: 8000 });
    }
  });

  test('muestra datos de asistencia del atleta', async ({ page }) => {
    // Algún indicador de asistencia o entrenamientos
    const attendanceInfo = page.locator('text=/asistencia|entrenamiento|sesion/i').first();
    await expect(attendanceInfo).toBeVisible({ timeout: 10000 });
  });

  test('no puede acceder al admin dashboard', async ({ page }) => {
    await page.goto('/admin-dashboard');
    // Debe redirigir fuera del admin dashboard (ya sea a su propio dashboard o a /forbidden)
    await expect(page).not.toHaveURL('/admin-dashboard', { timeout: 5000 });
  });
});
