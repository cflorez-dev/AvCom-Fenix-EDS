// @vitest-environment happy-dom
import {
  describe, it, expect, beforeAll, afterEach, vi,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);
const sanitizePath = '../../scripts/utils/sanitize.js';
let ModalAviancaLayout;

// sanitizeHTML falla cerrado sin DOMPurify (devuelve ''), así que se stubea
// como pass-through para poder afirmar sobre el contenido de la descripción.
beforeAll(async () => {
  vi.doMock(sanitizePath, () => ({
    sanitizeHTML: vi.fn((s) => String(s || '')),
    sanitizeSpreadProps: vi.fn((p) => p),
  }));
  ({ ModalAviancaLayout } = await import('../../design-system/molecules/modal/modal-avianca-layout.js'));
});

const LONG_DESCRIPTION = 'Lo sentimos, en el momento no está disponible el ascenso a Business Class '
  + 'para este vuelo. Si deseas, puedes intentar con otro vuelo que tengas programado';

const mount = (props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<${ModalAviancaLayout} isOpen=${true} title="Ascenso no disponible" ...${props} />`,
    container,
  );
  return container;
};

// El div de la descripción es el que lleva la clase base `leading-[27px]`.
const getDescription = (container) => container.querySelector('.leading-\\[27px\\]');

describe('design-system · ModalAviancaLayout — contrato de la descripción', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  // El default lo comparten cms-modal, geo-conflict-modal, members-modal y (desde la
  // reversión de 1299705, 2026-07-30) cabin-upgrade-form: ninguno pasa un
  // descriptionClassName propio, todos heredan este cap.
  it('mantiene el cap por default: los consumidores no cambian', () => {
    const desc = getDescription(mount({ description: LONG_DESCRIPTION }));

    expect(desc).toBeTruthy();
    expect(desc.className).toContain('max-h-[81px]');
    expect(desc.className).toContain('overflow-y-auto');
    expect(desc.className).toContain('pr-[20px]');
  });

  // Ningún consumidor actual pasa este override, pero el mecanismo se mantiene
  // disponible (p. ej. members-modal ya lo usó antes por su propio motivo).
  it('con descriptionClassName="" no capa la altura ni reserva gutter derecho', () => {
    const desc = getDescription(mount({
      description: LONG_DESCRIPTION,
      descriptionClassName: '',
    }));

    expect(desc.className).not.toMatch(/max-h-/);
    expect(desc.className).not.toMatch(/overflow-y-auto/);
    // `pr-[20px]` existe solo para dejar sitio a la barra de scroll; sin scroll
    // desplaza el texto 10px a la izquierda del centro.
    expect(desc.className).not.toMatch(/\bpr-\[/);
    expect(desc.className).toContain('text-center');
  });

  it('sigue respetando un descriptionClassName propio del consumidor', () => {
    const desc = getDescription(mount({
      description: LONG_DESCRIPTION,
      descriptionClassName: 'max-h-[200px] overflow-y-auto',
    }));

    expect(desc.className).toContain('max-h-[200px]');
    expect(desc.className).toContain('overflow-y-auto');
  });

  it('la card conserva su propio límite de viewport como red de seguridad', () => {
    const container = mount({ description: LONG_DESCRIPTION, descriptionClassName: '' });
    const card = container.querySelector('[data-name="modal"]').firstElementChild;

    // Ante un texto autorado enorme el scroll lo asume la card, no la descripción
    // sola, así que el botón queda alcanzable.
    expect(card.className).toContain('max-h-[90vh]');
    expect(card.className).toContain('overflow-auto');
  });

  it('renderiza la descripción autorada', () => {
    const desc = getDescription(mount({ description: LONG_DESCRIPTION }));

    expect(desc.textContent).toContain('no está disponible el ascenso a Business Class');
  });
});
