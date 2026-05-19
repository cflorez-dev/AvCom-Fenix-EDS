/**
 * Loader Service
 * Manages the display and hiding of the cms-loader block using CSS
 *
 * IMPORTANT: This service only controls an EXISTING cms-loader block in the DOM.
 * If no cms-loader block exists, the service will do nothing.
 */

/**
 * Cached reference to the loader section
 */
let loaderSection = null;

function stripQueryString(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url, window.location.href);
    parsed.search = '';
    return parsed.toString();
  } catch (e) {
    return url.split('?')[0];
  }
}

function stripSrcsetQueryParams(srcset) {
  if (!srcset) return srcset;

  return srcset
    .split(',')
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .map((candidate) => {
      const [url, ...descriptorParts] = candidate.split(/\s+/);
      if (!url) return candidate;
      const cleanedUrl = stripQueryString(url);
      if (!descriptorParts.length) return cleanedUrl;
      return `${cleanedUrl} ${descriptorParts.join(' ')}`;
    })
    .join(', ');
}

function optimizeLoaderImagePayload(loader) {
  if (!loader || loader.dataset.loaderImageOptimized === 'true') return;

  const picture = loader.querySelector('.cms-loader picture') || loader.querySelector('picture');
  const img = loader.querySelector('.cms-loader img') || loader.querySelector('img');
  if (!img) return;

  // Hotfix: el GIF subido en AEM (2000×2000) pierde calidad al pasar por el pipeline
  // de Helix con ?width=200 (rasteriza y muestra pixelado en DPR≥2). Servimos el
  // asset raw — pesa más, pero el cliente requirió la fix visual inmediata.
  // El tamaño en pantalla lo controla CSS via .cms-loader-image-wrapper (width:100px).
  const sources = picture ? picture.querySelectorAll('source') : [];
  sources.forEach((source) => {
    const srcset = source.getAttribute('srcset');
    if (srcset) source.setAttribute('srcset', stripSrcsetQueryParams(srcset));
  });

  const imgSrcset = img.getAttribute('srcset');
  if (imgSrcset) img.setAttribute('srcset', stripSrcsetQueryParams(imgSrcset));

  const src = img.getAttribute('src');
  if (src) img.setAttribute('src', stripQueryString(src));

  img.removeAttribute('sizes');
  img.setAttribute('width', '100');
  img.setAttribute('height', '100');
  img.setAttribute('loading', 'eager');
  img.setAttribute('decoding', 'async');
  img.setAttribute('fetchpriority', 'high');

  loader.dataset.loaderImageOptimized = 'true';
}

/**
 * Finds and caches the cms-loader section in the DOM
 * @returns {HTMLElement|null} The loader section element or null if not found
 */
function getLoaderSection() {
  if (!loaderSection) {
    // Look for the cms-loader section
    loaderSection = document.querySelector('.section.cms-loader-container');

    // Alternative: look for any section containing a cms-loader block
    if (!loaderSection) {
      const loaderBlock = document.querySelector('.cms-loader.block');
      if (loaderBlock) {
        loaderSection = loaderBlock.closest('.section');
      }
    }
  }

  return loaderSection;
}

/**
 * Shows or hides the loader
 * @param {boolean} show - True to show the loader, false to hide it
 * @returns {boolean} True if the operation was successful, false if no loader exists
 *
 * @example
 * // Show the loader
 * showLoader(true);
 *
 * // Hide the loader
 * showLoader(false);
 */
export function showLoader(show) {
  const loader = getLoaderSection();

  // If no loader exists in the DOM, do nothing
  if (!loader) {
    // eslint-disable-next-line no-console
    console.warn('cms-loader block not found in DOM. Make sure the block is rendered before calling showLoader().');
    return false;
  }

  if (show) {
    optimizeLoaderImagePayload(loader);

    // Show loader
    loader.style.display = 'block';
    document.body.classList.add('loader-curtain-active');

    // Avoid initial 1-frame flicker: if body is not visible yet, show immediately.
    if (!document.body.classList.contains('appear')) {
      loader.classList.add('is-visible');
    } else {
      // Keep smooth transition for subsequent shows
      requestAnimationFrame(() => {
        loader.classList.add('is-visible');
      });
    }

    // Prevent body scroll when loader is visible
    document.body.style.overflow = 'hidden';
  } else {
    document.body.classList.remove('loader-curtain-active');

    // Hide loader with smooth fade-out transition
    loader.classList.remove('is-visible');
    // Wait for transition to complete before hiding completely
    setTimeout(() => {
      // Only hide if still not visible (class was removed)
      if (!loader.classList.contains('is-visible')) {
        loader.style.display = 'none';
      }
    }, 400); // Match CSS transition duration (400ms)
    // Restore body scroll immediately (user can scroll during fade-out)
    document.body.style.overflow = '';
  }

  return true;
}

/**
 * Checks if the loader is currently visible
 * @returns {boolean} True if loader is visible, false otherwise
 */
export function isLoaderVisible() {
  const loader = getLoaderSection();
  if (!loader) return false;

  return loader.classList.contains('is-visible')
    && loader.style.display !== 'none'
    && window.getComputedStyle(loader).display !== 'none';
}

/**
 * Updates the loader text (if the loader exists)
 * @param {string} newText - New text to display
 * @returns {boolean} True if successful, false if loader not found
 */
export function updateLoaderText(newText) {
  const loader = getLoaderSection();
  if (!loader) return false;

  const textParagraph = loader.querySelector('.cms-loader p');
  if (textParagraph) {
    textParagraph.textContent = newText;
    return true;
  }

  return false;
}

/**
 * Resets the cached loader reference
 * Call this if the DOM structure changes and you need to re-query for the loader
 */
export function resetLoaderCache() {
  loaderSection = null;
}
