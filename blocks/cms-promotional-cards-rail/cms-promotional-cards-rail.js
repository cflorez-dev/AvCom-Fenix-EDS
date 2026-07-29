import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import {
  CITY_FROM_ORIGIN_DROPDOWN_EVENT,
  getLastOriginDropdownCity,
  dispatchSetBookingDestinationEvent,
} from '../../scripts/utils/event-constants.js';
import { ArrowRightIcon } from '../../design-system/atoms/icons/arrow-right-icon.js';
import { LinkButton } from '../../design-system/atoms/link-button/link-button.js';
import { PromotionCard } from '../../design-system/organisms/cards/promotion-card/promotion-card.js';
import { getStoredCurrency, getStoredLanguage, getMainCityForCurrentPos } from '../../scripts/services/header/language-country-selector.js';
import {
  extractCmsPromotionalCardsRailProps,
  buildIataImageUrl,
  filterOfertasByConfig,
  buildOffersLandingUrl,
} from './cms-promotional-cards-rail-helper.js';
import { getStoredCountry } from '../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

let briefofertasCache = null;
let iataCache = null;
let i18Cache = null;

/**
 * Gets currency code from 'selected-currency' cookie
 * @returns {string} Currency code in lowercase (e.g.: 'cop', 'usd', 'mxn')
 */
function getCurrencyFromCookie() {
  try {
    const currencyCode = getStoredCurrency();
    if (currencyCode) {
      return currencyCode.toLowerCase();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error reading selected-currency cookie:', error);
  }
  return 'cop'; // Default currency
}

/**
 * Maps language code to column format used in offers file
 * @param {string} languageCode - Language code ('es', 'en', 'pt', 'fr')
 * @returns {string} Column format (e.g.: 'es-ES', 'en-US', 'pt-BR', 'fr-FR')
 */
function getColumnLocale(languageCode) {
  const localeMap = {
    es: 'es-ES',
    en: 'en-US',
    pt: 'pt-BR',
    fr: 'fr-FR',
  };

  return localeMap[languageCode] || 'es-ES';
}

/**
 * Formats a number as price with thousands separators
 * @param {string|number} price - Price to format (e.g.: '58000' or 58000)
 * @returns {string} Formatted price (e.g.: '58.000')
 */
function formatPrice(price) {
  if (!price) return '';

  const numericPrice = String(price).replace(/\D/g, '');
  const number = parseInt(numericPrice, 10);

  if (Number.isNaN(number)) return price;

  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Gets localized city name from IATA code
 * @param {string} iataCode - IATA code (e.g., 'MDE', 'CLO')
 * @param {string} language - Language code ('es', 'en', 'fr', 'pt')
 * @returns {string} Localized city name or code if not found
 */
function getCityNameFromIata(iataCode, language = 'es') {
  if (!iataCode || !iataCache) return iataCode;

  const cityData = iataCache.find(
    (item) => item.codigo_iata?.toUpperCase() === iataCode.toUpperCase(),
  );

  if (!cityData) return iataCode;

  const columnMap = {
    es: 'ciudad',
    en: 'ciudad_en',
    fr: 'ciudad_fr',
    pt: 'ciudad_pt',
  };
  const column = columnMap[language] || 'ciudad';
  return (cityData[column] || cityData.ciudad || iataCode).trim();
}

/**
 * Converts text to a URL-safe slug
 * @param {string} text - Text to slugify
 * @returns {string} URL-safe slug
 */
function slugify(text) {
  if (!text) return '';
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Builds a destination page URL from IATA code and language
 * @param {string} iataCode - Destination IATA code
 * @param {string} language - Language code ('es', 'en', 'fr', 'pt')
 * @returns {string} Destination URL (e.g., '/fr/destinations/que-faire-a-barranquilla')
 */
function buildDestinationUrl(iataCode, language) {
  const urlPreSlugData = i18Cache?.find((item) => item.Key === 'hubDestinations.urlPreSlug');
  const urlPreSlug = urlPreSlugData?.Text;
  if (!urlPreSlug || !iataCode) return '#';

  const cityName = getCityNameFromIata(iataCode, language);
  const citySlug = slugify(cityName);
  if (!citySlug) return '#';

  return `/${language}/${urlPreSlug}-${citySlug}`;
}

/**
 * Maps offer data to PromotionCard props
 * @param {Object} oferta - Offer data
 * @param {Object} blockConfig - Block configuration
 * @returns {Promise<Object>} Props for PromotionCard
 */
async function mapOfertaToCardProps(oferta, blockConfig) {
  const {
    imageBasePath,
    imageFormat,
    lifemilesChipVariant,
    discountChipVariant,
  } = blockConfig;

  const language = getStoredLanguage() || 'es';
  const columnLocale = getColumnLocale(language);

  // Get currency from cookie (cop, usd, mxn, pen, clp, eur, gbp, cad, brl, ars)
  const currencyCode = getCurrencyFromCookie();

  // Build price column key dynamically: price|{currency}
  const priceColumnKey = `price|${currencyCode}`;

  // Get price from column corresponding to selected currency
  const rawPrice = oferta[priceColumnKey] || oferta.price || '';

  // Get comparative price from SecondCurrency column in the offer
  let comparativeCurrency = '';
  let comparativePrice = '';

  const secondCurrency = oferta.SecondCurrency;
  if (secondCurrency && secondCurrency.trim() !== '') {
    const comparativePriceColumnKey = `price|${secondCurrency.toLowerCase()}`;
    const rawComparativePrice = oferta[comparativePriceColumnKey];

    if (rawComparativePrice) {
      comparativeCurrency = secondCurrency.toUpperCase();
      comparativePrice = formatPrice(rawComparativePrice);
    }
  }

  const destinationCode = oferta.Destination || '';
  const cityName = getCityNameFromIata(destinationCode, language);
  const destinationUrl = buildDestinationUrl(destinationCode, language);
  const labelKey = `Text2|${columnLocale}`;
  const label = oferta[labelKey] || oferta['Text2|es-ES'];
  const discountKey = `Text1|${columnLocale}`;
  const discount = oferta[discountKey] || oferta['Text1|es-ES'] || '';
  const earnMiles = oferta.EarnMiles === '1';
  const lifemilesTagData = i18Cache?.find((item) => item.Key === 'mainPromoCards.labels.lifemilesTag');
  const lifemilesTagText = lifemilesTagData?.Text;

  return {
    image: await buildIataImageUrl(destinationCode, imageBasePath, imageFormat),
    imageAlt: cityName,
    destination: cityName,
    label,
    discountChip: discount,
    discountChipVariant: discountChipVariant === 'discount-light' ? 'white' : 'discount',
    currency: currencyCode.toUpperCase(),
    price: formatPrice(rawPrice),
    comparativeCurrency,
    comparativePrice,
    showLifemilesChip: earnMiles,
    lifemilesTag: lifemilesTagText,
    lifemilesTagVariant: lifemilesChipVariant === 'dark' ? 'dark' : 'lifemiles',
    destinationUrl,
    destinationCode,
  };
}

/**
 * Renders promotion cards
 * @param {Element} container - Container where to render
 * @param {Array} ofertas - Array of offers to render
 * @param {Object} blockConfig - Block configuration
 */
async function renderCards(container, ofertas, blockConfig) {
  container.innerHTML = '';

  if (!ofertas || ofertas.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-500">No hay ofertas disponibles para este origen</p>';
    return;
  }

  const cardPromises = ofertas.map(async (oferta) => {
    const cardWrapper = document.createElement('li');
    cardWrapper.className = 'flex-1';

    const cardProps = await mapOfertaToCardProps(oferta, blockConfig);

    render(
      html`
        <${PromotionCard}
          ...${cardProps}
          loading="lazy"
          onClick=${() => {
    dispatchSetBookingDestinationEvent({
      iataCode: cardProps.destinationCode,
      cityName: cardProps.destination,
    });
  }}
        />
      `,
      cardWrapper,
    );

    return cardWrapper;
  });

  const cardWrappers = await Promise.all(cardPromises);
  cardWrappers.forEach((cardWrapper) => container.appendChild(cardWrapper));
}

/**
 * Renders author mode (Universal Editor)
 * @param {Element} block - Block in author mode
 */
function renderAuthorMode(block) {
  block.classList.add('cms-promotional-cards-rail-author-mode');

  const authorIndicator = document.createElement('div');
  authorIndicator.className = 'cms-promotional-cards-rail-author-indicator';
  authorIndicator.textContent = '🎴 CMS Promotional Cards Rail (Author Mode - Edit below)';
  authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
  block.insertBefore(authorIndicator, block.firstChild);
}

/**
 * Initializes data caches
 */
async function initializeDataCaches() {
  const language = getStoredLanguage() || 'es';

  if (!briefofertasCache) {
    const briefofertasData = await fetchAEMData('briefofertas');
    briefofertasCache = briefofertasData?.data || [];
  }

  if (!iataCache) {
    const iataData = await fetchAEMData('iata');
    iataCache = iataData?.data || [];
  }

  if (!i18Cache) {
    const i18Data = await fetchAEMData(`${language}`);
    i18Cache = i18Data?.data || [];
  }
}

/**
 * Sets up origin change listener
 * @param {Element} container - Cards container
 * @param {Object} currentOrigin - Current origin (modified by reference)
 * @param {Object} blockConfig - Block configuration
 */
function setupOriginChangeListener(container, currentOrigin, blockConfig) {
  window.addEventListener(CITY_FROM_ORIGIN_DROPDOWN_EVENT, async (event) => {
    const { originIataCode, originName } = event.detail || {};

    if (originIataCode) {
      currentOrigin.originIataCode = originIataCode;
      currentOrigin.originName = originName;

      const newOfertas = filterOfertasByConfig(briefofertasCache, originIataCode);
      await renderCards(container, newOfertas, blockConfig);
    }
  });
}

/**
 * Decorates the CMS Promotional Cards Rail block
 * @param {Element} block The cms-promotional-cards-rail block element
 */
export default async function decorate(block) {
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    renderAuthorMode(block);
    return;
  }

  // Extract block configuration
  const blockConfig = extractCmsPromotionalCardsRailProps(block);
  const { buttonText, buttonUrl, showButton } = blockConfig;

  // Initialize data caches
  await initializeDataCaches();

  // PBI CU-190 CA2 — Link "Descubrir más ofertas" dinámico:
  // /{idioma}-{pos}/{slug}, donde slug viene del spreadsheet i18n del idioma
  // activo (key `offers.landingSlug`). Si falta cualquier parte, se cae al
  // buttonUrl autorado en AEM (no rompe autorías existentes).
  const landingSlug = i18Cache?.find((item) => item.Key === 'offers.landingSlug')?.Text;
  const dynamicButtonUrl = buildOffersLandingUrl(
    getStoredLanguage(),
    getStoredCountry(),
    landingSlug,
    buttonUrl,
  );

  // Check if origin-dropdown already dispatched a city (handles race condition)
  const lastDropdownCity = getLastOriginDropdownCity();
  const defaultOrigin = lastDropdownCity?.originIataCode || await getMainCityForCurrentPos();
  const defaultOriginName = lastDropdownCity?.originName || defaultOrigin;

  // Estado del origen actual
  const currentOrigin = {
    originIataCode: defaultOrigin,
    originName: defaultOriginName,
  };

  // Hide original children to preserve data-aue-* for editor (Pattern B)
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  // Create DOM structure
  const wrapper = document.createElement('div');
  wrapper.className = 'cms-promotional-cards-rail-content';

  const container = document.createElement('ul');
  container.className = 'flex flex-col gap-[var(--spacing-4)] !m-0 min-[769px]:flex-row';

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'flex justify-end mt-4 md:mt-8';

  // Render initial offers
  const initialOfertas = filterOfertasByConfig(
    briefofertasCache,
    currentOrigin.originIataCode,
  );
  await renderCards(container, initialOfertas, blockConfig);

  // Render CTA button
  if (showButton) {
    render(
      html`
        <${LinkButton}
          size="medium"
          href=${dynamicButtonUrl}
          customClassName="group hover:!font-bold active:!font-bold"
        >
          ${buttonText}
          <${ArrowRightIcon} customClassName="group-hover:scale-110 group-active:scale-110" />
        </${LinkButton}>
      `,
      buttonContainer,
    );
  }

  // Assemble structure
  wrapper.appendChild(container);
  if (showButton) {
    wrapper.appendChild(buttonContainer);
  }

  // Set up listeners
  setupOriginChangeListener(container, currentOrigin, blockConfig);

  // Render INSIDE the block (compatible with editor-support.js re-decoration)
  block.appendChild(wrapper);
}
