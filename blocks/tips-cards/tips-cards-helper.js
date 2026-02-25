import { filterItemsByTargeting } from '../../scripts/utils/target-filter.js';

/**
 * Extracts props from a Tips Cards block.
 * Parent model fields (loading, target-countries, target-languages) are rendered
 * by AEM as leading single-cell rows (one row per field, positional order).
 *
 * @param {Element} block - The Tips Cards block element
 * @returns {Object} Configuration object with loading mode and targeting
 */
export function extractTipsCardsProps(block) {
  const defaultProps = {
    loading: 'lazy',
    targetCountries: '',
    targetLanguages: '',
  };

  if (!block) {
    return defaultProps;
  }

  const rows = Array.from(block.children);

  // Parent config rows are leading rows with exactly 1 cell (single value, no key-value).
  // Model field order: loading (row 0), target-countries (row 1), target-languages (row 2).
  // Backward compatible: old content may have only 1 parent row (loading).
  const parentValues = [];
  for (let i = 0; i < rows.length; i += 1) {
    const cells = Array.from(rows[i].children);
    if (cells.length === 1) {
      parentValues.push(cells[0]?.textContent?.trim() || '');
    } else {
      break; // Card items start here
    }
  }

  return {
    loading: parentValues[0] || defaultProps.loading,
    targetCountries: parentValues[1] || '',
    targetLanguages: parentValues[2] || '',
  };
}

/**
 * Extracts card data from child rows of the tips cards block.
 * Each child row represents one tip card item with icon, title, and description.
 * Leading single-cell rows (parent config) are automatically skipped.
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

  // Skip all leading single-cell rows (parent config: loading, target-countries, target-languages).
  // Card item rows always have >= 3 cells.
  const cardRows = rows.filter((row) => Array.from(row.children).length >= 3);

  // Each row is a child item (tips-card-item)
  // According to component-models.json structure:
  // 0: icon (reference/image in <picture> or <img>)
  // 1: iconAlt (text in <p>) - OPTIONAL
  // 2: title (text in <p>) - OPTIONAL
  // 3: description (text in <p>) - OPTIONAL
  // NOTE: Supports legacy 3-cell format (icon, title, description) for backwards compatibility

  cardRows.forEach((row, index) => {
    const cells = Array.from(row.children);

    // Support both 3-cell (legacy) and 4-cell (new) formats
    // With targeting fields appended: 5-cell (legacy+targeting) and 6-cell (new+targeting)
    const cellCount = cells.length;
    const isLegacyFormat = cellCount === 3 || cellCount === 5;
    const hasNewFormat = cellCount === 4 || cellCount === 6;
    const hasTargeting = cellCount === 5 || cellCount === 6;

    if (!isLegacyFormat && !hasNewFormat) {
      // eslint-disable-next-line no-console
      console.warn(`Tips Cards: Row ${index + 1} has invalid cell count (${cellCount}). Expected 3-6 cells. Skipping.`);
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

    // Extract targeting fields from last 2 cells when present
    let targetCountries = '';
    let targetLanguages = '';
    if (hasTargeting) {
      targetCountries = cells[cellCount - 2]?.textContent?.trim() || '';
      targetLanguages = cells[cellCount - 1]?.textContent?.trim() || '';
    }

    // Create card object (all fields optional except icon)
    const card = {
      icon,
      iconAlt,
      title,
      description,
      'target-countries': targetCountries,
      'target-languages': targetLanguages,
    };

    cards.push(card);
  });

  // Filter cards by targeting (country/language)
  return filterItemsByTargeting(cards, 'target-countries', 'target-languages');
}
