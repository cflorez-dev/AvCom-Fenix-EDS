import { test, expect } from '@playwright/test';

/**
 * Smoke test protecting against the importmap / modulepreload ordering
 * regression (broken by commit 68cc131, fixed by 7abda77).
 *
 * If the Preact `<link rel="modulepreload">` tags are emitted BEFORE the
 * `<script type="importmap">` in the <head>, then hooks.module.js runs its
 * internal `import "preact"` before the importmap is registered. The bare
 * specifier fails to resolve, the module is cached broken, and EVERY Preact
 * block (header, footer, booking-box, hero, marquesina, ...) fails with
 * "Failed to resolve module specifier 'preact'".
 *
 * Two layers of protection per page:
 *   1) [static]  The importmap must appear before the first Preact
 *      modulepreload in the served HTML <head>. Deterministic — catches the
 *      regression at the source regardless of network timing.
 *   2) [runtime] No module-resolution console/page errors, and the
 *      Preact-driven header & footer blocks reach data-block-status="loaded".
 *
 * The served HTML is read from the navigation RESPONSE (browser context), not a
 * separate `request` fixture — the EDS upstream's bot protection (Akamai) 403s
 * non-browser HTTP clients, which would make the static check a false negative.
 *
 * TARGET ENVIRONMENT: page HTML is proxied/served by the upstream, so this
 * validates the DEPLOYED <head> — not local head.html edits. Point E2E_BASE_URL
 * at an environment that does NOT bot-block automation (e.g. a *.aem.page
 * preview), or at locally-served clone files (see the clone-and-bisect guide).
 * Against `aem up --url <nuxqa>` the automated browser is denied by Akamai.
 *
 * Paths overridable via E2E_SMOKE_PATHS (comma-separated).
 */

const PATHS = (
  process.env.E2E_SMOKE_PATHS
  || '/fr,/pt,/pt/minha-reserva/prepare-sua-viagem/animais-de-estimacao-a-bordo'
)
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

const MODULE_ERROR_RE = /failed to resolve module specifier|error loading dynamically imported module|failed to fetch dynamically imported module|unable to resolve (?:module )?specifier|failed to load module/i;

const IMPORTMAP_RE = /<script[^>]*type=["']importmap["']/i;
const PREACT_MODULEPRELOAD_RE = /<link[^>]*rel=["']modulepreload["'][^>]*preact/i;

test.describe('Preact block loading smoke (importmap/modulepreload order)', () => {
  for (const path of PATHS) {
    test(`Preact blocks load, importmap precedes modulepreloads — ${path}`, async ({ page }) => {
      const moduleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && MODULE_ERROR_RE.test(msg.text())) {
          moduleErrors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => {
        if (MODULE_ERROR_RE.test(err.message)) moduleErrors.push(err.message);
      });

      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response, `navigation response for ${path}`).not.toBeNull();
      expect(response.ok(), `GET ${path} should return 2xx (got ${response.status()})`).toBeTruthy();

      // [static] importmap must precede the first Preact modulepreload in the
      // served <head>.
      const html = await response.text();
      const headEnd = html.indexOf('</head>');
      const head = headEnd > -1 ? html.slice(0, headEnd) : html;
      const importmapPos = head.search(IMPORTMAP_RE);
      const firstPreactPreloadPos = head.search(PREACT_MODULEPRELOAD_RE);

      expect(importmapPos, 'importmap script present in <head>').toBeGreaterThan(-1);
      expect(firstPreactPreloadPos, 'Preact modulepreload present in <head>').toBeGreaterThan(-1);
      expect(
        importmapPos,
        'importmap must be declared BEFORE any Preact modulepreload, '
          + 'otherwise the bare "preact" specifier fails to resolve',
      ).toBeLessThan(firstPreactPreloadPos);

      // [runtime] header & footer are Preact-driven blocks present on every
      // page; before the fix they would never reach "loaded". Resolves against
      // the final URL even if the page client-side redirects (e.g. /fr -> POS).
      await expect(page.locator('[data-block-name="header"]').first())
        .toHaveAttribute('data-block-status', 'loaded', { timeout: 20000 });
      await expect(page.locator('[data-block-name="footer"]').first())
        .toHaveAttribute('data-block-status', 'loaded', { timeout: 20000 });

      expect(
        moduleErrors,
        `Unexpected module-resolution errors:\n${moduleErrors.join('\n')}`,
      ).toHaveLength(0);
    });
  }
});
