/**
 * Helper functions to extract panel data from AEM table structure
 */

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
  let defaultBgIndex, defaultBgMobileIndex, interactiveBgIndex, interactiveBgMobileIndex;

  if (hasMobileImages) {
    // New structure with mobile images (13 cells)
    defaultBgIndex = 4;
    defaultBgMobileIndex = 5;
    interactiveBgIndex = hasOverlayField ? 11 : (hasBooleanField ? 11 : 9);
    interactiveBgMobileIndex = hasOverlayField ? 12 : (hasBooleanField ? 12 : 10);
  } else {
    // Legacy structures (9-11 cells)
    defaultBgIndex = 4;
    defaultBgMobileIndex = null;
    interactiveBgIndex = hasOverlayField ? 10 : (hasBooleanField ? 9 : 8);
    interactiveBgMobileIndex = null;
  }

  // Extract data based on cell index (AEM table structure)
  const data = {
    // Cell 0: Default Title
    defaultTitle: getText(cells, 0),
    // Cell 1: Default Description Line 1
    defaultDescriptionLine1: getText(cells, 1),
    // Cell 2: Default Description Line 2
    defaultDescriptionLine2: getText(cells, 2),
    // Cell 3: Default Media (image/SVG)
    defaultMedia: getImageSrc(cells, 3),
    // Cell 4: Default Background Image (Desktop)
    defaultBackgroundImage: getImageSrc(cells, defaultBgIndex),
    // Cell 5: Default Background Image (Mobile) - new field
    defaultBackgroundImageMobile: defaultBgMobileIndex !== null ? getImageSrc(cells, defaultBgMobileIndex) : '',
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
    // Cell 10/11 or 8/9: Interactive Background Image (Desktop)
    interactiveBackgroundImage: getImageSrc(cells, interactiveBgIndex),
    // Cell 11/12 or 9/10: Interactive Background Image (Mobile) - new field
    interactiveBackgroundImageMobile: interactiveBgMobileIndex !== null ? getImageSrc(cells, interactiveBgMobileIndex) : '',
  };

  return data;
}
