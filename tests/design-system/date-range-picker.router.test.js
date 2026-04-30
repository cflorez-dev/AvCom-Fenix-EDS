import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const apimModePath = '../../scripts/services/apim/apim-mode.js';
const apimClientPath = '../../scripts/services/apim/apim-client.service.js';
const proxyServicePath = '../../design-system/molecules/date-range-picker/date-range-picker.proxy.service.js';
const servicePath = '../../design-system/molecules/date-range-picker/date-range-picker.service.js';

const setupMocks = ({
  flag = false,
  directOutbound = vi.fn().mockResolvedValue({}),
  directOneWay = vi.fn().mockResolvedValue({}),
  proxyOutbound = vi.fn().mockResolvedValue({}),
  proxyOneWay = vi.fn().mockResolvedValue({}),
} = {}) => {
  const isApimDirectMode = vi.fn().mockResolvedValue(flag);

  vi.doMock(apimModePath, () => ({ isApimDirectMode }));
  vi.doMock(apimClientPath, () => ({
    getCheapestPrices: directOneWay,
    getCheapestPricesOutbound: directOutbound,
  }));
  vi.doMock(proxyServicePath, () => ({
    getCheapestPricesProxy: proxyOneWay,
    getCheapestPricesOutboundProxy: proxyOutbound,
  }));
  vi.doMock('../../scripts/services/header/language-country-selector.js', () => ({
    getStoredLanguage: () => 'es',
    getStoredCountry: () => 'CO',
  }));
  vi.doMock('../../scripts/utils/aem-data.js', () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
  }));

  return {
    isApimDirectMode, directOneWay, directOutbound, proxyOneWay, proxyOutbound,
  };
};

const baseParams = {
  origin: 'BOG',
  destination: 'MAD',
  year: 2026,
  month: 5, // 0-11
};

describe('date-range-picker.service > getCheapestPrices (router)', () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws on missing required params (origin/destination/year/month)', async () => {
    setupMocks({ flag: true });
    const { getCheapestPrices } = await import(servicePath);

    await expect(getCheapestPrices({})).rejects.toThrow(/Missing required/);
  });

  it('flag OFF → delegates to getCheapestPricesProxy', async () => {
    const proxyOneWay = vi.fn().mockResolvedValue({ '2026-06-01': { price: 100 } });
    const { directOneWay } = setupMocks({ flag: false, proxyOneWay });
    const { getCheapestPrices } = await import(servicePath);

    const result = await getCheapestPrices({ ...baseParams, tripType: 'RT' });

    expect(proxyOneWay).toHaveBeenCalledWith({ ...baseParams, tripType: 'RT' });
    expect(directOneWay).not.toHaveBeenCalled();
    expect(result).toEqual({ '2026-06-01': { price: 100 } });
  });

  it('flag ON → calls APIM direct getCheapestPrices with shape: tripType, originCityCode, etc.', async () => {
    const apimResponse = {
      data: {
        journeyPrices: [{
          daysPrices: [
            { date: '2026-06-15T00:00:00', price: 450 },
            { date: '2026-06-16T00:00:00', price: 500 },
          ],
        }],
      },
    };
    const directOneWay = vi.fn().mockResolvedValue(apimResponse);
    const { proxyOneWay } = setupMocks({ flag: true, directOneWay });
    const { getCheapestPrices } = await import(servicePath);

    const result = await getCheapestPrices({ ...baseParams, tripType: 'RT' });

    expect(directOneWay).toHaveBeenCalledWith({
      tripType: 'RT',
      originCityCode: 'BOG',
      destinationCityCode: 'MAD',
      pos: 'CO',
      month: 6, // 5+1, the API expects 1-12
      year: 2026,
    });
    expect(proxyOneWay).not.toHaveBeenCalled();
    expect(result).toEqual({
      '2026-06-15': { date: '2026-06-15T00:00:00', price: 450 },
      '2026-06-16': { date: '2026-06-16T00:00:00', price: 500 },
    });
  });

  it('flag ON, APIM returns empty daysPrices → returns {}', async () => {
    const directOneWay = vi.fn().mockResolvedValue({
      data: { journeyPrices: [{ daysPrices: [] }] },
    });
    setupMocks({ flag: true, directOneWay });
    const { getCheapestPrices } = await import(servicePath);

    expect(await getCheapestPrices(baseParams)).toEqual({});
  });

  it('flag ON, APIM throws → returns {} (graceful)', async () => {
    const directOneWay = vi.fn().mockRejectedValue(new Error('APIM down'));
    setupMocks({ flag: true, directOneWay });
    const { getCheapestPrices } = await import(servicePath);

    expect(await getCheapestPrices(baseParams)).toEqual({});
  });

  it('flag ON caches the normalized response in sessionStorage', async () => {
    const apimResponse = {
      data: { journeyPrices: [{ daysPrices: [{ date: '2026-06-15', price: 450 }] }] },
    };
    const directOneWay = vi.fn().mockResolvedValue(apimResponse);
    setupMocks({ flag: true, directOneWay });
    const { getCheapestPrices } = await import(servicePath);

    await getCheapestPrices({ ...baseParams, tripType: 'RT' });

    const entry = JSON.parse(
      sessionStorage.getItem('avianca_pricing_RT_BOG_MAD_2026_5'),
    );
    expect(entry.data['2026-06-15']).toEqual({ date: '2026-06-15', price: 450 });
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  it('flag ON returns cache hit without calling APIM', async () => {
    sessionStorage.setItem('avianca_pricing_RT_BOG_MAD_2026_5', JSON.stringify({
      data: { '2026-06-15': { price: 999 } },
      timestamp: Date.now(),
    }));
    const { directOneWay } = setupMocks({ flag: true });
    const { getCheapestPrices } = await import(servicePath);

    const result = await getCheapestPrices({ ...baseParams, tripType: 'RT' });

    expect(directOneWay).not.toHaveBeenCalled();
    expect(result).toEqual({ '2026-06-15': { price: 999 } });
  });
});

describe('date-range-picker.service > getCheapestPricesOutbound (router)', () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws on missing required params (incl. outboundDate)', async () => {
    setupMocks({ flag: true });
    const { getCheapestPricesOutbound } = await import(servicePath);

    await expect(getCheapestPricesOutbound({ ...baseParams })).rejects.toThrow(/outboundDate/);
  });

  it('flag OFF → delegates to getCheapestPricesOutboundProxy', async () => {
    const proxyOutbound = vi.fn().mockResolvedValue({ '2026-06-20': { price: 200 } });
    setupMocks({ flag: false, proxyOutbound });
    const { getCheapestPricesOutbound } = await import(servicePath);

    const result = await getCheapestPricesOutbound({
      ...baseParams,
      outboundDate: '2026-06-15',
    });

    expect(proxyOutbound).toHaveBeenCalledWith({
      ...baseParams,
      outboundDate: '2026-06-15',
    });
    expect(result).toEqual({ '2026-06-20': { price: 200 } });
  });

  it('flag ON → calls APIM direct with formatted outboundDate (YYYYMMDD)', async () => {
    const directOutbound = vi.fn().mockResolvedValue({
      journeyPrices: [{ daysPrices: [{ date: '2026-06-20', price: 300 }] }],
    });
    setupMocks({ flag: true, directOutbound });
    const { getCheapestPricesOutbound } = await import(servicePath);

    await getCheapestPricesOutbound({
      ...baseParams,
      outboundDate: '2026-06-15',
    });

    expect(directOutbound).toHaveBeenCalledWith({
      tripType: 'RT',
      originCityCode: 'BOG',
      destinationCityCode: 'MAD',
      pos: 'CO',
      month: 6,
      year: 2026,
      outboundDate: '20260615', // formatted to compact YYYYMMDD
    });
  });

  it('flag ON, APIM returns journeyPrices[0].daysPrices at top level (native APIM shape) → normalizes', async () => {
    // APIM returns the same shape with or without OutboundDate: { journeyPrices: [{ daysPrices }] }
    const directOutbound = vi.fn().mockResolvedValue({
      journeyPrices: [{ daysPrices: [{ date: '2026-06-20', price: 300 }] }],
    });
    setupMocks({ flag: true, directOutbound });
    const { getCheapestPricesOutbound } = await import(servicePath);

    const result = await getCheapestPricesOutbound({
      ...baseParams,
      outboundDate: '2026-06-15',
    });

    expect(result).toEqual({ '2026-06-20': { date: '2026-06-20', price: 300 } });
  });

  it('flag ON, APIM throws → returns {} (graceful)', async () => {
    const directOutbound = vi.fn().mockRejectedValue(new Error('APIM down'));
    setupMocks({ flag: true, directOutbound });
    const { getCheapestPricesOutbound } = await import(servicePath);

    expect(
      await getCheapestPricesOutbound({ ...baseParams, outboundDate: '2026-06-15' }),
    ).toEqual({});
  });
});
