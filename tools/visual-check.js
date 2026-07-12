const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const baseUrl = process.argv[2] || "http://localhost:5520";
const screenshotDir = process.env.REGITRUST_VISUAL_DIR || "E:\\CodexTools\\regitrust-visual\\screenshots";
const pages = [
  ["home", "/"],
  ["not-found", "/404.html"],
  ["foreign", "/foreign-company-registration-india.html"],
  ["nri", "/nri-company-registration-india.html"],
  ["market-entry", "/india-market-entry-services.html"]
];
const viewports = [
  ["desktop", 1365, 768],
  ["mobile", 390, 844]
];

async function main() {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const [pageName, pagePath] of pages) {
    for (const [viewportName, width, height] of viewports) {
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1
      });
      await page.goto(new URL(pagePath, baseUrl).toString(), { waitUntil: "networkidle" });
      await page.screenshot({
        path: path.join(screenshotDir, `${pageName}-${viewportName}.png`),
        fullPage: false
      });

      const issues = await page.evaluate(() => {
        const visibleElements = [...document.querySelectorAll("body *")].filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
        });
        const viewportWidth = document.documentElement.clientWidth;
        const overflow = visibleElements
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.right > viewportWidth + 2 || rect.left < -2;
          })
          .slice(0, 8)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName,
              className: String(element.className),
              text: (element.textContent || "").trim().slice(0, 80),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              viewportWidth
            };
          });
        return { title: document.title, overflow };
      });

      results.push({ page: pageName, viewport: viewportName, ...issues });
      await page.close();
    }
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));

  const overflowCount = results.reduce((count, result) => count + result.overflow.length, 0);
  if (overflowCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
