/**
 * Global constants for AEM Edge Delivery Services - Avianca Frontend Site
 */

// ============================================================================
// CMS Promotional Cards Rail Component Constants
// ============================================================================

/**
 * Maximum number of promotional cards to display in the rail
 * @constant {number}
 */
export const CMS_PROMOTIONAL_CARDS_MAX_CARDS = 3;

/**
 * Default path in AEM DAM for IATA destination images
 * @constant {string}
 */
export const CMS_PROMOTIONAL_CARDS_DEFAULT_IMAGE_PATH = '/content/dam/Avianca-home-site/iata_images';

/**
 * Default image format for IATA destination images
 * @constant {string}
 */
export const CMS_PROMOTIONAL_CARDS_DEFAULT_IMAGE_FORMAT = 'png';

/**
 * AEM Cloud base URL for image assets
 * @constant {string}
 */
export const CMS_PROMOTIONAL_CARDS_AEM_CLOUD_BASE = 'https://publish-p34631-e1321407.adobeaemcloud.com';

/**
 * Fallback image path when IATA code is not available
 * @constant {string}
 */
export const CMS_PROMOTIONAL_CARDS_FALLBACK_IMAGE = '/assets/samples/Oferta-San-Andres.png';

/**
 * Valid variant options for LifeMiles chip component
 * @constant {string[]}
 */
export const CMS_PROMOTIONAL_CARDS_VALID_LIFEMILES_VARIANTS = ['light', 'dark'];

/**
 * Valid variant options for discount chip component
 * @constant {string[]}
 */
export const CMS_PROMOTIONAL_CARDS_VALID_DISCOUNT_VARIANTS = ['discount', 'discount-light'];
