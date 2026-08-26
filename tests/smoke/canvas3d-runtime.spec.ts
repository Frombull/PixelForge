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

  test('toggles an extreme aliasing scenario on the main canvas', async ({ page }) => {
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

    const toggle = page.getByRole('button', { name: 'Aliasing', exact: true });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    const mainCanvas = page.locator('#canvas-container > canvas.main-canvas3d');
    await expect(mainCanvas).toHaveCount(1);
    const canvasMetrics = await mainCanvas.evaluate((canvas) => ({
      drawingWidth: canvas.width,
      clientWidth: canvas.clientWidth,
      imageRendering: getComputedStyle(canvas).imageRendering,
    }));
    expect(canvasMetrics.drawingWidth).toBeLessThan(canvasMetrics.clientWidth / 2);
    expect(canvasMetrics.imageRendering).toBe('pixelated');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(() => page.evaluate(() => window.Canvas3DBridge?.getState()?.isAliasingStressEnabled))
      .toBe(true);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect
      .poll(() => page.evaluate(() => window.Canvas3DBridge?.getState()?.isAliasingStressEnabled))
      .toBe(false);

    expect(browserErrors).toEqual([]);
  });
});
