import { test, expect } from '@playwright/test';

const COACH_EMAIL = process.env.E2E_COACH_EMAIL ?? 'coach@test.speedskate.co';
const COACH_PASS  = process.env.E2E_COACH_PASS  ?? 'TestCoach123!';

test.describe('Coach flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('coach can log in and sees dashboard with KPI cards', async ({ page }) => {
    await page.fill('input[type="email"]', COACH_EMAIL);
    await page.fill('input[type="password"]', COACH_PASS);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/coach-dashboard/, { timeout: 10000 });

    // Must have at least one KPI card visible
    const kpiCards = page.locator('[class*="kpi-card"], .animate-fade-in').first();
    await expect(kpiCards).toBeVisible({ timeout: 8000 });
  });

  test('coach can navigate to athletes list', async ({ page }) => {
    await page.fill('input[type="email"]', COACH_EMAIL);
    await page.fill('input[type="password"]', COACH_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coach-dashboard/, { timeout: 10000 });

    // Click Athletes in sidebar
    await page.click('text=Atletas');
    await expect(page).toHaveURL(/\/athletes/, { timeout: 8000 });
    await expect(page.locator('h1, h2').filter({ hasText: /atleta/i }).first()).toBeVisible();
  });

  test('coach can navigate to training page', async ({ page }) => {
    await page.fill('input[type="email"]', COACH_EMAIL);
    await page.fill('input[type="password"]', COACH_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/coach-dashboard/, { timeout: 10000 });

    await page.click('text=Entrenamientos');
    await expect(page).toHaveURL(/\/training/, { timeout: 8000 });
  });
});
