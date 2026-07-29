import { test, expect } from '@playwright/test';

/**
 * E2E del modo contingencia (darksite): overlay/bypass/redirect con la red
 * mockeada. No depende de que el CF `darksite-config` ni el fragment
 * `interstitial` existan en AEM — se intercepta el GET directo a la
 * persisted query GraphQL (`graphql/execute.json/.../getDarksiteConfig`,
 * sin middleware) y el fetch del fragment `.plain.html`. El `environment.json`
 * real del sitio proxied aún no trae `AV_DARKSITE_CONFIG_URL`, así que también
 * se intercepta para inyectar esa fila (fetch upstream + merge).
 * Spec: docs/superpowers/specs/2026-07-07-darksite-design.md
 */

const DARKSITE_ON = {
  data: {
    darksiteConfigList: {
      items: [{
        enabled: true,
        level: 'max',
        affectedPos: ['ALL'],
        blockedPaths: ['/ofertas-destinos'],
        lastUpdated: '2026-07-07T10:00:00Z',
      }],
    },
  },
};

const DARKSITE_OFF = {
  data: { darksiteConfigList: { items: [{ enabled: false }] } },
};

const DARKSITE_CONFIG_URL = 'https://publish-p34631-e1321407.adobeaemcloud.com/graphql/execute.json/avianca/getDarksiteConfig';

// loadFragment envuelve la respuesta en un <main> (hydrateFragment); esta
// respuesta NO debe pre-envolverse aquí, el propio fragment block lo hace.
const INTERSTITIAL_HTML = `
  <div>
    <h1>Información importante</h1>
    <p><a href="/darksite/es/">Ver información del evento</a></p>
    <p><a href="/es/#darksite-continue">Seguir en avianca.com</a></p>
  </div>`;

// Fragments del modo bypass (Task 10): headerAlert post-bypass y el banner
// que reemplaza la sección `darksite-swap` del home.
const HEADER_ALERT_HTML = `
  <div>
    <p>Operamos en modo contingencia. Contactos actualizados disponibles.</p>
  </div>`;

const HOME_BANNER_HTML = `
  <div>
    <p>Información del vuelo</p>
    <p><a href="/es/">Información del vuelo</a></p>
  </div>`;

// Sección `darksite-swap` (section-metadata) que el authoring prep del home
// debe dejar lista (docs/darksite-runbook.md). Ese contenido real aún no
// existe en el entorno de pruebas -confirmado con curl contra /es/: el home
// local se resuelve vía un componente cliente (`cms-loader`), no vía
// secciones/bloques EDS clásicos-, así que se simula inyectando esta sección
// sobre la respuesta REAL del documento (mismo formato que produce
// doc-authoring: ver readBlockConfig/decorateSections en scripts/aem.js).
const DARKSITE_SWAP_SECTION = `
  <div>
    <p>Promoción vigente (a reemplazar en modo bypass)</p>
    <div class="section-metadata">
      <div>
        <div>Style</div>
        <div>darksite-swap</div>
      </div>
    </div>
  </div>`;

async function mockDarksiteNetwork(page, {
  enabled = true, headerAlertHtml = null, homeBannerHtml = null,
} = {}) {
  // Playwright evalúa las rutas en orden inverso al de registro (LIFO), y
  // route.continue() envía directo a la red sin darle chance a un handler
  // registrado antes. El handler genérico '**' (que termina en
  // route.continue()) debe registrarse PRIMERO, y el específico de
  // environment.json DESPUÉS, para que este último se evalúe primero en las
  // requests a environment.json y las intercepte antes de que el genérico
  // las deje pasar a la red.
  await page.route('**', (route) => {
    const req = route.request();
    const url = req.url();
    if (req.method() === 'GET' && url.includes('graphql/execute.json') && url.includes('getDarksiteConfig')) {
      return route.fulfill({ json: enabled ? DARKSITE_ON : DARKSITE_OFF });
    }
    // OneTrust no está bajo prueba y su dark-filter (z-index máximo) intercepta
    // los clicks sobre el chrome del modo bypass (headerAlert, z-index 2000):
    // se corta el script de consentimiento en el origen para todo el spec.
    if (url.includes('cdn.cookielaw.org')) {
      return route.abort();
    }
    if (url.includes('/darksite/') && url.includes('.plain.html')) {
      if (url.includes('/header-alert')) {
        return headerAlertHtml
          ? route.fulfill({ contentType: 'text/html', body: headerAlertHtml })
          : route.fulfill({ status: 404, body: '' });
      }
      if (url.includes('/home-banner')) {
        return homeBannerHtml
          ? route.fulfill({ contentType: 'text/html', body: homeBannerHtml })
          : route.fulfill({ status: 404, body: '' });
      }
      return route.fulfill({ contentType: 'text/html', body: INTERSTITIAL_HTML });
    }
    return route.continue();
  });

  // environment.json real del sitio proxied aún no trae AV_DARKSITE_CONFIG_URL:
  // se hace fetch upstream y se aumenta con la fila necesaria para que el gate
  // llegue a hacer el GET directo a la persisted query (mismo patrón de
  // fetch+merge que mockHomeSwapSection usa para inyectar la sección del home).
  // Try/catch: el test puede cerrar página/contexto mientras este fetch
  // upstream (async, hacia el propio dev server) todavía está en vuelo — sin
  // esto Playwright reporta un "Target page ... has been closed" como fallo
  // del test aunque la navegación bajo prueba ya haya terminado bien.
  await page.route('**/environment.json', async (route) => {
    try {
      const response = await route.fetch();
      const json = await response.json();
      const rows = Array.isArray(json?.data) ? json.data : [];
      const augmented = {
        ...json,
        data: [
          ...rows.filter((row) => row.Key !== 'AV_DARKSITE_CONFIG_URL'),
          { Key: 'AV_DARKSITE_CONFIG_URL', Text: DARKSITE_CONFIG_URL },
        ],
      };
      await route.fulfill({ response, json: augmented });
    } catch (e) {
      // página/contexto ya cerrados: nada que cumplir.
    }
  });
}

/**
 * Intercepta la respuesta REAL del documento home (ruta `path`) e inyecta la
 * sección `darksite-swap` antes de `</main>`, sobre el HTML tal como lo sirve
 * el dev server (helix-pipeline/proxy ya resuelto) — no vía
 * `page.addInitScript`: ese hook corre antes de todo el JS de la página, pero
 * el gate (loadEager) también corre antes de `decorateMain`/`decorateSections`
 * -que es quien recién crea la sección y le aplica la clase desde la
 * section-metadata-, así que un init script no tiene ningún DOM real sobre el
 * que operar en ese momento; modificar la respuesta HTTP sí es honesto porque
 * reproduce EXACTAMENTE lo que decorateSections espera de un authoring real
 * (ver Task 12 report §2b para el detalle del descarte de alternativas).
 */
async function mockHomeSwapSection(page, path = '/es/') {
  await page.route(`**${path}`, async (route) => {
    const req = route.request();
    if (req.method() !== 'GET' || req.resourceType() !== 'document') {
      return route.fallback();
    }
    const response = await route.fetch();
    const html = await response.text();
    const injected = html.includes('</main>')
      ? html.replace('</main>', `${DARKSITE_SWAP_SECTION}</main>`)
      : html;
    return route.fulfill({ response, body: injected });
  });
}

test.describe('darksite contingency mode', () => {
  test('activo: overlay aparece en home y en URL interna directa', async ({ page }) => {
    await mockDarksiteNetwork(page);
    await page.goto('/es/');
    await expect(page.locator('.darksite-interstitial')).toBeVisible();

    await page.goto('/es/equipaje');
    await expect(page.locator('.darksite-interstitial')).toBeVisible();
  });

  test('CTA continuar: bypass en la sesión y promos redirigen al hub', async ({ page }) => {
    await mockDarksiteNetwork(page);
    await page.goto('/es/');
    await page.locator('a[href$="#darksite-continue"]').click();
    await expect(page.locator('.darksite-interstitial')).toHaveCount(0);

    // Misma sesión: navegar de nuevo no muestra overlay (bypass persistido).
    await page.goto('/es/');
    await expect(page.locator('.darksite-interstitial')).toHaveCount(0);

    // Ruta bloqueada: redirect al hub del darksite.
    await page.goto('/es/ofertas-destinos');
    await page.waitForURL('**/darksite/es/**');
  });

  test('sesión nueva: el overlay reaparece', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await mockDarksiteNetwork(page);
    await page.goto('/es/');
    await expect(page.locator('.darksite-interstitial')).toBeVisible();
    await context.close();
  });

  test('apagado: sin overlay y sin residuos en el DOM', async ({ page }) => {
    await mockDarksiteNetwork(page, { enabled: false });
    await page.goto('/es/');
    await expect(page.locator('.darksite-interstitial')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/darksite-open/);
  });
});

/**
 * Modo bypass (Task 10/12): con el overlay ya descartado en la sesión, el
 * gate monta un headerAlert sticky y reemplaza la sección `darksite-swap`
 * del home por el fragment `home-banner`. Reusa `mockDarksiteNetwork` (mismo
 * patrón de mocks de red que el resto del archivo).
 */
test.describe('bypass mode', () => {
  test('headerAlert: aparece INLINE tras el bypass, persiste entre navegaciones, dismiss la quita por la sesión', async ({ page }) => {
    await mockDarksiteNetwork(page, { headerAlertHtml: HEADER_ALERT_HTML });
    await page.goto('/es/');
    await page.locator('a[href$="#darksite-continue"]').click();
    await expect(page.locator('.darksite-interstitial')).toHaveCount(0);

    // Fix post-review (Task 12): el click del CTA continuar monta la alerta
    // DE INMEDIATO (mismo listener, sin navegación adicional) — el usuario
    // debe ver "header alert activo + banner informativo" al continuar.
    const alert = page.locator('.darksite-header-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('modo contingencia');

    // Persistencia: en la siguiente navegación la rama bypass de
    // runDarksiteGate (loadEager) la vuelve a montar.
    await page.goto('/es/');
    await expect(page.locator('.darksite-interstitial')).toHaveCount(0);
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('modo contingencia');

    await alert.locator('.darksite-header-alert-dismiss').click();
    await expect(alert).toHaveCount(0);
    const dismissed = await page.evaluate(
      () => sessionStorage.getItem('av-darksite-alert-dismissed'),
    );
    expect(dismissed).toBe('1');

    // Misma sesión: navegar de nuevo no vuelve a montar la alerta descartada.
    await page.goto('/es/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.darksite-header-alert')).toHaveCount(0);
  });

  test('swap del banner: la sección darksite-swap se oculta y el fragment home-banner se inserta', async ({ page }) => {
    await mockDarksiteNetwork(page, { homeBannerHtml: HOME_BANNER_HTML });
    await mockHomeSwapSection(page);

    await page.goto('/es/');
    await page.locator('a[href$="#darksite-continue"]').click();
    await expect(page.locator('.darksite-interstitial')).toHaveCount(0);

    // Reload ya con bypass persistido: dispara el swap del banner del home.
    await page.goto('/es/');
    await expect(page.locator('.darksite-interstitial')).toHaveCount(0);

    const banner = page.locator('.darksite-informative-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Información del vuelo');
    await expect(page.locator('main .section.darksite-swap')).toHaveClass(/darksite-swapped/);
  });
});
