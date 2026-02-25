import { filterItemsByTargeting } from '../../scripts/utils/target-filter.js';

/**
 * Extracts props from a CMS Promotional Card Carrousel block.
 * Parent model fields (loading, target-countries, target-languages) are rendered
 * by AEM as leading single-cell rows (one row per field, positional order).
 *
 * @param {Element} block - The CMS Promotional Card Carrousel block element
 * @returns {Object} Configuration object with loading mode and targeting
 */
export function extractCmsPromotionalCardCarrouselProps(block) {
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
      break; // Card items start here (multi-cell rows)
    }
  }

  // All other carousel behavior is hardcoded according to acceptance criteria:
  // - Navigation: Auto-enabled when ≥4 cards
  // - Loop: true (infinite carousel)
  // - AutoPlay: false (no auto-scroll)
  // - ItemsPerView: 3 (desktop), 2.2 (tablet), 1.2 (mobile)
  // - ScrollBehavior: Card-by-card (itemsToScroll: 1)
  // - Dimensions: 400px width, 408px height (responsive)
  // - Gap: 16px between cards

  return {
    loading: parentValues[0] || defaultProps.loading,
    targetCountries: parentValues[1] || '',
    targetLanguages: parentValues[2] || '',
  };
}

/**
 * Extracts card data from child rows of the carousel block.
 * Each child row represents one promotional card with 8 configurable fields.
 *
 * @param {Element} block - The CMS Promotional Card Carrousel block element
 * @returns {Array<Object>} Array of card objects with extracted data
 */
export function extractCarouselCards(block) {
  const cards = [];

  if (!block || !block.children) {
    return cards;
  }

  const rows = Array.from(block.children);

  // Skip all leading single-cell rows (parent config: loading, target-countries, target-languages).
  // Card item rows always have >= 7 cells.
  const cardRows = rows.filter((row) => Array.from(row.children).length >= 7);

  // Each row is a child item (cms-promotional-card-carrousel-item)
  // According to component-models.json, each row has cells in this order:
  // 0: image (reference)
  // 1: imageAlt (text) - wrapped in button-container
  // 2: variant (select - "dark" or "light")
  // 3: title (text)
  // 4: description (richtext)
  // 5: ctaText (text)
  // 6: ctaLink (text - URL) - wrapped in button-container

  cardRows.forEach((row) => {
    const cells = Array.from(row.children);

    if (cells.length < 7) {
      return;
    }

    // Extract image (cell 0)
    const imageCell = cells[0];
    const imgElement = imageCell?.querySelector('img');
    const image = imgElement?.src || '';

    // Extract backgroundColor (cell 1) - the href from the link inside button-container
    const backgroundColorCell = cells[1];
    const backgroundColorLink = backgroundColorCell?.querySelector('a');
    const backgroundColor = backgroundColorLink?.href?.split('#')[1] ? `#${backgroundColorLink.href.split('#')[1]}` : backgroundColorLink?.textContent?.trim() || '#1b1b1b';

    // Extract imageAlt from img element
    const imageAlt = imgElement?.alt || '';

    // Extract variant (cell 2)
    const variant = cells[2]?.textContent?.trim() || 'dark';

    // Extract title (cell 3)
    const title = cells[3]?.textContent?.trim() || '';

    // Extract description (cell 4) - preserve HTML from richtext
    const description = cells[4]?.innerHTML?.trim() || '';

    // Extract ctaText (cell 5)
    const ctaText = cells[5]?.textContent?.trim() || '';

    // Extract ctaLink (cell 6) - from link inside button-container
    const ctaLinkCell = cells[6];
    const ctaLinkElement = ctaLinkCell?.querySelector('a');
    const ctaLink = ctaLinkElement?.href || ctaLinkCell?.textContent?.trim() || '';

    // Validate required fields
    if (!image) {
      return;
    }

    if (!title) {
      return;
    }

    // Extract targeting fields (cells 7 and 8 - appended at end of model)
    const targetCountries = cells[7]?.textContent?.trim() || '';
    const targetLanguages = cells[8]?.textContent?.trim() || '';

    // Create card object
    const card = {
      image,
      imageAlt,
      backgroundColor,
      variant,
      title,
      description,
      ctaText,
      ctaLink,
      'target-countries': targetCountries,
      'target-languages': targetLanguages,
    };

    cards.push(card);
  });

  // Filter cards by targeting (country/language)
  return filterItemsByTargeting(cards, 'target-countries', 'target-languages');
}
