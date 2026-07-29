import { describe, it, expect } from 'vitest';
import {
  formatDob, genderLabel, genderOptions, sectionComplete, incompleteSections,
  donutCompleteness, geoFirst, dismissKey,
} from '../../design-system/organisms/members-account-data/members-account-data.logic.js';

/**
 * Lógica del organism tab Datos (1279361): formato de fecha por idioma (AC),
 * completitud por sección (chips del banner), geo-first y dismiss key.
 */

const LABELS = {
  genderMale: 'Masculino',
  genderFemale: 'Femenino',
  genderOther: 'Otro',
  sectionPersonal: 'Datos personales',
  sectionContact: 'Información de contacto',
  sectionEmergency: 'Contacto de emergencia',
  panelDocuments: 'Documentos de viaje',
};

describe('members-account-data.logic · formatDob (formato Figma "Mes DD, YYYY")', () => {
  const parts = { day: 10, month: 4, year: 2025 };
  it('ES: "Abril 10, 2025"', () => {
    expect(formatDob(parts, 'es')).toBe('Abril 10, 2025');
  });
  it('EN: "April 10, 2025"', () => {
    expect(formatDob(parts, 'en')).toBe('April 10, 2025');
  });
  it('FR: "Avril 10, 2025"', () => {
    expect(formatDob(parts, 'fr')).toBe('Avril 10, 2025');
  });
  it('PT: "Abril 10, 2025"', () => {
    expect(formatDob(parts, 'pt')).toBe('Abril 10, 2025');
  });
  it('sin fecha → cadena vacía', () => {
    expect(formatDob(null, 'es')).toBe('');
  });
});

describe('members-account-data.logic · género', () => {
  it('genderLabel mapea M/F/otro; U → vacío', () => {
    expect(genderLabel('M', LABELS)).toBe('Masculino');
    expect(genderLabel('F', LABELS)).toBe('Femenino');
    expect(genderLabel('X', LABELS)).toBe('Otro');
    expect(genderLabel('U', LABELS)).toBe('');
  });
  it('genderOptions → 3 opciones', () => {
    expect(genderOptions(LABELS).map((o) => o.value)).toEqual(['M', 'F', 'O']);
  });
});

describe('members-account-data.logic · sectionComplete / incompleteSections', () => {
  const vm = {
    personal: {
      gender: 'F', country: 'col', city: 'Bogotá', addressLine: 'x',
    },
    contact: { email: 'a@b.com', prefix: '57', phone: '3001234567' },
    emergency: { name: '', prefix: '', phone: '' },
    documents: [{ type: 'P' }],
  };
  it('personal/contact/documents completos; emergency incompleto', () => {
    expect(sectionComplete('personal', vm)).toBe(true);
    expect(sectionComplete('contact', vm)).toBe(true);
    expect(sectionComplete('documents', vm)).toBe(true);
    expect(sectionComplete('emergency', vm)).toBe(false);
  });
  it('incompleteSections lista solo las que faltan (emergency)', () => {
    const inc = incompleteSections(vm, LABELS);
    expect(inc.map((s) => s.key)).toEqual(['emergency']);
    expect(inc[0].label).toBe('Contacto de emergencia');
  });
});

describe('members-account-data.logic · donutCompleteness', () => {
  it('presence con 2 de 8 vacíos → 75%, 2 pendientes', () => {
    const presence = {
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      nationality: false,
      email: true,
      phone: true,
      address: false,
      travelDocument: true,
    };
    const d = donutCompleteness(presence, {});
    expect(d.percent).toBe(75);
    expect(d.pending).toBe(2);
    expect(d.complete).toBe(false);
  });
  it('todos presentes → 100% complete', () => {
    const presence = {
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      nationality: true,
      email: true,
      phone: true,
      address: true,
      travelDocument: true,
    };
    expect(donutCompleteness(presence, {}).complete).toBe(true);
  });
});

describe('members-account-data.logic · geoFirst / dismissKey', () => {
  it('geoFirst mueve el país guardado al frente', () => {
    const opts = [{ value: 'arg' }, { value: 'col' }, { value: 'bra' }];
    expect(geoFirst(opts, 'col').map((o) => o.value)).toEqual(['col', 'arg', 'bra']);
  });
  it('geoFirst sin país guardado → orden intacto', () => {
    const opts = [{ value: 'arg' }, { value: 'col' }];
    expect(geoFirst(opts, '').map((o) => o.value)).toEqual(['arg', 'col']);
  });
  it('dismissKey incluye membershipNumber (por cuenta, SIN PII)', () => {
    expect(dismissKey('99999999901')).toBe('members.account.completeDismissed.99999999901');
    expect(dismissKey(null)).toBe('members.account.completeDismissed.anon');
  });
});
