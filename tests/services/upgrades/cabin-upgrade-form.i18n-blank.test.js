// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { pickI18nText } from '../../../design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js';

const HELPER_KEY = 'cabinUpgradeForm.helper.apellido';
const HELPER_FALLBACK = 'Tal y como aparece(n) en la reserva';

describe('pickI18nText — la llave vacía es intención del autor, no ausencia', () => {
  it('respeta una llave autorada en blanco en vez de caer al fallback', () => {
    // Caso real de /es.json: el autor vació la llave para apagar el helper y
    // seguía mostrándose el texto hardcodeado.
    const es = [{ Key: HELPER_KEY, Text: '' }];
    expect(pickI18nText([es], HELPER_KEY, HELPER_FALLBACK)).toBe('');
  });

  it('usa el fallback solo cuando la llave no existe en ningún catálogo', () => {
    const es = [{ Key: 'otra.llave', Text: 'algo' }];
    expect(pickI18nText([es], HELPER_KEY, HELPER_FALLBACK)).toBe(HELPER_FALLBACK);
    expect(pickI18nText([], HELPER_KEY, HELPER_FALLBACK)).toBe(HELPER_FALLBACK);
    expect(pickI18nText(null, HELPER_KEY, HELPER_FALLBACK)).toBe(HELPER_FALLBACK);
  });

  it('devuelve el texto autorado cuando la llave tiene contenido', () => {
    const es = [{ Key: HELPER_KEY, Text: 'Como aparece en tu tiquete' }];
    expect(pickI18nText([es], HELPER_KEY, HELPER_FALLBACK)).toBe('Como aparece en tu tiquete');
  });

  it('el idioma activo gana sobre el catálogo de respaldo', () => {
    const en = [{ Key: HELPER_KEY, Text: 'As it appears on the booking' }];
    const es = [{ Key: HELPER_KEY, Text: HELPER_FALLBACK }];
    expect(pickI18nText([en, es], HELPER_KEY, HELPER_FALLBACK)).toBe('As it appears on the booking');
  });

  it('un blanco en el idioma activo apaga el texto sin consultar el respaldo', () => {
    const en = [{ Key: HELPER_KEY, Text: '' }];
    const es = [{ Key: HELPER_KEY, Text: HELPER_FALLBACK }];
    expect(pickI18nText([en, es], HELPER_KEY, HELPER_FALLBACK)).toBe('');
  });

  it('si el idioma activo no trae la llave, la toma del respaldo', () => {
    const en = [{ Key: 'otra', Text: 'x' }];
    const es = [{ Key: HELPER_KEY, Text: HELPER_FALLBACK }];
    expect(pickI18nText([en, es], HELPER_KEY, HELPER_FALLBACK)).toBe(HELPER_FALLBACK);
  });

  it('ignora catálogos nulos y entradas con Text no-string', () => {
    const roto = [{ Key: HELPER_KEY, Text: null }, { Key: 'z' }];
    const es = [{ Key: HELPER_KEY, Text: HELPER_FALLBACK }];
    expect(pickI18nText([null, roto, es], HELPER_KEY, HELPER_FALLBACK)).toBe(HELPER_FALLBACK);
    expect(pickI18nText([undefined, null], HELPER_KEY, HELPER_FALLBACK)).toBe(HELPER_FALLBACK);
  });

  it('un texto de solo espacios se respeta tal cual (no se normaliza a vacío)', () => {
    const es = [{ Key: HELPER_KEY, Text: '   ' }];
    expect(pickI18nText([es], HELPER_KEY, HELPER_FALLBACK)).toBe('   ');
  });
});
