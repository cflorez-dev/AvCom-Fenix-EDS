// @vitest-environment happy-dom
import {
  describe, it, expect, beforeAll, afterEach, vi,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

const aemDataPath = '../../../scripts/utils/aem-data.js';
const langPath = '../../../scripts/services/header/language-country-selector.js';

const HELPER_TEXT = 'Tal y como aparece(n) en la reserva';

// Recorte real de /es.json en NuxQA2 (2026-07-29): la llave del helper está
// autorada en blanco, el resto con texto.
const DICCIONARIO_NUXQA2 = [
  { Key: 'cabinUpgradeForm.buttonText', Text: 'Compra ya' },
  { Key: 'cabinUpgradeForm.labels.pnr', Text: 'Código de reserva' },
  { Key: 'cabinUpgradeForm.labels.apellido', Text: 'Apellido' },
  { Key: 'cabinUpgradeForm.helper.apellido', Text: '' },
];

const sinLaLlaveDelHelper = () => DICCIONARIO_NUXQA2
  .filter((r) => r.Key !== 'cabinUpgradeForm.helper.apellido');

let CabinUpgradeForm;
let resetI18nCachesForTests;
let fetchAEMData;

// El módulo se importa UNA vez: `vi.resetModules()` entre casos desempareja la
// instancia de Preact de la de sus hooks y el render revienta con `__H`.
beforeAll(async () => {
  vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
  vi.doMock(langPath, () => ({ getStoredLanguage: vi.fn().mockReturnValue('es') }));
  ({ fetchAEMData } = await import(aemDataPath));
  ({ CabinUpgradeForm, resetI18nCachesForTests } = await import(
    '../../../design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js'
  ));
});

const mountConDiccionario = async (rows) => {
  resetI18nCachesForTests();
  fetchAEMData.mockResolvedValue({ data: rows });
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${CabinUpgradeForm} />`, container);
  // dejar resolver el efecto asíncrono que carga los labels y su re-render
  for (let i = 0; i < 5; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 0); });
  }
  return container;
};

describe('CabinUpgradeForm — el helper del apellido con la llave vacía', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('NO se ve cuando la llave está autorada en blanco', async () => {
    const c = await mountConDiccionario(DICCIONARIO_NUXQA2);

    expect(c.textContent).not.toContain(HELPER_TEXT);
    expect(c.textContent).not.toContain('Tal y como aparece');
  });

  it('el resto del formulario sigue pintando con sus textos autorados', async () => {
    const c = await mountConDiccionario(DICCIONARIO_NUXQA2);

    // Prueba de que el diccionario SÍ se aplicó: el helper vacío no es un falso
    // negativo por labels sin cargar.
    expect(c.textContent).toContain('Código de reserva');
    expect(c.textContent).toContain('Apellido');
    expect(c.textContent).toContain('Compra ya');
  });

  it('tampoco deja el nodo del helper vacío en el DOM', async () => {
    const c = await mountConDiccionario(DICCIONARIO_NUXQA2);
    const apellido = c.querySelector('#last-name');

    expect(apellido).toBeTruthy();
    expect(apellido.getAttribute('aria-describedby')).toBeFalsy();
  });

  it('SÍ se ve cuando la llave trae texto', async () => {
    const c = await mountConDiccionario([
      ...sinLaLlaveDelHelper(),
      { Key: 'cabinUpgradeForm.helper.apellido', Text: HELPER_TEXT },
    ]);

    expect(c.textContent).toContain(HELPER_TEXT);
  });

  it('se ve el texto que decida el autor, no el hardcodeado', async () => {
    const c = await mountConDiccionario([
      ...sinLaLlaveDelHelper(),
      { Key: 'cabinUpgradeForm.helper.apellido', Text: 'Como aparece en tu tiquete' },
    ]);

    expect(c.textContent).toContain('Como aparece en tu tiquete');
    expect(c.textContent).not.toContain(HELPER_TEXT);
  });

  it('si la llave NO existe en el diccionario, cae al fallback (retrocompatible)', async () => {
    const c = await mountConDiccionario(sinLaLlaveDelHelper());

    expect(c.textContent).toContain(HELPER_TEXT);
  });

  it('con diccionario vacío mantiene todos los fallbacks del código', async () => {
    const c = await mountConDiccionario([]);

    expect(c.textContent).toContain(HELPER_TEXT);
    expect(c.textContent).toContain('Solicitar ascenso');
  });
});
