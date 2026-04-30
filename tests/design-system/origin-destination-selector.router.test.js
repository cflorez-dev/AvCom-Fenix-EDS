import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const apimModePath = '../../scripts/services/apim/apim-mode.js';
const apimClientPath = '../../scripts/services/apim/apim-client.service.js';
const proxyServicePath = '../../design-system/molecules/origin-destination-selector/origin-destination-selector.proxy.service.js';
const servicePath = '../../design-system/molecules/origin-destination-selector/origin-destination-selector.service.js';

const setupMocks = ({
  flag = false,
  apimResponse = [],
  proxyResponse = [],
} = {}) => {
  const isApimDirectMode = vi.fn().mockResolvedValue(flag);
  const consultaCombinabilidad = vi.fn().mockResolvedValue(apimResponse);
  const fetchCitiesProxy = vi.fn().mockResolvedValue(proxyResponse);

  vi.doMock(apimModePath, () => ({ isApimDirectMode }));
  vi.doMock(apimClientPath, () => ({ consultaCombinabilidad }));
  vi.doMock(proxyServicePath, () => ({ fetchCitiesProxy }));
  // The service imports getStoredLanguage / getStoredCountry / readUserOriginSelection
  // / fetchAEMData. Not exercised by fetchCities — minimal stubs below.
  vi.doMock('../../scripts/services/header/language-country-selector.js', () => ({
    getStoredLanguage: () => 'es',
    getStoredCountry: () => 'co',
  }));
  vi.doMock('../../scripts/utils/aem-data.js', () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
  }));
  vi.doMock('../../scripts/utils/event-constants.js', () => ({
    readUserOriginSelection: () => null,
  }));

  return { isApimDirectMode, consultaCombinabilidad, fetchCitiesProxy };
};

describe('origin-destination-selector.service > fetchCities (router)', () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('flag OFF → delegates to fetchCitiesProxy and does NOT call APIM', async () => {
    const proxyResponse = [{ iataCityCode: 'BOG' }, { iataCityCode: 'MDE' }];
    const { consultaCombinabilidad, fetchCitiesProxy } = setupMocks({
      flag: false,
      proxyResponse,
    });
    const { fetchCities } = await import(servicePath);

    const result = await fetchCities({ originCode: 'BOG', destinationCode: 'MAD' });

    expect(fetchCitiesProxy).toHaveBeenCalledWith({
      originCode: 'BOG',
      destinationCode: 'MAD',
      useCache: false,
    });
    expect(consultaCombinabilidad).not.toHaveBeenCalled();
    expect(result).toEqual(proxyResponse);
  });

  it('flag ON → calls consultaCombinabilidad with idioma + IATA codes; does NOT call proxy', async () => {
    const apimResponse = [{ iataCityCode: 'BOG' }];
    const { consultaCombinabilidad, fetchCitiesProxy } = setupMocks({
      flag: true,
      apimResponse,
    });
    const { fetchCities } = await import(servicePath);

    const result = await fetchCities({ originCode: 'BOG', destinationCode: 'MAD' });

    expect(consultaCombinabilidad).toHaveBeenCalledWith({
      idioma: 'es',
      codigoIataOrigen: 'BOG',
      codigoIataDestino: 'MAD',
    });
    expect(fetchCitiesProxy).not.toHaveBeenCalled();
    expect(result).toEqual(apimResponse);
  });

  it('flag ON, APIM returns array directly → returns array', async () => {
    setupMocks({ flag: true, apimResponse: [{ iataCityCode: 'BOG' }] });
    const { fetchCities } = await import(servicePath);

    const result = await fetchCities({ originCode: 'BOG' });

    expect(result).toEqual([{ iataCityCode: 'BOG' }]);
  });

  it('flag ON, APIM returns { data: [...] } shape → unwraps and returns the inner array', async () => {
    setupMocks({
      flag: true,
      apimResponse: { data: [{ iataCityCode: 'MDE' }] },
    });
    const { fetchCities } = await import(servicePath);

    const result = await fetchCities({ originCode: 'BOG' });

    expect(result).toEqual([{ iataCityCode: 'MDE' }]);
  });

  it('flag ON, APIM throws → falls back to expired sessionStorage cache when present', async () => {
    sessionStorage.setItem('avianca_cities_cache', JSON.stringify([{ iataCityCode: 'CACHED' }]));
    const { consultaCombinabilidad } = setupMocks({ flag: true });
    consultaCombinabilidad.mockRejectedValueOnce(new Error('APIM down'));
    const { fetchCities } = await import(servicePath);

    const result = await fetchCities({ originCode: 'BOG' });

    expect(result).toEqual([{ iataCityCode: 'CACHED' }]);
  });

  it('flag ON, APIM throws and no cache → returns empty array (no crash)', async () => {
    const { consultaCombinabilidad } = setupMocks({ flag: true });
    consultaCombinabilidad.mockRejectedValueOnce(new Error('APIM down'));
    const { fetchCities } = await import(servicePath);

    const result = await fetchCities({ originCode: 'BOG' });

    expect(result).toEqual([]);
  });

  it('flag ON with useCache=true and existing cache → returns cache without calling APIM', async () => {
    sessionStorage.setItem('avianca_cities_cache', JSON.stringify([{ iataCityCode: 'CACHED' }]));
    const { consultaCombinabilidad } = setupMocks({ flag: true });
    const { fetchCities } = await import(servicePath);

    const result = await fetchCities({ originCode: 'BOG', useCache: true });

    expect(consultaCombinabilidad).not.toHaveBeenCalled();
    expect(result).toEqual([{ iataCityCode: 'CACHED' }]);
  });

  it('flag ON with useCache=true and no cache → fetches and stores in cache', async () => {
    setupMocks({ flag: true, apimResponse: [{ iataCityCode: 'NEW' }] });
    const { fetchCities } = await import(servicePath);

    await fetchCities({ originCode: 'BOG', useCache: true });

    expect(JSON.parse(sessionStorage.getItem('avianca_cities_cache'))).toEqual([
      { iataCityCode: 'NEW' },
    ]);
  });

  it('passes useCache through to the proxy when flag is OFF', async () => {
    const { fetchCitiesProxy } = setupMocks({ flag: false });
    const { fetchCities } = await import(servicePath);

    await fetchCities({ originCode: 'BOG', useCache: true });

    expect(fetchCitiesProxy).toHaveBeenCalledWith(
      expect.objectContaining({ useCache: true }),
    );
  });
});
