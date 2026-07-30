// @vitest-environment happy-dom
import {
  describe, it, expect, beforeAll, beforeEach, afterEach, vi,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

const aemDataPath = '../../../scripts/utils/aem-data.js';
const langPath = '../../../scripts/services/header/language-country-selector.js';

let CabinUpgradeForm;
let resetI18nCachesForTests;
let fetchAEMData;

// Se importa UNA vez: resetear módulos desempareja la instancia de Preact de la de
// sus hooks y el render revienta leyendo `__H`.
beforeAll(async () => {
  vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
  vi.doMock(langPath, () => ({ getStoredLanguage: vi.fn().mockReturnValue('es') }));
  ({ fetchAEMData } = await import(aemDataPath));
  ({ CabinUpgradeForm, resetI18nCachesForTests } = await import(
    '../../../design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js'
  ));
});

const iconRequests = () => global.fetch.mock.calls
  .map(([u]) => String(u))
  .filter((u) => u.includes('/icons/'));

// El atom Icon cachea los SVG a nivel de módulo, así que un sprite ya traído por
// un caso anterior no se vuelve a pedir. Los asertos de abajo se escriben para no
// depender de ese estado compartido: las URLs se comprueban sobre el stub de
// Image, que sí es por caso.
let imagenesPrecargadas;

const mount = async (rows = []) => {
  resetI18nCachesForTests();
  fetchAEMData.mockResolvedValue({ data: rows });
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${CabinUpgradeForm} />`, container);
  for (let i = 0; i < 5; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 0); });
  }
  return container;
};

describe('CabinUpgradeForm — precarga las ilustraciones al montar', () => {
  let ImageOriginal;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<svg viewBox="0 0 80 80"><path d="M0 0"/></svg>',
      json: async () => ({}),
    });
    imagenesPrecargadas = [];
    ImageOriginal = window.Image;
    window.Image = class {
      set src(v) {
        this.currentSrc = v;
        imagenesPrecargadas.push(v);
      }
    };
  });

  afterEach(() => {
    window.Image = ImageOriginal;
    document.body.innerHTML = '';
    delete global.fetch;
    vi.clearAllMocks();
  });

  // Este caso corre primero, con el cache del atom Icon frío.
  it('pide los sprites de los 3 modales sin que el usuario abra ninguno', async () => {
    const c = await mount();

    const pedidos = iconRequests();
    expect(pedidos.some((u) => u.includes('modals/upgrade-no-availability'))).toBe(true);
    expect(pedidos.some((u) => u.includes('modals/upgrade-not-found'))).toBe(true);
    expect(pedidos.some((u) => u.includes('modals/upgrade-error'))).toBe(true);
    // La precarga ocurre en el montaje, no al abrir el modal.
    expect(c.querySelector('[data-name="modal"]')).toBeNull();
  });

  it('si el autor puso una URL, la calienta como imagen y no la pide como sprite', async () => {
    const url = 'https://cdn.example.com/dam/error-tecnico.svg';
    await mount([{ Key: 'cabinUpgradeForm.modalError.image', Text: url }]);

    expect(imagenesPrecargadas).toContain(url);
    // Las URLs las trae el navegador como <img>; no pasan por el fetch del atom Icon.
    expect(iconRequests().some((u) => u.includes(url))).toBe(false);
  });

  it('sin valores autorados no precarga ninguna imagen: todo son sprites', async () => {
    await mount();

    expect(imagenesPrecargadas).toEqual([]);
  });

  it('calienta una sola vez cuando los 3 modales comparten la misma URL', async () => {
    const url = '/media_unica.svg';
    await mount([
      { Key: 'cabinUpgradeForm.modalHighDemand.image', Text: url },
      { Key: 'cabinUpgradeForm.modalNotFound.image', Text: url },
      { Key: 'cabinUpgradeForm.modalError.image', Text: url },
    ]);

    expect(imagenesPrecargadas.filter((s) => s === url)).toHaveLength(1);
  });

  it('un fallo de red en la precarga no rompe el montaje del formulario', async () => {
    global.fetch = vi.fn().mockImplementation((u) => {
      if (String(u).includes('/icons/')) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: [] }) });
    });

    const c = await mount();

    // Best-effort: si la precarga falla, el formulario sigue funcionando igual.
    expect(c.querySelector('[data-name="cabinUpgradeForm"]')).toBeTruthy();
    expect(c.querySelector('#pnr-code')).toBeTruthy();
    expect(c.querySelector('#last-name')).toBeTruthy();
  });
});
