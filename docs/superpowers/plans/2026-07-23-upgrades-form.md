# Formulario Upgrades MMB (AVAEMF2P20-270) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la integración Plusgrade del formulario de upgrade de cabina por los servicios de Upgrades de API_CanalesDigitales, con redirección automática a MMB cuando haya al menos un vuelo elegible en Ventana Comercial.

**Architecture:** El token Cognito (`AuthorizationUpgrades`) llega vía `getApimCredentials('upgrades')` (extensión de `AV_TOKEN_ENDPOINT`; el secreto nunca toca el navegador). Un servicio nuevo (`scripts/services/upgrades/`) orquesta el `GET /v1/upgrades/validate` y mapea la respuesta a 4 resultados normalizados que el organism `cabin-upgrade-form` traduce a redirección o modales.

**Tech Stack:** Preact + htm (design-system), Tailwind, Vitest (happy-dom), patrón APIM existente (`apim-token.service.js`).

**Spec:** `docs/superpowers/specs/2026-07-23-upgrades-form-design.md` (contrato confirmado contra QA 2026-07-23).

## Global Constraints

- El `client_secret` de Cognito NO aparece en ningún archivo del repo ni en environment.json. El token viene de `getApimCredentials('upgrades')`.
- Ortografía del backend tal cual: `upgradeStatus` ∈ {`elegible`, `not_elegible`}.
- PNR: alfanumérico, MAYÚSCULAS, máximo 6 caracteres. Apellido: letras/espacios/acentos.
- Copys exactos de Figma (fallbacks es): modales "¡Ups! Algo salió mal"/"Por favor, intenta de nuevo."/"Reintentar" · "Servicio con alta demanda"/"El ascenso de cabina no está disponible para este vuelo."/"Consultar otra reserva" · "Reserva no encontrada"/"Revisa el código de tu reserva y apellido"/"Reintentar" · helper apellido "Tal y como aparece(n) en la reserva" · loader "Cargando...".
- URL MMB default: `https://gestiona.avianca.com/{lang}/manage/upgrade-business-class` + `?pnr=&lastname=&flow=mmb`; configurable con `AV_UPGRADES_MMB_URL` (soporta placeholder `{lang}`). Channel configurable `AV_UPGRADES_CHANNEL`, default `MMB`.
- Redirección en la MISMA pestaña (`window.location.assign`). Nunca se construye URL si no hay elegibilidad (CA-06).
- Sin referencias SSCI en el flujo upgrades (código, i18n o CMS).
- Commits frecuentes en `feat/270-upgrades-form`; si el hook pre-commit falla re-estageando `tw.css`, usar `--no-verify`.
- Tests: `npx vitest run <archivo>` desde la raíz del worktree. Si `node_modules` no existe: `npm install` primero (una vez).

---

### Task 1: Servicio `upgrades` en apim-token

**Files:**
- Modify: `scripts/services/apim/apim-token.service.js:6` (VALID_SERVICES)
- Test: `tests/services/apim/apim-token.service.test.js`

**Interfaces:**
- Produces: `getApimCredentials('upgrades')` → `Promise<{token, subscriptionKey?, apimBaseUrl?, expiresAt}>` (el backend de AV_TOKEN_ENDPOINT responderá `{token, expiresIn}` para `{"service":"upgrades"}`; cache/expiración ya resueltos por el mecanismo existente).

- [ ] **Step 1: Test que falla** — agregar al describe existente de `tests/services/apim/apim-token.service.test.js` (seguir sus helpers/mocks actuales; leer el archivo antes):

```js
it('accepts the upgrades service and POSTs { service: "upgrades" }', async () => {
  // usar el mismo helper de mock de fetch/environment del archivo
  const { getApimCredentials } = await importFreshModule();
  await getApimCredentials('upgrades');
  const [, init] = global.fetch.mock.calls.at(-1);
  expect(JSON.parse(init.body)).toEqual({ service: 'upgrades' });
});
```

(Adaptar nombres al estilo del archivo: usa `vi.resetModules()` + import dinámico como los demás tests.)

- [ ] **Step 2: Correr y ver FAIL** — `npx vitest run tests/services/apim/apim-token.service.test.js` → falla con `Invalid service: upgrades`.
- [ ] **Step 3: Implementación mínima** — en `apim-token.service.js`:

```js
const VALID_SERVICES = ['pricing', 'digital', 'upgrades'];
```

- [ ] **Step 4: Correr y ver PASS** — mismo comando, todo verde (incluidos los tests previos del archivo).
- [ ] **Step 5: Commit** — `git add scripts/services/apim/apim-token.service.js tests/services/apim/apim-token.service.test.js && git commit -m "feat(upgrades): servicio 'upgrades' en apim-token (AVAEMF2P20-270)"`

---

### Task 2: Lógica pura — mapeo de resultado y URL MMB

**Files:**
- Create: `scripts/services/upgrades/upgrades-result.js`
- Test: `tests/services/upgrades/upgrades-result.test.js`

**Interfaces:**
- Produces:
  - `UPGRADE_RESULT = { ELIGIBLE: 'ELIGIBLE', NO_AVAILABILITY: 'NO_AVAILABILITY', NOT_FOUND: 'NOT_FOUND', ERROR: 'ERROR' }`
  - `normalizeName(value: string) => string` (trim, colapsa espacios, MAYÚSCULAS, sin diacríticos)
  - `mapValidateResult({ ok, status, body, lastName }) => UPGRADE_RESULT[keyof]`
  - `buildMmbRedirectUrl({ baseUrl, lang, pnr, lastName }) => string`

- [ ] **Step 1: Tests que fallan** — `tests/services/upgrades/upgrades-result.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  UPGRADE_RESULT, mapValidateResult, buildMmbRedirectUrl, normalizeName,
} from '../../../scripts/services/upgrades/upgrades-result.js';

const BODY_OK = {
  passengers: [{ firstName: 'LINA', lastName: 'MORALES', refNumber: '2' }],
  pnr: 'AYQQQS',
  segments: [
    { refNumber: '1', upgradeStatus: 'not_elegible' },
    { refNumber: '2', upgradeStatus: 'elegible' },
  ],
};

describe('normalizeName', () => {
  it('uppercases, trims, collapses spaces and strips diacritics', () => {
    expect(normalizeName('  Pérez  Gómez ')).toBe('PEREZ GOMEZ');
    expect(normalizeName('morales')).toBe('MORALES');
  });
});

describe('mapValidateResult', () => {
  it('ELIGIBLE cuando el apellido coincide y hay >=1 segmento elegible', () => {
    expect(mapValidateResult({ ok: true, status: 200, body: BODY_OK, lastName: 'Morales' }))
      .toBe(UPGRADE_RESULT.ELIGIBLE);
  });
  it('apellido matchea con acentos/mayúsculas distintas', () => {
    expect(mapValidateResult({ ok: true, status: 200, body: BODY_OK, lastName: ' moráles ' }))
      .toBe(UPGRADE_RESULT.ELIGIBLE);
  });
  it('NO_AVAILABILITY cuando coincide apellido pero 0 elegibles', () => {
    const body = { ...BODY_OK, segments: [{ refNumber: '1', upgradeStatus: 'not_elegible' }] };
    expect(mapValidateResult({ ok: true, status: 200, body, lastName: 'MORALES' }))
      .toBe(UPGRADE_RESULT.NO_AVAILABILITY);
  });
  it('NOT_FOUND con el shape real de PNR inexistente (200, passengers/segments null)', () => {
    const body = { passengers: null, pnr: 'ZZZZZZ', segments: null };
    expect(mapValidateResult({ ok: true, status: 200, body, lastName: 'MORALES' }))
      .toBe(UPGRADE_RESULT.NOT_FOUND);
  });
  it('NOT_FOUND cuando el apellido no coincide con ningún pasajero', () => {
    expect(mapValidateResult({ ok: true, status: 200, body: BODY_OK, lastName: 'GARCIA' }))
      .toBe(UPGRADE_RESULT.NOT_FOUND);
  });
  it('NOT_FOUND defensivo ante HTTP 404', () => {
    expect(mapValidateResult({ ok: false, status: 404, body: null, lastName: 'X' }))
      .toBe(UPGRADE_RESULT.NOT_FOUND);
  });
  it('ERROR ante 5xx, body inválido u otros 4xx', () => {
    expect(mapValidateResult({ ok: false, status: 500, body: null, lastName: 'X' })).toBe(UPGRADE_RESULT.ERROR);
    expect(mapValidateResult({ ok: false, status: 400, body: null, lastName: 'X' })).toBe(UPGRADE_RESULT.ERROR);
    expect(mapValidateResult({ ok: true, status: 200, body: null, lastName: 'X' })).toBe(UPGRADE_RESULT.ERROR);
  });
});

describe('buildMmbRedirectUrl', () => {
  it('reemplaza {lang} y arma query pnr/lastname/flow', () => {
    const url = buildMmbRedirectUrl({
      baseUrl: 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class',
      lang: 'es', pnr: 'AYQQQS', lastName: 'Morales',
    });
    expect(url).toBe('https://gestiona.avianca.com/es/manage/upgrade-business-class?pnr=AYQQQS&lastname=Morales&flow=mmb');
  });
  it('encodea apellidos con espacios/acentos', () => {
    const url = buildMmbRedirectUrl({
      baseUrl: 'https://x.example/{lang}/p', lang: 'en', pnr: 'ABC123', lastName: 'De la Peña',
    });
    expect(url).toContain('lastname=De+la+Pe%C3%B1a');
    expect(url).toContain('/en/p?');
  });
  it('acepta baseUrl sin placeholder {lang} (se usa tal cual)', () => {
    const url = buildMmbRedirectUrl({
      baseUrl: 'https://x.example/es/p', lang: 'en', pnr: 'ABC123', lastName: 'Perez',
    });
    expect(url.startsWith('https://x.example/es/p?')).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y ver FAIL** — `npx vitest run tests/services/upgrades/upgrades-result.test.js` → módulo no existe.
- [ ] **Step 3: Implementación** — `scripts/services/upgrades/upgrades-result.js`:

```js
// Lógica pura del flujo Upgrades (AVAEMF2P20-270): sin fetch, sin DOM.
// El contrato de /upgrades/validate está confirmado contra QA (ver spec
// docs/superpowers/specs/2026-07-23-upgrades-form-design.md):
// - PNR inexistente responde 200 con passengers/segments null (no 404).
// - upgradeStatus usa la ortografía del backend: 'elegible' | 'not_elegible'.
// - El servicio NO valida apellido (solo recibe header PNR): se compara en
//   el front contra passengers[].lastName.

export const UPGRADE_RESULT = {
  ELIGIBLE: 'ELIGIBLE',
  NO_AVAILABILITY: 'NO_AVAILABILITY',
  NOT_FOUND: 'NOT_FOUND',
  ERROR: 'ERROR',
};

export const normalizeName = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toUpperCase();

export const mapValidateResult = ({
  ok, status, body, lastName,
}) => {
  if (!ok) return status === 404 ? UPGRADE_RESULT.NOT_FOUND : UPGRADE_RESULT.ERROR;
  if (!body || typeof body !== 'object') return UPGRADE_RESULT.ERROR;

  const passengers = Array.isArray(body.passengers) ? body.passengers : [];
  const segments = Array.isArray(body.segments) ? body.segments : [];
  if (!passengers.length || !segments.length) return UPGRADE_RESULT.NOT_FOUND;

  const target = normalizeName(lastName);
  const lastNameMatches = passengers.some((p) => normalizeName(p?.lastName) === target);
  if (!lastNameMatches) return UPGRADE_RESULT.NOT_FOUND;

  const hasEligible = segments.some((s) => s?.upgradeStatus === 'elegible');
  return hasEligible ? UPGRADE_RESULT.ELIGIBLE : UPGRADE_RESULT.NO_AVAILABILITY;
};

export const buildMmbRedirectUrl = ({
  baseUrl, lang, pnr, lastName,
}) => {
  const resolvedBase = baseUrl.replace('{lang}', lang);
  const params = new URLSearchParams({ pnr, lastname: lastName, flow: 'mmb' });
  return `${resolvedBase}?${params.toString()}`;
};
```

- [ ] **Step 4: Correr y ver PASS** — mismo comando, 11 tests verdes.
- [ ] **Step 5: Commit** — `git add scripts/services/upgrades/ tests/services/upgrades/ && git commit -m "feat(upgrades): mapeo de resultado de validate y builder de URL MMB"`

---

### Task 3: Orquestación fetch — `upgrades.service.js`

**Files:**
- Create: `scripts/services/upgrades/upgrades.service.js`
- Test: `tests/services/upgrades/upgrades.service.test.js`

**Interfaces:**
- Consumes: `getApimCredentials(service)`, `clearApimTokenCache(service)` de `../apim/apim-token.service.js`; `fetchAEMData('environment')` de `../../utils/aem-data.js`.
- Produces:
  - `validateUpgrade({ pnr }) => Promise<{ ok: boolean, status: number, body: object|null }>` (NO lanza por status de negocio; solo propaga errores de red/token)
  - `getUpgradesConfig() => Promise<{ channel: string, mmbUrl: string }>`
  - `resetUpgradesConfigCacheForTests()`
  - `DEFAULT_MMB_URL = 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class'`

- [ ] **Step 1: Tests que fallan** — `tests/services/upgrades/upgrades.service.test.js` (mismo estilo de mocks que `apim-client.service.test.js`):

```js
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const tokenServicePath = '../../../scripts/services/apim/apim-token.service.js';
const aemDataPath = '../../../scripts/utils/aem-data.js';
const servicePath = '../../../scripts/services/upgrades/upgrades.service.js';

const DIGITAL = {
  token: 'azure-jwt', subscriptionKey: 'sub-key', apimBaseUrl: 'https://apim.example/API_CanalesDigitales',
};
const UPGRADES = { token: 'cognito-jwt' };

const mockDeps = ({ envRows = [], clearSpy = vi.fn() } = {}) => {
  vi.doMock(tokenServicePath, () => ({
    getApimCredentials: vi.fn().mockImplementation((s) => {
      if (s === 'digital') return Promise.resolve(DIGITAL);
      if (s === 'upgrades') return Promise.resolve(UPGRADES);
      return Promise.reject(new Error(`unknown ${s}`));
    }),
    clearApimTokenCache: clearSpy,
  }));
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: envRows }),
  }));
  return { clearSpy };
};

const jsonResponse = (status, body) => ({
  ok: status < 400, status, json: async () => body,
});

describe('upgrades.service', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.doUnmock(tokenServicePath);
    vi.doUnmock(aemDataPath);
    vi.restoreAllMocks();
    delete global.fetch;
  });

  it('GETs /v1/upgrades/validate con los 5 headers y PNR en mayúsculas', async () => {
    mockDeps();
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, { pnr: 'AYQQQS' }));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'ayqqqs' });

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://apim.example/API_CanalesDigitales/v1/upgrades/validate');
    expect(init.headers).toEqual({
      Authorization: 'azure-jwt',
      'Ocp-Apim-Subscription-Key': 'sub-key',
      AuthorizationUpgrades: 'cognito-jwt',
      channel: 'MMB',
      PNR: 'AYQQQS',
    });
    expect(res).toEqual({ ok: true, status: 200, body: { pnr: 'AYQQQS' } });
  });

  it('usa AV_UPGRADES_CHANNEL de environment cuando existe', async () => {
    mockDeps({ envRows: [{ Key: 'AV_UPGRADES_CHANNEL', Text: 'WEB' }] });
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    const { validateUpgrade } = await import(servicePath);

    await validateUpgrade({ pnr: 'ABC123' });

    expect(global.fetch.mock.calls[0][1].headers.channel).toBe('WEB');
  });

  it('ante 401 limpia ambos caches y reintenta UNA vez', async () => {
    const { clearSpy } = mockDeps();
    global.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, null))
      .mockResolvedValueOnce(jsonResponse(200, { pnr: 'X' }));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'ABC123' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(clearSpy).toHaveBeenCalledWith('digital');
    expect(clearSpy).toHaveBeenCalledWith('upgrades');
    expect(res.ok).toBe(true);
  });

  it('un segundo 401 NO reintenta de nuevo y devuelve ok:false', async () => {
    mockDeps();
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(401, null));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'ABC123' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ ok: false, status: 401, body: null });
  });

  it('body no-JSON no lanza: devuelve body null', async () => {
    mockDeps();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } });
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'ABC123' });

    expect(res).toEqual({ ok: true, status: 200, body: null });
  });

  it('getUpgradesConfig: defaults y overrides de environment', async () => {
    mockDeps({ envRows: [{ Key: 'AV_UPGRADES_MMB_URL', Text: 'https://uat.example/{lang}/upgrade' }] });
    const { getUpgradesConfig, DEFAULT_MMB_URL } = await import(servicePath);

    const cfg = await getUpgradesConfig();

    expect(cfg.mmbUrl).toBe('https://uat.example/{lang}/upgrade');
    expect(cfg.channel).toBe('MMB');
    expect(DEFAULT_MMB_URL).toBe('https://gestiona.avianca.com/{lang}/manage/upgrade-business-class');
  });
});
```

- [ ] **Step 2: Correr y ver FAIL** — `npx vitest run tests/services/upgrades/upgrades.service.test.js`.
- [ ] **Step 3: Implementación** — `scripts/services/upgrades/upgrades.service.js`:

```js
import { getApimCredentials, clearApimTokenCache } from '../apim/apim-token.service.js';
import { fetchAEMData } from '../../utils/aem-data.js';

// Cliente del flujo Upgrades (AVAEMF2P20-270). El AuthorizationUpgrades
// (token Cognito) viene del backend de AV_TOKEN_ENDPOINT como servicio
// 'upgrades' — el client_secret de Cognito nunca llega al navegador.

export const DEFAULT_MMB_URL = 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class';
const DEFAULT_CHANNEL = 'MMB';

let configCache = null;

const findEnvKey = (config, key) => config?.data
  ?.find((item) => item?.Key?.trim?.() === key)?.Text?.trim?.();

export const getUpgradesConfig = async () => {
  if (configCache) return configCache;
  const config = await fetchAEMData('environment');
  configCache = {
    channel: findEnvKey(config, 'AV_UPGRADES_CHANNEL') || DEFAULT_CHANNEL,
    mmbUrl: findEnvKey(config, 'AV_UPGRADES_MMB_URL') || DEFAULT_MMB_URL,
  };
  return configCache;
};

export const resetUpgradesConfigCacheForTests = () => {
  configCache = null;
};

// No lanza por status de negocio: el mapeo a ELIGIBLE/NOT_FOUND/etc. lo hace
// mapValidateResult (upgrades-result.js) con { ok, status, body }.
export const validateUpgrade = async ({ pnr }, isRetry = false) => {
  const [digital, upgrades, { channel }] = await Promise.all([
    getApimCredentials('digital'),
    getApimCredentials('upgrades'),
    getUpgradesConfig(),
  ]);

  const res = await fetch(`${digital.apimBaseUrl}/v1/upgrades/validate`, {
    headers: {
      Authorization: digital.token,
      'Ocp-Apim-Subscription-Key': digital.subscriptionKey,
      AuthorizationUpgrades: upgrades.token,
      channel,
      PNR: String(pnr ?? '').toUpperCase(),
    },
  });

  if (res.status === 401 && !isRetry) {
    clearApimTokenCache('digital');
    clearApimTokenCache('upgrades');
    return validateUpgrade({ pnr }, true);
  }

  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
};
```

- [ ] **Step 4: Correr y ver PASS** — 6 tests verdes; correr también `npx vitest run tests/services/upgrades/` completo.
- [ ] **Step 5: Commit** — `git add scripts/services/upgrades/upgrades.service.js tests/services/upgrades/upgrades.service.test.js && git commit -m "feat(upgrades): cliente validate con cadena de tokens y retry 401"`

---

### Task 4: Molecule `full-page-loader`

**Files:**
- Create: `design-system/molecules/full-page-loader/full-page-loader.js`
- Create: `design-system/molecules/full-page-loader/full-page-loader.sample.js`

**Interfaces:**
- Produces: `FullPageLoader({ isOpen: boolean, label?: string })` — overlay blanco `fixed inset-0`, cóndor + label, `role="status"`, bloquea scroll del body mientras `isOpen`.

**Notas:** El cóndor es el mismo vector de marca ya versionado: `assets/logos/members/decorative-vector.svg` (patrón de uso en `design-system/organisms/members-elite-header/members-elite-header.js:50`, con `window.hlx?.codeBasePath`). Figma 77-9620 pide loader continuo que reemplaza la vista hasta tener respuesta.

- [ ] **Step 1: Implementación** — `design-system/molecules/full-page-loader/full-page-loader.js`:

```js
import { h } from '@dropins/tools/preact.js';
import { useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * FullPageLoader - Loader de página completa para transiciones de producto
 * (Figma Formulario UpGrade 77-9620). Overlay blanco que cubre el viewport
 * con el cóndor de marca y un label, hasta que el flujo lo cierre.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visible mientras sea true
 * @param {string} [props.label='Cargando...'] - Texto bajo el cóndor (i18n)
 * @returns {import('preact').VNode|null}
 */
export const FullPageLoader = ({ isOpen, label = 'Cargando...' }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const condorSrc = `${window.hlx?.codeBasePath || ''}/assets/logos/members/decorative-vector.svg`;

  return html`
    <div
      class="fixed inset-0 z-[1100] bg-white flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
      data-name="fullPageLoader"
    >
      <img
        src=${condorSrc}
        alt=""
        aria-hidden="true"
        class="w-[72px] h-auto pointer-events-none select-none animate-pulse"
      />
      <p class="text-text-normal-secondary text-sm !m-0">${label}</p>
    </div>
  `;
};

export default FullPageLoader;
```

- [ ] **Step 2: Sample** — `design-system/molecules/full-page-loader/full-page-loader.sample.js` (seguir el formato de `design-system/atoms/simple-loader/simple-loader.sample.js`; leerlo y replicar la estructura exportando un caso `isOpen: true`).
- [ ] **Step 3: Verificación estática** — `node --check design-system/molecules/full-page-loader/full-page-loader.js` y `npx eslint design-system/molecules/full-page-loader/ --no-error-on-unmatched-pattern` → sin errores.
- [ ] **Step 4: Commit** — `git add design-system/molecules/full-page-loader/ && git commit -m "feat(upgrades): molecule full-page-loader (loader de transiciones)"`

---

### Task 5: Rework de `cabin-upgrade-form`

**Files:**
- Modify: `design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js` (reemplazo completo del flujo de datos; ver código abajo)
- Test: `tests/services/upgrades/cabin-upgrade-form.helpers.test.js`

**Interfaces:**
- Consumes: `validateUpgrade`, `getUpgradesConfig` (Task 3); `mapValidateResult`, `buildMmbRedirectUrl`, `UPGRADE_RESULT` (Task 2); `FullPageLoader` (Task 4); `ModalAviancaLayout`, `Input`, `Button`, `fetchAEMData`, `getStoredLanguage` (existentes).
- Produces: `sanitizePnr(value) => string` y `sanitizeLastName(value) => string` exportados para test; el componente `CabinUpgradeForm` mantiene su firma pública (props `onSubmit`, `onError`, `modalDescription`, `modalImageData`, `modalImageAlt`, `customClassName`) para no romper a `form-header-banner`, `megamenu` y `navbar-mobile`.

**Decisiones de detalle (del spec):**
- `sanitizePnr`: quita no-alfanuméricos, MAYÚSCULAS, `slice(0, 6)`.
- `sanitizeLastName`: solo letras (incl. acentos/ñ/ü) y espacios (regex existente).
- Estado `modal`: `null | 'NO_AVAILABILITY' | 'NOT_FOUND' | 'ERROR'`. CTA: NO_AVAILABILITY limpia campos; NOT_FOUND/ERROR solo cierran (NOT_FOUND además enfoca PNR vía `document.getElementById('pnr-code')?.focus()`).
- `ELIGIBLE`: `window.location.assign(buildMmbRedirectUrl(...))`; el loader queda visible (no `setIsSubmitting(false)` en ese camino).
- Icono de modal: `modals/upgrade-not-available` existente para los 3 casos como fallback inicial (paso de icons abajo puede sustituirlos).
- Keys i18n nuevas (con fallback hardcodeado es, patrón `getI18nLabel(key, fallback)`):
  `cabinUpgradeForm.helper.apellido` → "Tal y como aparece(n) en la reserva"
  `cabinUpgradeForm.loader.label` → "Cargando..."
  `cabinUpgradeForm.modalHighDemand.title|description|buttonText` → "Servicio con alta demanda" | "El ascenso de cabina no está disponible para este vuelo." | "Consultar otra reserva"
  `cabinUpgradeForm.modalNotFound.title|description|buttonText` → "Reserva no encontrada" | "Revisa el código de tu reserva y apellido" | "Reintentar"
  `cabinUpgradeForm.modalError.title|description|buttonText` (existentes) → fallbacks "¡Ups! Algo salió mal" | "Por favor, intenta de nuevo." | "Reintentar"
- Se eliminan: `getEnvironmentConfig`, `DEFAULT_CONFIG`, `AV_CABIN_UPGRADE_API_URL/KEY`, el POST `checkUpgradeEligibility`, `result.offerUrl` y `window.open`.

- [ ] **Step 1: Test de helpers que falla** — `tests/services/upgrades/cabin-upgrade-form.helpers.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { sanitizePnr, sanitizeLastName } from '../../../design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js';

describe('sanitizePnr', () => {
  it('mayúsculas, solo alfanumérico, máximo 6', () => {
    expect(sanitizePnr('ay-qq_qs99')).toBe('AYQQQS');
    expect(sanitizePnr('abc')).toBe('ABC');
    expect(sanitizePnr('a1b2c3d4')).toBe('A1B2C3');
  });
});

describe('sanitizeLastName', () => {
  it('permite letras, acentos, ñ/ü y espacios; quita el resto', () => {
    expect(sanitizeLastName('De la Peña3!')).toBe('De la Peña');
    expect(sanitizeLastName('Müller')).toBe('Müller');
  });
});
```

Nota: importar el organism arrastra Preact/htm — el entorno happy-dom de la suite lo soporta (mismo caso que tests de organisms existentes). Si el import fallara por dependencias de `@dropins`, mover `sanitizePnr`/`sanitizeLastName` a `scripts/services/upgrades/upgrades-result.js` y reexportarlos; ajustar imports en ambos archivos.

- [ ] **Step 2: Correr y ver FAIL** — `npx vitest run tests/services/upgrades/cabin-upgrade-form.helpers.test.js` (los exports no existen).
- [ ] **Step 3: Reemplazar el organism** — nuevo contenido de `cabin-upgrade-form.js` (completo):

```js
import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Input } from '../../../atoms/inputs/input/input.js';
import { Button } from '../../../atoms/button/button.js';
import { ModalAviancaLayout } from '../../../molecules/modal/modal-avianca-layout.js';
import { FullPageLoader } from '../../../molecules/full-page-loader/full-page-loader.js';
import { fetchAEMData } from '../../../../scripts/utils/aem-data.js';
import { getStoredLanguage } from '../../../../scripts/services/header/language-country-selector.js';
import { validateUpgrade, getUpgradesConfig } from '../../../../scripts/services/upgrades/upgrades.service.js';
import { mapValidateResult, buildMmbRedirectUrl, UPGRADE_RESULT } from '../../../../scripts/services/upgrades/upgrades-result.js';

const html = htm.bind(h);

let i18Cache = null;
let i18FallbackCache = null;

export const sanitizePnr = (value) => String(value ?? '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toUpperCase()
  .slice(0, 6);

export const sanitizeLastName = (value) => String(value ?? '')
  .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');

function getI18nLabel(key, fallback = '') {
  if (i18Cache) {
    const labelData = i18Cache.find((item) => item.Key === key);
    if (labelData?.Text) return labelData.Text;
  }
  if (i18FallbackCache) {
    const labelData = i18FallbackCache.find((item) => item.Key === key);
    if (labelData?.Text) return labelData.Text;
  }
  return fallback;
}

/**
 * CabinUpgradeForm - Formulario de acceso a Upgrades (AVAEMF2P20-270).
 * Valida PNR + apellido contra /v1/upgrades/validate (Ventana Comercial) y
 * redirige a Upgrades MMB cuando hay al menos un segmento elegible. Sin
 * selección de flujo ni SSCI.
 *
 * @param {Object} props
 * @param {Function} [props.onSubmit] - Callback tras resultado exitoso (antes de redirigir)
 * @param {Function} [props.onError] - Callback en resultados de error
 * @param {string} [props.modalDescription] - Override CMS de la descripción del modal de sin disponibilidad
 * @param {Object} [props.modalImageData] - Override CMS del icono del modal
 * @param {string} [props.modalImageAlt] - Alt del icono del modal
 * @param {string} [props.customClassName=''] - Clases adicionales
 * @returns {import('preact').VNode}
 */
export const CabinUpgradeForm = ({
  onSubmit = () => {},
  onError = () => {},
  modalDescription,
  modalImageData,
  modalImageAlt,
  customClassName = '',
  ...rest
}) => {
  const [pnrCode, setPnrCode] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ pnrCode: '', lastName: '' });
  const [activeModal, setActiveModal] = useState(null); // null | UPGRADE_RESULT.*
  const [labels, setLabels] = useState({});

  useEffect(() => {
    const loadLabels = async () => {
      if (!i18Cache) {
        const cookieLanguage = getStoredLanguage() || 'es';
        const i18Data = await fetchAEMData(`${cookieLanguage}`);
        i18Cache = i18Data?.data || [];
        if (cookieLanguage !== 'es' && !i18FallbackCache) {
          const esFallback = await fetchAEMData('es');
          i18FallbackCache = esFallback?.data || [];
        }
      }
      setLabels({
        buttonText: getI18nLabel('cabinUpgradeForm.buttonText', 'Solicitar ascenso'),
        pnrLabel: getI18nLabel('cabinUpgradeForm.labels.pnr', 'Código de reserva'),
        lastNameLabel: getI18nLabel('cabinUpgradeForm.labels.apellido', 'Apellido'),
        lastNameHelper: getI18nLabel('cabinUpgradeForm.helper.apellido', 'Tal y como aparece(n) en la reserva'),
        pnrError: getI18nLabel('cabinUpgradeForm.error.pnr', 'El código de reserva es obligatorio'),
        lastNameError: getI18nLabel('cabinUpgradeForm.error.apellido', 'El apellido es obligatorio'),
        loaderLabel: getI18nLabel('cabinUpgradeForm.loader.label', 'Cargando...'),
        errorTitle: getI18nLabel('cabinUpgradeForm.modalError.title', '¡Ups! Algo salió mal'),
        errorDescription: getI18nLabel('cabinUpgradeForm.modalError.description', 'Por favor, intenta de nuevo.'),
        errorButton: getI18nLabel('cabinUpgradeForm.modalError.buttonText', 'Reintentar'),
        highDemandTitle: getI18nLabel('cabinUpgradeForm.modalHighDemand.title', 'Servicio con alta demanda'),
        highDemandDescription: getI18nLabel('cabinUpgradeForm.modalHighDemand.description', 'El ascenso de cabina no está disponible para este vuelo.'),
        highDemandButton: getI18nLabel('cabinUpgradeForm.modalHighDemand.buttonText', 'Consultar otra reserva'),
        notFoundTitle: getI18nLabel('cabinUpgradeForm.modalNotFound.title', 'Reserva no encontrada'),
        notFoundDescription: getI18nLabel('cabinUpgradeForm.modalNotFound.description', 'Revisa el código de tu reserva y apellido'),
        notFoundButton: getI18nLabel('cabinUpgradeForm.modalNotFound.buttonText', 'Reintentar'),
        formAriaLabel: getI18nLabel('cabinUpgradeForm.aria.form', 'Formulario de upgrade de cabina'),
        submitAriaLabel: getI18nLabel('cabinUpgradeForm.aria.submitButton', 'Solicitar ascenso a Business Class'),
      });
    };
    loadLabels();
  }, []);

  const handlePnrKeyPress = (e) => {
    if (!/[a-zA-Z0-9]/.test(e.key)) e.preventDefault();
  };

  const handlePnrChange = (value) => {
    const sanitized = sanitizePnr(value);
    setPnrCode(sanitized);
    if (errors.pnrCode && sanitized.length > 0) {
      setErrors((prev) => ({ ...prev, pnrCode: '' }));
    }
  };

  const handleLastNameKeyPress = (e) => {
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/.test(e.key)) e.preventDefault();
  };

  const handleLastNameChange = (value) => {
    const sanitized = sanitizeLastName(value);
    setLastName(sanitized);
    if (errors.lastName && sanitized.length > 0) {
      setErrors((prev) => ({ ...prev, lastName: '' }));
    }
  };

  const closeModal = () => setActiveModal(null);

  const handleHighDemandClose = () => {
    setActiveModal(null);
    setPnrCode('');
    setLastName('');
  };

  const handleNotFoundClose = () => {
    setActiveModal(null);
    document.getElementById('pnr-code')?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = { pnrCode: '', lastName: '' };
    if (!pnrCode.trim()) newErrors.pnrCode = labels.pnrError;
    if (!lastName.trim()) newErrors.lastName = labels.lastNameError;
    if (newErrors.pnrCode || newErrors.lastName) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await validateUpgrade({ pnr: pnrCode });
      const result = mapValidateResult({ ...response, lastName });

      if (result === UPGRADE_RESULT.ELIGIBLE) {
        const { mmbUrl } = await getUpgradesConfig();
        const url = buildMmbRedirectUrl({
          baseUrl: mmbUrl,
          lang: getStoredLanguage() || 'es',
          pnr: sanitizePnr(pnrCode),
          lastName: lastName.trim(),
        });
        await onSubmit({ pnrCode, lastName, result: response.body });
        // Redirección misma pestaña; el loader queda visible hasta navegar.
        window.location.assign(url);
        return;
      }

      setActiveModal(result);
      onError({ result, response });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[cabin-upgrade-form] validate failed:', error);
      setActiveModal(UPGRADE_RESULT.ERROR);
      onError({ result: UPGRADE_RESULT.ERROR, error });
    }
    setIsSubmitting(false);
  };

  const containerClasses = `cabin-upgrade-form w-full ${customClassName}`.trim();
  const modalIcon = modalImageData?.src || 'modals/upgrade-not-available';

  return html`
    <form
      class=${containerClasses}
      onSubmit=${handleSubmit}
      data-name="cabinUpgradeForm"
      aria-label=${labels.formAriaLabel || 'Formulario de upgrade de cabina'}
      novalidate
      ...${rest}
    >
      <div class="flex gap-4 lg:flex-row flex-col w-full lg:min-h-[64px]">
        <div class="flex gap-4 lg:flex-row flex-col w-full">
          <div class="w-full">
            <${Input}
              id="pnr-code"
              name="pnrCode"
              label=${labels.pnrLabel}
              type="text"
              value=${pnrCode}
              onChange=${handlePnrChange}
              onKeyPress=${handlePnrKeyPress}
              required=${false}
              maxLength="6"
              state=${errors.pnrCode ? 'error' : 'normal'}
              helperText=${errors.pnrCode}
              prefixIconName="services/airplane-ticket"
              aria-required="true"
              aria-invalid=${errors.pnrCode ? 'true' : 'false'}
              aria-describedby=${errors.pnrCode ? 'pnr-error' : undefined}
              customClassName=${`[&>div]:!outline-[var(${errors.pnrCode ? '' : '--color-border-default'})]${errors.pnrCode ? ' [&>div]:!outline-[#FF1C46]' : ''} ${errors.pnrCode ? '[&_label]:!text-[var(--color-alert-error-icon-bg)]' : '[&_label]:!text-[var(--color-text-normal-primary)]'}`}
            />
          </div>

          <div class="w-full">
            <${Input}
              id="last-name"
              name="lastName"
              label=${labels.lastNameLabel}
              type="text"
              value=${lastName}
              onChange=${handleLastNameChange}
              onKeyPress=${handleLastNameKeyPress}
              required=${false}
              state=${errors.lastName ? 'error' : 'normal'}
              helperText=${errors.lastName || labels.lastNameHelper}
              prefixIconName="person-icon"
              aria-required="true"
              aria-invalid=${errors.lastName ? 'true' : 'false'}
              aria-describedby=${errors.lastName ? 'lastname-error' : undefined}
              customClassName=${`[&>div]:!outline-[var(${errors.lastName ? '' : '--color-border-default'})]${errors.lastName ? ' [&>div]:!outline-[#FF1C46]' : ''} ${errors.lastName ? '[&_label]:!text-[var(--color-alert-error-icon-bg)]' : '[&_label]:!text-[var(--color-text-normal-primary)]'}`}
            />
          </div>
        </div>

        <div class="flex items-center max-h-[4rem] w-full lg:w-auto">
          <${Button}
            type="submit"
            variant="primary"
            size="md"
            disabled=${isSubmitting}
            customClassName="w-full lg:w-auto whitespace-nowrap"
            aria-label=${labels.submitAriaLabel || 'Solicitar ascenso a Business Class'}
          >
            ${labels.buttonText}
          </${Button}>
        </div>
      </div>
    </form>

    <${FullPageLoader} isOpen=${isSubmitting} label=${labels.loaderLabel} />

    <${ModalAviancaLayout}
      isOpen=${activeModal === UPGRADE_RESULT.NO_AVAILABILITY}
      onClose=${handleHighDemandClose}
      title=${labels.highDemandTitle}
      description=${modalDescription || labels.highDemandDescription}
      icon=${modalIcon}
      imageAlt=${modalImageAlt}
      primaryButtonLabel=${labels.highDemandButton}
      onPrimaryClick=${handleHighDemandClose}
    />

    <${ModalAviancaLayout}
      isOpen=${activeModal === UPGRADE_RESULT.NOT_FOUND}
      onClose=${handleNotFoundClose}
      title=${labels.notFoundTitle}
      description=${labels.notFoundDescription}
      icon=${modalIcon}
      primaryButtonLabel=${labels.notFoundButton}
      onPrimaryClick=${handleNotFoundClose}
    />

    <${ModalAviancaLayout}
      isOpen=${activeModal === UPGRADE_RESULT.ERROR}
      onClose=${closeModal}
      title=${labels.errorTitle}
      description=${labels.errorDescription}
      icon=${modalIcon}
      primaryButtonLabel=${labels.errorButton}
      onPrimaryClick=${closeModal}
    />
  `;
};

export default CabinUpgradeForm;
```

- [ ] **Step 4: Correr y ver PASS** — `npx vitest run tests/services/upgrades/` (helpers + services). `node --check design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js`.
- [ ] **Step 5: Verificar que no quedó nada de Plusgrade/SSCI** — `grep -rn "AV_CABIN_UPGRADE\|checkUpgradeEligibility\|offerUrl\|ssci" design-system/organisms/forms/cabin-upgrade-form/` → 0 resultados.
- [ ] **Step 6: Commit** — `git add design-system/organisms/forms/cabin-upgrade-form/ tests/services/upgrades/cabin-upgrade-form.helpers.test.js && git commit -m "feat(upgrades): cabin-upgrade-form consume upgrades/validate y redirige a MMB (AVAEMF2P20-270)"`

---

### Task 6: Iconos de modal desde Figma (best-effort)

**Files:**
- Create (si el export funciona): `icons/modals/upgrade-technical-error.svg`, `icons/modals/upgrade-high-demand.svg`, `icons/modals/upgrade-not-found.svg`
- Modify (si se crean): mapa de iconos en `cabin-upgrade-form.js` (prop `icon` de cada modal)

**Nodos Figma:** archivo `ZCD8smROXO5KHNvo1Vd8z7`, modales desktop: `77:7338` (¡Ups! — avión+engranajes), `77:8285` (alta demanda — silla con alerta), `77:9230` (no encontrada — avión con alerta). Intentar `get_design_context` sobre el nodo del ícono interno de cada modal para extraer SVG.

- [ ] **Step 1:** Intentar extraer los 3 SVG de Figma. Si el MCP no entrega vectores utilizables, **mantener** `modals/upgrade-not-available` en los 3 modales y registrar en el PR: "iconos definitivos pendientes de asset del equipo de diseño".
- [ ] **Step 2 (solo si hay SVGs):** guardarlos en `icons/modals/` (viewBox limpio, sin fills hardcodeados innecesarios; seguir el formato de `icons/modals/upgrade-not-available.svg`) y actualizar en `cabin-upgrade-form.js`:

```js
const MODAL_ICONS = {
  [UPGRADE_RESULT.ERROR]: 'modals/upgrade-technical-error',
  [UPGRADE_RESULT.NO_AVAILABILITY]: 'modals/upgrade-high-demand',
  [UPGRADE_RESULT.NOT_FOUND]: 'modals/upgrade-not-found',
};
```

y usar `icon=${modalImageData?.src || MODAL_ICONS[...]}` en cada modal.

- [ ] **Step 3: Commit** — `git add icons/modals/ design-system/organisms/forms/cabin-upgrade-form/ && git commit -m "feat(upgrades): iconos de modales del flujo upgrades"` (omitir si no hubo assets).

---

### Task 7: Verificación integral y PR

**Files:**
- Modify: `RESUME.md` (estado + pasos de QA manual)

- [ ] **Step 1: Suite completa** — `npx vitest run` → todo verde (incluye suites previas no relacionadas; si alguna falla, verificar que ya fallaba en `origin/avdev` antes de tocarla).
- [ ] **Step 2: Lint** — `npx eslint scripts/services/upgrades/ design-system/organisms/forms/cabin-upgrade-form/ design-system/molecules/full-page-loader/ tests/services/upgrades/` → 0 errores.
- [ ] **Step 3: E2E manual (documentar en RESUME, ejecutar si hay entorno)** — `npm run start` (aem up); en consola del browser sembrar el token QA:

```js
localStorage.setItem('avianca_apim_token_upgrades', JSON.stringify({
  token: '<access_token de Bruno>', expiresAt: Date.now() + 55 * 60 * 1000,
}));
```

Probar: PNR `AYQQQS` + apellido `Morales` → redirige a MMB con `?pnr=AYQQQS&lastname=Morales&flow=mmb` · apellido `Garcia` → modal Reserva no encontrada · PNR `ZZZZZZ` → modal Reserva no encontrada · sin red (offline) → modal ¡Ups! · campos vacíos → errores inline. Verificar loader y foco de modales con teclado.

- [ ] **Step 4: Actualizar RESUME.md** (marcar implementación/verificación, dejar pendientes: backend token endpoint, keys AEM, i18n CMS, rotación credenciales) y commit.
- [ ] **Step 5: Push + PR a `avdev`**:

```bash
git push
gh pr create --base avdev --title "feat(upgrades): formulario de validación para acceso a Upgrades MMB (AVAEMF2P20-270)" --body "$(cat <<'EOF'
## AVAEMF2P20-270 / PBI 1281633
Reemplaza la integración Plusgrade del cabin-upgrade-form por los servicios de Upgrades
(API_CanalesDigitales) con redirección automática a Upgrades MMB (Ventana Comercial).

- Nuevo servicio scripts/services/upgrades/ (validate + mapeo ELIGIBLE/NO_AVAILABILITY/NOT_FOUND/ERROR)
- Token Cognito vía AV_TOKEN_ENDPOINT servicio 'upgrades' (secreto NUNCA en el front) — requiere extensión backend
- Molecule full-page-loader; modales alta demanda / no encontrada / error técnico (Figma)
- URL MMB configurable (AV_UPGRADES_MMB_URL, {lang} dinámico) + AV_UPGRADES_CHANNEL
- Spec: docs/superpowers/specs/2026-07-23-upgrades-form-design.md

### Pendientes de coordinación
- Backend: AV_TOKEN_ENDPOINT service 'upgrades' → {token, expiresIn}
- AEM: keys i18n cabinUpgradeForm.* nuevas + environment keys opcionales
- Diseño: iconos definitivos de modales (si Task 6 no los extrajo)
- Rotar credenciales QA de la colección Bruno antes de prod

https://claude.ai/code/session_014Mdjr3Ur2pZimeMK8eTe2G
EOF
)"
```

---

## Self-Review (hecho al escribir el plan)

- **Cobertura del spec:** §1 servicios → Tasks 1-3 · §2 contrato/mapeo → Task 2 · §3 organism/validaciones/modales/i18n/SSCI → Task 5 · §4 loader → Task 4 · §5 URL MMB → Tasks 2-3-5 · Testing → Tasks 1-5, 7 · CA-01..07 cubiertos (CA-07 vía ModalAviancaLayout + role=status + aria de inputs).
- **Placeholders:** Task 6 es explícitamente best-effort con fallback definido (no es un TBD: el fallback es el estado final aceptable).
- **Consistencia de tipos:** `validateUpgrade` devuelve `{ok,status,body}` y `mapValidateResult` consume `{ok,status,body,lastName}` — verificado en Tasks 3 y 5. `UPGRADE_RESULT` se usa como valor de `activeModal` en Task 5.
