// @vitest-environment happy-dom
import {
  describe, it, expect, beforeAll, afterEach,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);
let FullPageLoader;

// Ruta del asset del cóndor que también usa el bloque oficial cms-loader.
const CONDOR_ASSET = '/assets/loader/condor-loader.gif';

beforeAll(async () => {
  ({ FullPageLoader } = await import('../../design-system/molecules/full-page-loader/full-page-loader.js'));
});

const mount = (props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${FullPageLoader} isOpen=${true} ...${props} />`, container);
  return container;
};

describe('design-system · FullPageLoader — usa el asset del cóndor del producto', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('pinta el GIF del cóndor, el mismo asset que sirve el bloque cms-loader', () => {
    const img = mount().querySelector('[data-name="fullPageLoader"] img');

    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(CONDOR_ASSET);
  });

  it('ya no dibuja el cóndor como SVG inline', () => {
    const c = mount();

    // El trazo SVG animado era una aproximación mientras no se disponía del
    // asset oficial; ahora sobra.
    expect(c.querySelector('[data-name="fullPageLoader"] svg')).toBeNull();
  });

  it('lo dimensiona a 100px, igual que .cms-loader-image-wrapper', () => {
    const img = mount().querySelector('[data-name="fullPageLoader"] img');

    expect(img.className).toContain('w-[100px]');
    expect(img.className).toContain('h-auto');
  });

  it('lo carga con prioridad: está en el camino crítico cuando se muestra', () => {
    const img = mount().querySelector('[data-name="fullPageLoader"] img');

    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });

  it('es decorativo: el significado lo lleva el label, no la imagen', () => {
    const img = mount().querySelector('[data-name="fullPageLoader"] img');

    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
  });

  it('conserva el label y el rol de status para lectores de pantalla', () => {
    const c = mount({ label: 'Cargando...' });
    const root = c.querySelector('[data-name="fullPageLoader"]');

    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-live')).toBe('polite');
    expect(root.textContent).toContain('Cargando...');
  });

  it('respeta el label que llega por i18n', () => {
    const c = mount({ label: 'Loading...' });

    expect(c.textContent).toContain('Loading...');
  });

  it('no renderiza nada cerrado', () => {
    const c = mount({ isOpen: false });

    expect(c.querySelector('[data-name="fullPageLoader"]')).toBeNull();
  });
});

describe('design-system · FullPageLoader — el label se puede apagar desde el diccionario', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('con label vacío no pinta el párrafo: queda solo el cóndor', () => {
    const c = mount({ label: '' });

    // Vaciar `cabinUpgradeForm.loader.label` debe quitar el texto de verdad, no
    // dejar un <p> vacío ocupando sitio bajo el cóndor.
    expect(c.querySelector('[data-name="fullPageLoader"] p')).toBeNull();
    expect(c.querySelector('[data-name="fullPageLoader"] img')).toBeTruthy();
  });

  it('con label vacío el overlay sigue anunciándose a lectores de pantalla', () => {
    const root = mount({ label: '' }).querySelector('[data-name="fullPageLoader"]');

    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-live')).toBe('polite');
  });

  it('con label con texto sí pinta el párrafo', () => {
    const c = mount({ label: 'Cargando...' });

    expect(c.querySelector('[data-name="fullPageLoader"] p').textContent).toBe('Cargando...');
  });

  it('sin prop label usa el default del molecule (uso standalone)', () => {
    const c = mount();

    expect(c.querySelector('[data-name="fullPageLoader"] p').textContent).toBe('Cargando...');
  });
});
