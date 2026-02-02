/**
 * Maps block HTML data to a structured configuration object for CMS Secondary Banner
 *
 * Expected structure: 18 divs containing (in order):
 * - Div 0: Title
 * - Div 1: First label
 * - Div 2: Secondary Label
 * - Div 3: Image Desktop (picture element)
 * - Div 4: Image Mobile (picture element)
 * - Div 5: Image Alt text
 * - Div 6: CTA Text
 * - Div 7: CTA URL (link)
 * - Div 8: CTA Link Type (empty, defaults to 'dofollow')
 * - Div 9: Mode (empty, defaults to 'light')
 * - Div 10: Background Type
 * - Div 11: Background Color (link with color value)
 * - Div 12: Gradient Color Start (link with color value)
 * - Div 13: Gradient Color End (link with color value)
 * - Div 14: Condor Stroke Color (link with color value)
 * - Div 15: Loading
 * - Div 16: Target Countries (comma-separated)
 * - Div 17: Target Languages (comma-separated)
 *
 * @param {Element} block The cms-secondary-banner block element
 * @returns {Object} Mapped configuration object with all banner properties
 */
export function mapCmsSecondaryBannerData(block) {
  if (!block) {
    return getDefaultConfig();
  }

  const divs = Array.from(block.querySelectorAll(':scope > div'));

  // Extract picture elements for desktop and mobile
  const pictureDesktop = extractPictureElement(divs[3]);
  const pictureMobile = extractPictureElement(divs[4]);

  // Map data based on div order
  const mappedData = {
    title: extractTextValue(divs[0]) || '',
    firstLabel: extractTextValue(divs[1]) || '',
    secondaryLabel: extractTextValue(divs[2]) || '',
    imageDesktop: pictureDesktop?.src || '',
    imageMobile: pictureMobile?.src || '',
    pictureDesktop: pictureDesktop, // Full picture element data
    pictureMobile: pictureMobile, // Full picture element data
    imageAlt: extractTextValue(divs[5]) || pictureDesktop?.alt || pictureMobile?.alt || '',
    ctaText: extractTextValue(divs[6]) || '',
    ctaUrl: extractLinkValue(divs[7]) || '',
    ctaLinkType: extractTextValue(divs[8]) || 'dofollow',
    mode: extractTextValue(divs[9]) || 'light',
    backgroundType: extractTextValue(divs[10]) || 'solid',
    backgroundColor: extractLinkValue(divs[11]) || '#1b1b1b',
    gradientColorStart: extractLinkValue(divs[12]) || '',
    gradientColorEnd: extractLinkValue(divs[13]) || '',
    condorStrokeColor: extractLinkValue(divs[14]) || '',
    loading: extractTextValue(divs[15]) || pictureDesktop?.loading || pictureMobile?.loading || 'lazy',
    targetCountries: extractTextValue(divs[16]) || '',
    targetLanguages: extractTextValue(divs[17]) || '',
  };

  return mappedData;
}

/**
 * Extracts text content from nested div > div > p structure
 * @param {Element} div The div element to extract text from
 * @returns {string} Extracted text content or empty string
 */
function extractTextValue(div) {
  if (!div) return '';
  const innerDiv = div.querySelector(':scope > div');
  if (innerDiv) {
    const paragraph = innerDiv.querySelector('p');
    return paragraph ? paragraph.textContent.trim() : '';
  }
  return '';
}

/**
 * Extracts picture element data (sources and img) for responsive images
 * @param {Element} div The div element containing a picture element
 * @returns {Object|null} Object with picture element data or null
 */
function extractPictureElement(div) {
  if (!div) return null;
  const picture = div.querySelector('picture');
  if (!picture) return null;

  const img = picture.querySelector('img');
  if (!img) return null;

  // Extract sources for responsive images
  const sources = Array.from(picture.querySelectorAll('source')).map(source => ({
    type: source.getAttribute('type'),
    srcset: source.getAttribute('srcset'),
    media: source.getAttribute('media'),
  }));

  return {
    src: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '',
    loading: img.getAttribute('loading') || 'lazy',
    sources,
    pictureElement: picture.cloneNode(true), // Clone for direct use
  };
}

/**
 * Extracts image source from picture element (backward compatibility)
 * @param {Element} div The div element containing a picture element
 * @returns {string} Image source URL or empty string
 */
function extractImageSource(div) {
  const pictureData = extractPictureElement(div);
  return pictureData ? pictureData.src : '';
}

/**
 * Extracts link href (for URLs and color values)
 * Handles both URL links and color value links (e.g., "#fffff")
 * @param {Element} div The div element containing a link element
 * @returns {string} Extracted URL or color value, or empty string
 */
function extractLinkValue(div) {
  if (!div) return '';
  const innerDiv = div.querySelector(':scope > div');
  if (innerDiv) {
    const link = innerDiv.querySelector('a');
    if (link) {
      // For color values, prefer textContent (e.g., "#fffff")
      // For URLs, use href directly
      const { textContent, href } = link;
      const linkText = textContent.trim();

      // Check if it's a color value (starts with #)
      if (linkText.startsWith('#')) {
        return linkText;
      }

      // For URLs, use href but clean it up if needed
      // Remove protocol and domain if it's a relative URL
      if (href && !href.startsWith('http')) {
        // Extract path from href (handles cases like "file:///path" or relative paths)
        const urlMatch = href.match(/(\/[^#]*)/);
        return urlMatch ? urlMatch[1] : href;
      }

      return href || linkText;
    }
  }
  return '';
}

/**
 * Returns default configuration object for CMS Secondary Banner
 * @returns {Object} Default configuration with all properties
 */
function getDefaultConfig() {
  return {
    title: '',
    firstLabel: '',
    secondaryLabel: '',
    imageDesktop: '',
    imageMobile: '',
    pictureDesktop: null,
    pictureMobile: null,
    imageAlt: '',
    ctaText: '',
    ctaUrl: '',
    ctaLinkType: 'dofollow',
    mode: 'light',
    backgroundType: 'solid',
    backgroundColor: '#1b1b1b',
    gradientColorStart: '',
    gradientColorEnd: '',
    condorStrokeColor: '',
    loading: 'lazy',
  };
}

