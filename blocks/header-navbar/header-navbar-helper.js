/**
 * Helper functions for Header Navbar block
 */

import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';

/**
 * Parses the ?ueLinkMode query param from a URL and returns openMode + clean URL.
 * Modes: default | icon | newtab | icon-newtab
 * @param {string} rawUrl
 * @returns {{ url: string, openMode: string }}
 */
function parseUeLinkMode(rawUrl) {
  if (!rawUrl || rawUrl === '#') return { url: rawUrl || '#', openMode: 'default' };
  try {
    // Support relative URLs by prepending a dummy base
    const base = rawUrl.startsWith('http') ? undefined : 'https://x.x';
    const parsed = new URL(rawUrl, base);
    const mode = parsed.searchParams.get('ueLinkMode') || 'default';
    parsed.searchParams.delete('ueLinkMode');
    // Reconstruct: if relative, remove the dummy base
    const cleanUrl = base
      ? parsed.pathname + (parsed.search || '') + (parsed.hash || '')
      : parsed.toString();
    return { url: cleanUrl || '#', openMode: mode };
  } catch {
    return { url: rawUrl, openMode: 'default' };
  }
}

/**
 * Parses a sub-item string in format "label | url | icon"
 * @param {string} subItemText - Text content from <li> element
 *   (e.g., "item 1 | /item-1 | item-1-icon")
 * @returns {Object} Object with label, url, iconName, and openMode
 */
function parseSubItem(subItemText) {
  if (!subItemText || typeof subItemText !== 'string') {
    return {
      label: '',
      url: '#',
      iconName: '',
      openMode: 'default',
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
      openMode: 'default',
    };
  }

  // Split by pipe character and trim each part
  const parts = trimmed.split('|').map((part) => part.trim()).filter((part) => part.length > 0);
  const rawUrl = parts[1] || '#';
  const { url, openMode } = parseUeLinkMode(rawUrl);

  return {
    label: parts[0] || '',
    url,
    iconName: parts[2] || '',
    openMode,
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
 * Parses one `header-megamenu-column` block element from the nav page.
 * Row 0 = column title, Row 1 = links richtext (ul/li).
 * Row 2 = target-countries (comma-separated), Row 3 = target-languages.
 * @param {Element} blockEl - The .header-megamenu-column block element
 * @returns {{ title: string, items: Array, targetCountries: string, targetLanguages: string }|null}
 */
function parseMegamenuColumnBlock(blockEl) {
  if (!blockEl || !blockEl.textContent?.trim()) return null;

  const rows = Array.from(blockEl.children);

  // Row 0, Cell 0 → title
  const titleEl = rows[0]?.querySelector('p, strong, b, h2, h3, h4, h5, h6');
  const title = titleEl?.textContent?.trim() || rows[0]?.textContent?.trim() || '';

  // Row 1, Cell 0 → links rich text (ul/li with optional <a>)
  const linksCell = rows[1]?.querySelector('div') || rows[1];
  const items = [];

  if (linksCell) {
    const listItems = linksCell.querySelectorAll('li');
    listItems.forEach((li) => {
      const rawText = li.textContent?.trim() || '';
      const anchor = li.querySelector('a');
      const anchorHref = anchor ? (anchor.getAttribute('href') || '').trim() : '';

      if (rawText) {
        const parsed = parseSubItem(rawText);
        if (anchorHref) {
          const { url, openMode } = parseUeLinkMode(anchorHref);
          parsed.url = url;
          parsed.openMode = openMode;
          // When the <a> only wraps the label (normal AEM authoring), li.textContent is
          // "label | icon-name" — parseSubItem mistakes "icon-name" for the url, leaving
          // parsed.iconName empty. Recover iconName from the non-anchor text nodes.
          if (!parsed.iconName) {
            const nonAnchorText = Array.from(li.childNodes)
              .filter((n) => n !== anchor)
              .map((n) => n.textContent.trim())
              .join('')
              .replace(/^\|+\s*/, '') // strip leading pipe(s)
              .trim();
            if (nonAnchorText) parsed.iconName = nonAnchorText;
          }
          // Ensure label is clean anchor text (no pipe artifacts)
          parsed.label = anchor.textContent.trim().split('|')[0].trim();
        }
        if (parsed.label) items.push(parsed);
      }
    });

    // Standalone links not in <li>
    const standaloneLinks = linksCell.querySelectorAll('p > a, div > a');
    standaloneLinks.forEach((a) => {
      const rawHref = a.getAttribute('href') || '';
      const linkLabel = a.textContent?.trim() || '';
      if (linkLabel && rawHref && !items.some((i) => i.label === linkLabel)) {
        const { url, openMode } = parseUeLinkMode(rawHref);
        items.push({
          label: linkLabel, url, iconName: '', openMode,
        });
      }
    });
  }

  if (!title && items.length === 0) return null;

  // Row 2 = target-countries, Row 3 = target-languages
  const targetCountries = rows[2]?.textContent?.trim() || '';
  const targetLanguages = rows[3]?.textContent?.trim() || '';

  return {
    title, items, targetCountries, targetLanguages,
  };
}

/**
 * Parses a nav-page section element into megamenu content.
 * Finds up to 3 `header-megamenu-column` blocks for the link columns,
 * and any remaining non-column block as the CMS panel.
 * If a `header-megamenu-form` block is present it takes priority over any
 * CMS block — `formType` will be set and `cmsBlock` will be null.
 * @param {Element} sectionEl - The section DOM element (e.g. .megamenu-lifemiles)
 * @returns {{ columns: Array, cmsBlock: Element|null, formType: string|null }}
 */
export function parseMegamenuSection(sectionEl) {
  if (!sectionEl) return {
    columns: [], cmsBlock: null, formType: null, formLabel: '',
  };

  const columnBlocks = Array.from(
    sectionEl.querySelectorAll('.header-megamenu-column'),
  );
  const columns = columnBlocks
    .map((b) => parseMegamenuColumnBlock(b))
    .filter(Boolean)
    .filter((col) => shouldShowByTargeting(col.targetCountries, col.targetLanguages))
    .slice(0, 3);

  // Check for a form block first — it takes priority over any CMS block.
  const formBlock = sectionEl.querySelector('.header-megamenu-form');
  if (formBlock) {
    const rows = Array.from(formBlock.children);
    // Row 0 = form-type
    // New format: Row 1 = form-label, Row 2 = target-countries, Row 3 = target-languages
    // Old format (backward compat): Row 1 = target-countries, Row 2 = target-languages
    const formType = rows[0]?.textContent?.trim() || 'cabin-upgrade';
    const row1Text = rows[1]?.textContent?.trim() || '';

    // Detect old format: row 1 is empty or matches comma-separated 2-letter ISO codes
    const isPosCode = row1Text === '' || /^[a-z]{2}(,[a-z]{2})*$/i.test(row1Text);

    let formLabel = '';
    let formTargetCountries;
    let formTargetLanguages;

    if (isPosCode) {
      // Old format — no label field
      formTargetCountries = row1Text;
      formTargetLanguages = rows[2]?.textContent?.trim() || '';
    } else {
      // New format — label present
      formLabel = row1Text;
      formTargetCountries = rows[2]?.textContent?.trim() || '';
      formTargetLanguages = rows[3]?.textContent?.trim() || '';
    }

    if (!shouldShowByTargeting(formTargetCountries, formTargetLanguages)) {
      // Form block is filtered out — fall through to CMS block
    } else {
      return {
        columns, cmsBlock: null, formType, formLabel,
      };
    }
  }

  // Find first CMS block in section subtree.
  // Direct children of the section are EDS wrapper divs (not blocks themselves),
  // so we use querySelector to find the block at any depth.
  const cmsBlock = sectionEl.querySelector(
    '.block:not(.header-megamenu-column)',
  ) || null;

  return { columns, cmsBlock, formType: null, formLabel: '' };
}

/**
 * Extracts a single navbar item from a row element.
 * Column positions:
 *   col[0] = label
 *   col[1] = url
 *   col[2] = icon name
 *   col[3] = submenu (legacy rich text, <ul><li> pipe format)
 *   col[4] = target-countries
 *   col[5] = target-languages
 *   col[6] = megamenu-anchor (CSS class of a nav-page section, e.g. 'megamenu-lifemiles')
 * @param {Element} rowElement
 * @returns {Object|null}
 */
function extractNavbarItem(rowElement) {
  if (!rowElement || !rowElement.children) {
    return null;
  }

  const cols = Array.from(rowElement.children);

  // Columna 0: label
  const labelCol = cols[0];
  const label = labelCol?.querySelector('p')?.textContent?.trim()
                || labelCol?.textContent?.trim()
                || '';

  if (!label) return null;

  // Columna 1: url
  const urlCol = cols[1];
  let url = '#';
  if (urlCol) {
    const link = urlCol.querySelector('a');
    if (link) {
      url = link.getAttribute('href') || link.textContent?.trim() || '#';
    } else {
      url = urlCol.textContent?.trim() || '#';
    }
  }

  // Columna 2: iconName
  const iconCol = cols[2];
  const iconName = iconCol?.querySelector('p')?.textContent?.trim()
                   || iconCol?.textContent?.trim()
                   || '';

  // Columna 3: legacy submenu (subItems <ul><li>)
  const col3 = cols[3];
  const subItems = extractSubItems(col3);

  // Columna 4: target-countries, Columna 5: target-languages
  const targetCountries = cols[4]?.textContent?.trim() || '';
  const targetLanguages = cols[5]?.textContent?.trim() || '';

  // Columna 6: megamenu-anchor (CSS class of a nav-page section)
  const megamenuAnchor = cols[6]?.textContent?.trim() || '';

  const item = {
    label,
    url: url || '#',
    iconName,
    'target-countries': targetCountries,
    'target-languages': targetLanguages,
  };

  if (megamenuAnchor) {
    // Megamenu: columns are resolved later via DOM lookup in header-navbar.js
    item.megamenu = { anchor: megamenuAnchor };
  } else if (subItems.length > 0) {
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
    const isEmptyLanguage = !secondRowValue || secondRowValue === '';

    if (hasOnlyTargetingColumns && (hasValidLanguageCode || isEmptyLanguage)) {
      startIndex += 1;
    }
  }

  // Check next row for a hex color value (hover-accent-color UE model field).
  // AEM UE writes single-column value rows — the hex color would be read as a nav
  // item label without this guard.
  if (rows.length > startIndex) {
    const colorRowValue = rows[startIndex]?.children[0]?.textContent?.trim();
    const hasOneOrTwoColumns = rows[startIndex].children.length <= 2;
    const isHexColor = /^#[0-9a-fA-F]{3,8}$/.test(colorRowValue || '');
    if (hasOneOrTwoColumns && isHexColor) {
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

    // Megamenu: anchor pointer — columns resolved later via parseMegamenuSection
    if (item.megamenu) {
      section.megamenu = { anchor: item.megamenu.anchor };
      return section;
    }

    // Legacy dropdown format: flat subItems list
    if (item.subItems && Array.isArray(item.subItems) && item.subItems.length > 0) {
      section.subItems = item.subItems.map((subItem) => ({
        itemLabel: subItem.label || '',
        url: subItem.url || '#',
        openMode: subItem.openMode || 'default',
      }));
    }

    return section;
  });
}
