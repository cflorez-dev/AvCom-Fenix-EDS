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

function updateQueryParam(url, key, value) {
  try {
    const parsed = new URL(url, window.location.href);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch (e) {
    return url;
  }
}

function optimizeSrcset(srcset, targetWidth) {
  if (!srcset) return srcset;

  return srcset
    .split(',')
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .map((candidate) => {
      const [url, ...descriptorParts] = candidate.split(/\s+/);
      if (!url) return candidate;

      const optimizedUrl = updateQueryParam(url, 'width', targetWidth);
      if (!descriptorParts.length) return optimizedUrl;

      const descriptor = descriptorParts.join(' ');
      const normalizedDescriptor = /\d+w$/.test(descriptor)
        ? `${targetWidth}w`
        : descriptor;
      return `${optimizedUrl} ${normalizedDescriptor}`;
    })
    .join(', ');
}

function optimizeLoaderImagePayload(loader) {
  if (!loader || loader.dataset.loaderImageOptimized === 'true') return;

  const picture = loader.querySelector('.cms-loader picture') || loader.querySelector('picture');
  const img = loader.querySelector('.cms-loader img') || loader.querySelector('img');
  if (!img) return;

  const sources = picture ? picture.querySelectorAll('source') : [];
  sources.forEach((source) => {
    const srcset = source.getAttribute('srcset');
    if (!srcset) return;

    const isDesktop = (source.getAttribute('media') || '').includes('min-width: 600px');
    const optimizedWidth = isDesktop ? '200' : '200';
    source.setAttribute('srcset', optimizeSrcset(srcset, optimizedWidth));
  });

  const imgSrcset = img.getAttribute('srcset');
  if (imgSrcset) {
    img.setAttribute('srcset', optimizeSrcset(imgSrcset, '200'));
  }

  const src = img.getAttribute('src');
  if (src) {
    img.setAttribute('src', updateQueryParam(src, 'width', '200'));
  }
  img.setAttribute('sizes', '200px');
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

  // If no loader exists in the DOM, do nothing (most pages don't have a curtain loader)
  if (!loader) {
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
