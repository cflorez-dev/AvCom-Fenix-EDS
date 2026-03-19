import { createOptimizedPicture } from '../../scripts/aem.js';
import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';

/**
 * Gets the text content of a specific cell within an element.
 * Tries: p tag → first child element → direct textContent.
 * @param {Element} el - Parent element
 * @param {number} index - Cell index (0-based)
 * @returns {string} Trimmed text content
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
 * Derives a readable label from a URL path/host.
 * @param {string} value
 * @returns {string}
 */
function deriveNameFromUrl(value) {
  if (!value) return '';
  try {
    const parsed = new URL(value, window.location.origin);
    const lastPath = parsed.pathname.split('/').filter(Boolean).pop() || '';
    const base = lastPath || parsed.hostname.replace(/^www\./, '');
    return decodeURIComponent(base)
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
  } catch (e) {
    return '';
  }
}

/**
 * Resolves a stable accessible name for partner logos.
 * @param {Object} item
 * @param {number} index
 * @returns {string}
 */
function getAccessiblePartnerName(item, index) {
  const explicitAlt = item.imageAlt?.trim();
  if (explicitAlt) return explicitAlt;

  const fromLink = deriveNameFromUrl(item.redirectUrl);
  if (fromLink) return fromLink;

  const fromImage = deriveNameFromUrl(item.imageUrl);
  if (fromImage) return fromImage;

  return `Partner ${index + 1}`;
}

/**
 * Maps the footer partners logos block data.
 * Block model fields: 0=target-countries, 1=target-languages
 * Item model fields:  0=image, 1=alt, 2=url, 3=target-countries, 4=target-languages
 * @param {Element} block The footer-partners-logos block element
 * @returns {Array<{imageUrl: string, imageAlt: string, redirectUrl: string}>}
 * Array of partner logo data
 */
export function mapFooterPartnersLogosData(block) {
  const items = [];

  // Rows 0 and 1 are always targeting fields (target-countries, target-languages)
  const contentChildren = [...block.children].slice(2);

  contentChildren.forEach((item) => {
    // Item-level targeting: positional fields 3=target-countries, 4=target-languages
    const itemCountries = getCellText(item, 3);
    const itemLanguages = getCellText(item, 4);

    if ((itemCountries || itemLanguages)
      && !shouldShowByTargeting(itemCountries, itemLanguages)) {
      return; // Skip this item
    }
    // Extract image URL from picture > img
    const img = item.querySelector('picture img');
    const imageUrl = img?.src || img?.getAttribute('src') || '';

    // Extract image alt text
    const imageAlt = img?.alt || img?.getAttribute('alt') || '';

    // Extract redirect URL from button-container > p > a
    const link = item.querySelector('.button-container a');
    const redirectUrl = link?.href || link?.getAttribute('href') || '';

    items.push({
      imageUrl,
      imageAlt,
      redirectUrl,
    });
  });

  return items;
}

/**
 * Renders footer partners logos from data
 * @param {Array<{imageUrl: string, imageAlt: string, redirectUrl: string}>} items
 * Array of partner logo data
 * @returns {DocumentFragment} Fragment containing rendered logos
 */
export function renderFooterPartnersLogos(items) {
  const fragment = document.createDocumentFragment();

  items.forEach((item, index) => {
    // Skip if no image URL
    if (!item.imageUrl) return;

    const accessibleName = getAccessiblePartnerName(item, index);

    // Create picture element with optimized image
    const picture = createOptimizedPicture(
      item.imageUrl,
      item.imageAlt || accessibleName,
      false,
      [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
    );

    // If there's a redirect URL, wrap picture in an anchor
    if (item.redirectUrl) {
      const anchor = document.createElement('a');
      anchor.href = item.redirectUrl;
      anchor.setAttribute('aria-label', accessibleName);
      anchor.appendChild(picture);
      fragment.appendChild(anchor);
    } else {
      fragment.appendChild(picture);
    }
  });

  return fragment;
}

/**
 * Decorates the footer partners logos block
 * @param {Element} block The footer-partners-logos block element
 */
export default function decorate(block) {
  // Detect if we're in Universal Editor author environment
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    block.classList.add('footer-partners-logos-author-mode');
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'footer-partners-logos-author-indicator';
    authorIndicator.textContent = '🏢 Footer Partners Logos Block (Author Mode - Edit below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #ccc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);
    // Don't transform the block - keep it editable
    return;
  }

  // 2. Block-level targeting: positional rows 0=target-countries, 1=target-languages
  const rows = [...block.children];
  const getRowText = (rowIndex) => {
    const row = rows[rowIndex];
    if (!row || !row.children.length) return '';
    return row.children[0]?.textContent?.trim() || '';
  };

  const targetCountries = getRowText(0);
  const targetLanguages = getRowText(1);

  if (!shouldShowByTargeting(targetCountries, targetLanguages)) {
    block.style.display = 'none';
    return;
  }

  // 2. Mapear datos del bloque
  const logosData = mapFooterPartnersLogosData(block);

  // 3. Modo Producción: renderizar logos
  const container = document.createElement('div');
  container.className = 'footer-partners-logos-container max-w-[1248px] w-[100%] justify-self-center';

  if (logosData.length > 0) {
    const renderedLogos = renderFooterPartnersLogos(logosData);
    container.appendChild(renderedLogos);
  }

  // 4. Buscar el contenedor footer-partner-logos-wrapper en el footer
  const injectIntoFooter = () => {
    const footerWrapper = document.querySelector('.footer-partner-logos-wrapper');
    if (footerWrapper) {
      // PROTECTION: Skip if container already has content (first matching block wins)
      if (footerWrapper.children.length > 0) {
        // eslint-disable-next-line no-console
        console.log('[footer-partners-logos] Skipping render - container already has content');
        block.style.display = 'none';
        return true;
      }
      footerWrapper.appendChild(container);
      footerWrapper.classList.remove('hidden');
      return true;
    }
    return false;
  };

  // Intentar inyectar inmediatamente
  if (!injectIntoFooter()) {
    // Si no se encuentra el wrapper, esperar un poco y reintentar
    // Esto es útil si el footer se carga de forma asíncrona
    const retryInterval = setInterval(() => {
      if (injectIntoFooter()) {
        clearInterval(retryInterval);
      }
    }, 100);

    // Timeout después de 5 segundos como fallback
    setTimeout(() => {
      clearInterval(retryInterval);
      // Si después de 5 segundos no se encontró, insertar como hermano
      if (!document.querySelector('.footer-partner-logos-wrapper')?.contains(container)) {
        block.parentNode.insertBefore(container, block.nextSibling);
      }
    }, 5000);
  }

  // 5. Hide & Render Sibling Pattern:
  // Ocultar bloque original (NO eliminar - preservar para Universal Editor)
  block.style.display = 'none';
}
