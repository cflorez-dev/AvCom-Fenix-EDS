/* global globalThis */
import {
  describe, it, expect, beforeAll, vi,
} from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * account-profile.service (1279361 · Paso 3): mapeo del wrapper `memberProfile`
 * al VM por secciones + presence (sin PII) + params de frequent-flyer. Fixture
 * FICTICIA con pasaporte CON expiración + ID SIN expiración (D23) y contacto de
 * emergencia poblado.
 */

const fullFx = JSON.parse(
  readFileSync(new URL('../../fixtures/members/account/member-profile-full.json', import.meta.url), 'utf8'),
);
const goldFx = JSON.parse(
  readFileSync(new URL('../../fixtures/members/elite/gold.json', import.meta.url), 'utf8'),
);

const servicePath = '../../../scripts/services/members/account-profile.service.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';

let loadAccountProfile;
let toAccountProfileVM;
let parseLmDate;

beforeAll(async () => {
  globalThis.window = globalThis.window || {
    location: { pathname: '/', href: 'http://localhost/', search: '' },
    history: {},
  };
  globalThis.document = globalThis.document || { cookie: '', documentElement: { lang: 'es' } };
  vi.doMock(loaderPath, () => ({
    loadLmScript: vi.fn().mockResolvedValue(undefined),
    whenLmReady: vi.fn().mockResolvedValue(undefined),
  }));
  ({ loadAccountProfile, toAccountProfileVM, parseLmDate } = await import(servicePath));
});

const makeResponse = (json) => new Response(JSON.stringify(json), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

describe('account-profile · parseLmDate', () => {
  it('DD-Mon-YYYY → {day,month,year}', () => {
    expect(parseLmDate('15-May-1990')).toEqual({ day: 15, month: 5, year: 1990 });
    expect(parseLmDate('07-Mar-1992')).toEqual({ day: 7, month: 3, year: 1992 });
  });
  it('ISO y vacío/inválido', () => {
    expect(parseLmDate('2030-08-20')).toEqual({ day: 20, month: 8, year: 2030 });
    expect(parseLmDate('')).toBeNull();
    expect(parseLmDate('no-fecha')).toBeNull();
  });
});

describe('account-profile · toAccountProfileVM (fixture completa)', () => {
  const vm = () => toAccountProfileVM(fullFx.memberProfile);

  it('personal: género, nombre completo, fecha, país, ciudad, dirección', () => {
    const p = vm().personal;
    expect(p.gender).toBe('F');
    expect(p.fullName).toBe('Ana García');
    expect(p.givenName).toBe('Ana');
    expect(p.familyName).toBe('García');
    expect(p.dateOfBirthParts).toEqual({ day: 15, month: 5, year: 1990 });
    expect(p.city).toBe('Bogotá');
    expect(p.addressLine).toBe('Calle Falsa 123');
  });

  it('contact: email/prefijo/teléfono + hadValue por campo (obligatoriedad dinámica)', () => {
    const c = vm().contact;
    expect(c.email).toBe('ana.garcia.ficticia@example.com');
    expect(c.prefix).toBe('57');
    expect(c.phone).toBe('3001234567');
    expect(c.hadValue).toEqual({ email: true, prefix: true, phone: true });
  });

  it('emergency: un solo campo de nombre (D33) + prefijo + teléfono', () => {
    const e = vm().emergency;
    expect(e.name).toBe('Pedro García');
    expect(e.prefix).toBe('57');
    expect(e.phone).toBe('3009998877');
  });

  it('documents: orden pasaporte → ID; expiración presente en pasaporte, null en ID (D23)', () => {
    const docs = vm().documents;
    expect(docs.map((d) => d.type)).toEqual(['P', 'I']);
    expect(docs[0].number).toBe('AV1234567');
    expect(docs[0].expiry).toBe('20-Aug-2030');
    expect(docs[0].expiryParts).toEqual({ day: 20, month: 8, year: 2030 });
    expect(docs[1].expiry).toBeNull();
  });

  it('profileParams: params para frequent-flyer', () => {
    const pp = vm().profileParams;
    expect(pp.companyCode).toBe('LM');
    expect(pp.programCode).toBe('LMS');
    expect(pp.accountStatus).toBe('A');
    expect(pp.preferredLanguage).toBe('ES');
    expect(pp.membershipNumber).toBe('99999999901');
  });

  it('presence: mapa de booleans SIN PII', () => {
    const pr = vm().presence;
    expect(pr.firstName).toBe(true);
    expect(pr.email).toBe(true);
    // El presence solo contiene booleans (ningún valor string de PII).
    Object.values(pr).forEach((v) => expect(typeof v).toBe('boolean'));
  });
});

describe('account-profile · toAccountProfileVM (contrato real gold: campos vacíos)', () => {
  it('gold.json: contacto sin dirección/teléfono → hadValue false; emergencyContact [] → vacío', () => {
    const vm = toAccountProfileVM(goldFx.memberProfile);
    expect(vm.contact.hadValue.phone).toBe(false);
    expect(vm.contact.hadValue.email).toBe(true); // gold sí trae email
    expect(vm.emergency.name).toBe('');
    // gold trae 1 documento de identidad sin expiración
    expect(vm.documents[0].type).toBe('I');
    expect(vm.documents[0].expiry).toBeNull();
  });
});

describe('account-profile · loadAccountProfile (best-effort)', () => {
  it('wrapperFn con Response → VM ok', async () => {
    const wrapperFn = vi.fn().mockResolvedValue(makeResponse(fullFx.memberProfile));
    const vm = await loadAccountProfile(wrapperFn);
    expect(vm.ok).toBe(true);
    expect(vm.personal.fullName).toBe('Ana García');
    expect(wrapperFn).toHaveBeenCalledWith('memberProfile', {}, false);
  });

  it('wrapper devuelve string E.EON.* (no Response) → { ok:false } (fail-soft)', async () => {
    const wrapperFn = vi.fn().mockResolvedValue('E.EON.6');
    const vm = await loadAccountProfile(wrapperFn);
    expect(vm.ok).toBe(false);
  });

  it('sin wrapper disponible → { ok:false }', async () => {
    const vm = await loadAccountProfile(null);
    expect(vm.ok).toBe(false);
  });
});
