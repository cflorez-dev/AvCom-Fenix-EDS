import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const aemDataPath = '../../../scripts/utils/aem-data.js';
const servicePath = '../../../scripts/services/apim/apim-mode.js';

const mockEnv = (rows) => {
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: rows }),
  }));
};

describe('apim-mode', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock(aemDataPath);
    vi.restoreAllMocks();
  });

  it('returns true when AV_APIM_DIRECT_MODE is "true"', async () => {
    mockEnv([{ Key: 'AV_APIM_DIRECT_MODE', Text: 'true' }]);
    const { isApimDirectMode } = await import(servicePath);

    expect(await isApimDirectMode()).toBe(true);
  });

  it('returns false when AV_APIM_DIRECT_MODE is "false"', async () => {
    mockEnv([{ Key: 'AV_APIM_DIRECT_MODE', Text: 'false' }]);
    const { isApimDirectMode } = await import(servicePath);

    expect(await isApimDirectMode()).toBe(false);
  });

  it('returns false when the flag is missing from environment', async () => {
    mockEnv([{ Key: 'OTHER_KEY', Text: 'something' }]);
    const { isApimDirectMode } = await import(servicePath);

    expect(await isApimDirectMode()).toBe(false);
  });

  it('returns false when fetchAEMData yields the empty fallback ({ data: [] })', async () => {
    mockEnv([]);
    const { isApimDirectMode } = await import(servicePath);

    expect(await isApimDirectMode()).toBe(false);
  });

  it('returns false when fetchAEMData returns no data field at all', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({}),
    }));
    const { isApimDirectMode } = await import(servicePath);

    expect(await isApimDirectMode()).toBe(false);
  });

  it('trims whitespace around Key and Text (defensive against AEM spreadsheet padding)', async () => {
    mockEnv([{ Key: '  AV_APIM_DIRECT_MODE  ', Text: '  true  ' }]);
    const { isApimDirectMode } = await import(servicePath);

    expect(await isApimDirectMode()).toBe(true);
  });

  it('treats non-"true" text as false (e.g. "TRUE", "1", "yes")', async () => {
    mockEnv([{ Key: 'AV_APIM_DIRECT_MODE', Text: 'TRUE' }]);
    const { isApimDirectMode } = await import(servicePath);

    expect(await isApimDirectMode()).toBe(false);
  });

  it('caches the result: second call does not re-read environment', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      data: [{ Key: 'AV_APIM_DIRECT_MODE', Text: 'true' }],
    });
    vi.doMock(aemDataPath, () => ({ fetchAEMData: fetchSpy }));
    const { isApimDirectMode } = await import(servicePath);

    await isApimDirectMode();
    await isApimDirectMode();
    await isApimDirectMode();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('resetApimModeCache forces re-read on next call', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      data: [{ Key: 'AV_APIM_DIRECT_MODE', Text: 'true' }],
    });
    vi.doMock(aemDataPath, () => ({ fetchAEMData: fetchSpy }));
    const { isApimDirectMode, resetApimModeCache } = await import(servicePath);

    await isApimDirectMode();
    resetApimModeCache();
    await isApimDirectMode();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
