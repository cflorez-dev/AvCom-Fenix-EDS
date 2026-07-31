// @vitest-environment happy-dom
import {
  describe, it, expect, beforeAll, afterEach,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

let Modal;

beforeAll(async () => {
  ({ Modal } = await import('../../design-system/molecules/modal/modal.js'));
});

// El lock corre en un useEffect: preact lo agenda async (varios ticks, no uno
// solo — un único `setTimeout(0)` no alcanza a que corra antes del assert),
// así que hay que ceder el hilo repetidas veces antes de leer el DOM.
const flush = async (veces = 6) => {
  for (let i = 0; i < veces; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 0); });
  }
};

const mount = async (props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${Modal} ...${props}>Content<//>`, container);
  await flush();
  return container;
};

const unmount = async (container) => {
  render(null, container);
  await flush();
  container.remove();
};

describe('design-system · Modal — scroll lock (1299705, regresión del padding-right redundante)', () => {
  afterEach(() => {
    document.documentElement.classList.remove('overflow-hidden');
    document.body.classList.remove('overflow-hidden');
    document.documentElement.style.paddingRight = '';
    document.body.style.paddingRight = '';
  });

  it('bloquea html y body al abrir', async () => {
    const container = await mount({ isOpen: true, onClose: () => {} });

    expect(document.documentElement.classList.contains('overflow-hidden')).toBe(true);
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    await unmount(container);
  });

  // `html` ya trae `scrollbar-gutter: stable` sitewide (styles.css) para el jitter
  // del header/megamenú. Agregar un padding-right calculado en JS por encima de esa
  // reserva la duplica: encoge el contenido un ancho de scrollbar extra mientras el
  // modal está abierto, y lo devuelve de golpe (el salto visible del bug) al cerrar.
  // El fix quita el padding-right; este test evita que alguien lo reintroduzca.
  it('no agrega padding-right manual — scrollbar-gutter ya reserva el espacio', async () => {
    const container = await mount({ isOpen: true, onClose: () => {} });

    expect(document.documentElement.style.paddingRight).toBe('');
    expect(document.body.style.paddingRight).toBe('');

    await unmount(container);
  });

  it('desbloquea html y body al desmontar', async () => {
    const container = await mount({ isOpen: true, onClose: () => {} });
    await unmount(container);

    expect(document.documentElement.classList.contains('overflow-hidden')).toBe(false);
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
    expect(document.documentElement.style.paddingRight).toBe('');
  });

  it('no bloquea nada si isOpen nunca fue true', async () => {
    const container = await mount({ isOpen: false, onClose: () => {} });

    expect(document.documentElement.classList.contains('overflow-hidden')).toBe(false);
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);

    await unmount(container);
  });
});

describe('design-system · Modal — sin overflow-auto redundante en el wrapper de children (1299705)', () => {
  // El wrapper de children (childrenContainerClasses) quedaba exactamente al
  // borde de su propio contenido (la card auto-crece para calzar justo), así
  // que CUALQUIER recálculo de layout — como el que dispara el pseudo-selector
  // `:active` de un botón al presionarlo — podía dejar un redondeo de
  // sub-píxel de Chromium (~1px) que lo hacía pasar de "cabe exacto" a
  // "desborda", destapando un scrollbar por una fracción de segundo. La card
  // (el padre) ya trae su propio `overflow-auto` con ~90vh de margen — ese es
  // el que debe absorber un desborde real, no este wrapper interno sin margen.
  it('la card conserva su overflow-auto, pero el wrapper de children no repite la clase', async () => {
    const container = await mount({ isOpen: true, onClose: () => {} });

    const card = container.querySelector('[data-name="modal"]').firstElementChild;
    const childrenWrapper = Array.from(card.querySelectorAll('div'))
      .find((el) => el.textContent.trim() === 'Content');

    expect(card.className).toContain('overflow-auto');
    expect(childrenWrapper).toBeTruthy();
    expect(childrenWrapper.className).not.toMatch(/overflow-auto/);

    await unmount(container);
  });
});
