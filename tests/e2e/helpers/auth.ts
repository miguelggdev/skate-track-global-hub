import { Page } from '@playwright/test';

export const ADMIN_EMAIL  = process.env.E2E_ADMIN_EMAIL  ?? 'admin@speedskate.co';
export const ADMIN_PASS   = process.env.E2E_ADMIN_PASS   ?? 'TestAdmin123!';
export const COACH_EMAIL  = process.env.E2E_COACH_EMAIL  ?? 'coach@test.speedskate.co';
export const COACH_PASS   = process.env.E2E_COACH_PASS   ?? 'TestCoach123!';
export const PARENT_EMAIL = process.env.E2E_PARENT_EMAIL ?? 'parent@test.speedskate.co';
export const PARENT_PASS  = process.env.E2E_PARENT_PASS  ?? 'TestParent123!';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
  await page.waitForURL(/\/admin-dashboard|\/dashboard/, { timeout: 12000 });
}

export async function loginAsCoach(page: Page) {
  await loginAs(page, COACH_EMAIL, COACH_PASS);
  await page.waitForURL(/\/coach-dashboard|\/dashboard/, { timeout: 12000 });
}

export async function loginAsParent(page: Page) {
  await loginAs(page, PARENT_EMAIL, PARENT_PASS);
  await page.waitForURL(/\/parent-dashboard|\/dashboard/, { timeout: 12000 });
}
