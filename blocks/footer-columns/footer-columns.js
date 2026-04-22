import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { FooterColumns } from '../../design-system/organisms/footer/footer-columns/footer-columns.js';
import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';
import { isSafeUrl } from '../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * Gets the text content of a specific cell within a block element.
 * Tries: p tag → first child element → direct textContent.
 * @param {Element} el - Parent element containing cells as direct children
 * @param {number} index - Cell index (0-based)
 * @returns {string} Trimmed text content of the cell
 */
function getCellText(el, index) {
  const cell = el?.children[index];
  if (!cell) return '';
  return cell.querySelector('p')?.textContent?.trim()
    || cell.children[0]?.textContent?.trim()
    || cell.textContent?.trim()
    || '';
}

/**
 * Maps footer columns HTML structure to an array of objects
 * @param {Element} block The footer-columns block element
 * @returns {Array} Array of column objects (max 5)
 */
function mapFooterColumns(block) {
  const columns = [];
  const columnElements = [...block.children];

  // Rows 0 and 1 are always targeting fields (target-countries, target-languages)
  // consistent with how decorate() reads them positionally
  const actualColumnElements = columnElements.slice(2);

  // Process ALL columns first, then filter and limit
  for (let i = 0; i < actualColumnElements.length; i += 1) {
    const columnElement = actualColumnElements[i];

    // --- Item-level targeting (positional) ---
    // Model fields: 0=title, 1=content, 2=target-countries, 3=target-languages
    const itemCountries = getCellText(columnElement, 2);
    const itemLanguages = getCellText(columnElement, 3);

    if (itemCountries || itemLanguages) {
      if (!shouldShowByTargeting(itemCountries, itemLanguages)) {
        // Skip this column item - targeting does not match
        continue; // eslint-disable-line no-continue
      }
    }

    const columnData = {
      title: '',
      subItems: [],
    };

    // Title is always at cell 0
    columnData.title = getCellText(columnElement, 0);

    // Links are always at cell 1
    const listItems = columnElement.children[1]?.querySelectorAll('ul li') || [];
    listItems.forEach((li) => {
      // Check if there's an anchor tag inside the li
      const anchor = li.querySelector('a');

      if (anchor) {
        const rawUrl = anchor.getAttribute('href') || '';
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

        if (rawUrl) {
          columnData.subItems.push({
            label: label || anchorText,
            // Validate URL at point of use to prevent XSS via javascript:, data:, etc.
            url: isSafeUrl(rawUrl) ? rawUrl : '#',
          });
        }
      } else {
        // Fallback to original text parsing format "Label | /label"
        const text = li.textContent.trim();
        const parts = text.split('|').map((part) => part.trim());

        if (parts.length === 2) {
          const [fallbackLabel, fallbackUrl] = parts;
          columnData.subItems.push({
            label: fallbackLabel,
            // Validate URL at point of use to prevent XSS via javascript:, data:, etc.
            url: isSafeUrl(fallbackUrl) ? fallbackUrl : '#',
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

  const rows = [...block.children];
  const getRowText = (rowIndex) => {
    const row = rows[rowIndex];
    if (!row || !row.children.length) return '';
    // Use children[0] pattern consistent with other EDS blocks
    return row.children[0]?.textContent?.trim() || '';
  };

  const targetCountries = getRowText(0);
  const targetLanguages = getRowText(1);

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
