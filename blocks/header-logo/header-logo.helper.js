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

  const rawSrc = img.getAttribute('src') || '';
  // Helix rasteriza el SVG a su viewBox intrínseco (50×32) cuando genera el <source webp>,
  // así que en móvil <600px gana el WebP de 50px y el logo sale pixelado en DPR≥2.
  // Si el asset original es SVG, ignoramos los <source> raster y servimos el SVG vectorial.
  const isSvg = /\.svg($|\?)/i.test(rawSrc);

  const sources = isSvg
    ? []
    : Array.from(pictureElement.querySelectorAll('source')).map((source) => ({
      type: source.getAttribute('type'),
      srcset: source.getAttribute('srcset'),
      media: source.getAttribute('media'),
    }));

  const src = isSvg ? rawSrc.split('?')[0] : rawSrc;

  return {
    src,
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

  // Check if first 2 rows are targeting config (single-column rows with country/language codes)
  const validCountries = ['co', 'ar', 'mx', 'pe', 'ec', 'sv', 'cr', 'br', 'bo', 'cl', 'ca', 'gt', 'hn', 'ni', 'pa', 'py', 'do', 'eu', 'gb', 'uy', 'ot', 'us'];
  let startIndex = 0;

  if (children.length >= 2) {
    const firstRowValue = children[0]?.children[0]?.textContent?.trim().toLowerCase();
    const firstRowIsTargeting = firstRowValue &&
      children[0].children.length <= 2 && // Max 2 cols for targeting config
      (validCountries.includes(firstRowValue) || firstRowValue.split(',').every((c) => validCountries.includes(c.trim())));

    if (firstRowIsTargeting) {
      // Skip first 2 rows (target-countries and target-languages)
      startIndex = 2;
    }
  }

  // Logo Desktop (primer div real - después del targeting si existe)
  const logoDesktopDiv = children[startIndex + 0];
  const logoDesktopPicture = logoDesktopDiv?.querySelector('picture');
  const logoDesktop = extractLogoFromPicture(logoDesktopPicture);

  // Logo Mobile (segundo div real - después del targeting)
  const logoMobileDiv = children[startIndex + 1];
  const logoMobilePicture = logoMobileDiv?.querySelector('picture');
  const logoMobile = extractLogoFromPicture(logoMobilePicture);

  // Logo Dark Mode (tercer div real - después del targeting) - puede no existir
  const logoDarkModeDiv = children[startIndex + 2];
  const logoDarkModePicture = logoDarkModeDiv?.querySelector('picture');
  const logoDarkMode = extractLogoFromPicture(logoDarkModePicture);

  // URL de redirección (cuarto div real - después del targeting)
  const redirectUrlDiv = children[startIndex + 3];
  const redirectLink = redirectUrlDiv?.querySelector('a');
  const redirectUrl = redirectLink?.getAttribute('href') || '';

  // Is Dark Mode (sexto div real - después del targeting)
  const darkModeDiv = children[startIndex + 5];
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
