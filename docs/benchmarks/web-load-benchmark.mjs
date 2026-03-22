import { chromium, devices } from 'playwright';

const TARGET_URL = process.env.BENCH_URL || 'http://127.0.0.1:4173/login';
const RUNS = Number.parseInt(process.env.BENCH_RUNS || '5', 10);

const profiles = [
  {
    name: 'desktop',
    contextOptions: {
      viewport: { width: 1440, height: 900 }
    }
  },
  {
    name: 'mobile',
    contextOptions: {
      ...devices['Pixel 5']
    }
  }
];

function computeAverage(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function runProfile(browser, profile) {
  const measurements = [];

  for (let run = 0; run < RUNS; run += 1) {
    const context = await browser.newContext(profile.contextOptions);
    const page = await context.newPage();

    await page.goto(TARGET_URL, { waitUntil: 'load' });

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paints = performance.getEntriesByType('paint');
      const fcp = paints.find((entry) => entry.name === 'first-contentful-paint');

      return {
        domContentLoadedMs: navigation?.domContentLoadedEventEnd || 0,
        domInteractiveMs: navigation?.domInteractive || 0,
        loadEventEndMs: navigation?.loadEventEnd || 0,
        transferSize: navigation?.transferSize || 0,
        encodedBodySize: navigation?.encodedBodySize || 0,
        decodedBodySize: navigation?.decodedBodySize || 0,
        firstContentfulPaintMs: fcp?.startTime || 0
      };
    });

    measurements.push(metrics);
    await context.close();
  }

  return {
    profile: profile.name,
    runs: RUNS,
    avg: {
      domContentLoadedMs: computeAverage(measurements.map((item) => item.domContentLoadedMs)),
      domInteractiveMs: computeAverage(measurements.map((item) => item.domInteractiveMs)),
      loadEventEndMs: computeAverage(measurements.map((item) => item.loadEventEndMs)),
      firstContentfulPaintMs: computeAverage(measurements.map((item) => item.firstContentfulPaintMs)),
      transferSize: computeAverage(measurements.map((item) => item.transferSize)),
      encodedBodySize: computeAverage(measurements.map((item) => item.encodedBodySize)),
      decodedBodySize: computeAverage(measurements.map((item) => item.decodedBodySize))
    }
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    const results = [];

    for (const profile of profiles) {
      const result = await runProfile(browser, profile);
      results.push(result);
    }

    const output = {
      url: TARGET_URL,
      generatedAt: new Date().toISOString(),
      results
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(output, null, 2));
  } finally {
    await browser.close();
  }
}

await main();
