/* global globalThis */
import {
  describe, it, expect, beforeAll, vi,
} from 'vitest';

// `deriveCenit` es puro, pero vive en `session.service.js`, que importa
// (vía lm-script.loader → aem.js) un módulo que toca `window` en top-level y
// revienta la colección en Node. Mockeamos el loader para cortar esa cadena y
// damos window/document mínimos (mismo idiom que session.service.test.js), luego
// importamos dinámicamente (vi.doMock NO se hoista).
const servicePath = '../../../scripts/services/members/session.service.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';

let deriveCenit;

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
  // members-config: evita el fetch real (y su cadena async → unhandled rejection).
  vi.doMock('../../../scripts/services/members/members-config.js', () => ({
    loadMembersConfig: vi.fn().mockResolvedValue({ portalRoutes: ['/members'] }),
    getMembersConfigSync: vi.fn().mockReturnValue({ portalRoutes: ['/members'] }),
  }));
  ({ deriveCenit } = await import(servicePath));
});

describe('session.service · deriveCenit (mapeo tolerante Cenit, 1271692)', () => {
  describe('desde cenitStatus (eliteProgram.status.cenitStatus)', () => {
    it('ONE_MILLION → nivel 1 (acepta case/underscore)', () => {
      expect(deriveCenit({ cenitStatusRaw: 'ONE_MILLION' })).toEqual({ level: 1 });
      expect(deriveCenit({ cenitStatusRaw: 'one_million' })).toEqual({ level: 1 });
      expect(deriveCenit({ cenitStatusRaw: 'One Million' })).toEqual({ level: 1 });
    });
    it('TWO_MILLION → nivel 2', () => {
      expect(deriveCenit({ cenitStatusRaw: 'TWO_MILLION' })).toEqual({ level: 2 });
      expect(deriveCenit({ cenitStatusRaw: 'two-million' })).toEqual({ level: 2 });
    });
    it('valores numéricos "1"/"2" → nivel correspondiente', () => {
      expect(deriveCenit({ cenitStatusRaw: '1' })).toEqual({ level: 1 });
      expect(deriveCenit({ cenitStatusRaw: '2' })).toEqual({ level: 2 });
    });
    it('cenitStatus sin nivel reconocible ("NONE"/"0") → null', () => {
      expect(deriveCenit({ cenitStatusRaw: 'NONE' })).toEqual({ level: null });
      expect(deriveCenit({ cenitStatusRaw: '0' })).toEqual({ level: null });
    });
  });

  describe('desde la string tier (fuente del AC)', () => {
    it('"Gold Cenit One Million" → nivel 1', () => {
      expect(deriveCenit({ tierRaw: 'Gold Cenit One Million' })).toEqual({ level: 1 });
    });
    it('"Diamond Cenit Two Million" → nivel 2', () => {
      expect(deriveCenit({ tierRaw: 'Diamond Cenit Two Million' })).toEqual({ level: 2 });
    });
    it('"Magno Cenit One Million" → nivel 1', () => {
      expect(deriveCenit({ tierRaw: 'Magno Cenit One Million' })).toEqual({ level: 1 });
    });
    it('"Silver Cenit" sin nivel explícito → nivel 1 (base cenit)', () => {
      expect(deriveCenit({ tierRaw: 'Silver Cenit' })).toEqual({ level: 1 });
    });
    it('tier base sin cenit → null', () => {
      expect(deriveCenit({ tierRaw: 'Gold' })).toEqual({ level: null });
      expect(deriveCenit({ tierRaw: 'LifeMiles' })).toEqual({ level: null });
      expect(deriveCenit({ tierRaw: 'Diamond' })).toEqual({ level: null });
    });
  });

  describe('precedencia y bordes', () => {
    it('cenitStatus gana sobre tier cuando ambos traen dato', () => {
      expect(deriveCenit({ tierRaw: 'Gold Cenit One Million', cenitStatusRaw: 'TWO_MILLION' }))
        .toEqual({ level: 2 });
    });
    it('sin fuentes / null / undefined / vacío → null', () => {
      expect(deriveCenit()).toEqual({ level: null });
      expect(deriveCenit({})).toEqual({ level: null });
      expect(deriveCenit({ tierRaw: null, cenitStatusRaw: null })).toEqual({ level: null });
      expect(deriveCenit({ tierRaw: '', cenitStatusRaw: '' })).toEqual({ level: null });
    });
  });
});
