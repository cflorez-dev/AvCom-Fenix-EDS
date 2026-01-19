/**
 * Extracts props from a CMS Informative Cards Rail block.
 * 
 * Block structure:
 * - Row 0: Variant (horizontal/vertical)
 * - Row 1: Loading strategy (lazy/eager)
 * - Rows 2+: Card data rows
 * 
 * Each card row contains cells with:
 * - Cell 0: Image - picture element
 * - Cell 1: Title - p element
 * - Cell 2: Details/Description - p element
 * - Cell 3: Action Type - p element ("none", "chevron") OR Empty (if button)
 * - Cell 4: Button text - p element (if action is button) OR Empty
 * - Cell 5: Link URL - .button-container > p > a OR p > a
 * 
 * @param {Element} block - The CMS Informative Cards Rail block element
 * @returns {Object} Configuration object with variant, gap, and cards array
 */
export function extractCmsInformativeCardsRailProps(block) {
  if (!block) return { variant: 'horizontal', gap: '16px', cards: [] };

  const rows = [...block.children];
  const props = {
    variant: 'horizontal',
    gap: '16px',
    cards: [],
  };

  // Extract variant from row 0
  if (rows[0]) {
    const variantCell = rows[0].querySelector('div > p');
    if (variantCell) {
      const variantValue = variantCell.textContent.trim().toLowerCase();
      props.variant = variantValue === 'vertical' ? 'vertical' : 'horizontal';
    }
  }

  // Extract cards starting from row 2
  for (let i = 2; i < rows.length; i += 1) {
    const row = rows[i];
    const cells = [...row.children];

    // Skip if row doesn't have enough cells
    if (cells.length < 6) continue;

    const card = extractCardFromRow(cells);
    
    // Only add card if it has minimum required data
    if (card.title || card.image) {
      props.cards.push(card);
    }
  }

  return props;
}

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
    }
  }

  // Cell 1: Title
  if (cells[1]) {
    const titleP = cells[1].querySelector('p');
    if (titleP) {
      card.title = titleP.textContent.trim();
    }
  }

  // Cell 2: Details
  if (cells[2]) {
    const detailsP = cells[2].querySelector('p');
    if (detailsP) {
      card.details = detailsP.textContent.trim();
    }
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
  if (buttonTextFromCell4) {
    // Cell 4 has button text -> it's a button
    card.actionType = 'button';
    card.buttonText = buttonTextFromCell4;
    card.showChevron = false;
  } else if (actionTypeFromCell3 === 'chevron') {
    // Cell 3 says "chevron"
    card.actionType = 'chevron';
    card.showChevron = true;
  } else if (actionTypeFromCell3 === 'none') {
    // Cell 3 says "none"
    card.actionType = 'none';
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

  return card;
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
