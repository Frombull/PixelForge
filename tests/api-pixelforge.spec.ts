import { test, expect } from '@playwright/test';

test.describe('PixelForge Endpoints', () => {

  test.describe('GET /', () => {
    test('return 200 and valid HTML', async ({ request }) => {
      const response = await request.get('/');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
    });
  });

  test.describe('GET /vector', () => {
    test('return 200 and expected payload', async ({ request }) => {
      const response = await request.get('/vector');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');

      //const body = await response.json();
      // expect(body).toHaveProperty('message');
      // expect(typeof body.message).toBe('string');
    });

    test('return 404 for non-existent route', async ({ request }) => {
      const response = await request.get('/non-existent-route');
      expect(response.status()).toBe(404);
    });
  });

});