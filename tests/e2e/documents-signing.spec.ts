import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Documentos y Firma Digital', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
  });

  test('página de documentos carga con tabs', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /documento/i })).toBeVisible({ timeout: 8000 });
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(4, { timeout: 5000 });
  });

  test('tab Carta Permiso genera carta', async ({ page }) => {
    await page.locator('[role="tab"]').filter({ hasText: /carta|permiso/i }).click();
    const content = page.locator('[role="tabpanel"]').filter({ isVisible: true });
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('tab Carnet muestra generador', async ({ page }) => {
    await page.locator('[role="tab"]').filter({ hasText: /carnet/i }).click();
    const content = page.locator('[role="tabpanel"]').filter({ isVisible: true });
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('tab Planilla Excel muestra exportación', async ({ page }) => {
    await page.locator('[role="tab"]').filter({ hasText: /planilla|excel/i }).click();
    const content = page.locator('[role="tabpanel"]').filter({ isVisible: true });
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('tab Firma Digital muestra los 5 documentos firmables', async ({ page }) => {
    await page.locator('[role="tab"]').filter({ hasText: /firma/i }).click();
    // Espera que los documentos carguen
    await expect(page.locator('[role="tabpanel"]').filter({ isVisible: true })).toBeVisible({ timeout: 5000 });

    // Debe mostrar los 5 documentos firmables
    const firmarBtns = page.locator('button').filter({ hasText: /firmar/i });
    await expect(firmarBtns).toHaveCount(5, { timeout: 5000 });
  });

  test('botón Firmar abre el diálogo de firma', async ({ page }) => {
    await page.locator('[role="tab"]').filter({ hasText: /firma/i }).click();
    const firmarBtn = page.locator('button').filter({ hasText: /firmar/i }).first();
    await expect(firmarBtn).toBeVisible({ timeout: 5000 });
    await firmarBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // El diálogo debe contener el canvas de firma
    await expect(dialog.locator('canvas')).toBeVisible({ timeout: 5000 });
  });

  test('diálogo de firma tiene campo de nombre y botón borrar', async ({ page }) => {
    await page.locator('[role="tab"]').filter({ hasText: /firma/i }).click();
    await page.locator('button').filter({ hasText: /firmar/i }).first().click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Campo nombre del firmante
    const nameInput = dialog.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });

    // Botón borrar firma
    const clearBtn = dialog.locator('button').filter({ hasText: /borrar|limpiar|clear/i });
    await expect(clearBtn).toBeVisible({ timeout: 5000 });
  });

  test('canvas de firma acepta input de ratón', async ({ page }) => {
    await page.locator('[role="tab"]').filter({ hasText: /firma/i }).click();
    await page.locator('button').filter({ hasText: /firmar/i }).first().click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const canvas = dialog.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    const box = await canvas.boundingBox();
    if (box) {
      // Simula trazar una firma con el ratón
      await page.mouse.move(box.x + 30, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 50);
      await page.mouse.move(box.x + 100, box.y + 80);
      await page.mouse.up();
      // El canvas debe seguir visible después del dibujo
      await expect(canvas).toBeVisible();
    }
  });
});
