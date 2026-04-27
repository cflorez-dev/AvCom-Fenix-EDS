/**
 * Helper functions to extract panel data from AEM table structure
 */

/**
 * Optimizes image URL for better performance
 * @param {string} imageUrl - Original image URL
 * @returns {string} Optimized image URL
 */
function optimizeImageUrl(imageUrl, targetWidth) {
  if (!imageUrl) return imageUrl;

  let optimizedUrl = imageUrl;

  // Adjust width for sharper rendering on high-DPI screens
  if (targetWidth && optimizedUrl.includes('width=')) {
    optimizedUrl = optimizedUrl.replace(/width=\d+/, `width=${targetWidth}`);
  }

  if (optimizedUrl.includes('format=png')) {
    optimizedUrl = optimizedUrl.replace('format=png', 'format=webply');
  }

  if (!optimizedUrl.includes('format=') && !optimizedUrl.toLowerCase().endsWith('.gif')) {
    optimizedUrl += optimizedUrl.includes('?') ? '&format=webply' : '?format=webply';
  }

  return optimizedUrl;
}

/**
 * Extract text content from a cell
 * @param {Element[]} cells - Array of cell elements
 * @param {number} index - Cell index
 * @returns {string} Extracted text content
 */
function getText(cells, index) {
  const cell = cells[index];
  if (!cell) return '';
  const p = cell.querySelector('p');
  return p ? p.textContent.trim() : '';
}

/**
 * Extract image src from a cell
 * @param {Element[]} cells - Array of cell elements
 * @param {number} index - Cell index
 * @returns {string} Image source URL
 */
function getImageSrc(cells, index) {
  const cell = cells[index];
  if (!cell) return '';
  const img = cell.querySelector('img');
  return img ? img.src : '';
}

/**
 * Extract link URL from a cell
 * @param {Element[]} cells - Array of cell elements
 * @param {number} index - Cell index
 * @returns {string} Link URL
 */
function getLinkUrl(cells, index) {
  const cell = cells[index];
  if (!cell) return '';
  const link = cell.querySelector('a');
  return link ? link.href : '';
}

/**
 * Extract HTML content from a cell (removes wrapping <p> tag)
 * @param {Element[]} cells - Array of cell elements
 * @param {number} index - Cell index
 * @returns {string} HTML content without wrapping paragraph
 */
function getHTML(cells, index) {
  const cell = cells[index];
  if (!cell) return '';
  const p = cell.querySelector('p');
  return p ? p.innerHTML : cell.innerHTML;
}

/**
 * Extract boolean value from a cell
 * @param {Element[]} cells - Array of cell elements
 * @param {number} index - Cell index
 * @returns {boolean} Boolean value (true if cell contains 'true', false otherwise)
 */
function getBoolean(cells, index) {
  const cell = cells[index];
  if (!cell) return false;
  const text = cell.textContent.trim().toLowerCase();
  return text === 'true';
}

/**
 * Extract panel data from a DOM section (AEM table structure)
 * @param {Element} section - The div element containing panel data (direct child of block)
 * @returns {Object} Panel data object with all fields
 */
export default function extractPanelData(section) {
  const cells = [...section.children];

  // Detect structure based on cell count and content
  // New structure: 13 cells (with mobile backgrounds)
  // Previous structure: 11 cells (with overlay), 10 cells (with boolean), or 9 cells (legacy)

  // Check if we have the new structure with mobile images (13 cells total)
  const hasMobileImages = cells.length >= 12;

  // Detect if we have boolean field (check cell 8 in legacy or cell 9 in new structure)
  const booleanIndex = hasMobileImages ? 9 : 8;
  const hasBooleanField = cells[booleanIndex] && !cells[booleanIndex].querySelector('picture, img') && cells[booleanIndex].textContent.trim().toLowerCase() === 'true';

  // Detect overlay field position
  const overlayIndex = hasMobileImages ? 10 : 9;
  const hasOverlayField = cells[overlayIndex] && !cells[overlayIndex].querySelector('picture, img') && cells[overlayIndex].textContent.trim() !== '' && cells[overlayIndex].textContent.trim().toLowerCase() !== 'true';

  const openInNewTab = hasBooleanField ? getBoolean(cells, booleanIndex) : false;
  const overlayBackground = hasOverlayField ? getText(cells, overlayIndex) : '';

  // Calculate background image indices based on structure
  let defaultBgIndex;
  let defaultBgMobileIndex;
  let interactiveBgIndex;
  let interactiveBgMobileIndex;

  if (hasMobileImages) {
    // New structure with mobile images (13 cells)
    defaultBgIndex = 4;
    defaultBgMobileIndex = 5;
    if (hasOverlayField) {
      interactiveBgIndex = 11;
      interactiveBgMobileIndex = 12;
    } else if (hasBooleanField) {
      interactiveBgIndex = 11;
      interactiveBgMobileIndex = 12;
    } else {
      interactiveBgIndex = 9;
      interactiveBgMobileIndex = 10;
    }
  } else {
    // Legacy structures (9-11 cells)
    defaultBgIndex = 4;
    defaultBgMobileIndex = null;
    if (hasOverlayField) {
      interactiveBgIndex = 10;
    } else if (hasBooleanField) {
      interactiveBgIndex = 9;
    } else {
      interactiveBgIndex = 8;
    }
    interactiveBgMobileIndex = null;
  }

  // Calculate targeting field indices
  let targetCountriesIndex;
  let targetLanguagesIndex;

  if (hasMobileImages) {
    targetCountriesIndex = 13;
    targetLanguagesIndex = 14;
  } else if (hasOverlayField) {
    targetCountriesIndex = 12;
    targetLanguagesIndex = 13;
  } else {
    targetCountriesIndex = 11;
    targetLanguagesIndex = 12;
  }

  const data = {
    // Cell 0: Default Title
    defaultTitle: getText(cells, 0),
    // Cell 1: Default Description Line 1
    defaultDescriptionLine1: getText(cells, 1),
    // Cell 2: Default Description Line 2
    defaultDescriptionLine2: getText(cells, 2),
    // Cell 3: Default Media (image/SVG)
    defaultMedia: getImageSrc(cells, 3),
    // Cell 4: Default Background Image (Desktop) - optimized
    defaultBackgroundImage: optimizeImageUrl(getImageSrc(cells, defaultBgIndex), 2000),
    // Cell 5: Default Background Image (Mobile) - optimized
    defaultBackgroundImageMobile: defaultBgMobileIndex !== null ? optimizeImageUrl(getImageSrc(cells, defaultBgMobileIndex), 600) : '',
    // Cell 5 or 6: Interactive Description (richtext - may contain HTML)
    interactiveDescription: getHTML(cells, hasMobileImages ? 6 : 5),
    // Cell 6 or 7: Interactive Button Text
    interactiveButtonText: getText(cells, hasMobileImages ? 7 : 6),
    // Cell 7 or 8: Interactive Button URL
    interactiveButtonUrl: getLinkUrl(cells, hasMobileImages ? 8 : 7),
    // Cell 8 or 9: Interactive Button Open in New Tab (boolean)
    interactiveButtonOpenInNewTab: openInNewTab,
    // Cell 9 or 10: Interactive Overlay Background (CSS value)
    interactiveOverlayBackground: overlayBackground,
    // Cell 10/11 or 8/9: Interactive Background Image (Desktop) - optimized
    interactiveBackgroundImage: optimizeImageUrl(getImageSrc(cells, interactiveBgIndex), 2000),
    // Cell 11/12 or 9/10: Interactive Background Image (Mobile) - optimized
    interactiveBackgroundImageMobile: interactiveBgMobileIndex !== null ? optimizeImageUrl(getImageSrc(cells, interactiveBgMobileIndex), 600) : '',
    // Targeting fields
    'target-countries': getText(cells, targetCountriesIndex),
    'target-languages': getText(cells, targetLanguagesIndex),
  };

  return data;
}
