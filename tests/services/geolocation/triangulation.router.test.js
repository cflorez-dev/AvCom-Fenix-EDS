import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const apimModePath = '../../../scripts/services/apim/apim-mode.js';
const apimClientPath = '../../../scripts/services/apim/apim-client.service.js';
const proxyServicePath = '../../../scripts/services/geolocation/triangulation.proxy.service.js';
const servicePath = '../../../scripts/services/geolocation/triangulation.service.js';

const RAW_AIRPORTS = [
  {
    iataCityCode: 'BOG', iataCountryCode: 'CO', latitude: '4.701', longitude: '-74.146', name: 'Bogotá', country: 'Colombia', active: true,
  },
  {
    iataCityCode: 'MDE', iataCountryCode: 'CO', latitude: '6.164', longitude: '-75.423', name: 'Medellín', country: 'Colombia', active: true,
  },
];

const setupMocks = ({
  flag = false,
  directRaw = RAW_AIRPORTS,
  proxyRaw = RAW_AIRPORTS,
  directThrows = false,
} = {}) => {
  const isApimDirectMode = vi.fn().mockResolvedValue(flag);

  const consultaCombinabilidad = directThrows
    ? vi.fn().mockRejectedValue(new Error('APIM down'))
    : vi.fn().mockResolvedValue({ data: directRaw });
  const fetchAirportsRawProxy = vi.fn().mockResolvedValue(proxyRaw);

  vi.doMock(apimModePath, () => ({ isApimDirectMode }));
  vi.doMock(apimClientPath, () => ({ consultaCombinabilidad }));
  vi.doMock(proxyServicePath, () => ({ fetchAirportsRawProxy }));
  vi.doMock('../../../scripts/utils/aem-data.js', () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
  }));

  return { isApimDirectMode, consultaCombinabilidad, fetchAirportsRawProxy };
};

describe('triangulation.service > fetchAirportsCatalog (router)', () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('flag OFF → uses fetchAirportsRawProxy and does NOT call APIM', async () => {
    const { consultaCombinabilidad, fetchAirportsRawProxy } = setupMocks({ flag: false });
    const { fetchAirportsCatalog } = await import(servicePath);

    const airports = await fetchAirportsCatalog();

    expect(fetchAirportsRawProxy).toHaveBeenCalledWith({ language: 'es' });
    expect(consultaCombinabilidad).not.toHaveBeenCalled();
    expect(airports).toHaveLength(2);
    expect(airports[0].iataCityCode).toBe('BOG');
  });

  it('flag ON → uses consultaCombinabilidad (APIM direct), NOT proxy', async () => {
    const { consultaCombinabilidad, fetchAirportsRawProxy } = setupMocks({ flag: true });
    const { fetchAirportsCatalog } = await import(servicePath);

    const airports = await fetchAirportsCatalog();

    expect(consultaCombinabilidad).toHaveBeenCalledWith({
      idioma: 'es',
      codigoIataOrigen: '',
      codigoIataDestino: '',
    });
    expect(fetchAirportsRawProxy).not.toHaveBeenCalled();
    expect(airports).toHaveLength(2);
  });

  it('flag ON, APIM returns array directly (not wrapped)', async () => {
    setupMocks({ flag: true });
    // Override mock to return raw array (no .data wrapper)
    vi.doUnmock(apimClientPath);
    vi.doMock(apimClientPath, () => ({
      consultaCombinabilidad: vi.fn().mockResolvedValue(RAW_AIRPORTS),
    }));
    const { fetchAirportsCatalog } = await import(servicePath);

    const airports = await fetchAirportsCatalog();

    expect(airports).toHaveLength(2);
  });

  it('flag ON, APIM throws → returns null (graceful)', async () => {
    setupMocks({ flag: true, directThrows: true });
    const { fetchAirportsCatalog } = await import(servicePath);

    const airports = await fetchAirportsCatalog();

    expect(airports).toBeNull();
  });

  it('uses sessionStorage cache if present (independent of flag)', async () => {
    const cached = [{
      lat: 1, lng: 1, iataCityCode: 'AAA', iataCountryCode: 'CO', cityName: 'x', country: 'x',
    }];
    sessionStorage.setItem('airports-catalog', JSON.stringify(cached));
    const { consultaCombinabilidad, fetchAirportsRawProxy } = setupMocks({ flag: true });
    const { fetchAirportsCatalog } = await import(servicePath);

    const airports = await fetchAirportsCatalog();

    expect(consultaCombinabilidad).not.toHaveBeenCalled();
    expect(fetchAirportsRawProxy).not.toHaveBeenCalled();
    expect(airports).toEqual(cached);
  });

  it('force=true bypasses cache and re-fetches via the active path', async () => {
    sessionStorage.setItem('airports-catalog', JSON.stringify([{ lat: 0, lng: 0 }]));
    const { consultaCombinabilidad } = setupMocks({ flag: true });
    const { fetchAirportsCatalog } = await import(servicePath);

    const airports = await fetchAirportsCatalog({ force: true });

    expect(consultaCombinabilidad).toHaveBeenCalledTimes(1);
    expect(airports.length).toBeGreaterThan(1);
  });

  it('passes language through to the active path', async () => {
    const { consultaCombinabilidad } = setupMocks({ flag: true });
    const { fetchAirportsCatalog } = await import(servicePath);

    await fetchAirportsCatalog({ language: 'pt' });

    expect(consultaCombinabilidad).toHaveBeenCalledWith(
      expect.objectContaining({ idioma: 'pt' }),
    );
  });
});
