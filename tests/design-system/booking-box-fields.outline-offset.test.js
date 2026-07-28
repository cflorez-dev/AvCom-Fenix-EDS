// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { resolveContainerClasses } from '../../design-system/molecules/date-range-picker/date-range-picker.js';
import { PassengerSelector } from '../../design-system/molecules/passenger-selector/passenger-selector.js';

const html = htm.bind(h);

// Los iconos del dropin piden rAF al montar y happy-dom no lo expone.
if (typeof window.requestAnimationFrame !== 'function') {
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
}

// El outline de 1px de los campos del booking box debe dibujarse HACIA ADENTRO
// (`outline-offset-[-1px]`). Con el offset por defecto (0) el trazo queda FUERA de la
// caja y el campo se ve 2px más alto y 2px más ancho de lo que mide su border-box.
//
// Eso producía el bug reportado en producción el 2026-07-24: al pasar de RT a OW el
// campo de fechas "cambiaba de alto" (57px visibles en RT contra 55px en OW). No era la
// altura del layout — los dos modos miden 55px — sino el contenedor del rango, que era
// el único que dejaba el outline por fuera. El input standalone (OW) ya lo tenía adentro
// desde el fix 1286625, igual que origin-destination-selector y el átomo input.
//
// Pasajeros arrastraba el mismo defecto (siempre 57px visibles, 2px más que
// Origen/Destino), solo que no salta al alternar el tipo de viaje y por eso nadie lo
// había reportado.
const INSET_OUTLINE = 'outline-offset-[-1px]';

describe('booking box · el outline de los campos se dibuja hacia adentro', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('DateRangePicker (contenedor del rango, RT)', () => {
    it('dibuja el outline hacia adentro en modo rango', () => {
      const classes = resolveContainerClasses(true, '');
      expect(classes).toContain('outline-1');
      expect(classes).toContain(INSET_OUTLINE);
    });

    it('no inyecta outline propio en modo single (OW): lo pone el DateInput standalone', () => {
      expect(resolveContainerClasses(false, 'mi-clase')).toBe('mi-clase');
      expect(resolveContainerClasses(false, '')).toBe('');
    });

    it('conserva las clases del consumidor junto al contenedor agrupado', () => {
      expect(resolveContainerClasses(true, 'w-full')).toContain('w-full');
    });
  });

  describe('PassengerSelector (trigger)', () => {
    it('dibuja el outline del trigger hacia adentro', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      render(html`<${PassengerSelector} />`, container);

      const trigger = container.querySelector('[data-name="passengerSelector"] > div');
      expect(trigger).toBeTruthy();
      expect(trigger.className).toContain('outline-1');
      expect(trigger.className).toContain(INSET_OUTLINE);

      // Los iconos del dropin animan en un microtask; desmontar y drenar la cola evita
      // que el trabajo pendiente estalle cuando vitest ya derribó el entorno.
      render(null, container);
      await new Promise((resolve) => { setTimeout(resolve, 0); });
    });
  });
});
