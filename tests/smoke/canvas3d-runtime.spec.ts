import { expect, test } from '@playwright/test';

test.describe('Canvas 3D runtime', () => {
  test('mounts the bridge and renderer without browser errors', async ({ page }) => {
    const browserErrors: string[] = [];

    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });

    const response = await page.goto('/canvas-3d');
    expect(response?.status()).toBe(200);

    await expect
      .poll(() => page.evaluate(() => Boolean(window.Canvas3DBridge?.getState())))
      .toBe(true);
    await expect(page.locator('#canvas-container canvas').first()).toBeVisible();

    expect(browserErrors).toEqual([]);
  });
});
