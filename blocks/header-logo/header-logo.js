import { extractHeaderLogoData } from './header-logo.helper.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';

const isDesktop = window.matchMedia('(min-width: 769px)');

/**
 * Creates a picture element with sources and img
 * @param {Object} logoData Logo data object with src, alt, width, height, sources
 * @returns {Element} Picture element
 */
function createPictureElement(logoData) {
  if (!logoData) return null;

  const picture = document.createElement('picture');

  // Add source elements
  if (logoData.sources && logoData.sources.length > 0) {
    logoData.sources.forEach((sourceData) => {
      const source = document.createElement('source');
      if (sourceData.type) source.setAttribute('type', sourceData.type);
      if (sourceData.srcset) source.setAttribute('srcset', sourceData.srcset);
      if (sourceData.media) source.setAttribute('media', sourceData.media);
      picture.appendChild(source);
    });
  }

  // Add img element
  // Logo is always above-the-fold (sits inside the sticky header) — use eager
  // loading + high fetch priority so it paints with the first frame instead
  // of waiting for IntersectionObserver to discover it (the previous lazy
  // setting deferred it and contributed to a small CLS shift).
  const img = document.createElement('img');
  img.className = 'header-logo-img';
  img.setAttribute('loading', 'eager');
  img.setAttribute('fetchpriority', 'high');
  img.setAttribute('decoding', 'async');
  if (logoData.src) img.setAttribute('src', logoData.src);
  if (logoData.alt) img.setAttribute('alt', logoData.alt);
  if (logoData.width) img.setAttribute('width', logoData.width);
  if (logoData.height) img.setAttribute('height', logoData.height);

  picture.appendChild(img);
  return picture;
}

/**
 * Renders the logo component
 * @param {Element} container Container element to render into
 * @param {Object} logoData Extracted logo data
 */
function renderLogo(container, logoData) {
  // Clear container
  container.innerHTML = '';

  // Get the appropriate logo based on desktop/mobile
  const currentLogo = isDesktop.matches ? logoData.logoDesktop : logoData.logoMobile;

  if (!currentLogo) {
    return;
  }

  // Create anchor element
  const anchor = document.createElement('a');
  anchor.setAttribute('href', logoData.redirectUrl || '/');
  anchor.className = 'header-logo-link';

  // Ensure the logo link has an accessible name even if author content omits alt text.
  const accessibleLogoName = (currentLogo.alt && currentLogo.alt.trim()) || 'Avianca';
  anchor.setAttribute('aria-label', accessibleLogoName);

  // Create picture element
  const picture = createPictureElement({
    ...currentLogo,
    alt: accessibleLogoName,
  });
  if (picture) {
    anchor.appendChild(picture);
  }

  container.appendChild(anchor);
}

/**
 * Decorates the Header Logo block
 * @param {Element} block The header-logo block element
 */
export default function decorate(block) {
  // 1. Detect Author Mode
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    // Preserve editable content
    block.classList.add('header-logo-author-mode');

    const authorIndicator = document.createElement('div');
    authorIndicator.textContent = '📝 Header Logo (Author Mode - Edit below)';
    authorIndicator.className = 'bg-[var(--color-background-author-indicator)] p-2 border border-dashed border-[var(--color-border-author-indicator)] mb-2 text-xs text-[var(--color-text-author-indicator)]';
    block.insertBefore(authorIndicator, block.firstChild);

    return;
  }

  // 1.1 Targeting check - hide if not matching current POS
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

  // 2. Extract data from block using helper
  const logoData = extractHeaderLogoData(block);

  // Validate that data was extracted correctly
  if (!logoData || (!logoData.logoDesktop && !logoData.logoMobile)) {
    // If there's no data, hide the block and don't render anything
    block.classList.add('hidden');
    return;
  }

  // 3. Function to render logo in the correct container
  let resizeHandler = null;
  let headerResizeHandler = null;
  let scrollHandler = null;

  const renderLogoInContainer = (targetContainer) => {
    if (!targetContainer) return;

    // Render initial logo using data extracted from helper
    renderLogo(targetContainer, logoData);

    const updateLogoSize = () => {
      const img = targetContainer.querySelector('img');
      // Hysteresis: diferentes thresholds para activar vs desactivar
      // Esto evita el flickering cuando el scroll está cerca del threshold
      const scrollThresholdActivate = 10; // Activar modo compacto cuando scroll > 10px
      const scrollThresholdDeactivate = 0; // Desactivar cuando scroll <= 0px
      const compactLogoClasses = ['h-[28px]', 'w-auto'];
      if (!img) return;

      // Verificar estado actual para evitar cambios innecesarios
      const isCurrentlyCompact = img.classList.contains('h-[28px]');
      const currentScroll = window.scrollY;

      // Solo cambiar si es necesario (evita cambios innecesarios)
      if (!isCurrentlyCompact && currentScroll > scrollThresholdActivate) {
        // Activar modo compacto
        img.classList.add(...compactLogoClasses);
      } else if (isCurrentlyCompact && currentScroll <= scrollThresholdDeactivate) {
        // Desactivar modo compacto
        img.classList.remove(...compactLogoClasses);
      }
    };

    // Remove existing listeners if any
    if (resizeHandler) {
      isDesktop.removeEventListener('change', resizeHandler);
    }
    if (headerResizeHandler) {
      window.removeEventListener('header-resize', headerResizeHandler);
    }
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
    }

    // Create new handlers
    resizeHandler = () => {
      renderLogo(targetContainer, logoData);
    };
    headerResizeHandler = () => {
      renderLogo(targetContainer, logoData);
    };
    scrollHandler = () => {
      updateLogoSize();
    };

    // Listen for window size changes using MediaQueryList
    isDesktop.addEventListener('change', resizeHandler);

    // Also listen for custom header-resize event
    window.addEventListener('header-resize', headerResizeHandler);
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Apply initial size based on current scroll
    updateLogoSize();
  };

  // 4. Find the .header-logo container in the DOM (created by the header block)
  const findAndRenderLogo = (logoContainer) => {
    const container = logoContainer || document.querySelector('.header-logo');

    if (container) {
      // If it exists, render directly there
      renderLogoInContainer(container);
      // Hide original block
      block.classList.add('hidden');
      return true;
    }

    return false;
  };

  // Flag para evitar múltiples renderizados
  let isRendered = false;

  // Variables para polling y observers (declaradas en scope superior)
  let mutationObserver = null;
  let pollingTimeout = null;
  let rafId = null;

  let handleHeaderReady = null;

  // Function to clean up all listeners and observers
  const cleanup = () => {
    window.removeEventListener('header-template-ready', handleHeaderReady);
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    if (pollingTimeout) {
      clearTimeout(pollingTimeout);
      pollingTimeout = null;
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  // Listen for header-template-ready event (preferred method)
  handleHeaderReady = (event) => {
    if (isRendered) return;
    if (event.detail && event.detail.logoContainer) {
      if (findAndRenderLogo(event.detail.logoContainer)) {
        isRendered = true;
        cleanup();
      }
    }
  };

  // Register event listener
  window.addEventListener('header-template-ready', handleHeaderReady);

  // MutationObserver to detect when container appears in DOM
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver((mutations, observer) => {
      if (isRendered) {
        observer.disconnect();
        return;
      }

      // Check if container now exists
      const container = document.querySelector('.header-logo');
      if (container && findAndRenderLogo(container)) {
        isRendered = true;
        cleanup();
      }
    });

    // Observe changes in body and header
    const observeTarget = document.body || document.documentElement;
    if (observeTarget) {
      mutationObserver.observe(observeTarget, {
        childList: true,
        subtree: true,
      });
    }
  }

  // Immediate verification before starting any process
  if (findAndRenderLogo()) {
    isRendered = true;
    cleanup();
  } else {
    // If not found, use multiple fallback methods
    // This handles the case where header-logo decorates before header
    const maxAttempts = 100; // Increased to 100 attempts (~5 seconds with setTimeout)

    // Polling with requestAnimationFrame (faster, better for animations)
    let rafAttempts = 0;
    const tryRenderRAF = () => {
      if (isRendered) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        return;
      }

      rafAttempts += 1;

      if (findAndRenderLogo()) {
        isRendered = true;
        cleanup();
        return;
      }

      if (rafAttempts < maxAttempts) {
        rafId = requestAnimationFrame(tryRenderRAF);
      }

      // If requestAnimationFrame reached maximum, cancel and let setTimeout continue
      if (rafAttempts >= maxAttempts && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // Polling with setTimeout (more reliable in some browsers like Firefox/Edge)
    let timeoutAttempts = 0;
    const tryRenderTimeout = () => {
      if (isRendered) {
        if (pollingTimeout) {
          clearTimeout(pollingTimeout);
          pollingTimeout = null;
        }
        return;
      }

      timeoutAttempts += 1;

      if (findAndRenderLogo()) {
        isRendered = true;
        cleanup();
        return;
      }

      if (timeoutAttempts < maxAttempts) {
        // Use 50ms delay for setTimeout (more reliable than requestAnimationFrame)
        pollingTimeout = setTimeout(tryRenderTimeout, 50);
      } else {
        // If after all attempts we haven't found the container,
        // create our own container as fallback
        cleanup();

        const fallbackContainer = document.createElement('div');
        fallbackContainer.className = 'header-logo-container';
        renderLogoInContainer(fallbackContainer);

        // Hide & Render Sibling Pattern:
        // Hide original block (DO NOT delete - preserve for Universal Editor)
        block.classList.add('hidden');

        // Insert transformed content as sibling element
        if (block.parentNode) {
          block.parentNode.insertBefore(fallbackContainer, block.nextSibling);
        }
      }
    };

    // Start with requestAnimationFrame (faster)
    rafId = requestAnimationFrame(tryRenderRAF);

    // Also start setTimeout as parallel fallback (more reliable)
    // This ensures it works even if requestAnimationFrame has issues
    // Especially important for Firefox and Edge
    pollingTimeout = setTimeout(tryRenderTimeout, 100);
  }
}
