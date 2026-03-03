import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { FooterColumns } from '../../design-system/organisms/footer/footer-columns/footer-columns.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

/**
 * Maps footer columns HTML structure to an array of objects
 * @param {Element} block The footer-columns block element
 * @returns {Array} Array of column objects (max 5)
 */
function mapFooterColumns(block) {
  const columns = [];
  const columnElements = [...block.children];

  // Check each row independently to determine if it's targeting config
  // Row 0: country codes, Row 1: language codes - each validated separately
  const validCountries = ['co', 'ar', 'mx', 'pe', 'ec', 'sv', 'cr', 'br', 'bo', 'cl', 'ca', 'gt', 'hn', 'ni', 'pa', 'py', 'do', 'eu', 'gb', 'uy', 'ot', 'us'];
  const validLanguages = ['es', 'en', 'pt', 'fr'];
  let startIndex = 0;

  // Check row 0 for country targeting
  if (columnElements.length >= 1) {
    const firstRowValue = columnElements[0]?.children[0]?.textContent?.trim().toLowerCase();
    // Row is targeting if it has 1-2 columns AND either:
    // - Contains a valid country code/list
    // - Is empty (placeholder for "no country targeting")
    const hasOnlyTargetingColumns = columnElements[0].children.length <= 2;
    const hasValidCountryCode = firstRowValue
      && (validCountries.includes(firstRowValue) || firstRowValue.split(',').every((c) => validCountries.includes(c.trim())));
    const isEmpty = !firstRowValue || firstRowValue === '';

    if (hasOnlyTargetingColumns && (hasValidCountryCode || isEmpty)) {
      startIndex += 1;
    }
  }

  // Check row 1 for language targeting (independently of row 0)
  if (columnElements.length >= 2) {
    const adjustedIndex = startIndex; // Current position after row 0 check
    const secondRowValue = columnElements[adjustedIndex]?.children[0]?.textContent?.trim().toLowerCase();
    const hasOnlyTargetingColumns = columnElements[adjustedIndex].children.length <= 2;
    const hasValidLanguageCode = secondRowValue
      && (validLanguages.includes(secondRowValue) || secondRowValue.split(',').every((l) => validLanguages.includes(l.trim())));

    if (hasOnlyTargetingColumns && hasValidLanguageCode) {
      startIndex += 1;
    }
  }

  // Process maximum 5 columns (after skipping targeting rows if present)
  const actualColumnElements = columnElements.slice(startIndex);

  // Process ALL columns first, then filter and limit
  for (let i = 0; i < actualColumnElements.length; i += 1) {
    const columnElement = actualColumnElements[i];
    const columnData = {
      title: '',
      subItems: [],
    };

    // Extract title from first div > div > p
    const titleDiv = columnElement.querySelector('div > div > p');
    if (titleDiv) {
      columnData.title = titleDiv.textContent.trim();
    }

    // Extract subItems from second div > ul > li
    const listItems = columnElement.querySelectorAll('div:nth-child(2) ul li');
    listItems.forEach((li) => {
      // Check if there's an anchor tag inside the li
      const anchor = li.querySelector('a');

      if (anchor) {
        // Extract URL from anchor href
        const url = anchor.getAttribute('href') || '';
        // Extract label: prefer anchor text, fallback to text before "|" if exists
        const anchorText = anchor.textContent.trim();
        const fullText = li.textContent.trim();
        const parts = fullText.split('|').map((part) => part.trim());

        let label = anchorText;
        // If there's text before "|", use it as label
        const [firstPart] = parts;
        if (parts.length >= 2 && firstPart && firstPart !== anchorText) {
          label = firstPart;
        }

        if (url) {
          columnData.subItems.push({
            label: label || anchorText,
            url,
          });
        }
      } else {
        // Fallback to original text parsing format "Label | /label"
        const text = li.textContent.trim();
        const parts = text.split('|').map((part) => part.trim());

        if (parts.length === 2) {
          columnData.subItems.push({
            label: parts[0],
            url: parts[1],
          });
        }
      }
    });

    columns.push(columnData);
  }

  // Filter out empty columns (no title AND no subItems)
  const filteredColumns = columns.filter(
    (col) => col.title || (col.subItems && col.subItems.length > 0),
  );

  // Limit to maximum 5 columns AFTER filtering
  const finalColumns = filteredColumns.slice(0, 5);

  return finalColumns;
}

/**
 * Decorates the Footer Columns block
 * @param {Element} block The footer-columns block element
 */
export default function decorate(block) {
  // 1. Detect Author Mode
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    // Preserve editable content
    block.classList.add('footer-columns-author-mode');

    const authorIndicator = document.createElement('div');
    authorIndicator.textContent = '📂 Footer Columns (Author Mode - Edit below)';
    authorIndicator.className = 'bg-[var(--color-gray-100)] p-2 border border-dashed border-[var(--color-border-stroke-focus)] mb-2 text-xs text-[var(--color-text-normal-secondary)]';
    block.insertBefore(authorIndicator, block.firstChild);

    return;
  }

  // Targeting check - hide if not matching current POS
  const config = readBlockConfig(block);
  
  // Leer targeting desde config (formato estándar: target-countries | co)
  let targetCountries = config['target-countries'] || '';
  let targetLanguages = config['target-languages'] || '';
  
  // Fallback: Si no hay config con nombre, leer de las primeras dos filas simples
  // SOLO si el contenido parece ser un código de país/idioma válido
  if (!targetCountries && !targetLanguages) {
    const validCountries = ['co', 'ar', 'mx', 'pe', 'ec', 'sv', 'cr', 'br', 'bo', 'cl', 'ca', 'gt', 'hn', 'ni', 'pa', 'py', 'do', 'eu', 'gb', 'uy', 'ot', 'us'];
    const validLanguages = ['es', 'en', 'pt', 'fr'];
    
    const rows = block.querySelectorAll(':scope > div');
    if (rows.length >= 2) {
      const firstRowValue = rows[0]?.children[0]?.textContent?.trim().toLowerCase();
      // Solo usar si es un código de país válido (2-3 letras) o lista separada por comas
      if (firstRowValue && (validCountries.includes(firstRowValue) || firstRowValue.split(',').every((c) => validCountries.includes(c.trim())))) {
        targetCountries = firstRowValue;
      }
      
      const secondRowValue = rows[1]?.children[0]?.textContent?.trim().toLowerCase();
      // Solo usar si es un código de idioma válido o lista separada por comas
      if (secondRowValue && (validLanguages.includes(secondRowValue) || secondRowValue.split(',').every((l) => validLanguages.includes(l.trim())))) {
        targetLanguages = secondRowValue;
      }
    }
  }

  if (!shouldShowByTargeting(targetCountries, targetLanguages)) {
    block.style.display = 'none';
    return;
  }

  // 2. Map block data
  const mappedData = mapFooterColumns(block);

  // Verify if there is data before rendering
  const hasContent = mappedData.length > 0 && mappedData.some(
    (col) => col.title || (col.subItems && col.subItems.length > 0),
  );

  // 3. Production Mode: render Preact component
  const container = document.createElement('div');

  // Solo renderizar si hay contenido
  if (hasContent) {
    render(
      html`<${FooterColumns} columns=${mappedData} />`,
      container,
    );
  }

  // 4. Find the footer-columns-wrapper container in the footer
  const injectIntoFooter = () => {
    const footerWrapper = document.querySelector('.footer-columns-wrapper');
    if (footerWrapper) {
      // PROTECTION: Skip if container already has content (first matching block wins)
      if (footerWrapper.children.length > 0) {
        // eslint-disable-next-line no-console
        console.log('[footer-columns] Skipping render - container already has content');
        block.classList.add('hidden');
        return true;
      }

      // Verify if there is content to display
      if (hasContent && container.children.length > 0) {
        footerWrapper.appendChild(container);
        footerWrapper.classList.remove('hidden');
      } else {
        // If there is no content, hide the wrapper to avoid style conflicts
        footerWrapper.classList.add('hidden');
      }
      return true;
    }
    return false;
  };

  // Attempt to inject immediately
  if (!injectIntoFooter()) {
    // If the wrapper is not found, wait a bit and retry
    // This is useful if the footer loads asynchronously
    const retryInterval = setInterval(() => {
      if (injectIntoFooter()) {
        clearInterval(retryInterval);
      }
    }, 100);

    // Timeout after 5 seconds as fallback
    setTimeout(() => {
      clearInterval(retryInterval);
      // If not found after 5 seconds, insert as sibling
      if (!document.querySelector('.footer-columns-wrapper')?.contains(container)) {
        block.parentNode.insertBefore(container, block.nextSibling);
      }
    }, 5000);
  }

  // 5. Hide & Render Sibling Pattern:
  // Hide original block (DO NOT remove - preserve for Universal Editor)
  block.classList.add('hidden');
}
