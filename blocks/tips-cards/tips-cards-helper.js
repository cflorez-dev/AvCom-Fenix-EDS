import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Extracts props from a Tips Cards block.
 * Extracts loading mode from the parent block configuration.
 *
 * @param {Element} block - The Tips Cards block element
 * @returns {Object} Configuration object with loading mode
 */
export function extractTipsCardsProps(block) {
  const defaultProps = {
    loading: 'lazy', // Default to lazy loading
  };

  if (!block) {
    return defaultProps;
  }

  // Extract configuration from block metadata using readBlockConfig
  const config = readBlockConfig(block);
  const loading = config.loading || defaultProps.loading;

  return {
    loading,
  };
}

/**
 * Extracts card data from child rows of the tips cards block.
 * Each child row represents one tip card item with icon, title, and description.
 *
 * @param {Element} block - The Tips Cards block element
 * @returns {Array<Object>} Array of tip card objects with extracted data
 */
export function extractTipsCards(block) {
  const cards = [];

  if (!block || !block.children) {
    return cards;
  }

  const rows = Array.from(block.children);

  // Skip the first row (index 0) - it contains parent configuration (loading mode)
  // Start from index 1 for child items (tip cards)
  const cardRows = rows.slice(1);

  // Each row is a child item (tips-card-item)
  // According to component-models.json structure:
  // 0: icon (reference/image in <picture> or <img>)
  // 1: iconAlt (text in <p>) - OPTIONAL
  // 2: title (text in <p>) - OPTIONAL
  // 3: description (text in <p>) - REQUIRED
  // NOTE: Supports legacy 3-cell format (icon, title, description) for backwards compatibility

  cardRows.forEach((row, index) => {
    const cells = Array.from(row.children);

    // Support both 3-cell (legacy) and 4-cell (new) formats
    const isLegacyFormat = cells.length === 3;
    const hasNewFormat = cells.length === 4;

    if (!isLegacyFormat && !hasNewFormat) {
      // eslint-disable-next-line no-console
      console.warn(`Tips Cards: Row ${index + 1} has invalid cell count (${cells.length}). Expected 3 or 4 cells. Skipping.`);
      return;
    }

    // Extract icon (cell 0) - from <picture> or <img>
    const iconCell = cells[0];
    const imgElement = iconCell?.querySelector('img');
    const icon = imgElement?.src || '';

    let iconAlt = '';
    let title = '';
    let description = '';

    if (isLegacyFormat) {
      // Legacy format: icon, title, description
      iconAlt = ''; // Not available in legacy format
      title = cells[1]?.textContent?.trim() || '';
      description = cells[2]?.textContent?.trim() || '';
    } else {
      // New format: icon, iconAlt, title, description
      iconAlt = cells[1]?.textContent?.trim() || '';
      title = cells[2]?.textContent?.trim() || '';
      description = cells[3]?.textContent?.trim() || '';
    }

    // Debug data extraction (disabled in production)
    // console.log(`💡 Tips Card ${index + 1} extracted data:`, {
    //   icon,
    //   iconAlt,
    //   title,
    //   description: `${description.substring(0, 50)}...`,
    // });

    // Validate required fields - only description is mandatory
    if (!description) {
      // eslint-disable-next-line no-console
      console.warn(`Tips Cards: Row ${index + 1} missing description. Skipping card.`);
      return;
    }

    // Icon and title are optional - card can work without them

    // Create card object
    const card = {
      icon,
      iconAlt,
      title,
      description,
    };

    cards.push(card);
  });

  return cards;
}
