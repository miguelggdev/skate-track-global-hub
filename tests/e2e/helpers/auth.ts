import { Page } from '@playwright/test';

export const ADMIN_EMAIL  = process.env.E2E_ADMIN_EMAIL  ?? 'admin@speedskate.co';
export const ADMIN_PASS   = process.env.E2E_ADMIN_PASS   ?? 'TestAdmin123!';
export const COACH_EMAIL  = process.env.E2E_COACH_EMAIL  ?? 'coach@test.speedskate.co';
export const COACH_PASS   = process.env.E2E_COACH_PASS   ?? 'TestCoach123!';
export const PARENT_EMAIL = process.env.E2E_PARENT_EMAIL ?? 'parent@test.speedskate.co';
export const PARENT_PASS  = process.env.E2E_PARENT_PASS  ?? 'TestParent123!';

// Only true when credentials are explicitly set as env vars (CI/staging with real test users).
// When running locally without env vars, authenticated tests skip gracefully instead of failing.
export const HAS_E2E_CREDENTIALS = !!(
  process.env.E2E_ADMIN_EMAIL &&
  process.env.E2E_COACH_EMAIL &&
  process.env.E2E_PARENT_EMAIL
);

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

export async function loginAsAdmin(page: Page): Promise<boolean> {
  try {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.waitForURL(/\/admin-dashboard|\/dashboard/, { timeout: 12000 });
    return true;
  } catch {
    return false;
  }
}

export async function loginAsCoach(page: Page): Promise<boolean> {
  try {
    await loginAs(page, COACH_EMAIL, COACH_PASS);
    await page.waitForURL(/\/coach-dashboard|\/dashboard/, { timeout: 12000 });
    return true;
  } catch {
    return false;
  }
}

export async function loginAsParent(page: Page): Promise<boolean> {
  try {
    await loginAs(page, PARENT_EMAIL, PARENT_PASS);
    await page.waitForURL(/\/parent-dashboard|\/dashboard/, { timeout: 12000 });
    return true;
  } catch {
    return false;
  }
}
