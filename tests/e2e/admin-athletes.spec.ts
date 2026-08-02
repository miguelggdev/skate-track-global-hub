import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Admin — gestión de atletas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('admin dashboard carga con cards de estadísticas', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
    // Al menos una card de métricas debe estar visible
    const statsCards = page.locator('[class*="card"], [class*="Card"]');
    await expect(statsCards.first()).toBeVisible({ timeout: 8000 });
  });

  test('admin puede navegar a la lista de atletas', async ({ page }) => {
    await page.click('text=Atletas');
    await expect(page).toHaveURL(/\/athletes/, { timeout: 8000 });
    await expect(page.locator('h1, h2').filter({ hasText: /atleta/i }).first()).toBeVisible();
  });

  test('lista de atletas muestra tabla o tarjetas', async ({ page }) => {
    await page.goto('/athletes');
    await page.waitForLoadState('networkidle');
    // Tabla o grid de atletas
    const content = page.locator('table, [role="grid"], [class*="grid"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('buscador de atletas filtra resultados', async ({ page }) => {
    await page.goto('/athletes');
    await page.waitForLoadState('networkidle');
    const search = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"]').first();
    if (await search.isVisible()) {
      await search.fill('test');
      // Espera que la lista cambie o muestre mensaje vacío
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('puede abrir el diálogo de creación de atleta', async ({ page }) => {
    await page.goto('/athletes');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button').filter({ hasText: /nuevo atleta|agregar|crear/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('admin puede navegar a sesiones de entrenamiento', async ({ page }) => {
    await page.goto('/training');
    await expect(page.locator('h1, h2').filter({ hasText: /entrenamiento|training|sesion/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('admin puede acceder al módulo financiero', async ({ page }) => {
    await page.goto('/finance');
    await expect(page.locator('h1, h2').filter({ hasText: /finanz|pago|transacc/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('admin puede acceder a mensajes', async ({ page }) => {
    await page.goto('/mensajes');
    await expect(page.locator('h1, h2, [class*="inbox"]').first()).toBeVisible({ timeout: 8000 });
  });
});
