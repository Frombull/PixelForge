const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto("http://localhost:3000/pricing", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/private/tmp/claude-501/-Users-marco-Documents-Repos-PixelForge/7ac60885-8c7f-4cca-bff0-129535fa6613/scratchpad/pricing-dark.png", fullPage: true });

  // Toggle to light mode via the theme button
  await page.click('button[aria-label="Alternar tema"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/private/tmp/claude-501/-Users-marco-Documents-Repos-PixelForge/7ac60885-8c7f-4cca-bff0-129535fa6613/scratchpad/pricing-light.png", fullPage: true });

  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

  await browser.close();
  console.log("done", errors);
})();
