/* global globalThis */
import {
  describe, it, expect, beforeAll, vi,
} from 'vitest';

/**
 * frequent-flyer.service (1279361 · Paso 5): CRUD REAL de acompañantes vía
 * `lmFrequentFlyer`. Verifica bordes de edad EXACTOS (D34), orden alfabético del
 * get, `travelerCompanionCount` en add, país ORIGINAL + sin partnerMembershipNumber
 * en edit, remove ok, y mapeo de errores (E.EON.20 → max). SIEMPRE con wrapperFn mock.
 */

const servicePath = '../../../scripts/services/members/frequent-flyer.service.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';

let getCompanions;
let addCompanion;
let editCompanion;
let removeCompanion;
let computeAge;
let ageBand;

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
  ({
    getCompanions, addCompanion, editCompanion, removeCompanion, computeAge, ageBand,
  } = await import(servicePath));
});

const okResponse = (json) => new Response(JSON.stringify(json), { status: 200, headers: { 'Content-Type': 'application/json' } });
const PROFILE = {
  companyCode: 'LM', programCode: 'LMS', accountStatus: 'A', preferredLanguage: 'ES',
};

describe('frequent-flyer · bordes de edad (D34: Infante 0–2 · Niño 3–14 · Joven 15–17 · Adulto ≥18)', () => {
  const NOW = new Date('2026-07-17T12:00:00');
  const at = (yearsAgo) => {
    const p = { day: 17, month: 7, year: NOW.getFullYear() - yearsAgo };
    return ageBand(computeAge(p, NOW));
  };
  it('bordes exactos 2/3, 14/15, 17/18', () => {
    expect(at(2)).toBe('infant');
    expect(at(3)).toBe('child');
    expect(at(14)).toBe('child');
    expect(at(15)).toBe('young');
    expect(at(17)).toBe('young');
    expect(at(18)).toBe('adult');
    expect(at(0)).toBe('infant');
    expect(at(40)).toBe('adult');
  });
  it('cumpleaños aún no cumplido este año resta un año', () => {
    // Nació el 18-Jul-2008: al 17-Jul-2026 todavía tiene 17 (Joven), no 18.
    expect(ageBand(computeAge({ day: 18, month: 7, year: 2008 }, NOW))).toBe('young');
    // Un día después ya es adulto.
    expect(ageBand(computeAge({ day: 16, month: 7, year: 2008 }, NOW))).toBe('adult');
  });
});

describe('frequent-flyer · getCompanions', () => {
  it('mapea + ordena alfabéticamente por nombre completo', async () => {
    const wrapperFn = vi.fn().mockResolvedValue(okResponse({
      header: { code: '000' },
      frequentFlyers: [
        {
          nomineeReferenceNumber: '2', givenName: 'Zoe', familyName: 'Alvarez', dateOfBirth: '01-Jan-2000', country: '7710',
        },
        {
          nomineeReferenceNumber: '1', givenName: 'Ana', familyName: 'Beltran', dateOfBirth: '05-May-2015', partnerMembershipNumber: '55550001',
        },
      ],
    }));
    const res = await getCompanions(PROFILE, wrapperFn);
    expect(res.ok).toBe(true);
    expect(res.companions.map((c) => c.givenName)).toEqual(['Ana', 'Zoe']);
    expect(res.companions[0].lmNumber).toBe('55550001');
    // get manda action + companyCode/programCode
    expect(wrapperFn).toHaveBeenCalledWith('lmFrequentFlyer', { action: 'get', companyCode: 'LM', programCode: 'LMS' }, false);
  });

  it('wrapper string E.EON.* → { ok:false } (fail-soft, no lista vacía falsa)', async () => {
    const res = await getCompanions(PROFILE, vi.fn().mockResolvedValue('E.EON.6'));
    expect(res.ok).toBe(false);
    expect(res.error).toBe('generic');
  });

  it('sin wrapper → { ok:false, error:unavailable }', async () => {
    const res = await getCompanions(PROFILE, null);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('unavailable');
  });
});

describe('frequent-flyer · addCompanion', () => {
  it('manda travelerCompanionCount = largo actual (obligatorio)', async () => {
    const wrapperFn = vi.fn().mockResolvedValue(okResponse({ header: { code: '000' } }));
    const res = await addCompanion(PROFILE, {
      givenName: 'Luis', familyName: 'Pérez', gender: 'M', dateOfBirth: '10-Oct-1995', countryOfResidence: '7710',
    }, 2, wrapperFn);
    expect(res.ok).toBe(true);
    const [, params] = wrapperFn.mock.calls[0];
    expect(params.action).toBe('add');
    expect(params.travelerCompanionCount).toBe(2);
    expect(params.givenName).toBe('Luis');
  });

  it('alta por partnerMembershipNumber → omite el resto de campos', async () => {
    const wrapperFn = vi.fn().mockResolvedValue(okResponse({ header: { code: '000' } }));
    await addCompanion(PROFILE, { partnerMembershipNumber: '55550001' }, 0, wrapperFn);
    const [, params] = wrapperFn.mock.calls[0];
    expect(params.partnerMembershipNumber).toBe('55550001');
    expect(params.givenName).toBeUndefined();
    expect(params.travelerCompanionCount).toBe(0);
  });

  it('E.EON.20 → error:max', async () => {
    const wrapperFn = vi.fn().mockResolvedValue(okResponse({ header: { code: 'E.EON.20' } }));
    const res = await addCompanion(PROFILE, { givenName: 'X' }, 4, wrapperFn);
    expect(res).toEqual({ ok: false, error: 'max' });
  });
});

describe('frequent-flyer · editCompanion', () => {
  it('manda countryOfResidence ORIGINAL y NO manda partnerMembershipNumber', async () => {
    const wrapperFn = vi.fn().mockResolvedValue(okResponse({ header: { code: '000' } }));
    const companion = {
      nomineeReferenceNumber: '9', customerNumber: '77', accountGroupType: 'G', countryOfResidence: '7710', lmNumber: '55550001', givenName: 'Ana', familyName: 'Beltran',
    };
    const res = await editCompanion(PROFILE, companion, { givenName: 'Ana María' }, wrapperFn);
    expect(res.ok).toBe(true);
    const [, params] = wrapperFn.mock.calls[0];
    expect(params.action).toBe('edit');
    expect(params.countryOfResidence).toBe('7710'); // original
    expect(params.givenName).toBe('Ana María'); // cambio aplicado
    expect(params.nomineeReferenceNumber).toBe('9');
    expect('partnerMembershipNumber' in params).toBe(false); // nunca en edit
  });
});

describe('frequent-flyer · removeCompanion', () => {
  it('manda identificadores del get; code 000 → ok', async () => {
    const wrapperFn = vi.fn().mockResolvedValue(okResponse({ header: { code: '000' } }));
    const res = await removeCompanion(PROFILE, { nomineeReferenceNumber: '9', customerNumber: '77', accountGroupType: 'G' }, wrapperFn);
    expect(res.ok).toBe(true);
    const [, params] = wrapperFn.mock.calls[0];
    expect(params.action).toBe('remove');
    expect(params.nomineeReferenceNumber).toBe('9');
  });

  it('code distinto de 000 → error:generic', async () => {
    const wrapperFn = vi.fn().mockResolvedValue(okResponse({ header: { code: 'E.EON.99' } }));
    const res = await removeCompanion(PROFILE, { nomineeReferenceNumber: '9' }, wrapperFn);
    expect(res).toEqual({ ok: false, error: 'generic' });
  });
});
