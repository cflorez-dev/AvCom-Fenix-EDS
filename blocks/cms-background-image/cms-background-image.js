/**
 * CMS Background Image Block
 *
 * Applies a decorative background image to the main element.
 * Supports responsive images for mobile, tablet, and desktop.
 * Configurable from AEM with fallback color and positioning.
 *
 * Feature Flag: FEATURE_CMS_BACKGROUND_IMAGE
 * Set in page metadata or globally to enable/disable this component.
 * AEM Block Structure:
 * | Mobile Image  | [image]              |
 * | Tablet Image  | [image]              |
 * | Desktop Image | [image]              |
 * | Fallback Color| #f5f5f5              |
 * | Position      | center               |
 * | Behavior      | scroll (or fixed)    |
 * | Size          | cover (or contain)   |
 * | Enabled       | true                 |
 */

/**
 * Optimize an AEM image URL for use as CSS background-image.
 * Converts PNG/JPG format to WebP for significantly smaller payload.
 * @param {string} url
 * @returns {string}
 */
function optimizeBgUrl(url) {
  if (!url) return url;
  return url.replace(/([?&])format=(png|jpg|jpeg)/i, '$1format=webply');
}

/**
 * Check if the feature is enabled via feature flag
 * @returns {boolean} True if feature is enabled
 */
function isFeatureEnabled() {
  // Check page metadata first
  const meta = document.head.querySelector('meta[name="feature-cms-background-image"]');
  if (meta) {
    return meta.content.toLowerCase() === 'true';
  }

  // Check global config (if available)
  if (window.aviancaConfig?.features?.cmsBackgroundImage !== undefined) {
    return window.aviancaConfig.features.cmsBackgroundImage;
  }

  // Default to true if no feature flag is set
  return true;
}

export default function decorate(block) {
  // Check feature flag first
  if (!isFeatureEnabled()) {
    // eslint-disable-next-line no-console
    console.log('CMS Background Image: Feature is disabled via feature flag.');
    block.remove();
    return;
  }

  // 1. Detect if we are running inside the Universal Editor (Author Mode)
  // We heuristically detect authoring by hostname and path pattern.
  const isAuthorEnv = window.location.hostname.includes('author-')
    && window.location.pathname.startsWith('/content/');

  if (isAuthorEnv) {
    // In author mode: preserve editable DOM and show a compact indicator.
    // Do not transform the block so the Universal Editor can keep references
    // to the child items and allow in-place editing.
    block.textContent = '';

    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'cms-background-image-author-indicator';
    authorIndicator.textContent = 'CMS Background Image';
    authorIndicator.style.cssText = 'background: #e3f2fd; padding: 8px 12px; border-left: 3px solid #2196f3; font-size: 13px; color: #1565c0; font-weight: 500;';
    block.appendChild(authorIndicator);

    // Exit without transforming the block: authoring UI manages the content.
    return;
  }

  // 2. Production mode: parse configuration from the block DOM
  const rows = Array.from(block.children);
  const config = {
    mobileImage: '',
    tabletImage: '',
    desktopImage: '',
    fallbackColor: '#f5f5f5',
    position: 'top right',
    behavior: 'scroll', // 'scroll' or 'fixed'
    size: 'contain', // 'cover' or 'contain'
    enabled: true, // Can be disabled per block instance
  };

  // Parse block configuration from AEM by row index. The block is authored as
  // a simple table-like structure where each row represents a field.
  rows.forEach((row, index) => {
    const cell = row.children[0];
    if (!cell) return;

    // Extract image from picture element
    const img = cell.querySelector('img');

    if (index === 0 && img) {
      // Row 0: Mobile image
      config.mobileImage = optimizeBgUrl(img.src);
    } else if (index === 1 && img) {
      // Row 1: Tablet image
      config.tabletImage = optimizeBgUrl(img.src);
    } else if (index === 2 && img) {
      // Row 2: Desktop image
      config.desktopImage = optimizeBgUrl(img.src);
    } else if (index === 3) {
      // Row 3: Fallback color (may be authored as a link, paragraph, or plain text)
      const link = cell.querySelector('a');
      const paragraph = cell.querySelector('p');
      if (link) {
        config.fallbackColor = link.getAttribute('href') || link.textContent.trim();
      } else if (paragraph) {
        config.fallbackColor = paragraph.textContent.trim();
      } else {
        config.fallbackColor = cell.textContent.trim();
      }
    } else if (index === 4) {
      // Row 4: Background position (e.g. 'center', 'top right')
      config.position = cell.textContent.trim();
    } else if (index === 5) {
      // Row 5: Behavior - 'scroll' (default) or 'fixed'
      config.behavior = cell.textContent.trim().toLowerCase();
    } else if (index === 6) {
      // Row 6: Size - 'cover' or 'contain'
      config.size = cell.textContent.trim().toLowerCase();
    } else if (index === 7) {
      // Row 7: Enabled flag - 'true' or 'false'
      config.enabled = cell.textContent.trim().toLowerCase() === 'true';
    }
  });

  // Check if block instance is enabled
  if (!config.enabled) {
    // eslint-disable-next-line no-console
    console.log('CMS Background Image: Block instance is disabled.');
    block.remove();
    return;
  }

  // Validate at least one image is provided
  if (!config.mobileImage && !config.tabletImage && !config.desktopImage) {
    // eslint-disable-next-line no-console
    console.warn('CMS Background Image: No images provided. Block will not be applied.');
    block.remove();
    return;
  }

  // Use mobile as fallback if tablet/desktop not provided
  if (!config.tabletImage) config.tabletImage = config.mobileImage;
  if (!config.desktopImage) config.desktopImage = config.tabletImage || config.mobileImage;

  // Apply background settings to the page <main> element
  const main = document.querySelector('main');
  if (!main) {
    // eslint-disable-next-line no-console
    console.warn('CMS Background Image: <main> element not found.');
    block.remove();
    return;
  }

  // Set CSS custom properties used by the stylesheet
  main.style.setProperty('--bg-fallback-color', config.fallbackColor);
  main.style.setProperty('--bg-position', config.position);
  main.style.setProperty('--bg-behavior', config.behavior);
  main.style.setProperty('--bg-size', config.size);

  // Add class to trigger CSS
  main.classList.add('has-background-image');

  // Add data attribute for behavior (used in CSS)
  main.setAttribute('data-bg-behavior', config.behavior);

  /**
   * Ensure LCP background image is requested early.
   * Keeps a single reusable preload element to avoid duplicates.
   * @param {string} imageUrl
   */
  function preloadBackgroundImage(imageUrl) {
    if (!imageUrl) return;

    let preload = document.head.querySelector('link[data-cms-bg-preload="true"]');
    if (!preload) {
      preload = document.createElement('link');
      preload.setAttribute('data-cms-bg-preload', 'true');
      preload.rel = 'preload';
      preload.as = 'image';
      preload.fetchPriority = 'high';
      document.head.appendChild(preload);
    }

    if (preload.getAttribute('href') !== imageUrl) {
      preload.setAttribute('href', imageUrl);
    }
  }

  /**
   * Select image URL based on current viewport.
   * @returns {string}
   */
  function getImageForViewport() {
    if (window.matchMedia('(min-width: 1248px)').matches) {
      return config.desktopImage;
    }
    if (window.matchMedia('(min-width: 768px)').matches) {
      return config.tabletImage;
    }
    return config.mobileImage;
  }

  /**
   * Gets viewport tier key to avoid unnecessary work on resize.
   * @returns {'mobile'|'tablet'|'desktop'}
   */
  function getViewportTier() {
    if (window.matchMedia('(min-width: 1248px)').matches) return 'desktop';
    if (window.matchMedia('(min-width: 768px)').matches) return 'tablet';
    return 'mobile';
  }

  let currentViewportTier = '';

  /**
   * Load appropriate background image based on the current viewport size.
   * Uses viewport tiers to avoid redundant updates while resizing.
   */
  function loadBackgroundImage(force = false) {
    const viewportTier = getViewportTier();
    if (!force && viewportTier === currentViewportTier) {
      return;
    }
    currentViewportTier = viewportTier;

    const imageUrl = getImageForViewport();
    if (!imageUrl) return;

    preloadBackgroundImage(imageUrl);
    // Apply immediately so browser can start fetching as soon as possible.
    main.style.setProperty('--bg-current', `url('${imageUrl}')`);
    main.classList.add('loaded');
  }

  // Load initial image
  loadBackgroundImage(true);

  // Reload image on viewport resize (debounced)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      loadBackgroundImage();
    }, 250);
  });

  // Hide the block element (only used for configuration)
  block.style.display = 'none';
  block.setAttribute('aria-hidden', 'true');

  // Remove spacing from controller section container
  const controllerSection = block.closest('.section');
  if (controllerSection) {
    controllerSection.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
  }
}
