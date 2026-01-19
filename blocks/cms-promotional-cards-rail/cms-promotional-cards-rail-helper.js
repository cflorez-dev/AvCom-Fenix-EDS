import {
  CMS_PROMOTIONAL_CARDS_MAX_CARDS as MAX_CARDS,
  CMS_PROMOTIONAL_CARDS_DEFAULT_IMAGE_PATH as DEFAULT_IMAGE_PATH,
  CMS_PROMOTIONAL_CARDS_DEFAULT_IMAGE_FORMAT as DEFAULT_IMAGE_FORMAT,
  CMS_PROMOTIONAL_CARDS_AEM_CLOUD_BASE as AEM_CLOUD_BASE,
  CMS_PROMOTIONAL_CARDS_FALLBACK_IMAGE as FALLBACK_IMAGE,
  CMS_PROMOTIONAL_CARDS_VALID_LIFEMILES_VARIANTS as VALID_LIFEMILES_VARIANTS,
  CMS_PROMOTIONAL_CARDS_VALID_DISCOUNT_VARIANTS as VALID_DISCOUNT_VARIANTS,
} from '../../scripts/utils/constants.js';
import { getStoredCurrency } from '../../scripts/services/header/language-country-selector.js';

/**
 * Builds the image URL for a destination based on IATA code
 * @param {string} iataCode - IATA code (e.g., 'PTY', 'MIA')
 * @param {string} imagePath - Path for images in DAM
 * @param {string} format - Image format (webp, jpg, png)
 * @returns {string} Full image URL
 */
export function buildIataImageUrl(iataCode, imagePath = DEFAULT_IMAGE_PATH, format = DEFAULT_IMAGE_FORMAT) {
  if (!iataCode) {
    return `${window.hlx?.codeBasePath || ''}${FALLBACK_IMAGE}`;
  }

  return `${AEM_CLOUD_BASE}${imagePath}/${iataCode.toLowerCase()}.${format}`;
}

/**
 * Extracts props from a CMS Promotional Cards Rail block.
 * Parses block rows in order according to component-models.json structure.
 *
 * @param {Element} block - The CMS Promotional Cards Rail block element
 * @returns {Object} Configuration object with all block properties
 */
export function extractCmsPromotionalCardsRailProps(block) {
  const defaultProps = {
    imageBasePath: DEFAULT_IMAGE_PATH,
    imageFormat: DEFAULT_IMAGE_FORMAT,
    lifemilesChipVariant: 'light',
    discountChipVariant: 'discount',
    buttonText: 'Ver todas las ofertas',
    buttonUrl: '/ofertas',
    showButton: true,
  };

  if (!block) {
    return defaultProps;
  }

  const rows = Array.from(block.children);

  // Row 0: imageBasePath
  let imageBasePath = defaultProps.imageBasePath;
  if (rows[0]) {
    const linkElement = rows[0].querySelector('a');
    if (linkElement) {
      imageBasePath = linkElement.getAttribute('href') || linkElement.textContent.trim();
    } else {
      const textContent = rows[0].textContent.trim();
      if (textContent) imageBasePath = textContent;
    }
  }

  // Row 1: lifemilesChipVariant
  let lifemilesChipVariant = defaultProps.lifemilesChipVariant;
  if (rows[1]) {
    const text = rows[1].textContent.trim();
    if (text) lifemilesChipVariant = text;
  }

  // Row 2: discountChipVariant
  let discountChipVariant = defaultProps.discountChipVariant;
  if (rows[2]) {
    const text = rows[2].textContent.trim();
    if (text) discountChipVariant = text;
  }

  // Row 3: buttonText
  let buttonText = defaultProps.buttonText;
  if (rows[3]) {
    const text = rows[3].textContent.trim();
    if (text) buttonText = text;
  }

  // Row 4: buttonUrl
  let buttonUrl = defaultProps.buttonUrl;
  if (rows[4]) {
    const linkElement = rows[4].querySelector('a');
    if (linkElement) {
      buttonUrl = linkElement.getAttribute('href') || linkElement.textContent.trim();
    } else {
      const textContent = rows[4].textContent.trim();
      if (textContent) buttonUrl = textContent;
    }
  }

  // Row 5: showButton (boolean)
  let showButton = defaultProps.showButton;
  if (rows[5]) {
    const text = rows[5].textContent.trim().toLowerCase();
    if (text) {
      showButton = text !== 'false' && text !== '0' && text !== 'no';
    }
  }

  return {
    imageBasePath,
    imageFormat: defaultProps.imageFormat,
    lifemilesChipVariant,
    discountChipVariant,
    buttonText,
    buttonUrl,
    showButton,
  };
}

/**
 * Validates extracted props for debugging
 * @param {Object} props - Extracted props object
 * @returns {Object} Validation result with isValid and errors array
 */
export function validateCmsPromotionalCardsRailProps(props) {
  const errors = [];

  if (!props || typeof props !== 'object') {
    return { isValid: false, errors: ['Props object is invalid'] };
  }

  if (!props.buttonText || props.buttonText.trim() === '') {
    errors.push('Button text is empty');
  }

  if (!props.buttonUrl || props.buttonUrl.trim() === '') {
    errors.push('Button URL is empty');
  }

  if (!VALID_LIFEMILES_VARIANTS.includes(props.lifemilesChipVariant)) {
    errors.push(`lifemilesChipVariant must be one of: ${VALID_LIFEMILES_VARIANTS.join(', ')}`);
  }

  if (!VALID_DISCOUNT_VARIANTS.includes(props.discountChipVariant)) {
    errors.push(`discountChipVariant must be one of: ${VALID_DISCOUNT_VARIANTS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Filters offers based on origin IATA code.
 * Always returns exactly 3 cards sorted by lowest price.
 *
 * @param {Array} ofertas - Array of offers from briefofertas
 * @param {string} originIataCode - Origin IATA code
 * @param {Object} config - Optional configuration (kept for backwards compatibility)
 * @returns {Array} Filtered and sorted offers (always 3 cards with lowest price)
 */
export function filterOfertasByConfig(ofertas, originIataCode, config = {}) {
  if (!ofertas || !Array.isArray(ofertas) || !originIataCode) {
    return [];
  }

  const normalizedOriginCode = originIataCode.trim().toUpperCase();

  // Filtrar por origen
  const filtered = ofertas.filter((oferta) => {
    const origin = (oferta.Origin || oferta.originIataCode || oferta.origin || '').trim().toUpperCase();
    return origin === normalizedOriginCode;
  });

  if (filtered.length === 0) {
    return [];
  }

  // Obtener moneda desde cookie para determinar qué columna de precio usar
  const currencyCode = (getStoredCurrency() || 'COP').toLowerCase();
  const priceColumnKey = `price|${currencyCode}`;

  // Ordenar por precio (menor a mayor) usando la columna de moneda correspondiente
  filtered.sort((a, b) => {
    const priceA = parseFloat(a[priceColumnKey] || a.price || a.specialPrice || 0);
    const priceB = parseFloat(b[priceColumnKey] || b.price || b.specialPrice || 0);
    return priceA - priceB;
  });

  return filtered.slice(0, MAX_CARDS);
}
