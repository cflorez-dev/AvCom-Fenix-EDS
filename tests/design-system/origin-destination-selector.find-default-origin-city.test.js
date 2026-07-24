import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';

const servicePath = '../../design-system/molecules/origin-destination-selector/origin-destination-selector.service.js';

// findDefaultOriginCity is a pure function, but importing the service module
// pulls in its top-level dependencies. Stub them so the import resolves; none
// are exercised by findDefaultOriginCity itself.
const mockDeps = () => {
  vi.doMock('../../scripts/services/header/language-country-selector.js', () => ({
    getStoredLanguage: () => 'es',
    getStoredCountry: () => 'ar',
  }));
  vi.doMock('../../scripts/utils/aem-data.js', () => ({ fetchAEMData: vi.fn() }));
  vi.doMock('../../scripts/utils/event-constants.js', () => ({ readUserOriginSelection: () => null }));
  vi.doMock('../../scripts/services/apim/apim-mode.js', () => ({ isApimDirectMode: vi.fn() }));
  vi.doMock('../../scripts/services/apim/apim-client.service.js', () => ({ consultaCombinabilidad: vi.fn() }));
  vi.doMock('../../design-system/molecules/origin-destination-selector/origin-destination-selector.proxy.service.js', () => ({ fetchCitiesProxy: vi.fn() }));
};

const loadFn = async () => (await import(servicePath)).findDefaultOriginCity;

// Real-shape rows from the production consultaCombinabilidad catalog for
// Buenos Aires. Deliberately ordered with the per-terminal rows BEFORE the
// metropolitan aggregate to reproduce the live array order (AEP idx 7,
// EZE idx 127, BUE aggregate idx 552).
const AEP = { iataCityCode: 'BUE', iataTerminal: 'AEP', name: 'Buenos Aires' };
const EZE = { iataCityCode: 'BUE', iataTerminal: 'EZE', name: 'Buenos Aires' };
const BUE = { iataCityCode: 'BUE', iataTerminal: 'BUE', name: 'Buenos Aires' };
const BOG = { iataCityCode: 'BOG', iataTerminal: 'BOG', name: 'Bogotá' };
const PAR_CDG = { iataCityCode: 'PAR', iataTerminal: 'CDG', name: 'París' };
const PAR_ORY = { iataCityCode: 'PAR', iataTerminal: 'ORY', name: 'París' };

describe('findDefaultOriginCity', () => {
  let findDefaultOriginCity;

  beforeEach(async () => {
    vi.resetModules();
    mockDeps();
    findDefaultOriginCity = await loadFn();
  });

  describe('multi-airport city WITH a metropolitan aggregate row (BUE)', () => {
    // The catalog lists AEP first, then EZE, then the BUE/BUE aggregate.
    const cities = [AEP, EZE, BUE];

    it('resolves ato=BUE to the BUE/BUE aggregate, not the first terminal row (AEP)', () => {
      // Regression: PBI 1216373 — ato=BUE was resolving to Aeroparque (AEP)
      // because .find() returned the first iataCityCode==='BUE' by array order.
      expect(findDefaultOriginCity(cities, 'BUE')).toEqual(BUE);
    });

    it('picks the aggregate regardless of backend array order', () => {
      // Same three rows shuffled — aggregate must still win.
      expect(findDefaultOriginCity([BUE, EZE, AEP], 'BUE')).toEqual(BUE);
      expect(findDefaultOriginCity([EZE, AEP, BUE], 'BUE')).toEqual(BUE);
    });

    it('pins a specific terminal when the author sets ato=EZE', () => {
      expect(findDefaultOriginCity(cities, 'EZE')).toEqual(EZE);
    });

    it('pins a specific terminal when the author sets ato=AEP', () => {
      expect(findDefaultOriginCity(cities, 'AEP')).toEqual(AEP);
    });
  });

  describe('multi-airport city WITHOUT an aggregate row (degenerate fallback)', () => {
    // No PAR/PAR row → ato=PAR must still resolve to a valid origin. This case
    // remains dependent on backend array order (unavoidable, inherently
    // ambiguous), so it documents rather than fixes that behavior.
    const paris = [PAR_CDG, PAR_ORY];

    it('falls back to the first city-code match', () => {
      expect(findDefaultOriginCity(paris, 'PAR')).toEqual(PAR_CDG);
    });

    it('still honors a terminal pin (ato=ORY)', () => {
      expect(findDefaultOriginCity(paris, 'ORY')).toEqual(PAR_ORY);
    });
  });

  describe('single-airport city', () => {
    it('resolves deterministically via the aggregate rule (terminal === city)', () => {
      expect(findDefaultOriginCity([BOG, AEP, EZE, BUE], 'BOG')).toEqual(BOG);
    });
  });

  describe('tolerance & guards', () => {
    it('resolves a terminal code stored in ato when no city-code matches', () => {
      // Author accidentally stored a terminal (CDG) as the POS ato.
      expect(findDefaultOriginCity([PAR_CDG], 'CDG')).toEqual(PAR_CDG);
    });

    it('returns null for a falsy ato', () => {
      expect(findDefaultOriginCity([BUE], '')).toBeNull();
      expect(findDefaultOriginCity([BUE], null)).toBeNull();
    });

    it('returns null for empty or non-array cities', () => {
      expect(findDefaultOriginCity([], 'BUE')).toBeNull();
      expect(findDefaultOriginCity(null, 'BUE')).toBeNull();
    });

    it('returns null when nothing matches', () => {
      expect(findDefaultOriginCity([BOG], 'BUE')).toBeNull();
    });
  });
});
