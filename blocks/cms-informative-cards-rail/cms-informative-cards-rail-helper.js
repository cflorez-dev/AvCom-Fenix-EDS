import { filterItemsByTargeting } from '../../scripts/utils/target-filter.js';

/**
 * Extracts a single card's data from a row's cells
 * @param {Array<Element>} cells - Array of cell elements
 * @returns {Object} Card data object
 */
function extractCardFromRow(cells) {
  const card = {
    image: null,
    imageAlt: '',
    title: '',
    details: '',
    actionType: 'none', // 'button', 'chevron', 'none'
    buttonText: null,
    buttonUrl: null,
    showChevron: false,
  };

  // Cell 0: Image
  if (cells[0]) {
    const picture = cells[0].querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        card.image = img.src;
        card.imageAlt = img.alt || '';
      }
    } else {
      // Fallback: external image URLs may be delivered as <a> links
      const img = cells[0].querySelector('img');
      if (img) {
        card.image = img.src;
        card.imageAlt = img.alt || '';
      } else {
        const anchor = cells[0].querySelector('a');
        if (anchor?.href) {
          card.image = anchor.href;
          card.imageAlt = anchor.textContent?.trim() || '';
        }
      }
    }
  }

  // Cell 1: Title
  if (cells[1]) {
    const titleP = cells[1].querySelector('p');
    if (titleP) {
      card.title = titleP.textContent.trim();
    }
  }

  // Cell 2: Details - preserve HTML for rich text support
  if (cells[2]) {
    card.details = cells[2].innerHTML?.trim() || '';
  }

  // Cell 3: Action Type (can be "none", "chevron", or empty)
  let actionTypeFromCell3 = '';
  if (cells[3]) {
    const actionTypeP = cells[3].querySelector('p');
    if (actionTypeP) {
      actionTypeFromCell3 = actionTypeP.textContent.trim().toLowerCase();
    }
  }

  // Cell 4: Button text (if present, it's a button type)
  let buttonTextFromCell4 = '';
  if (cells[4]) {
    const buttonTextP = cells[4].querySelector('p');
    if (buttonTextP) {
      buttonTextFromCell4 = buttonTextP.textContent.trim();
    }
  }

  // Determine action type based on cells 3 and 4
  if (actionTypeFromCell3 === 'chevron') {
    // Cell 3 says "chevron" - take priority
    card.actionType = 'chevron';
    card.showChevron = true;
  } else if (actionTypeFromCell3 === 'none') {
    // Cell 3 says "none" - take priority
    card.actionType = 'none';
    card.showChevron = false;
  } else if (buttonTextFromCell4) {
    // Cell 3 is empty/other AND Cell 4 has button text -> it's a button
    card.actionType = 'button';
    card.buttonText = buttonTextFromCell4;
    card.showChevron = false;
  } else {
    // Default to chevron if nothing specified
    card.actionType = 'chevron';
    card.showChevron = true;
  }

  // Cell 5: Link URL (always present)
  if (cells[5]) {
    // Buscar primero en .button-container
    let link = cells[5].querySelector('.button-container a');
    // Si no existe, buscar cualquier link en la celda
    if (!link) {
      link = cells[5].querySelector('a');
    }
    if (link) {
      card.buttonUrl = link.getAttribute('href') || '#';
    }
  }

  // Cell 6: target-countries (multiselect, comma-separated)
  if (cells[6]) {
    const targetCountriesP = cells[6].querySelector('p');
    if (targetCountriesP) {
      card['target-countries'] = targetCountriesP.textContent.trim();
    }
  }

  // Cell 7: target-languages (multiselect, comma-separated)
  if (cells[7]) {
    const targetLanguagesP = cells[7].querySelector('p');
    if (targetLanguagesP) {
      card['target-languages'] = targetLanguagesP.textContent.trim();
    }
  }

  return card;
}

/**
 * Reads parent configuration from first rows
 * Uses semantic detection instead of fixed positions to handle optional fields
 * @param {Element} block - The block element
 * @returns {Object} Parent configuration with configRowCount
 */
function readParentConfig(block) {
  const rows = [...block.children];
  const config = {
    targetCountries: '',
    targetLanguages: '',
    variant: 'horizontal',
    loading: 'lazy',
    configRowCount: 0, // Track how many rows are config vs cards
  };

  // Known values for semantic detection
  const variantValues = ['horizontal', 'vertical'];
  const loadingValues = ['lazy', 'eager'];

  let foundVariant = false;
  let foundLoading = false;
  let countryLangIndex = 0; // Track position of country/lang values (0 = countries, 1 = languages)

  // Iterate through rows and detect config values semantically
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const cell = row.querySelector('div > p');
    const value = cell?.textContent?.trim().toLowerCase() || '';

    if (!value) {
      // Empty row in targeting section - increment position tracker
      if (!foundVariant && !foundLoading && countryLangIndex < 2) {
        countryLangIndex += 1;
        config.configRowCount = i + 1;
      }
      // eslint-disable-next-line no-continue
      continue;
    }

    // Check if this is variant
    if (variantValues.includes(value)) {
      config.variant = value;
      foundVariant = true;
      config.configRowCount = i + 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    // Check if this is loading
    if (loadingValues.includes(value)) {
      config.loading = value;
      foundLoading = true;
      config.configRowCount = i + 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    // If we found both variant and loading, remaining rows are cards
    if (foundVariant && foundLoading) {
      break;
    }

    // Check if this row is a card (has image in first cell)
    const firstCell = row.children[0];
    const hasImage = firstCell?.querySelector('picture img');
    if (hasImage) {
      // This is a card row, stop config parsing
      break;
    }

    // Otherwise, treat as target country/language (comma-separated values or country codes)
    // Country codes are typically 2-letter (co, us, mx) or language codes (es, en)
    // Could be comma-separated: "co,mx,ec" or single value: "co"
    const isCountryOrLangFormat = /^[a-z]{2}(,[a-z]{2})*$/i.test(value);

    if (isCountryOrLangFormat) {
      // Use position-based assignment: position 0 = countries, position 1 = languages
      if (countryLangIndex === 0) {
        config.targetCountries = value;
        config.configRowCount = i + 1;
        countryLangIndex = 1;
      } else if (countryLangIndex === 1) {
        config.targetLanguages = value;
        config.configRowCount = i + 1;
        countryLangIndex = 2;
      }
    }
  }

  return config;
}

/**
 * Extracts props from a CMS Informative Cards Rail block.
 * Block structure (flexible order, optional fields):
 * - Target Countries (optional, comma-separated, e.g., "co,mx,ec")
 * - Target Languages (optional, comma-separated, e.g., "es,en")
 * - Variant (required, "horizontal" or "vertical")
 * - Loading strategy (required, "lazy" or "eager")
 * - Card data rows (one row per card)
 * Each card row contains cells with:
 * - Cell 0: Image - picture element
 * - Cell 1: Title - p element
 * - Cell 2: Details/Description - p element
 * - Cell 3: Action Type - p element ("none", "chevron") OR Empty (if button)
 * - Cell 4: Button text - p element (if action is button) OR Empty
 * - Cell 5: Link URL - .button-container > p > a OR p > a
 * @param {Element} block - The CMS Informative Cards Rail block element
 * @returns {Object} Configuration object with variant, gap, and cards array
 */
export function extractCmsInformativeCardsRailProps(block) {
  if (!block) return { variant: 'horizontal', gap: '16px', cards: [] };

  const rows = [...block.children];
  const config = readParentConfig(block);

  const props = {
    variant: config.variant === 'vertical' ? 'vertical' : 'horizontal',
    gap: '16px',
    cards: [],
    targetCountries: config.targetCountries,
    targetLanguages: config.targetLanguages,
    loading: config.loading === 'eager' ? 'eager' : 'lazy',
  };

  // Extract cards starting from the row after config rows
  // Use configRowCount to determine where cards start
  const cardStartIndex = config.configRowCount || 0;

  for (let i = cardStartIndex; i < rows.length; i += 1) {
    const row = rows[i];
    const cells = [...row.children];

    // Skip if row doesn't have enough cells
    if (cells.length >= 6) {
      const card = extractCardFromRow(cells);

      // Only add card if it has minimum required data
      if (card.title || card.image) {
        props.cards.push(card);
      }
    }
  }

  // Filter cards by country/language targeting (use kebab-case field names)
  props.cards = filterItemsByTargeting(props.cards, 'target-countries', 'target-languages');

  return props;
}

/**
 * Validates extracted props for debugging
 * @param {Object} props - Extracted props object
 * @returns {Object} Validation result with isValid and errors array
 */
export function validateCmsInformativeCardsRailProps(props) {
  const errors = [];

  if (!props || typeof props !== 'object') {
    return { isValid: false, errors: ['Props object is invalid'] };
  }

  if (!['horizontal', 'vertical'].includes(props.variant)) {
    errors.push(`Invalid variant: ${props.variant}. Must be 'horizontal' or 'vertical'`);
  }

  if (!props.cards || !Array.isArray(props.cards)) {
    errors.push('Cards array is missing or invalid');
  } else if (props.cards.length === 0) {
    errors.push('No cards found in block');
  } else {
    props.cards.forEach((card, index) => {
      if (!card.title && !card.details) {
        errors.push(`Card ${index + 1}: Missing both title and details`);
      }
      if (!card.image) {
        errors.push(`Card ${index + 1}: Missing image`);
      }
      if (card.buttonText && !card.buttonUrl) {
        errors.push(`Card ${index + 1}: Button text provided but no URL`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
