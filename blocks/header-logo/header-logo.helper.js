/**
 * Helper functions for Header Logo block
 */

/**
 * Extracts logo image information from a picture element
 * @param {Element} pictureElement The picture element containing the logo
 * @returns {Object|null} Object with src, alt, width, height, or null if not found
 */
function extractLogoFromPicture(pictureElement) {
  if (!pictureElement) return null;

  const img = pictureElement.querySelector('img');
  if (!img) return null;

  // Get sources for responsive images
  const sources = Array.from(pictureElement.querySelectorAll('source')).map(source => ({
    type: source.getAttribute('type'),
    srcset: source.getAttribute('srcset'),
    media: source.getAttribute('media'),
  }));

  return {
    src: img.getAttribute('src'),
    alt: img.getAttribute('alt') || '',
    width: img.getAttribute('width'),
    height: img.getAttribute('height'),
    sources,
  };
}

/**
 * Extracts all header logo data from the block element
 * @param {Element} block The header-logo block element
 * @returns {Object} Object containing extracted logo data
 */
export function extractHeaderLogoData(block) {
  const children = Array.from(block.children);

  // Logo Desktop (primer div - índice 0)
  const logoDesktopDiv = children[0];
  const logoDesktopPicture = logoDesktopDiv?.querySelector('picture');
  const logoDesktop = extractLogoFromPicture(logoDesktopPicture);

  // Logo Mobile (segundo div - índice 1)
  const logoMobileDiv = children[1];
  const logoMobilePicture = logoMobileDiv?.querySelector('picture');
  const logoMobile = extractLogoFromPicture(logoMobilePicture);

  // Logo Dark Mode (tercer div - índice 2) - puede no existir
  const logoDarkModeDiv = children[2];
  const logoDarkModePicture = logoDarkModeDiv?.querySelector('picture');
  const logoDarkMode = extractLogoFromPicture(logoDarkModePicture);

  // URL de redirección (cuarto div - índice 3)
  const redirectUrlDiv = children[3];
  const redirectLink = redirectUrlDiv?.querySelector('a');
  const redirectUrl = redirectLink?.getAttribute('href') || '';

  // Is Dark Mode (sexto div - índice 5)
  const darkModeDiv = children[5];
  const darkModeText = darkModeDiv?.querySelector('p')?.textContent?.trim() || 'false';
  const isDarkMode = darkModeText.toLowerCase() === 'true';

  return {
    logoDesktop,
    logoMobile,
    logoDarkMode,
    redirectUrl,
    isDarkMode,
  };
}
