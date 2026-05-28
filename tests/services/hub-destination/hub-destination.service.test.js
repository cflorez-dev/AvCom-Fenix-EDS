import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const servicePath = '../../../scripts/services/hub-destination/hub-destination.service.js';
const aemDataPath = '../../../scripts/utils/aem-data.js';

const jsonResponse = (body, overrides = {}) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: {
    get: () => 'application/json',
  },
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  ...overrides,
});

const createStorage = () => {
  const items = new Map();

  return {
    getItem: vi.fn((key) => (items.has(key) ? items.get(key) : null)),
    setItem: vi.fn((key, value) => {
      items.set(key, String(value));
    }),
    removeItem: vi.fn((key) => {
      items.delete(key);
    }),
    clear: vi.fn(() => {
      items.clear();
    }),
    key: vi.fn((index) => Array.from(items.keys())[index] || null),
    get length() {
      return items.size;
    },
  };
};

describe('hub-destination.service cache resilience', () => {
  let storage;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    vi.resetModules();
    storage = createStorage();
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: storage,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'fetch', {
      value: vi.fn(),
      configurable: true,
    });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({
        data: [
          { Key: 'AV_API_URL_CONTENT_FRAGMENTS', Text: 'https://graphql.example/api' },
          { Key: 'AV_NAME_SITE', Text: 'avianca' },
        ],
      }),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.sessionStorage;
    delete globalThis.fetch;
  });

  it('does not write sessionStorage when cache is disabled by default', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ data: [{ Origin: 'BOG' }] }));
    const { fetchHubDestinationsData } = await import(servicePath);

    const result = await fetchHubDestinationsData('destinationsbyorigin');

    expect(fetch).toHaveBeenCalledWith('/destinationsbyorigin.json');
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(result).toEqual({ data: [{ Origin: 'BOG' }] });
  });

  it('returns fetched data when sessionStorage quota is exceeded', async () => {
    const quotaError = new Error('The quota has been exceeded.');
    quotaError.name = 'QuotaExceededError';
    storage.setItem.mockImplementationOnce(() => {
      throw quotaError;
    });
    fetch.mockResolvedValueOnce(jsonResponse({ data: [{ Origin: 'BOG', Destination: 'MAD' }] }));
    const { fetchHubDestinationsData } = await import(servicePath);

    const result = await fetchHubDestinationsData('destinationsbyorigin', true);

    expect(result).toEqual({ data: [{ Origin: 'BOG', Destination: 'MAD' }] });
    expect(warnSpy).toHaveBeenCalledWith(
      '[hub-destination.service] Error saving destinationsbyorigin to cache:',
      quotaError,
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('uses valid cache and avoids the network when cache is enabled', async () => {
    storage.setItem(
      'avianca_hub_destinations_destinationsbyorigin',
      JSON.stringify({ data: [{ Origin: 'MDE' }] }),
    );
    const { fetchHubDestinationsData } = await import(servicePath);

    const result = await fetchHubDestinationsData('destinationsbyorigin', true);

    expect(fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ data: [{ Origin: 'MDE' }] });
  });

  it('ignores corrupt cache and fetches fresh data', async () => {
    storage.setItem('avianca_hub_destinations_destinationsbyorigin', '{not-json');
    fetch.mockResolvedValueOnce(jsonResponse({ data: [{ Origin: 'CLO' }] }));
    const { fetchHubDestinationsData } = await import(servicePath);

    const result = await fetchHubDestinationsData('destinationsbyorigin', true);

    expect(fetch).toHaveBeenCalledWith('/destinationsbyorigin.json');
    expect(result).toEqual({ data: [{ Origin: 'CLO' }] });
    expect(warnSpy).toHaveBeenCalledWith(
      '[hub-destination.service] Error reading destinationsbyorigin from cache:',
      expect.any(SyntaxError),
    );
  });

  it('keeps fetch errors graceful for destinations by origin', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}, {
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    }));
    const { fetchDestinationsByOrigin } = await import(servicePath);

    const result = await fetchDestinationsByOrigin();

    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith(
      '[hub-destination.service] Error fetching destinationsbyorigin:',
      expect.any(Error),
    );
  });

  it('returns GraphQL destinations even when cache write exceeds quota', async () => {
    const quotaError = new Error('The quota has been exceeded.');
    quotaError.name = 'QuotaExceededError';
    storage.setItem.mockImplementationOnce(() => {
      throw quotaError;
    });
    fetch.mockResolvedValueOnce(jsonResponse({
      data: {
        destinationList: {
          items: [{ iata: 'MAD' }],
        },
      },
    }));
    const { fetchAllDestinationsGraphQL } = await import(servicePath);

    const result = await fetchAllDestinationsGraphQL(true);

    expect(fetch).toHaveBeenCalledWith('https://graphql.example/api', expect.objectContaining({
      method: 'POST',
    }));
    expect(result).toEqual([{ iata: 'MAD' }]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[hub-destination.service] Error saving GraphQL data to cache:',
      quotaError,
    );
  });
});
