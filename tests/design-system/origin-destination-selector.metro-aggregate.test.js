import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';

const servicePath = '../../design-system/molecules/origin-destination-selector/origin-destination-selector.service.js';

// Both helpers are pure, but importing the service module pulls in its
// top-level dependencies. Stub them so the import resolves; none are exercised
// by the functions under test.
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

// Real-shape rows from the live consultaCombinabilidad catalog.
const AEP = { iataCityCode: 'BUE', iataTerminal: 'AEP', name: 'Buenos Aires' };
const EZE = { iataCityCode: 'BUE', iataTerminal: 'EZE', name: 'Buenos Aires' };
const BUE = { iataCityCode: 'BUE', iataTerminal: 'BUE', name: 'Buenos Aires' };
const BOG = { iataCityCode: 'BOG', iataTerminal: 'BOG', name: 'Bogotá' };
const MDE = { iataCityCode: 'MDE', iataTerminal: 'MDE', name: 'Medellín' };
const PAR_CDG = { iataCityCode: 'PAR', iataTerminal: 'CDG', name: 'París' };
const PAR_ORY = { iataCityCode: 'PAR', iataTerminal: 'ORY', name: 'París' };
const SAO_GRU = { iataCityCode: 'SAO', iataTerminal: 'GRU', name: 'Sao Paulo' };
const SAO_CGH = { iataCityCode: 'SAO', iataTerminal: 'CGH', name: 'Sao Paulo' };

describe('promoteToMetroAggregate', () => {
  let promoteToMetroAggregate;
  let findDefaultOriginCity;

  beforeEach(async () => {
    vi.resetModules();
    mockDeps();
    const mod = await import(servicePath);
    promoteToMetroAggregate = mod.promoteToMetroAggregate;
    findDefaultOriginCity = mod.findDefaultOriginCity;
  });

  describe('Buenos Aires (PBI 1294884)', () => {
    // Catalog order is unreliable: the same query returned AEP/EZE/BUE on /es
    // and BUE/EZE/AEP on /en, so every case is asserted on both orders.
    const orders = [
      ['AEP, EZE, BUE', [AEP, EZE, BUE]],
      ['BUE, EZE, AEP', [BUE, EZE, AEP]],
    ];

    orders.forEach(([label, cities]) => {
      describe(`catalog order ${label}`, () => {
        const resolve = (code) => promoteToMetroAggregate(
          cities,
          findDefaultOriginCity(cities, code),
        );

        it('promotes a terminal code (EZE) to the metropolitan aggregate', () => {
          // This is the live case: the offers brief ships Buenos Aires as EZE.
          expect(resolve('EZE')).toEqual(BUE);
        });

        it('promotes the other terminal (AEP) too', () => {
          expect(resolve('AEP')).toEqual(BUE);
        });

        it('keeps the aggregate when the code already is BUE', () => {
          expect(resolve('BUE')).toEqual(BUE);
        });
      });
    });
  });

  describe('cities outside the allowlist are untouched', () => {
    it('does not promote Paris (CDG stays CDG)', () => {
      const paris = [PAR_CDG, PAR_ORY];
      expect(promoteToMetroAggregate(paris, PAR_CDG)).toEqual(PAR_CDG);
    });

    it('does not promote Sao Paulo (GRU stays GRU)', () => {
      const sao = [SAO_GRU, SAO_CGH];
      expect(promoteToMetroAggregate(sao, SAO_GRU)).toEqual(SAO_GRU);
    });

    it('leaves single-airport cities alone', () => {
      expect(promoteToMetroAggregate([BOG, MDE], BOG)).toEqual(BOG);
    });
  });

  describe('destination landing prefill (destinations.js resolution)', () => {
    // The landing reached from the destinations hub resolves the CF city code
    // with a plain first-match-by-city-code, then promotes. Verified live: the
    // Buenos Aires landing was prefilling "Buenos Aires (AEP)".
    const resolveLanding = (catalog, cityCode) => promoteToMetroAggregate(
      catalog,
      catalog.find((c) => String(c.iataCityCode || '').toUpperCase() === cityCode),
    );

    it('prefills the aggregate for a Buenos Aires landing whatever the catalog order', () => {
      expect(resolveLanding([AEP, BUE, EZE], 'BUE')).toEqual(BUE);
      expect(resolveLanding([EZE, AEP, BUE], 'BUE')).toEqual(BUE);
    });

    it('keeps the first-airport behaviour for every other metro', () => {
      expect(resolveLanding([PAR_ORY, PAR_CDG], 'PAR')).toEqual(PAR_ORY);
      expect(resolveLanding([SAO_CGH, SAO_GRU], 'SAO')).toEqual(SAO_CGH);
    });

    it('resolves single-airport cities unchanged', () => {
      expect(resolveLanding([BOG, MDE], 'MDE')).toEqual(MDE);
    });
  });

  describe('fail-safe guards (must never blank out a resolved value)', () => {
    it('returns the terminal row when the aggregate is absent from the pool', () => {
      // Backend stopped publishing BUE/BUE → keep Ezeiza rather than nothing.
      expect(promoteToMetroAggregate([AEP, EZE], EZE)).toEqual(EZE);
    });

    it('returns the match untouched for a non-array pool', () => {
      expect(promoteToMetroAggregate(null, EZE)).toEqual(EZE);
      expect(promoteToMetroAggregate(undefined, EZE)).toEqual(EZE);
    });

    it('propagates a null/undefined match without throwing', () => {
      expect(promoteToMetroAggregate([AEP, EZE, BUE], null)).toBeNull();
      expect(promoteToMetroAggregate([AEP, EZE, BUE], undefined)).toBeUndefined();
    });

    it('tolerates rows without a city code', () => {
      expect(promoteToMetroAggregate([{}], {})).toEqual({});
    });
  });
});

describe('applyMetroPriorityOrder', () => {
  let applyMetroPriorityOrder;

  beforeEach(async () => {
    vi.resetModules();
    mockDeps();
    applyMetroPriorityOrder = (await import(servicePath)).applyMetroPriorityOrder;
  });

  const terminals = (cities) => cities.map((city) => city.iataTerminal);

  it('orders Buenos Aires as BUE, EZE, AEP (PBI 1294884)', () => {
    expect(terminals(applyMetroPriorityOrder([AEP, EZE, BUE]))).toEqual(['BUE', 'EZE', 'AEP']);
  });

  it('produces the same order whatever the backend returned', () => {
    [[AEP, EZE, BUE], [BUE, EZE, AEP], [EZE, AEP, BUE], [AEP, BUE, EZE]].forEach((order) => {
      expect(terminals(applyMetroPriorityOrder(order))).toEqual(['BUE', 'EZE', 'AEP']);
    });
  });

  it('keeps every other city in its exact original position', () => {
    const catalog = [BOG, AEP, MDE, EZE, PAR_CDG, BUE, PAR_ORY];
    const result = applyMetroPriorityOrder(catalog);

    expect(terminals(result)).toEqual(['BOG', 'BUE', 'MDE', 'EZE', 'CDG', 'AEP', 'ORY']);
    // Non-BUE rows never move: they keep their index.
    expect(result[0]).toEqual(BOG);
    expect(result[2]).toEqual(MDE);
    expect(result[4]).toEqual(PAR_CDG);
    expect(result[6]).toEqual(PAR_ORY);
  });

  it('never adds, drops or duplicates options (the dropdown cannot end up empty)', () => {
    const catalog = [BOG, AEP, MDE, EZE, PAR_CDG, BUE, PAR_ORY, SAO_GRU];
    const result = applyMetroPriorityOrder(catalog);

    expect(result).toHaveLength(catalog.length);
    catalog.forEach((city) => expect(result).toContain(city));
    expect(new Set(result).size).toBe(catalog.length);
  });

  it('does not mutate the input array', () => {
    const catalog = [AEP, EZE, BUE];
    applyMetroPriorityOrder(catalog);
    expect(terminals(catalog)).toEqual(['AEP', 'EZE', 'BUE']);
  });

  it('leaves other multi-airport cities in backend order', () => {
    const catalog = [PAR_ORY, PAR_CDG, SAO_CGH, SAO_GRU];
    expect(terminals(applyMetroPriorityOrder(catalog))).toEqual(['ORY', 'CDG', 'CGH', 'GRU']);
  });

  it('handles a partial Buenos Aires catalog (only two of the three rows)', () => {
    expect(terminals(applyMetroPriorityOrder([AEP, EZE]))).toEqual(['EZE', 'AEP']);
    expect(terminals(applyMetroPriorityOrder([AEP, BUE]))).toEqual(['BUE', 'AEP']);
  });

  it('returns the input untouched for a single or absent Buenos Aires row', () => {
    const single = [BOG, EZE, MDE];
    expect(applyMetroPriorityOrder(single)).toBe(single);
  });

  it('guards against empty, null and malformed input', () => {
    expect(applyMetroPriorityOrder([])).toEqual([]);
    expect(applyMetroPriorityOrder(null)).toEqual([]);
    expect(applyMetroPriorityOrder(undefined)).toEqual([]);
    expect(applyMetroPriorityOrder([null, AEP, BUE])).toHaveLength(3);
  });
});
