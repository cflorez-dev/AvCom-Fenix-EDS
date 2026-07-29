import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';

const helperPath = '../../blocks/cms-promotional-cards-rail/cms-promotional-cards-rail-helper.js';

const mockDeps = () => {
  vi.doMock('../../scripts/services/header/language-country-selector.js', () => ({
    getStoredCurrency: () => 'cop',
  }));
  vi.doMock('../../scripts/utils/aem-data.js', () => ({ fetchAEMData: vi.fn() }));
};

// Rows exactly as they come from the live `iata.json`: the metropolitan entry
// carries an empty `codigo_iata_ciudad`, terminals point at their city.
const IATA_CATALOG = [
  {
    pais: 'AR', codigo_iata: 'EZE', codigo_iata_ciudad: 'BUE', ciudad: 'Buenos Aires',
  },
  {
    pais: 'AR', codigo_iata: 'AEP', codigo_iata_ciudad: 'BUE', ciudad: 'Buenos Aires',
  },
  {
    pais: 'AR', codigo_iata: 'BUE', codigo_iata_ciudad: '', ciudad: 'Buenos Aires',
  },
  {
    pais: 'CO', codigo_iata: 'BOG', codigo_iata_ciudad: '', ciudad: 'Bogotá',
  },
  {
    pais: 'CO', codigo_iata: 'MDE', codigo_iata_ciudad: '', ciudad: 'Medellín',
  },
];

const offer = (origin, destination, price) => ({
  Origin: origin,
  Destination: destination,
  'price|cop': String(price),
  'Text2|es-ES': 'Por trayecto desde',
});

// Argentinian offers are keyed by terminal in the live brief.
const AR_OFFERS = [
  offer('AEP', 'BOG', 900000),
  offer('AEP', 'MDE', 800000),
  offer('AEP', 'BGA', 950000),
  offer('EZE', 'MIA', 990000),
];
const CO_OFFERS = [
  offer('BOG', 'CTG', 89980),
  offer('BOG', 'CCS', 674530),
  offer('BOG', 'VLN', 675140),
  offer('BOG', 'MIA', 1200000),
];

describe('resolveCityEquivalentCodes', () => {
  let resolveCityEquivalentCodes;

  beforeEach(async () => {
    vi.resetModules();
    mockDeps();
    resolveCityEquivalentCodes = (await import(helperPath)).resolveCityEquivalentCodes;
  });

  it('maps the metropolitan code to all its terminals', () => {
    expect(resolveCityEquivalentCodes(IATA_CATALOG, 'BUE').sort())
      .toEqual(['AEP', 'BUE', 'EZE']);
  });

  it('maps a terminal to its city and sibling terminals', () => {
    expect(resolveCityEquivalentCodes(IATA_CATALOG, 'AEP').sort())
      .toEqual(['AEP', 'BUE', 'EZE']);
    expect(resolveCityEquivalentCodes(IATA_CATALOG, 'EZE').sort())
      .toEqual(['AEP', 'BUE', 'EZE']);
  });

  it('returns only the code itself for a single-airport city', () => {
    expect(resolveCityEquivalentCodes(IATA_CATALOG, 'BOG')).toEqual(['BOG']);
  });

  it('normalizes casing and whitespace', () => {
    expect(resolveCityEquivalentCodes(IATA_CATALOG, ' aep ').sort())
      .toEqual(['AEP', 'BUE', 'EZE']);
  });

  it('returns the code alone when it is absent from the catalog', () => {
    expect(resolveCityEquivalentCodes(IATA_CATALOG, 'XXX')).toEqual(['XXX']);
  });

  it('guards against a missing or empty catalog and a falsy code', () => {
    expect(resolveCityEquivalentCodes(null, 'BUE')).toEqual([]);
    expect(resolveCityEquivalentCodes([], 'BUE')).toEqual([]);
    expect(resolveCityEquivalentCodes(IATA_CATALOG, '')).toEqual([]);
    expect(resolveCityEquivalentCodes(IATA_CATALOG, null)).toEqual([]);
  });
});

describe('filterOfertasByConfig — metropolitan origin fallback', () => {
  let filterOfertasByConfig;
  let resolveCityEquivalentCodes;

  beforeEach(async () => {
    vi.resetModules();
    mockDeps();
    const mod = await import(helperPath);
    filterOfertasByConfig = mod.filterOfertasByConfig;
    resolveCityEquivalentCodes = mod.resolveCityEquivalentCodes;
  });

  const withCatalog = (code) => ({
    equivalentOriginCodes: resolveCityEquivalentCodes(IATA_CATALOG, code),
  });

  it('renders the Argentinian offers when the origin preloads BUE but the brief keys AEP', () => {
    // Regression: with the exact match only, POS=ar returned 0 cards.
    const result = filterOfertasByConfig(AR_OFFERS, 'BUE', withCatalog('BUE'));

    expect(result).toHaveLength(3);
    expect(result.map((o) => o.Destination)).toEqual(['MDE', 'BOG', 'BGA']);
  });

  it('keeps sorting by lowest price across the equivalent terminals', () => {
    const result = filterOfertasByConfig(AR_OFFERS, 'BUE', withCatalog('BUE'));
    const prices = result.map((o) => Number(o['price|cop']));

    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('works in the reverse direction (origin AEP, offers keyed BUE)', () => {
    const briefKeyedByCity = [offer('BUE', 'BOG', 900000), offer('BUE', 'MDE', 800000)];
    const result = filterOfertasByConfig(briefKeyedByCity, 'AEP', withCatalog('AEP'));

    expect(result.map((o) => o.Destination)).toEqual(['MDE', 'BOG']);
  });

  it('does NOT alter a result that already has exact matches', () => {
    const mixed = [...CO_OFFERS, ...AR_OFFERS];
    const exactOnly = filterOfertasByConfig(mixed, 'BOG');
    const withFallback = filterOfertasByConfig(mixed, 'BOG', withCatalog('BOG'));

    expect(withFallback).toEqual(exactOnly);
    expect(withFallback.every((o) => o.Origin === 'BOG')).toBe(true);
  });

  it('never mixes cities: an exact match wins over the equivalences', () => {
    const mixed = [offer('BUE', 'MIA', 100), ...AR_OFFERS];
    const result = filterOfertasByConfig(mixed, 'BUE', withCatalog('BUE'));

    expect(result).toEqual([mixed[0]]);
  });

  it('keeps the previous behavior when no equivalences are supplied', () => {
    expect(filterOfertasByConfig(AR_OFFERS, 'BUE')).toEqual([]);
    expect(filterOfertasByConfig(AR_OFFERS, 'BUE', {})).toEqual([]);
  });

  it('returns [] for an unknown origin instead of falling back to everything', () => {
    expect(filterOfertasByConfig(CO_OFFERS, 'BUE', withCatalog('BUE'))).toEqual([]);
  });

  it('guards against malformed input', () => {
    expect(filterOfertasByConfig(null, 'BUE', withCatalog('BUE'))).toEqual([]);
    expect(filterOfertasByConfig(AR_OFFERS, '', withCatalog('BUE'))).toEqual([]);
    expect(filterOfertasByConfig(AR_OFFERS, 'BUE', { equivalentOriginCodes: [null, ''] })).toEqual([]);
  });
});
