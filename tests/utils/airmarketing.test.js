// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';

const aemDataPath = '../../scripts/utils/aem-data.js';

function mockEnv(rows) {
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: rows }),
  }));
}

describe('airmarketing helper', () => {
  beforeEach(() => {
    vi.resetModules();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('reads base URL (without trailing slash) and both GUIDs from environment.json', async () => {
    mockEnv([
      { Key: 'AV_AIRMARKETING_EMBED_BASE', Text: '  https://landing-dev.aps-airmarketing.net/  ' },
      { Key: 'AV_SEARCHBAR_API_KEY', Text: ' sb-guid ' },
      { Key: 'AV_DESTINATION_CARDS_API_KEY', Text: 'dc-guid' },
    ]);
    const { getAirMarketingConfig } = await import('../../scripts/utils/airmarketing.js');
    const cfg = await getAirMarketingConfig();
    expect(cfg).toEqual({
      baseUrl: 'https://landing-dev.aps-airmarketing.net',
      searchbarApiKey: 'sb-guid',
      destinationCardsApiKey: 'dc-guid',
    });
  });

  it('returns empty strings for missing keys', async () => {
    mockEnv([{ Key: 'AV_NAME_SITE', Text: 'avianca' }]);
    const { getAirMarketingConfig } = await import('../../scripts/utils/airmarketing.js');
    const cfg = await getAirMarketingConfig();
    expect(cfg).toEqual({ baseUrl: '', searchbarApiKey: '', destinationCardsApiKey: '' });
  });

  it('caches config and calls fetchAEMData only once', async () => {
    const fetchAEMData = vi.fn().mockResolvedValue({ data: [{ Key: 'AV_SEARCHBAR_API_KEY', Text: 'x' }] });
    vi.doMock(aemDataPath, () => ({ fetchAEMData }));
    const { getAirMarketingConfig } = await import('../../scripts/utils/airmarketing.js');
    await getAirMarketingConfig();
    await getAirMarketingConfig();
    expect(fetchAEMData).toHaveBeenCalledTimes(1);
  });

  it('does not cache when all values are empty (transient empty fetch)', async () => {
    const fetchAEMData = vi.fn().mockResolvedValue({ data: [] });
    vi.doMock(aemDataPath, () => ({ fetchAEMData }));
    const { getAirMarketingConfig } = await import('../../scripts/utils/airmarketing.js');
    await getAirMarketingConfig();
    await getAirMarketingConfig();
    expect(fetchAEMData).toHaveBeenCalledTimes(2);
  });

  it('loadAirMarketingEmbed appends a module script once (idempotent)', async () => {
    const { loadAirMarketingEmbed } = await import('../../scripts/utils/airmarketing.js');
    const url = 'https://x/embedded/searchbar.js';
    loadAirMarketingEmbed(url);
    loadAirMarketingEmbed(url);
    const scripts = document.querySelectorAll(`script[src="${url}"]`);
    expect(scripts.length).toBe(1);
    expect(scripts[0].type).toBe('module');
  });

  it('preconnectAirMarketing appends a preconnect link once and no-ops on empty', async () => {
    const { preconnectAirMarketing } = await import('../../scripts/utils/airmarketing.js');
    preconnectAirMarketing('');
    expect(document.querySelectorAll('link[rel="preconnect"]').length).toBe(0);
    preconnectAirMarketing('https://x');
    preconnectAirMarketing('https://x');
    expect(document.querySelectorAll('link[rel="preconnect"][href="https://x"]').length).toBe(1);
  });
});
