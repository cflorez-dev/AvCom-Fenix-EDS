// @vitest-environment happy-dom
import {
  describe, it, expect, beforeAll, beforeEach, afterEach, vi,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { CONDOR_LOADER_ASSET } from '../../../design-system/molecules/full-page-loader/full-page-loader.js';

const html = htm.bind(h);

const aemDataPath = '../../../scripts/utils/aem-data.js';
const langPath = '../../../scripts/services/header/language-country-selector.js';

let CabinUpgradeForm;
let resetI18nCachesForTests;
let fetchAEMData;

beforeAll(async () => {
  vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
  vi.doMock(langPath, () => ({ getStoredLanguage: vi.fn().mockReturnValue('es') }));
  ({ fetchAEMData } = await import(aemDataPath));
  ({ CabinUpgradeForm, resetI18nCachesForTests } = await import(
    '../../../design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js'
  ));
});

const prefetchLinks = () => [...document.head.querySelectorAll('link[rel="prefetch"]')]
  .map((l) => l.getAttribute('href'));

const mount = async () => {
  resetI18nCachesForTests();
  fetchAEMData.mockResolvedValue({ data: [] });
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${CabinUpgradeForm} />`, container);
  for (let i = 0; i < 6; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 0); });
  }
  return container;
};

// El GIF del cóndor del fallback (224 KB) se pedía en el instante en que el loader
// se abre, o sea al enviar el formulario, que es justo cuando la red puede estar
// degradada. Verificado en avqa: no aparecía entre los recursos de la carga.
// El camino del bloque cms-loader autorado NO tiene este problema: su <img> vive en
// el HTML de la página con loading="eager" y el navegador ya lo trae en la carga,
// aunque la sección esté en display:none.
describe('CabinUpgradeForm — prefetch del asset del loader de fallback', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200, text: async () => '<svg></svg>', json: async () => ({}),
    });
    document.head.querySelectorAll('link[rel="prefetch"]').forEach((l) => l.remove());
  });

  afterEach(() => {
    document.head.querySelectorAll('link[rel="prefetch"]').forEach((l) => l.remove());
    document.body.innerHTML = '';
    delete global.fetch;
    vi.clearAllMocks();
  });

  it('sin bloque cms-loader en la página, prefetchea el GIF del fallback', async () => {
    await mount();

    expect(prefetchLinks()).toContain(CONDOR_LOADER_ASSET);
  });

  it('lo declara como imagen y con rel=prefetch, no preload', async () => {
    await mount();

    const link = [...document.head.querySelectorAll('link[rel="prefetch"]')]
      .find((l) => l.getAttribute('href') === CONDOR_LOADER_ASSET);

    // prefetch (prioridad baja, tiempo libre) y no preload: son 224 KB que solo
    // se necesitan al enviar, no deben competir con los recursos de la página.
    expect(link).toBeTruthy();
    expect(link.getAttribute('as')).toBe('image');
    expect(document.head.querySelector(`link[rel="preload"][href="${CONDOR_LOADER_ASSET}"]`)).toBeNull();
  });

  it('con el bloque cms-loader autorado NO lo prefetchea: ese camino no usa el fallback', async () => {
    const bloque = document.createElement('div');
    bloque.className = 'section cms-loader-container';
    document.body.appendChild(bloque);

    await mount();

    expect(prefetchLinks()).not.toContain(CONDOR_LOADER_ASSET);
  });

  it('detecta también el bloque por .cms-loader.block', async () => {
    const bloque = document.createElement('div');
    bloque.className = 'cms-loader block';
    document.body.appendChild(bloque);

    await mount();

    expect(prefetchLinks()).not.toContain(CONDOR_LOADER_ASSET);
  });

  it('no duplica el link si el formulario se monta dos veces', async () => {
    await mount();
    await mount();

    const repetidos = prefetchLinks().filter((h2) => h2 === CONDOR_LOADER_ASSET);
    expect(repetidos).toHaveLength(1);
  });
});
