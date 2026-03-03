/**
 * Helper functions for Header Navbar block
 */

/**
 * Parses a sub-item string in format "label | url | icon"
 * @param {string} subItemText - Text content from <li> element
 *   (e.g., "item 1 | /item-1 | item-1-icon")
 * @returns {Object} Object with label, url, and iconName
 */
function parseSubItem(subItemText) {
  if (!subItemText || typeof subItemText !== 'string') {
    return {
      label: '',
      url: '#',
      iconName: '',
    };
  }

  // Trim the input
  const trimmed = subItemText.trim();

  // If no pipe character, treat entire string as label
  if (!trimmed.includes('|')) {
    return {
      label: trimmed,
      url: '#',
      iconName: '',
    };
  }

  // Split by pipe character and trim each part
  const parts = trimmed.split('|').map((part) => part.trim()).filter((part) => part.length > 0);

  return {
    label: parts[0] || '',
    url: parts[1] || '#',
    iconName: parts[2] || '',
  };
}

/**
 * Extracts sub-items from a column element containing a <ul> with <li> elements
 * @param {Element} subItemsColumn - The column element (typically column 3) containing sub-items
 * @returns {Array} Array of sub-item objects with label, url, and iconName
 */
function extractSubItems(subItemsColumn) {
  if (!subItemsColumn) {
    return [];
  }

  const subItems = [];
  const getAnchorHref = (element) => {
    const link = element?.querySelector('a');
    if (!link) return '';
    return (link.getAttribute('href') || link.href || '').trim();
  };

  // Find all <ul> elements in the column
  const lists = subItemsColumn.querySelectorAll('ul');

  lists.forEach((list) => {
    // Get all <li> elements
    const listItems = list.querySelectorAll('li');

    listItems.forEach((li) => {
      // Get text content from <li>
      const subItemText = li.textContent?.trim() || '';
      const anchorHref = getAnchorHref(li);

      if (subItemText) {
        const subItem = parseSubItem(subItemText);
        if (anchorHref) {
          subItem.url = anchorHref;
        }
        if (subItem.label) {
          subItems.push(subItem);
        }
      }
    });
  });

  // Also check if there are direct text nodes or <p> elements with sub-item format
  const paragraphs = subItemsColumn.querySelectorAll('p');
  paragraphs.forEach((p) => {
    const text = p.textContent?.trim() || '';
    const anchorHref = getAnchorHref(p);
    if (text && text.includes('|')) {
      const subItem = parseSubItem(text);
      if (anchorHref) {
        subItem.url = anchorHref;
      }
      if (subItem.label
        && !subItems.some((item) => item.label === subItem.label && item.url === subItem.url)) {
        subItems.push(subItem);
      }
    }
  });

  return subItems;
}

/**
 * Extracts a single navbar item from a row element
 * @param {Element} rowElement - The row element containing the item data
 * @returns {Object|null} Object with label, url, iconName, and subItems array, or null if invalid
 */
function extractNavbarItem(rowElement) {
  if (!rowElement || !rowElement.children) {
    return null;
  }

  const cols = Array.from(rowElement.children);

  // Columna 0: label (Menu item label)
  const labelCol = cols[0];
  const label = labelCol?.querySelector('p')?.textContent?.trim()
                || labelCol?.textContent?.trim()
                || '';

  // Si no hay label, el item no es válido
  if (!label) {
    return null;
  }

  // Columna 1: url (Menu item URL)
  const urlCol = cols[1];
  let url = '#';
  if (urlCol) {
    const link = urlCol.querySelector('a');
    if (link) {
      url = link.getAttribute('href') || link.textContent?.trim() || '#';
    } else {
      // Si no hay link, buscar en el texto
      url = urlCol.textContent?.trim() || '#';
    }
  }

  // Columna 2: iconName (Menu item Icon Name)
  const iconCol = cols[2];
  const iconName = iconCol?.querySelector('p')?.textContent?.trim()
                   || iconCol?.textContent?.trim()
                   || '';

  // Columna 3: subItems (Sub-menu items)
  const subItemsCol = cols[3];
  const subItems = extractSubItems(subItemsCol);

  // Columna 4: target-countries (Optional - targeting per menu item)
  const targetCountries = cols[4]?.textContent?.trim() || '';

  // Columna 5: target-languages (Optional - targeting per menu item)
  const targetLanguages = cols[5]?.textContent?.trim() || '';

  // Construir el objeto del item
  const item = {
    label,
    url: url || '#',
    iconName,
    'target-countries': targetCountries,
    'target-languages': targetLanguages,
  };

  // Solo agregar subItems si hay elementos
  if (subItems.length > 0) {
    item.subItems = subItems;
  }

  return item;
}

/**
 * Extracts all header navbar data from the block element
 * @param {Element} block - The header-navbar block element
 * @returns {Object} Object containing extracted navbar data
 *
 * Structure returned:
 * {
 *   items: [
 *     {
 *       label: string,        // Menu item label
 *       url: string,          // Menu item URL
 *       iconName: string,     // Menu item icon name
 *       subItems?: [          // Optional sub-items array
 *         {
 *           label: string,    // Sub item label
 *           url: string,      // Sub item URL
 *           iconName: string  // Sub item icon name
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export function extractHeaderNavbarData(block) {
  if (!block) {
    return {
      items: [],
    };
  }

  const items = [];

  // Process each child row (each row is a menu item)
  const rows = Array.from(block.children);

  // Check each row independently to determine if it's targeting config
  // Row 0: country codes, Row 1: language codes - each validated separately
  const validCountries = ['co', 'ar', 'mx', 'pe', 'ec', 'sv', 'cr', 'br', 'bo', 'cl', 'ca', 'gt', 'hn', 'ni', 'pa', 'py', 'do', 'eu', 'gb', 'uy', 'ot', 'us'];
  const validLanguages = ['es', 'en', 'pt', 'fr'];
  let startIndex = 0;

  // Check row 0 for country targeting
  if (rows.length >= 1) {
    const firstRowValue = rows[0]?.children[0]?.textContent?.trim().toLowerCase();
    const hasOnlyTargetingColumns = rows[0].children.length <= 2;
    const hasValidCountryCode = firstRowValue
      && (validCountries.includes(firstRowValue) || firstRowValue.split(',').every((c) => validCountries.includes(c.trim())));
    const isEmpty = !firstRowValue || firstRowValue === '';

    if (hasOnlyTargetingColumns && (hasValidCountryCode || isEmpty)) {
      startIndex += 1;
    }
  }

  // Check row 1 for language targeting (independently of row 0)
  if (rows.length >= 2) {
    const adjustedIndex = startIndex;
    const secondRowValue = rows[adjustedIndex]?.children[0]?.textContent?.trim().toLowerCase();
    const hasOnlyTargetingColumns = rows[adjustedIndex].children.length <= 2;
    const hasValidLanguageCode = secondRowValue
      && (validLanguages.includes(secondRowValue) || secondRowValue.split(',').every((l) => validLanguages.includes(l.trim())));

    if (hasOnlyTargetingColumns && hasValidLanguageCode) {
      startIndex += 1;
    }
  }

  rows.slice(startIndex).forEach((row) => {
    // Ignorar elementos que no son items (como indicadores de autor, etc.)
    if (row.classList.contains('header-navbar-author-indicator')
        || row.classList.contains('header-navbar-author-mode')) {
      return;
    }

    const item = extractNavbarItem(row);
    if (item) {
      items.push(item);
    }
  });

  return {
    items,
  };
}

/**
 * Validates that the extracted data matches the expected structure
 * @param {Object} data - The extracted navbar data
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateHeaderNavbarData(data) {
  const errors = [];

  if (!data) {
    errors.push('Data is null or undefined');
    return { isValid: false, errors };
  }

  // Validar items
  if (!Array.isArray(data.items)) {
    errors.push('Items must be an array');
    return { isValid: false, errors };
  }

  // Validar cada item
  data.items.forEach((item, index) => {
    if (!item.label || typeof item.label !== 'string') {
      errors.push(`Item ${index}: missing or invalid label`);
    }
    if (!item.url || typeof item.url !== 'string') {
      errors.push(`Item ${index}: missing or invalid url`);
    }
    if (item.iconName && typeof item.iconName !== 'string') {
      errors.push(`Item ${index}: iconName must be a string if provided`);
    }
    if (item.subItems) {
      if (!Array.isArray(item.subItems)) {
        errors.push(`Item ${index}: subItems must be an array if provided`);
      } else {
        item.subItems.forEach((subItem, subIndex) => {
          if (!subItem.label || typeof subItem.label !== 'string') {
            errors.push(`Item ${index}, Sub-item ${subIndex}: missing or invalid label`);
          }
          if (!subItem.url || typeof subItem.url !== 'string') {
            errors.push(`Item ${index}, Sub-item ${subIndex}: missing or invalid url`);
          }
          if (subItem.iconName && typeof subItem.iconName !== 'string') {
            errors.push(`Item ${index}, Sub-item ${subIndex}: iconName must be a string if provided`);
          }
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Converts navbar data from header-navbar format to Navbar component format
 * @param {Object} navbarData - Data in format: { items: [{ label, url, iconName, subItems? }] }
 * @returns {Array} Array in format: [{ itemLabel, url, subItems? }] for Navbar component
 */
export function convertToNavbarSections(navbarData) {
  if (!navbarData || !navbarData.items || !Array.isArray(navbarData.items)) {
    return [];
  }

  return navbarData.items.map((item) => {
    const section = {
      itemLabel: item.label || '',
      url: item.url || '#',
    };

    // Convert subItems if they exist
    if (item.subItems && Array.isArray(item.subItems) && item.subItems.length > 0) {
      section.subItems = item.subItems.map((subItem) => ({
        itemLabel: subItem.label || '',
        url: subItem.url || '#',
      }));
    }

    return section;
  });
}
