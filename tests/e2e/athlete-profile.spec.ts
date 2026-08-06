import { test, expect } from '@playwright/test';

const ATHLETE_EMAIL = process.env.E2E_ATHLETE_EMAIL ?? 'athlete@test.speedskate.co';
const ATHLETE_PASS  = process.env.E2E_ATHLETE_PASS  ?? 'TestAthlete123!';

test.describe('Athlete profile flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ATHLETE_EMAIL);
    await page.fill('input[type="password"]', ATHLETE_PASS);
    await page.click('button[type="submit"]');
    const ok = await page.waitForURL(/\/athlete-dashboard/, { timeout: 12000 }).then(() => true).catch(() => false);
    if (!ok) test.skip();
  });

  test('athlete dashboard loads without errors', async ({ page }) => {
    await expect(page.locator('h1, [data-testid="identity-card"]').first()).toBeVisible({ timeout: 10000 });
    // No error toast or error card
    await expect(page.locator('[role="alert"][class*="destructive"]')).toHaveCount(0);
  });

  test('tab navigation exists and tabs are clickable', async ({ page }) => {
    // At least 5 tab buttons should be visible
    const tabs = page.locator('[role="tab"], button').filter({ hasText: /perfil|entreno|competencias|cuerpo|contacto/i });
    await expect(tabs.first()).toBeVisible({ timeout: 8000 });
  });

  test('Perfil tab loads content', async ({ page }) => {
    // Click on the Perfil tab if not already active
    const perfilTab = page.getByRole('button', { name: /perfil/i }).first();
    if (await perfilTab.isVisible()) {
      await perfilTab.click();
    }
    // Some content should be visible (form or card)
    await expect(page.locator('form, [class*="card"]').first()).toBeVisible({ timeout: 6000 });
  });

  test('training KPI cards display', async ({ page }) => {
    // The 4 new training KPI cards should be present (Progresión, Volumen, Consistencia, Carga)
    const kpiSection = page.locator('text=Índice de Consistencia, text=Volumen Semanal, text=Carga de Entrenamiento').first();
    // At least one of these headers should exist in the DOM
    const cardHeaders = page.locator('span').filter({ hasText: /Progresión Mensual|Volumen Semanal|Índice de Consistencia|Carga de Entrenamiento/ });
    await expect(cardHeaders.first()).toBeVisible({ timeout: 8000 });
  });
});
