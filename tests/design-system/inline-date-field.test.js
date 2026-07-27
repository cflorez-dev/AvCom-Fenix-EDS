// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach,
} from 'vitest';
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import {
  InlineDateField,
  normalizeDateValue,
  composeDate,
  resolveFieldState,
} from '../../design-system/molecules/inline-date-field/inline-date-field.js';

const html = htm.bind(h);

const mount = (props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<${InlineDateField} ...${props} />`, container);
  return container.querySelector('[data-name="inline-date-field"]');
};

describe('inline-date-field · helpers puros', () => {
  it('normalizeDateValue acepta objeto y devuelve strings', () => {
    expect(normalizeDateValue({ day: 5, month: 6, year: 1990 }))
      .toEqual({ day: '5', month: '6', year: '1990' });
  });

  it('normalizeDateValue acepta ISO YYYY-MM-DD', () => {
    expect(normalizeDateValue('1990-06-05'))
      .toEqual({ day: '5', month: '6', year: '1990' });
  });

  it('normalizeDateValue con vacío/null → partes vacías', () => {
    expect(normalizeDateValue(null)).toEqual({ day: '', month: '', year: '' });
    expect(normalizeDateValue('')).toEqual({ day: '', month: '', year: '' });
    expect(normalizeDateValue({ day: '', month: null, year: undefined }))
      .toEqual({ day: '', month: '', year: '' });
  });

  it('composeDate compone el campo cambiado sin pisar el resto', () => {
    const current = { day: '1', month: '2', year: '2000' };
    expect(composeDate(current, 'month', 8)).toEqual({ day: '1', month: '8', year: '2000' });
    expect(composeDate(current, 'day', null)).toEqual({ day: '', month: '2', year: '2000' });
  });

  // Corregido contra el diseño Figma real (datePicker 1291:53013, variantes
  // 1291:53682 "Error global" / 1291:53731 "Error individual"): el error
  // GLOBAL tiñe la caja compartida, el label de grupo y el helper text — NO
  // el texto de cada segmento individual (en 1291:53682 día/mes/año se ven
  // en negro normal pese al error). Solo `fieldErrors[campo]` tiñe el
  // segmento puntual. `resolveFieldState` ahora solo depende de `fieldErrors`;
  // el error global se resuelve aparte, a nivel de caja, en el componente.
  it('resolveFieldState: solo el error individual pinta su propio segmento', () => {
    expect(resolveFieldState('year', { fieldErrors: { year: true } })).toBe('error');
    expect(resolveFieldState('day', { fieldErrors: { year: true } })).toBe('normal');
    expect(resolveFieldState('month', {})).toBe('normal');
  });
});

describe('inline-date-field · render', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renderiza 3 selects (Día | Mes | Año)', () => {
    const root = mount({ value: { day: '15', month: '6', year: '1990' } });
    expect(root).not.toBeNull();
    const selects = root.querySelectorAll('[data-name="select"]');
    expect(selects.length).toBe(3);
  });

  it('readonly deshabilita la interacción de los 3 selects', () => {
    const root = mount({ value: { day: '2', month: '1', year: '1985' }, readonly: true });
    const combos = root.querySelectorAll('[role="combobox"]');
    expect(combos.length).toBe(3);
    combos.forEach((c) => {
      expect(c.getAttribute('tabindex')).toBe('-1');
    });
  });

  it('helperText global se renderiza una sola vez', () => {
    const root = mount({
      value: { day: '', month: '', year: '' },
      error: true,
      helperText: 'Pendiente por completar',
    });
    const helpers = root.querySelectorAll('[data-name="inline-date-field-helper"]');
    expect(helpers.length).toBe(1);
    expect(helpers[0].textContent).toContain('Pendiente por completar');
  });
});
