import htm from 'htm';
import { h, render } from '@dropins/tools/preact.js';
import { HubDestinations } from '../../design-system/templates/hub-destinations/hub-destinations.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { resolveLocale } from '../../scripts/utils/locale.js';
import { mapHubDestinationsData } from './hub-destinations.helper.js';

const html = htm.bind(h);

/**
 * Reads the selected-language cookie
 * @returns {string|null} Language code or null
 */
function getLanguageFromCookie() {
  try {
    const match = document.cookie.match(/selected-language=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]).toLowerCase().trim();
    }
  } catch (e) {
    // Cookie reading failed
  }
  return null;
}

/**
 * Decorates the Hub Destinations block
 * @param {Element} block The hub-destinations block element
 */
export default async function decorate(block) {
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    block.classList.add('hub-destinations-author-mode');

    const authorIndicator = document.createElement('div');
    authorIndicator.textContent = '🌎 Hub Destinations (Author Mode)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);

    return;
  }
  const container = document.createElement('div');

  // Priority: Cookie first, then URL, then default
  const cookieLanguage = getLanguageFromCookie();
  const locale = await resolveLocale();
  const language = cookieLanguage || locale.language || 'es';

  const config = await fetchAEMData(language);

  const i18n = Object.fromEntries(
    (config?.data || []).map(({ Key, Text }) => [Key, Text]),
  );
  
  const destinationsData = await mapHubDestinationsData(i18n);

  const origins = Array.isArray(destinationsData?.origins)
    ? destinationsData.origins
    : [];

  const defaultOriginCode = destinationsData?.defaultOriginCode
    || destinationsData?.mainCityCode
    || origins[0]?.code
    || '';

  // eslint-disable-next-line no-console
  console.log('[hub-destinations] mapped payload:', {
    originsCount: origins.length,
    defaultOriginCode,
    mainCityCode: destinationsData?.mainCityCode || '',
    firstOrigin: origins[0]?.code || null,
  });

  render(
    html`
      <${HubDestinations}
        origins=${origins}
        defaultOriginCode=${defaultOriginCode}
        i18n=${i18n}
        locale=${language}
      />
    `,
    container,
  );

  block.style.display = 'none';
  block.parentNode.insertBefore(container, block.nextSibling);
}
