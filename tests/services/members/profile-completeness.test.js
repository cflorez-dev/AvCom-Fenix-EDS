import { describe, it, expect } from 'vitest';
import {
  computeProfileCompleteness,
  completenessFromPresence,
  profileFieldPresence,
  extractProfileFields,
  DEFAULT_COMPLETENESS_FIELDS,
} from '../../../scripts/services/members/profile-completeness.js';

// Construye un raw `memberProfile` con el shape real del wrapper. `overrides`
// permite vaciar campos para simular perfiles incompletos.
const buildProfile = (ind = {}, contact = {}, documents = 1) => ({
  memberProfileDetails: {
    memberAccount: {
      memberProfile: {
        individualInfo: {
          givenName: 'NOMBRE',
          familyName: 'APELLIDO',
          dateOfBirth: '07-Mar-1992',
          memberNationality: '8010',
          preferredEmailAddress: 'user@example.com',
          preferredPhoneNumber: '+571234567',
          memberContactInfos: [{
            addressLine1: 'Calle 1',
            city: 'Bogotá',
            country: 'CO',
            emailAddress: 'user@example.com',
            phoneNumber: '+571234567',
            ...contact,
          }],
          ...ind,
        },
        document: Array.from({ length: documents }, (_, i) => ({ documentType: 'P', documentNumber: `D${i}` })),
      },
    },
  },
});

describe('members/profile-completeness', () => {
  it('perfil 100% lleno → complete=true, percent=100, sin missing', () => {
    const r = computeProfileCompleteness(buildProfile());
    expect(r.complete).toBe(true);
    expect(r.percent).toBe(100);
    expect(r.missing).toEqual([]);
    expect(r.total).toBe(DEFAULT_COMPLETENESS_FIELDS.length);
  });

  it('perfil sin dirección (caso real del socio de prueba) → incompleto en threshold 100', () => {
    const r = computeProfileCompleteness(
      buildProfile({}, { addressLine1: null, city: null, country: null }),
    );
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(['address']);
    expect(r.filled).toBe(DEFAULT_COMPLETENESS_FIELDS.length - 1);
    expect(r.percent).toBe(88); // 7/8 = 87.5 → 88
  });

  it('email cae a memberContactInfos cuando preferredEmailAddress está vacío', () => {
    const r = computeProfileCompleteness(
      buildProfile({ preferredEmailAddress: '' }, { emailAddress: 'fallback@x.com' }),
    );
    expect(r.missing).not.toContain('email');
  });

  it('sin documento de viaje → falta travelDocument', () => {
    const r = computeProfileCompleteness(buildProfile({}, {}, 0));
    expect(r.missing).toEqual(['travelDocument']);
  });

  it('CF override: lista de campos recortada (solo nombre+email) → ignora el resto', () => {
    const r = computeProfileCompleteness(
      buildProfile({}, { addressLine1: null, city: null, country: null }),
      { fields: ['firstName', 'email'] },
    );
    expect(r.total).toBe(2);
    expect(r.complete).toBe(true); // address no cuenta en esta regla
  });

  it('CF override: threshold más bajo → completo aun con un campo faltante', () => {
    const r = computeProfileCompleteness(
      buildProfile({}, { addressLine1: null, city: null, country: null }),
      { threshold: 80 },
    );
    expect(r.percent).toBe(88);
    expect(r.complete).toBe(true); // 88 >= 80
  });

  it('CF override: ids desconocidos se ignoran (defensivo)', () => {
    const r = computeProfileCompleteness(buildProfile(), { fields: ['firstName', 'noExisteEsteCampo'] });
    expect(r.total).toBe(1);
    expect(r.complete).toBe(true);
  });

  it('reglas REALES del CF autorado → el socio de prueba (sin dirección, con documento) da COMPLETO', () => {
    // CF autorado: fields = [firstName, lastName, email, phone, documentId], threshold 100.
    const cfRules = { fields: ['firstName', 'lastName', 'email', 'phone', 'documentId'], threshold: 100 };
    const r = computeProfileCompleteness(
      buildProfile({}, { addressLine1: null, city: null, country: null }), // sin dirección
      cfRules,
    );
    expect(r.total).toBe(5);
    expect(r.missing).toEqual([]); // dirección no cuenta en las reglas del CF
    expect(r.complete).toBe(true);
    expect(r.percent).toBe(100);
  });

  it('reglas del CF: sin documento → incompleto (falta documentId)', () => {
    const cfRules = { fields: ['firstName', 'lastName', 'email', 'phone', 'documentId'], threshold: 100 };
    const r = computeProfileCompleteness(buildProfile({}, {}, 0), cfRules);
    expect(r.missing).toEqual(['documentId']);
    expect(r.complete).toBe(false);
  });

  it('raw vacío/null → no rompe (0%, incompleto)', () => {
    expect(computeProfileCompleteness(null).complete).toBe(false);
    expect(computeProfileCompleteness({}).percent).toBe(0);
    expect(computeProfileCompleteness(undefined).missing).toContain('firstName');
  });

  it('extractProfileFields navega defensivo sin lanzar', () => {
    expect(() => extractProfileFields(null)).not.toThrow();
    expect(extractProfileFields({}).documentCount).toBe(0);
  });

  it('profileFieldPresence devuelve booleans por campo, SIN PII', () => {
    const presence = profileFieldPresence(
      buildProfile({}, { addressLine1: null, city: null, country: null }),
    );
    expect(presence.firstName).toBe(true);
    expect(presence.documentId).toBe(true);
    expect(presence.address).toBe(false);
    // todos los valores son booleanos (no hay strings/PII)
    expect(Object.values(presence).every((v) => typeof v === 'boolean')).toBe(true);
  });

  it('completenessFromPresence aplica las reglas del CF sobre el mapa de presencia', () => {
    const presence = {
      firstName: true, lastName: true, email: true, phone: true, documentId: true,
    };
    const r = completenessFromPresence(presence, {
      fields: ['firstName', 'lastName', 'email', 'phone', 'documentId'], threshold: 100,
    });
    expect(r.complete).toBe(true);
    expect(r.percent).toBe(100);
  });

  it('computeProfileCompleteness === presence + reglas (mismo resultado)', () => {
    const raw = buildProfile({}, { addressLine1: null, city: null, country: null });
    const rules = { fields: ['firstName', 'email', 'address'], threshold: 100 };
    expect(computeProfileCompleteness(raw, rules))
      .toEqual(completenessFromPresence(profileFieldPresence(raw), rules));
  });
});
