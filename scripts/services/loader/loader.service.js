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
    // Show loader with smooth transition
    // First set display to block, then add class for opacity transition
    loader.style.display = 'block';
    // Use requestAnimationFrame to ensure display is applied before adding class
    requestAnimationFrame(() => {
      loader.classList.add('is-visible');
    });
    // Prevent body scroll when loader is visible
    document.body.style.overflow = 'hidden';
  } else {
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
