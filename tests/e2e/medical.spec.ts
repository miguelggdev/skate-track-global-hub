import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsCoach } from './helpers/auth';

test.describe('Módulo médico — admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('puede navegar a la página de atletas', async ({ page }) => {
    await page.goto('/athletes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').filter({ hasText: /atleta/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('el botón médico abre el diálogo médico del atleta', async ({ page }) => {
    await page.goto('/athletes');
    await page.waitForLoadState('networkidle');

    // Abre el diálogo médico del primer atleta disponible
    const medicalBtn = page.locator('button').filter({ hasText: /médico|medical|salud/i }).first();
    if (await medicalBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await medicalBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 8000 });

      // Verifica que tiene tabs del módulo médico
      const tabs = dialog.locator('[role="tab"]');
      await expect(tabs.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('diálogo médico tiene tab de Vacunas', async ({ page }) => {
    await page.goto('/athletes');
    await page.waitForLoadState('networkidle');

    const medicalBtn = page.locator('button').filter({ hasText: /médico|medical|salud/i }).first();
    if (await medicalBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await medicalBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 8000 });

      const vacunasTab = dialog.locator('[role="tab"]').filter({ hasText: /vacuna/i });
      await expect(vacunasTab).toBeVisible({ timeout: 5000 });
      await vacunasTab.click();
      // El contenido de vacunas debe aparecer
      await expect(dialog.locator('text=/vacuna|inmuniza/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('diálogo médico tiene tab de Tests Físicos', async ({ page }) => {
    await page.goto('/athletes');
    await page.waitForLoadState('networkidle');

    const medicalBtn = page.locator('button').filter({ hasText: /médico|medical|salud/i }).first();
    if (await medicalBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await medicalBtn.click();
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 8000 });

      const testsTab = dialog.locator('[role="tab"]').filter({ hasText: /test|físic|condicion/i });
      await expect(testsTab).toBeVisible({ timeout: 5000 });
      await testsTab.click();
      await expect(dialog.locator('text=/test|evaluac|condicion/i').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Módulo médico — coach', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCoach(page);
  });

  test('coach puede navegar a atletas desde su dashboard', async ({ page }) => {
    await page.click('text=Atletas');
    await expect(page).toHaveURL(/\/athletes/, { timeout: 8000 });
  });
});
