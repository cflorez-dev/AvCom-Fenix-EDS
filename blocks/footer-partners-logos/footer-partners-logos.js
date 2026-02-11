import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';

/**
 * Maps the footer partners logos block data
 * @param {Element} block The footer-partners-logos block element
 * @returns {Array<{imageUrl: string, imageAlt: string, redirectUrl: string}>}
 * Array of partner logo data
 */
export function mapFooterPartnersLogosData(block) {
  const items = [];
  const allChildren = [...block.children];

  // Check if first 2 rows are targeting config (single-column rows with country/language codes)
  const validCountries = ['co', 'ar', 'mx', 'pe', 'ec', 'sv', 'cr', 'br', 'bo', 'cl', 'ca', 'gt', 'hn', 'ni', 'pa', 'py', 'do', 'eu', 'gb', 'uy', 'ot', 'us'];
  let startIndex = 0;
  
  if (allChildren.length >= 2) {
    const firstRowValue = allChildren[0]?.children[0]?.textContent?.trim().toLowerCase();
    const firstRowIsTargeting = firstRowValue && 
      allChildren[0].children.length <= 2 && // Max 2 cols for targeting config
      (validCountries.includes(firstRowValue) || firstRowValue.split(',').every((c) => validCountries.includes(c.trim())));
    
    if (firstRowIsTargeting) {
      // Skip first 2 rows (target-countries and target-languages)
      startIndex = 2;
    }
  }

  // Iterate through each partner logo item (after skipping targeting rows if present)
  allChildren.slice(startIndex).forEach((item) => {
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

  items.forEach((item) => {
    // Skip if no image URL
    if (!item.imageUrl) return;

    // Create picture element with optimized image
    const picture = createOptimizedPicture(
      item.imageUrl,
      item.imageAlt || '',
      false,
      [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
    );

    // If there's a redirect URL, wrap picture in an anchor
    if (item.redirectUrl) {
      const anchor = document.createElement('a');
      anchor.href = item.redirectUrl;
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
