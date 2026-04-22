import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';
import { LanguageSearch } from '../../design-system/organisms/header/language-search/language-search.js';

/**
 * Builds an absolute path for a module using codeBasePath
 * @param {string} relativePath - Relative path from codeBasePath
 * @returns {string} Absolute URL to the module
 */
function buildModulePath(relativePath) {
  const codeBasePath = window.hlx?.codeBasePath || '';
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  // If codeBasePath is empty, build absolute URL from origin
  if (!codeBasePath) {
    return `${window.location.origin}${cleanPath}`;
  }

  // If codeBasePath is already absolute, use it directly
  if (codeBasePath.startsWith('http://') || codeBasePath.startsWith('https://')) {
    return `${codeBasePath}${cleanPath}`.replace(/\/+/g, '/');
  }

  // If codeBasePath is relative, build absolute URL
  const basePath = codeBasePath.startsWith('/') ? codeBasePath : `/${codeBasePath}`;
  return `${window.location.origin}${basePath}${cleanPath}`.replace(/\/+/g, '/');
}

/**
 * Dynamically imports the language-country-selector service
 * @returns {Promise<Object>} Promise that resolves to the service module
 */
async function loadLanguageCountrySelectorService() {
  const servicePath = buildModulePath('/scripts/services/header/language-country-selector.js');
  try {
    const module = await import(servicePath);
    return module;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load language-country-selector service:', error);
    // Fallback: try relative path as last resort
    try {
      return await import('../../scripts/services/header/language-country-selector.js');
    } catch (fallbackError) {
      // eslint-disable-next-line no-console
      console.error('Failed to load language-country-selector service (fallback):', fallbackError);
      throw fallbackError;
    }
  }
}

const isDesktop = window.matchMedia('(min-width: 769px)');

const html = htm.bind(h);

/**
 * Maps block HTML data to a structured object
 * Expected structure: up to 7 divs containing:
 * - Div 0: default-pos (string, e.g., "es-col")
 * - Div 1: show-search-button (boolean string, e.g., "true")
 * - Div 2: title (string, e.g., "Select your location and language") - optional
 * - Div 3: country-label (string, e.g., "Select country/region") - optional
 * - Div 4: language-label (string, e.g., "select language") - optional
 * - Div 5: confirm-label (string, e.g., "confirm") - optional
 * - Div 6: confirm-button-text (string, e.g., "confirm button") - optional
 *
 * @param {Element} block The header language selector block element
 * @returns {Object} Mapped data object with language selector configurations
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
    if (!div) return null;
    const innerDiv = div.querySelector(':scope > div');
    if (innerDiv) {
      const paragraph = innerDiv.querySelector('p');
      const value = paragraph ? paragraph.textContent.trim() : '';
      return value || null;
    }
    return null;
  };

  // Helper function to parse boolean strings
  const parseBoolean = (value) => {
    if (!value || value === '') {
      return false; // Default to false if no value
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  };

  // Map data based on div order (after skipping targeting rows if present)
  const mappedData = {
    defaultPos: extractValue(divs[startIndex + 0]) || '',
    showSearchButton: parseBoolean(extractValue(divs[startIndex + 1])),
    title: extractValue(divs[startIndex + 2]) || null,
    countryLabel: extractValue(divs[startIndex + 3]) || null,
    languageLabel: extractValue(divs[startIndex + 4]) || null,
    confirmLabel: extractValue(divs[startIndex + 5]) || null,
    confirmButtonText: extractValue(divs[startIndex + 6]) || null,
  };

  return mappedData;
}

// Export mapBlockData for external use if needed
export { mapBlockData };

/**
 * Decorates the Header Language Selector block
 * @param {Element} block The header language selector block element
 */
export default async function decorate(block) {
  // Detect if we're in Universal Editor author environment
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    // In author mode: preserve original editable content
    block.classList.add('header-language-selector-author-mode');

    // Add visual indicator for author
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'header-language-selector-author-indicator bg-[var(--color-background-author-indicator)] p-2 border border-dashed border-[var(--color-border-author-indicator)] mb-2 text-xs text-[var(--color-text-author-indicator)]';
    authorIndicator.textContent = '🌐 Header Language Selector (Author Mode - Edit configuration)';
    block.insertBefore(authorIndicator, block.firstChild);

    // Don't transform the block - keep it editable
    return;
  }

  // Targeting check - hide if not matching current POS
  const targetingConfig = readBlockConfig(block);
  
  // Leer targeting desde config (formato estándar: target-countries | co)
  let targetCountries = targetingConfig['target-countries'] || '';
  let targetLanguages = targetingConfig['target-languages'] || '';
  
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

  // Load the language-country-selector service dynamically
  let languageCountrySelector;
  try {
    languageCountrySelector = await loadLanguageCountrySelectorService();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[header-language-selector] Failed to load service, block will not function:', error);
    return;
  }

  // Extract functions from the loaded service
  const {
    getStoredCountry,
    getStoredLanguage,
    getStoredPos,
    setStoredPos,
    normalizePos,
    validatePos,
  } = languageCountrySelector;

  // Map data from HTML structure
  const mappedData = mapBlockData(block);

  // Fallback to readBlockConfig if available
  const config = readBlockConfig(block);

  // Get default POS from block data (only used for setting default if cookies don't exist)
  const rawDefaultPos = mappedData.defaultPos || config['default-pos'] || '';

  // Normalize and validate the default POS using the mapper
  const defaultPos = normalizePos(rawDefaultPos);

  // eslint-disable-next-line no-console
  console.log('[header-language-selector] Initializing with:', {
    rawDefaultPos,
    normalizedDefaultPos: defaultPos,
    isValid: validatePos(defaultPos),
  });

  // Check if we have stored POS in cookies
  const storedPos = getStoredPos();
  const storedCountry = getStoredCountry();
  const storedLanguage = getStoredLanguage();

  // Set the default POS in cookies if not already set or if stored values are invalid
  if (!storedPos || !storedCountry || !storedLanguage) {
    // eslint-disable-next-line no-console
    console.log('[header-language-selector] No valid stored POS found, setting default:', defaultPos);
    setStoredPos(defaultPos);
  } else {
    // Validate stored POS and re-normalize if needed
    const normalizedStoredPos = normalizePos(storedPos, defaultPos);
    if (normalizedStoredPos !== storedPos) {
      // eslint-disable-next-line no-console
      console.log('[header-language-selector] Stored POS needs normalization:', {
        original: storedPos,
        normalized: normalizedStoredPos,
      });
      setStoredPos(normalizedStoredPos, defaultPos);
    }
  }

  const maxVisibleOptions = parseInt(config['max-visible-options'] || '4', 10);
  const showSearchButton = mappedData.showSearchButton !== undefined
    ? mappedData.showSearchButton
    : (config['show-search-button'] === 'true' || config['show-search-button'] === true);

  // Track render state to avoid double renders
  let isRendered = false;

  // Function to render LanguageSearch component in the target container
  const renderLanguageSearchInContainer = (targetContainer) => {
    if (!targetContainer) return;

    // Function to render the appropriate component based on screen size
    const renderAppropriateComponent = () => {
      if (isDesktop.matches) {
        // Desktop: render LanguageSearch component
        // Handle callbacks
        const handleSearchClick = (e) => {
          e.preventDefault();
          targetContainer.dispatchEvent(new CustomEvent('language-search-click', {
            detail: { showSearchButton },
            bubbles: true,
          }));
        };

        const handlePosChange = (pos) => {
          targetContainer.dispatchEvent(new CustomEvent('language-pos-change', {
            detail: { pos },
            bubbles: true,
          }));
        };

        // Crear objeto labels con las propiedades extraídas
        const labels = {
          title: mappedData.title,
          countryLabel: mappedData.countryLabel,
          languageLabel: mappedData.languageLabel,
          confirmLabel: mappedData.confirmLabel,
          confirmButtonText: mappedData.confirmButtonText,
        };

        // Render LanguageSearch component
        render(
          html`
            <${LanguageSearch}
              showSearchButton=${showSearchButton}
              searchButtonLabel="Buscar"
              posAvailable=${[]}
              defaultPos=${defaultPos}
              maxVisibleOptions=${maxVisibleOptions}
              onSearchClick=${handleSearchClick}
              onPosChange=${handlePosChange}
              labels=${labels}
              customClassName="header-language-selector"
            />
          `,
          targetContainer,
        );
      } else {
        // Mobile: clear container
        render(null, targetContainer);
      }
    };

    // Render initially
    renderAppropriateComponent();
    isRendered = true;

    // Listen for window size changes to toggle between mobile and desktop
    isDesktop.addEventListener('change', renderAppropriateComponent);
  };

  // Find the .header-language-selector container in the DOM (created by the header block)
  const findAndRenderLanguageSearch = () => {
    const languageSelectorContainer = document.querySelector('.header-language-selector');

    if (languageSelectorContainer) {
      // If it exists, render directly there
      renderLanguageSearchInContainer(languageSelectorContainer);
      // Hide original block
      block.classList.add('hidden');
      return true;
    }

    return false;
  };

  // Try to find the container immediately
  if (!findAndRenderLanguageSearch()) {
    // If it doesn't exist yet (timing issue), use requestAnimationFrame to wait
    // This handles the case where header decorates after header-language-selector
    let attempts = 0;
    const maxAttempts = 20; // Maximum 20 attempts (approximately 1 second)

    const tryRender = () => {
      attempts += 1;

      if (findAndRenderLanguageSearch()) {
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
        console.warn('[header-language-selector] Language selector container not found after multiple attempts');
        block.classList.add('hidden');
      }
    };

    // Start trying in the next frame
    requestAnimationFrame(tryRender);
  }

  // Listen for header-template-ready event to render when header is ready
  const handleHeaderReady = (event) => {
    if (isRendered) return;

    const languageSelectorContainer = event?.detail?.languageSelectorContainer;
    if (languageSelectorContainer) {
      renderLanguageSearchInContainer(languageSelectorContainer);
      block.classList.add('hidden');
      return;
    }

    // Fallback: attempt to find it in DOM
    findAndRenderLanguageSearch();
  };
  window.addEventListener('header-template-ready', handleHeaderReady);
}
