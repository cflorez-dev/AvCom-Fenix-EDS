// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';

const aemPath = '../../scripts/aem.js';
const targetPath = '../../scripts/utils/target-filter.js';
const localePath = '../../scripts/utils/locale.js';
const amPath = '../../scripts/utils/airmarketing.js';
const lcsPath = '../../scripts/services/header/language-country-selector.js';

function mockDeps({
  show, language = 'es', country = 'co', baseUrl = 'https://am', apiKey = 'sb-guid',
}) {
  vi.doMock(aemPath, () => ({ readBlockConfig: () => ({ 'target-countries': '', 'target-languages': '' }) }));
  vi.doMock(targetPath, () => ({
    shouldShowByTargeting: vi.fn().mockReturnValue(show),
    hideBlockWithSection: vi.fn(),
  }));
  vi.doMock(localePath, () => ({
    resolveLocale: vi.fn().mockResolvedValue({ language, country }),
  }));
  vi.doMock(amPath, () => ({
    getAirMarketingConfig: vi.fn().mockResolvedValue({ baseUrl, searchbarApiKey: apiKey, destinationCardsApiKey: 'dc' }),
    loadAirMarketingEmbed: vi.fn(),
    preconnectAirMarketing: vi.fn(),
  }));
  vi.doMock(lcsPath, () => ({
    getIataCountryCode: (c) => (c === 'eu' ? 'es' : c),
  }));
}

describe('searchbar-embed decorate', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
  });

  it('hides the block and renders no widget when POS does not match', async () => {
    mockDeps({ show: false });
    const { hideBlockWithSection } = await import('../../scripts/utils/target-filter.js');
    const decorate = (await import('../../blocks/searchbar-embed/searchbar-embed.js')).default;
    const block = document.createElement('div');
    document.body.appendChild(block);
    await decorate(block);
    expect(hideBlockWithSection).toHaveBeenCalledWith(block);
    expect(block.querySelector('avianca-searchbar')).toBeNull();
  });

  it('renders avianca-searchbar with api-key, lang and pos when POS matches', async () => {
    mockDeps({
      show: true, language: 'en', country: 'us', apiKey: 'sb-guid',
    });
    const decorate = (await import('../../blocks/searchbar-embed/searchbar-embed.js')).default;
    const block = document.createElement('div');
    document.body.appendChild(block);
    await decorate(block);
    const el = block.querySelector('avianca-searchbar');
    expect(el).not.toBeNull();
    expect(el.getAttribute('api-key')).toBe('sb-guid');
    expect(el.getAttribute('lang')).toBe('en');
    expect(el.getAttribute('pos')).toBe('us');
  });

  it('loads the searchbar module from the configured base URL', async () => {
    mockDeps({ show: true, baseUrl: 'https://am' });
    const { loadAirMarketingEmbed } = await import('../../scripts/utils/airmarketing.js');
    const decorate = (await import('../../blocks/searchbar-embed/searchbar-embed.js')).default;
    const block = document.createElement('div');
    document.body.appendChild(block);
    await decorate(block);
    expect(loadAirMarketingEmbed).toHaveBeenCalledWith('https://am/embedded/searchbar.js');
  });

  it('maps internal POS country eu to es via getIataCountryCode', async () => {
    mockDeps({ show: true, country: 'eu' });
    const decorate = (await import('../../blocks/searchbar-embed/searchbar-embed.js')).default;
    const block = document.createElement('div');
    document.body.appendChild(block);
    await decorate(block);
    expect(block.querySelector('avianca-searchbar').getAttribute('pos')).toBe('es');
  });

  it('warns and hides when base URL or api-key is missing', async () => {
    mockDeps({ show: true, baseUrl: '', apiKey: '' });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { hideBlockWithSection } = await import('../../scripts/utils/target-filter.js');
    const decorate = (await import('../../blocks/searchbar-embed/searchbar-embed.js')).default;
    const block = document.createElement('div');
    document.body.appendChild(block);
    await decorate(block);
    expect(warnSpy).toHaveBeenCalled();
    expect(hideBlockWithSection).toHaveBeenCalledWith(block);
    expect(block.querySelector('avianca-searchbar')).toBeNull();
    warnSpy.mockRestore();
  });
});
