import { test, expect } from '@playwright/test';

const UI_ROUTES = [
  '/',
  '/canvas',
  '/canvas-3d',
  '/cube',
  '/image-fft',
  '/aliasing',
  '/compress',
  '/segmentation',
  '/vector',
  '/a-star',
  '/boids',
];

test.describe('Endpoints smoke test', () => {

  for (const route of UI_ROUTES) {
    test(`Page should be 200: ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toContain('text/html');
      await expect(page.locator('body')).toBeVisible();
    });
  }

});