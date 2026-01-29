import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Extracts props from a CMS Informative Cards Carousel block.
 * Extracts loading mode from the parent block configuration.
 *
 * @param {Element} block - The CMS Informative Cards Carousel block element
 * @returns {Object} Configuration object with loading mode
 */
export function extractCmsInformativeCardsCarouselProps(block) {
  const defaultProps = {
    loading: 'lazy', // Default to lazy loading
  };

  if (!block) {
    return defaultProps;
  }

  // Extract configuration from block metadata using readBlockConfig
  const config = readBlockConfig(block);
  const loading = config.loading || defaultProps.loading;

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

  // Skip the first row (index 0) - it contains parent configuration (loading mode)
  // Start from index 1 for child items (cards)
  const cardRows = rows.slice(1);

  // Each row is a child item (cms-informative-cards-carousel-item)
  // According to ACTUAL HTML structure from AEM:
  // 0: image (picture with img)
  // 1: title (text in <p>)
  // 2: details (richtext in <p>)
  // 3: ctaText (text in <p>) - Button text
  // 4: ctaLink (in button-container <a>) - Button URL
  // 5: ctaTargetBlank (boolean text in <p>)
  // 6: ctaRel (select text in <p>)

  cardRows.forEach((row, index) => {
    const cells = Array.from(row.children);

    console.log(`🔍 CMS Informative Cards Carousel - Processing card row ${index + 1}:`, { row, cells, cellsLength: cells.length });

    if (cells.length < 7) {
      console.warn(`CMS Informative Cards Carousel: Row ${index + 1} has insufficient cells (${cells.length}/7). Skipping.`);
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

    console.log(`🎴 CMS Informative Cards Carousel - Card ${index + 1} extracted data:`, {
      image,
      imageAlt,
      title,
      details: details.substring(0, 50) + '...',
      ctaText,
      ctaLink,
      ctaTargetBlank,
      ctaRel,
    });

    // Validate required fields
    if (!image) {
      console.warn(`CMS Informative Cards Carousel: Row ${index + 1} missing image. Skipping card.`);
      return;
    }

    if (!title) {
      console.warn(`CMS Informative Cards Carousel: Row ${index + 1} missing title. Skipping card.`);
      return;
    }

    if (!details) {
      console.warn(`CMS Informative Cards Carousel: Row ${index + 1} missing details. Skipping card.`);
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
    };

    cards.push(card);
  });

  return cards;
}
