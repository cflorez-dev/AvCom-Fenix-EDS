import { readBlockConfig } from '../../scripts/aem.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';
import { resolveLocale } from '../../scripts/utils/locale.js';
import { getAirMarketingConfig, loadAirMarketingEmbed, preconnectAirMarketing } from '../../scripts/utils/airmarketing.js';
import { getIataCountryCode } from '../../scripts/services/header/language-country-selector.js';

/**
 * Decorate the searchbar-embed block: render the AirMarketing <avianca-searchbar>
 * embedded widget, gated by POS targeting and localized by current language/country.
 * @param {Element} block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const targetCountries = config['target-countries'] || '';
  const targetLanguages = config['target-languages'] || '';

  if (!shouldShowByTargeting(targetCountries, targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  const [locale, amConfig] = await Promise.all([resolveLocale(), getAirMarketingConfig()]);
  const lang = locale?.language || 'es';
  const pos = locale?.country ? getIataCountryCode(locale.country) : 'co';

  const { baseUrl, searchbarApiKey } = amConfig;
  if (!baseUrl || !searchbarApiKey) {
    // eslint-disable-next-line no-console
    console.warn('[searchbar-embed] Missing AV_AIRMARKETING_EMBED_BASE or AV_SEARCHBAR_API_KEY in environment.json');
    hideBlockWithSection(block);
    return;
  }

  preconnectAirMarketing(baseUrl);

  block.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'searchbar-embed-container';

  const widget = document.createElement('avianca-searchbar');
  widget.setAttribute('api-key', searchbarApiKey);
  widget.setAttribute('lang', lang);
  widget.setAttribute('pos', pos);
  wrapper.appendChild(widget);
  block.appendChild(wrapper);

  loadAirMarketingEmbed(`${baseUrl}/embedded/searchbar.js`);
}
