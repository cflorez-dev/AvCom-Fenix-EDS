import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { FooterColumns } from '../../design-system/organisms/footer/footer-columns/footer-columns.js';

const html = htm.bind(h);

/**
 * Maps footer columns HTML structure to an array of objects
 * @param {Element} block The footer-columns block element
 * @returns {Array} Array of column objects (max 5)
 */
function mapFooterColumns(block) {
  const columns = [];
  const columnElements = [...block.children];

  // Process maximum 5 columns
  const maxColumns = Math.min(columnElements.length, 5);

  for (let i = 0; i < maxColumns; i += 1) {
    const columnElement = columnElements[i];
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

  return columns;
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
      // Clear the wrapper
      footerWrapper.innerHTML = '';

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
