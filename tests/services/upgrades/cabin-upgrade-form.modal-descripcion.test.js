// @vitest-environment happy-dom
import {
  describe, it, expect, beforeAll, afterEach, vi,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

const aemDataPath = '../../../scripts/utils/aem-data.js';
const langPath = '../../../scripts/services/header/language-country-selector.js';
const servicePath = '../../../scripts/services/upgrades/upgrades.service.js';
const loaderPath = '../../../scripts/services/loader/loader.service.js';
const sanitizePath = '../../../scripts/utils/sanitize.js';

const DESCRIPCION_LARGA = 'Lo sentimos, en el momento no está disponible el ascenso a Business '
  + 'Class para este vuelo. Si deseas, puedes intentar con otro vuelo que tengas programado';

const DICCIONARIO = [
  { Key: 'cabinUpgradeForm.labels.pnr', Text: 'Código de reserva' },
  { Key: 'cabinUpgradeForm.labels.apellido', Text: 'Apellido' },
  { Key: 'cabinUpgradeForm.modalError.title', Text: 'Algo salió mal' },
  { Key: 'cabinUpgradeForm.modalError.description', Text: DESCRIPCION_LARGA },
  { Key: 'cabinUpgradeForm.modalError.button', Text: 'Entendido' },
];

let CabinUpgradeForm;
let MODAL_DESCRIPTION_CLASS;
let resetI18nCachesForTests;
let fetchAEMData;
let validateUpgrade;

// El módulo se importa UNA vez: `vi.resetModules()` entre casos desempareja la
// instancia de Preact de la de sus hooks y el render revienta con `__H`.
beforeAll(async () => {
  vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
  vi.doMock(langPath, () => ({ getStoredLanguage: vi.fn().mockReturnValue('es') }));
  vi.doMock(servicePath, () => ({
    validateUpgrade: vi.fn(),
    getUpgradesConfig: vi.fn().mockResolvedValue({ mmbUrl: 'https://example.test/mmb' }),
  }));
  // showLoader devuelve false = la página no tiene el bloque cms-loader autorado.
  vi.doMock(loaderPath, () => ({
    showLoader: vi.fn().mockReturnValue(false),
    updateLoaderText: vi.fn(),
  }));
  // sanitizeHTML falla cerrado sin DOMPurify (devuelve ''), así que se stubea como
  // pass-through para poder afirmar sobre el contenido de la descripción. Hay que
  // devolver TODOS los exports que consume el árbol del formulario: si falta uno,
  // el modal ni siquiera llega a renderizar.
  vi.doMock(sanitizePath, () => ({
    ensureDOMPurify: vi.fn().mockResolvedValue(null),
    sanitizeHTML: vi.fn((s) => String(s || '')),
    sanitizeHTMLAsync: vi.fn(async (s) => String(s || '')),
    isSafeUrl: vi.fn().mockReturnValue(true),
    sanitizeSVG: vi.fn((s) => String(s || '')),
    sanitizeSpreadProps: vi.fn((p) => p),
  }));
  // El árbol del formulario dispara fetches reales que en el entorno de test no tienen
  // servidor: los sprites de `/icons/*.svg` y el beacon de RUM de scripts/aem.js. Sin
  // stubear `fetch` queda una promesa pendiente que vitest reporta como unhandled
  // rejection al cerrar la suite ("Failed to execute fetch() ... operation was aborted"),
  // y eso hace fallar la corrida aunque todos los casos pasen.
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
    text: async () => '',
    json: async () => ({}),
  }));
  ({ fetchAEMData } = await import(aemDataPath));
  ({ validateUpgrade } = await import(servicePath));
  ({ CabinUpgradeForm, MODAL_DESCRIPTION_CLASS, resetI18nCachesForTests } = await import(
    '../../../design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js'
  ));
});

const tick = async (veces = 6) => {
  for (let i = 0; i < veces; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 0); });
  }
};

const montar = async () => {
  resetI18nCachesForTests();
  fetchAEMData.mockResolvedValue({ data: DICCIONARIO });
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${CabinUpgradeForm} />`, container);
  await tick();
  return container;
};

const escribir = (input, valor) => {
  input.value = valor;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

// Abre el modal de error técnico: validateUpgrade lanza y handleSubmit cae al catch.
const abrirModalDeError = async (container) => {
  escribir(container.querySelector('#pnr-code'), 'CD3IHK');
  escribir(container.querySelector('#last-name'), 'Salas');
  await tick(2);
  validateUpgrade.mockRejectedValue(new Error('boom'));
  container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await tick(8);
};

const getDescripcionDelModal = (container) => container
  .querySelector('[data-name="modal"] .leading-\\[27px\\]');

describe('CabinUpgradeForm — la descripción de sus modales no se capa (1299705)', () => {
  afterEach(() => { document.body.innerHTML = ''; vi.clearAllMocks(); });

  it('el override que se pasa a los modales apaga el cap del default', () => {
    expect(MODAL_DESCRIPTION_CLASS).toBe('');
  });

  it('el modal de error renderiza la descripción sin cap ni scroll interno', async () => {
    const container = await montar();
    await abrirModalDeError(container);

    const desc = getDescripcionDelModal(container);
    expect(desc).toBeTruthy();
    expect(desc.textContent).toContain('no está disponible el ascenso a Business');
    expect(desc.className).not.toMatch(/max-h-/);
    expect(desc.className).not.toMatch(/overflow-y-auto/);
  });

  it('el modal de error no reserva gutter derecho: el texto queda centrado', async () => {
    const container = await montar();
    await abrirModalDeError(container);

    const desc = getDescripcionDelModal(container);
    expect(desc.className).not.toMatch(/\bpr-\[/);
    expect(desc.className).toContain('text-center');
  });

  it('la card del modal conserva su límite de viewport como red de seguridad', async () => {
    const container = await montar();
    await abrirModalDeError(container);

    const card = container.querySelector('[data-name="modal"]').firstElementChild;
    expect(card.className).toContain('max-h-[90vh]');
    expect(card.className).toContain('overflow-auto');
  });
});
