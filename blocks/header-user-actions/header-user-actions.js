import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';
import { Actions } from '../../design-system/organisms/header/actions/actions.js';

const html = htm.bind(h);

/**
 * Maps block HTML data to a structured object
 * Expected structure: 6 divs containing:
 * - Div 0: cart-button-label
 * - Div 1: cart-button-icon
 * - Div 2: show-cart-button (boolean string)
 * - Div 3: user-button-label
 * - Div 4: user-button-icon
 * - Div 5: show-user-button (boolean string)
 *
 * @param {Element} block The header user actions block element
 * @returns {Object} Mapped data object with cart and user button configurations
 */
function mapBlockData(block) {
  const divs = Array.from(block.querySelectorAll(':scope > div'));

  // Check if first 2 rows are targeting config (single-column rows with country/language codes)
  const validCountries = ['co', 'ar', 'mx', 'pe', 'ec', 'sv', 'cr', 'br', 'bo', 'cl', 'ca', 'gt', 'hn', 'ni', 'pa', 'py', 'do', 'eu', 'gb', 'uy', 'ot', 'us'];
  let startIndex = 0;
  
  if (divs.length >= 2) {
    const firstRowValue = divs[0]?.children[0]?.textContent?.trim().toLowerCase();
    const firstRowIsTargeting = firstRowValue && 
      divs[0].children.length <= 2 && // Max 2 cols for targeting config
      (validCountries.includes(firstRowValue) || firstRowValue.split(',').every((c) => validCountries.includes(c.trim())));
    
    if (firstRowIsTargeting) {
      // Skip first 2 rows (target-countries and target-languages)
      startIndex = 2;
    }
  }

  // Helper function to extract text content from nested div > p structure
  const extractValue = (div) => {
    const innerDiv = div?.querySelector(':scope > div');
    if (innerDiv) {
      const paragraph = innerDiv.querySelector('p');
      return paragraph ? paragraph.textContent.trim() : '';
    }
    return '';
  };

  // Helper function to parse boolean strings
  const parseBoolean = (value) => {
    if (!value || value === '') {
      return true; // Default to true if no value
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  };

  // Map data based on div order (after skipping targeting rows if present)
  // Labels and icons default to empty strings, booleans default to true
  const mappedData = {
    cart: {
      label: extractValue(divs[startIndex + 0]) || '',
      icon: extractValue(divs[startIndex + 1]) || '',
      show: parseBoolean(extractValue(divs[startIndex + 2])),
    },
    user: {
      label: extractValue(divs[startIndex + 3]) || '',
      icon: extractValue(divs[startIndex + 4]) || '',
      show: parseBoolean(extractValue(divs[startIndex + 5])),
    },
  };

  return mappedData;
}

// Export mapBlockData for external use if needed
export { mapBlockData };

/**
 * Decorates the Header User Actions block
 * @param {Element} block The header user actions block element
 */
export default function decorate(block) {
  // Detect if we're in Universal Editor author environment
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    // In author mode: preserve original editable content
    block.classList.add('header-user-actions-author-mode');

    // Add visual indicator for author
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'header-user-actions-author-indicator';
    authorIndicator.textContent = '🛒 Header User Actions (Author Mode - Edit configuration)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);

    // Don't transform the block - keep it editable
    return;
  }

  // Targeting check - hide if not matching current POS
  const configData = readBlockConfig(block);
  
  // Leer targeting desde config (formato estándar: target-countries | co)
  let targetCountries = configData['target-countries'] || '';
  let targetLanguages = configData['target-languages'] || '';
  
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

  // Map data from HTML structure
  const mappedData = mapBlockData(block);

  // Fallback to readBlockConfig if available
  const config = readBlockConfig(block);

  // Prepare data for Actions component, prioritizing mapped data
  const cartData = {
    label: mappedData.cart.label || config['cart-button-label'] || '',
    icon: mappedData.cart.icon || config['cart-button-icon'] || '',
    show: mappedData.cart.show !== undefined
      ? mappedData.cart.show
      : (config['show-cart-button'] === 'true' || config['show-cart-button'] === true),
  };

  const userData = {
    label: mappedData.user.label || config['user-button-label'] || '',
    icon: mappedData.user.icon || config['user-button-icon'] || '',
    show: mappedData.user.show !== undefined
      ? mappedData.user.show
      : (config['show-user-button'] === 'true' || config['show-user-button'] === true),
  };

  // Function to render Actions component in the target container
  const renderActionsInContainer = (targetContainer) => {
    if (!targetContainer) return;

    // Handle click callbacks
    const handleCartClick = (e) => {
      e.preventDefault();
      targetContainer.dispatchEvent(new CustomEvent('cart-click', {
        detail: { ...cartData },
        bubbles: true,
      }));
    };

    const handleUserClick = (e) => {
      e.preventDefault();
      targetContainer.dispatchEvent(new CustomEvent('user-click', {
        detail: { ...userData },
        bubbles: true,
      }));
    };

    // Render Actions component
    render(
      html`
        <${Actions}
          cart=${cartData}
          user=${userData}
          onCartClick=${handleCartClick}
          onUserClick=${handleUserClick}
          customClassName="header-user-actions"
        />
      `,
      targetContainer,
    );
  };

  // Find the .user-actions container in the DOM (created by the header block)
  const findAndRenderActions = () => {
    const actionsContainer = document.querySelector('.user-actions');

    if (actionsContainer) {
      // If it exists, render directly there
      renderActionsInContainer(actionsContainer);
      // Hide original block
      block.style.display = 'none';
      return true;
    }

    return false;
  };

  // Try to find the container immediately
  if (!findAndRenderActions()) {
    // If it doesn't exist yet (timing issue), use requestAnimationFrame to wait
    // This handles the case where header decorates after header-user-actions
    let attempts = 0;
    const maxAttempts = 20; // Maximum 20 attempts (approximately 1 second)

    const tryRender = () => {
      attempts += 1;

      if (findAndRenderActions()) {
        // If we found and rendered, exit
        return;
      }

      if (attempts < maxAttempts) {
        // If we still haven't found it, try again in the next frame
        requestAnimationFrame(tryRender);
      } else {
        // If after several attempts we haven't found the container,
        // hide the original block as fallback
        // eslint-disable-next-line no-console
        console.warn('[header-user-actions] User actions container not found after multiple attempts');
        block.style.display = 'none';
      }
    };

    // Start trying in the next frame
    requestAnimationFrame(tryRender);
  }
}
