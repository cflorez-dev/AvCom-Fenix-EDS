import { filterItemsByTargeting } from '../../scripts/utils/target-filter.js';

/**
 * Extracts props from a CMS Informative Cards Carousel block.
 * Extracts loading mode, target countries, and target languages from
 * the parent block configuration.
 *
 * Parent row structure:
 * - Row 0: loading
 * - Row 1: target-countries (comma-separated)
 * - Row 2: target-languages (comma-separated)
 * - Row 3+: child items (cards)
 *
 * @param {Element} block - The CMS Informative Cards Carousel block element
 * @returns {Object} Configuration object with loading mode and targeting fields
 */
export function extractCmsInformativeCardsCarouselProps(block) {
  const defaultProps = {
    loading: 'lazy', // Default to lazy loading
    targetCountries: '',
    targetLanguages: '',
  };

  if (!block) {
    return defaultProps;
  }

  const rows = Array.from(block.children);

  // Row 0: loading field (single-cell row)
  let { loading } = defaultProps;
  if (rows[0] && rows[0].children.length === 1) {
    const loadingValue = rows[0].children[0].textContent.trim();
    if (loadingValue) {
      loading = loadingValue;
    }
  }

  // Row 1: target-countries field (comma-separated)
  let { targetCountries } = defaultProps;
  if (rows[1] && rows[1].children.length === 1) {
    const countriesValue = rows[1].children[0].textContent.trim();
    if (countriesValue) {
      targetCountries = countriesValue;
    }
  }

  // Row 2: target-languages field (comma-separated)
  let { targetLanguages } = defaultProps;
  if (rows[2] && rows[2].children.length === 1) {
    const languagesValue = rows[2].children[0].textContent.trim();
    if (languagesValue) {
      targetLanguages = languagesValue;
    }
  }

  // All other carousel behavior is hardcoded according to acceptance criteria:
  // Desktop:
  // - Up to 4 cards per row (responsive grid)
  // - All cards same height (CSS grid)
  // - Horizontal image proportion
  //
  // Mobile:
  // - Horizontal carousel with dots navigation
  // - Cards maintain desktop size
  // - Scroll horizontally with snap behavior
  // - Partially visible cards to indicate scroll
  // - Auto-adjust on swipe (snap to grid)

  return {
    loading,
    targetCountries,
    targetLanguages,
  };
}

/**
 * Extracts card data from child rows of the carousel block.
 * Each child row represents one informative card with 10 configurable fields.
 *
 * @param {Element} block - The CMS Informative Cards Carousel block element
 * @returns {Array<Object>} Array of card objects with extracted data
 */
export function extractCarouselCards(block) {
  const cards = [];

  if (!block || !block.children) {
    return cards;
  }

  const rows = Array.from(block.children);

  // Skip the first 3 rows - they contain parent configuration:
  // Row 0: loading
  // Row 1: target-countries
  // Row 2: target-languages
  // Start from index 3 for child items (cards)
  const cardRows = rows.slice(3);

  // Each row is a child item (cms-informative-cards-carousel-item)
  // According to ACTUAL HTML structure from AEM:
  // 0: image (picture with img)
  // 1: title (text in <p>)
  // 2: details (richtext in <p>)
  // 3: ctaText (text in <p>) - Button text
  // 4: ctaLink (in button-container <a>) - Button URL
  // 5: ctaTargetBlank (boolean text in <p>)
  // 6: ctaRel (select text in <p>)

  cardRows.forEach((row) => {
    const cells = Array.from(row.children);

    if (cells.length < 7) {
      return;
    }

    // Extract image (cell 0) - from <picture> or <img>
    const imageCell = cells[0];
    const imgElement = imageCell?.querySelector('img');
    const image = imgElement?.src || '';
    const imageAlt = imgElement?.alt || '';

    // Extract title (cell 1) - from <p> text
    const title = cells[1]?.textContent?.trim() || '';

    // Extract details (cell 2) - preserve HTML from <p>
    const details = cells[2]?.innerHTML?.trim() || '';

    // Extract ctaText (cell 3) - from <p> text
    const ctaText = cells[3]?.textContent?.trim() || '';

    // Extract ctaLink (cell 4) - from button-container <a href="">
    const ctaLinkCell = cells[4];
    const ctaLinkElement = ctaLinkCell?.querySelector('.button-container a') || ctaLinkCell?.querySelector('a');
    const ctaLink = ctaLinkElement?.href || '';

    // Extract ctaTargetBlank (cell 5) - boolean from <p> text
    const ctaTargetBlankText = cells[5]?.textContent?.trim().toLowerCase() || 'false';
    const ctaTargetBlank = ctaTargetBlankText === 'true';

    // Extract ctaRel (cell 6) - from <p> text (dofollow, nofollow, sponsored)
    const ctaRelRaw = cells[6]?.textContent?.trim().toLowerCase() || 'dofollow';
    const ctaRel = ['dofollow', 'nofollow', 'sponsored'].includes(ctaRelRaw) ? ctaRelRaw : 'dofollow';

    // Extract target-countries (cell 7) - comma-separated list
    const targetCountries = cells[7]?.textContent?.trim() || '';

    // Extract target-languages (cell 8) - comma-separated list
    const targetLanguages = cells[8]?.textContent?.trim() || '';

    // Validate required fields
    if (!image) {
      return;
    }

    if (!title) {
      return;
    }

    if (!details) {
      return;
    }

    // Create card object
    const card = {
      image,
      imageAlt,
      title,
      details,
      ctaText,
      ctaLink,
      ctaTargetBlank,
      ctaRel,
      'target-countries': targetCountries,
      'target-languages': targetLanguages,
    };

    cards.push(card);
  });

  // Filter cards by targeting (use kebab-case field names matching card keys)
  return filterItemsByTargeting(cards, 'target-countries', 'target-languages');
}
