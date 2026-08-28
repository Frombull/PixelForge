import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test('uses the production URL for social preview metadata', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'https://www.pixelforge3d.com.br/og',
    );
  });

  test('does not use the deprecated Three.js Clock', async ({ page }) => {
    const clockWarnings: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('THREE.Clock')) {
        clockWarnings.push(message.text());
      }
    });

    await page.goto('/');
    await expect(page.getByLabel('Logo 3D do PixelForge')).toBeVisible();
    await page.waitForTimeout(250);

    expect(clockWarnings).toEqual([]);
  });
});
