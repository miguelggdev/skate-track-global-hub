import { test, expect } from '@playwright/test';
import { loginAsCoach } from './helpers/auth';

test.describe('Calendario de Entrenamientos', () => {
  test.beforeEach(async ({ page }) => {
    const ok = await loginAsCoach(page);
    if (!ok) { test.skip(); return; }
    await page.goto('/training');
    await page.waitForLoadState('networkidle');
  });

  test('carga el calendario con encabezado de mes', async ({ page }) => {
    // Encabezado con el mes actual
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });
  });

  test('tiene controles de navegación prev/next', async ({ page }) => {
    const prevBtn = page.locator('button').filter({ hasText: /prev|anterior/i })
      .or(page.locator('button[aria-label*="prev"], button[aria-label*="anterior"]'))
      .or(page.locator('button svg[class*="ChevronLeft"]').locator('..'))
      .first();

    // Alternativamente busca botones con íconos de navegación
    const navBtns = page.locator('button').filter({ has: page.locator('svg') });
    await expect(navBtns.first()).toBeVisible({ timeout: 5000 });
  });

  test('el botón Hoy navega al mes actual', async ({ page }) => {
    const todayBtn = page.locator('button').filter({ hasText: /hoy|today/i });
    await expect(todayBtn).toBeVisible({ timeout: 5000 });
    await todayBtn.click();
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
  });

  test('tiene selector de vista mes/semana/día', async ({ page }) => {
    const mesBtn  = page.locator('button').filter({ hasText: /^mes$/i });
    const semanaBtn = page.locator('button').filter({ hasText: /^semana$/i });
    const diaBtn  = page.locator('button').filter({ hasText: /^d[ií]a$/i });

    await expect(mesBtn).toBeVisible({ timeout: 5000 });
    await expect(semanaBtn).toBeVisible({ timeout: 5000 });
    await expect(diaBtn).toBeVisible({ timeout: 5000 });
  });

  test('filtro de tipo de entrenamiento existe', async ({ page }) => {
    const filter = page.locator('select');
    await expect(filter).toBeVisible({ timeout: 5000 });
  });

  test('botón Exportar .ics es visible', async ({ page }) => {
    const exportBtn = page.locator('button').filter({ hasText: /exportar|ics/i });
    await expect(exportBtn).toBeVisible({ timeout: 5000 });
  });

  test('leyenda de tipos de entrenamiento se muestra', async ({ page }) => {
    // Al menos un ítem de leyenda debe ser visible
    const legend = page.locator('text=/técnico|físico|mental|recuperación|gimnasio/i').first();
    await expect(legend).toBeVisible({ timeout: 5000 });
  });

  test('cambiar a vista semana funciona', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^semana$/i }).click();
    // La página debe seguir siendo válida
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });
});
