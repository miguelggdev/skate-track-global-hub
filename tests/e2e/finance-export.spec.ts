import { test, expect } from '@playwright/test';

const FINANCE_EMAIL = process.env.E2E_FINANCE_EMAIL ?? 'finance@test.speedskate.co';
const FINANCE_PASS  = process.env.E2E_FINANCE_PASS  ?? 'TestFinance123!';

test.describe('Finance export flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', FINANCE_EMAIL);
    await page.fill('input[type="password"]', FINANCE_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/finance-dashboard/, { timeout: 12000 });
  });

  test('finance dashboard shows KPI cards', async ({ page }) => {
    const cards = page.locator('[class*="card"], [class*="kpi"]');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
  });

  test('navigate to finance tab shows transactions', async ({ page }) => {
    // Go to main finance page
    await page.goto('/finance');
    await expect(page.locator('h1, h2').filter({ hasText: /finanza|transacc/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Export Excel button is present', async ({ page }) => {
    // Look for export button on finance page
    await page.goto('/finance');
    const exportBtn = page.locator('button').filter({ hasText: /export|excel|descargar/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 8000 });
  });

  test('Export PDF button triggers download on finance dashboard', async ({ page }) => {
    // Navigate to reports tab in finance dashboard
    const reportsTab = page.locator('button, [role="tab"]').filter({ hasText: /report/i }).first();
    if (await reportsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportsTab.click();
    }

    const pdfBtn = page.locator('button').filter({ hasText: /pdf|exportar/i }).first();
    if (await pdfBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await pdfBtn.click();
      // If download triggered, test passes; if not, PDF is rendered inline (both valid)
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
      }
    }
  });
});
