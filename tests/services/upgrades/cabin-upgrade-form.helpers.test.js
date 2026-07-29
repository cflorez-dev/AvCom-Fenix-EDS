// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { sanitizePnr, sanitizeLastName } from '../../../design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js';

describe('sanitizePnr', () => {
  it('mayúsculas, solo alfanumérico, máximo 6', () => {
    expect(sanitizePnr('ay-qq_qs99')).toBe('AYQQQS');
    expect(sanitizePnr('abc')).toBe('ABC');
    expect(sanitizePnr('a1b2c3d4')).toBe('A1B2C3');
  });
});

describe('sanitizeLastName', () => {
  it('permite letras, acentos, ñ/ü y espacios; quita el resto', () => {
    expect(sanitizeLastName('De la Peña3!')).toBe('De la Peña');
    expect(sanitizeLastName('Müller')).toBe('Müller');
  });
});
