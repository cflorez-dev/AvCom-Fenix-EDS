import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const hubPath = process.env.E2E_HUB_DESTINATIONS_PATH || '/fr/offres/nos-destinations';

const geographicScenarios = [
  {
    name: 'Colombia POS',
    country: 'co',
    language: 'es',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    geolocation: { latitude: 4.711, longitude: -74.0721 },
  },
  {
    name: 'United States POS',
    country: 'us',
    language: 'en',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    geolocation: { latitude: 40.7128, longitude: -74.006 },
  },
  {
    name: 'Spain POS',
    country: 'es',
    language: 'es',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    geolocation: { latitude: 40.4168, longitude: -3.7038 },
  },
  {
    name: 'Brazil POS',
    country: 'br',
    language: 'pt',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    geolocation: { latitude: -23.5505, longitude: -46.6333 },
  },
];

const ignoredConsolePatterns = [
  /csp-violation/i,
  /blocked by connect-src/i,
  /google.*pagead/i,
  /facebook\.com\/tr/i,
];

const installQuotaGuard = async (page) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItemWithQuotaSimulation(key, value) {
      if (String(key).startsWith('avianca_hub_destinations_')) {
        const error = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        throw error;
      }
      return originalSetItem.call(this, key, value);
    };
  });
};

const collectRuntimeFailures = (page) => {
  const failures = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;

    const text = message.text();
    if (ignoredConsolePatterns.some((pattern) => pattern.test(text))) return;

    failures.push(text);
  });

  page.on('pageerror', (error) => {
    failures.push(error.message);
  });

  return failures;
};

test.describe('hub destinations geographic smoke', () => {
  for (const scenario of geographicScenarios) {
    test(`${scenario.name} renders when hub destination cache storage is full`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        locale: scenario.locale,
        timezoneId: scenario.timezoneId,
        geolocation: scenario.geolocation,
        permissions: ['geolocation'],
        extraHTTPHeaders: {
          'Accept-Language': scenario.locale,
        },
      });
      await context.addCookies([
        {
          name: 'selected-country',
          value: scenario.country,
          url: baseURL,
        },
        {
          name: 'selected-language',
          value: scenario.language,
          url: baseURL,
        },
      ]);
      const page = await context.newPage();
      const failures = collectRuntimeFailures(page);

      await installQuotaGuard(page);
      await page.goto(hubPath, { waitUntil: 'domcontentloaded' });

      expect(await page.getByRole('heading', { name: 'Access Denied' }).count()).toBe(0);

      const hubContent = page.locator('.hub-destinations-content');
      await expect(hubContent).toBeVisible();
      await expect(page.locator('.hub-destinations')).toHaveCount(1);

      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

      const quotaFetchingErrors = failures.filter((failure) => (
        /\[hub-destination\.service\] Error fetching destinationsbyorigin/i.test(failure)
        || /QuotaExceededError/i.test(failure)
      ));

      expect(quotaFetchingErrors).toEqual([]);
      expect(failures).toEqual([]);

      await context.close();
    });
  }
});
