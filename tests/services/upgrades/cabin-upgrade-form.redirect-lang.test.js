// @vitest-environment happy-dom
import {
  describe, it, expect, beforeAll, beforeEach, afterEach, vi,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

const aemDataPath = '../../../scripts/utils/aem-data.js';
const langPath = '../../../scripts/services/header/language-country-selector.js';
const servicePath = '../../../scripts/services/upgrades/upgrades.service.js';
const formPath = '../../../design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js';

const BODY_ELIGIBLE = {
  passengers: [{ firstName: 'LINA', lastName: 'MORALES' }],
  segments: [{ refNumber: '1', upgradeStatus: 'elegible' }],
};

const MMB_URL = 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class';

let CabinUpgradeForm;
let resetI18nCachesForTests;
let getStoredLanguage;
let getUpgradesConfig;
let validateUpgrade;

// Los módulos se mockean e importan UNA sola vez, sin vi.resetModules(): resetear
// desempareja la instancia de Preact de la de sus hooks y el render revienta con
// "Cannot read properties of undefined (reading '__H')". Mismo motivo por el que
// el componente expone resetI18nCachesForTests.
beforeAll(async () => {
  vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn().mockResolvedValue({ data: [] }) }));
  vi.doMock(langPath, () => ({ getStoredLanguage: vi.fn() }));
  vi.doMock(servicePath, () => ({
    validateUpgrade: vi.fn(),
    getUpgradesConfig: vi.fn(),
  }));
  ({ getStoredLanguage } = await import(langPath));
  ({ getUpgradesConfig, validateUpgrade } = await import(servicePath));
  ({ CabinUpgradeForm, resetI18nCachesForTests } = await import(formPath));
});

const flush = async () => {
  for (let i = 0; i < 8; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 0); });
  }
};

const setInputValue = (el, value) => {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
};

/**
 * Monta el formulario con el idioma y el langMap dados, lo llena con una reserva
 * elegible y lo envía. Devuelve la URL a la que se redirigió.
 */
const submitAndGetRedirectUrl = async ({ language, langMap }) => {
  getStoredLanguage.mockReturnValue(language);
  validateUpgrade.mockResolvedValue({ ok: true, status: 200, body: BODY_ELIGIBLE });
  getUpgradesConfig.mockResolvedValue({ channel: 'MMB', mmbUrl: MMB_URL, langMap });
  resetI18nCachesForTests();

  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${CabinUpgradeForm} />`, container);
  await flush();

  setInputValue(container.querySelector('#pnr-code'), 'AYQQQS');
  setInputValue(container.querySelector('#last-name'), 'Morales');
  await flush();

  container.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  await flush();

  return window.location.assign.mock.calls[0]?.[0];
};

// El sitio de MMB no está publicado en francés: /fr/ no existe en
// gestiona.avianca.com, así que el usuario aterrizaba en una URL inexistente
// (VSTS 1301186). El mapeo lo aplica buildMmbRedirectUrl con el langMap que
// entrega getUpgradesConfig; acá se verifica el cableado de punta a punta.
describe('CabinUpgradeForm — idioma de la redirección a MMB', () => {
  beforeEach(() => {
    vi.spyOn(window.location, 'assign').mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200, text: async () => '<svg></svg>', json: async () => ({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    delete global.fetch;
  });

  it('con la cookie en fr redirige al sitio en inglés', async () => {
    const url = await submitAndGetRedirectUrl({ language: 'fr', langMap: { fr: 'en' } });

    expect(url).toContain('/en/manage/upgrade-business-class?');
    expect(url).not.toContain('/fr/');
    expect(url).toContain('pnr=AYQQQS');
  });

  it('los demás idiomas del producto no se tocan', async () => {
    // Secuencial a propósito: cada idioma vuelve a montar el formulario y en
    // paralelo se pisarían el spy de location.assign.
    const languages = ['es', 'en', 'pt'];
    for (let i = 0; i < languages.length; i += 1) {
      window.location.assign.mockClear();
      // eslint-disable-next-line no-await-in-loop
      const url = await submitAndGetRedirectUrl({ language: languages[i], langMap: { fr: 'en' } });
      expect(url).toContain(`/${languages[i]}/manage/upgrade-business-class?`);
    }
  });

  it('respeta el mapa que venga de environment (el negocio cambia el destino)', async () => {
    const url = await submitAndGetRedirectUrl({ language: 'fr', langMap: { fr: 'pt' } });

    expect(url).toContain('/pt/manage/upgrade-business-class?');
  });

  it('si el negocio apaga el mapeo (fr:fr) el francés vuelve a su propio sitio', async () => {
    const url = await submitAndGetRedirectUrl({ language: 'fr', langMap: { fr: 'fr' } });

    expect(url).toContain('/fr/manage/upgrade-business-class?');
  });
});
