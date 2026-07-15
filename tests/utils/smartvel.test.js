// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';

const aemDataPath = '../../scripts/utils/aem-data.js';

describe('getSmartvelApiKey', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns the trimmed AV_SMARTVEL_API_KEY value from environment.json', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({
        data: [
          { Key: 'AV_NAME_SITE', Text: 'avianca' },
          { Key: 'AV_SMARTVEL_API_KEY', Text: '  abc-123  ' },
        ],
      }),
    }));
    const { getSmartvelApiKey } = await import('../../scripts/utils/smartvel.js');
    expect(await getSmartvelApiKey()).toBe('abc-123');
  });

  it('returns empty string when the key is absent', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_NAME_SITE', Text: 'avianca' }] }),
    }));
    const { getSmartvelApiKey } = await import('../../scripts/utils/smartvel.js');
    expect(await getSmartvelApiKey()).toBe('');
  });

  it('caches the result and calls fetchAEMData only once', async () => {
    const fetchAEMData = vi.fn().mockResolvedValue({
      data: [{ Key: 'AV_SMARTVEL_API_KEY', Text: 'key' }],
    });
    vi.doMock(aemDataPath, () => ({ fetchAEMData }));
    const { getSmartvelApiKey } = await import('../../scripts/utils/smartvel.js');
    await getSmartvelApiKey();
    await getSmartvelApiKey();
    expect(fetchAEMData).toHaveBeenCalledTimes(1);
  });
});
