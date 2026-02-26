/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

// eslint-disable-next-line import/no-cycle
import {
  decorateMain,
} from '../../scripts/scripts.js';

import { loadSections } from '../../scripts/aem.js';
import { cacheResolvedPath, cacheFailedPath } from '../../scripts/utils/locale.js';

// Cache raw HTML to avoid network requests
// Key: path, Value: { html: string, basePath: string }
const fragmentHTMLCache = new Map();
const pendingFragments = new Map();

/**
 * Hydrate cached HTML into a fully decorated fragment
 * Creates FRESH DOM and decorates it (safe for IDs, event handlers)
 *
 * @param {string} html Raw HTML string
 * @param {string} basePath Fragment base path for media resolution
 * @returns {HTMLElement} Decorated fragment
 */
async function hydrateFragment(html, basePath) {
  const main = document.createElement('main');
  main.innerHTML = html;

  // Reset base path for media (existing logic)
  const resetAttributeBase = (tag, attr) => {
    main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
      elem[attr] = new URL(elem.getAttribute(attr), new URL(basePath, window.location)).href;
    });
  };
  resetAttributeBase('img', 'src');
  resetAttributeBase('source', 'srcset');

  // Fresh decoration each time (IDs, event handlers work correctly)
  decorateMain(main);
  await loadSections(main);
  return main;
}

/**
 * Loads a fragment with caching.
 * Caches raw HTML (not decorated DOM) to ensure fresh decoration each time.
 * Uses negative caching for 404s to avoid repeated failed requests.
 *
 * @param {string} path The path to the fragment
 * @param {string} resourceType Optional - if provided, caches successful/failed path
 * @returns {HTMLElement|null} The root element of the fragment or null
 */
export async function loadFragment(path, resourceType = null) {
  // Validate path parameter
  if (!path || typeof path !== 'string' || !path.trim()) {
    // eslint-disable-next-line no-console
    console.error('[Fragment] loadFragment called with invalid path:', path, 'resourceType:', resourceType);
    return null;
  }

  if (!path.startsWith('/')) {
    // eslint-disable-next-line no-console
    console.error('[Fragment] Path must start with /:', path);
    return null;
  }

  // Check HTML cache first (positive cache)
  if (fragmentHTMLCache.has(path)) {
    const cached = fragmentHTMLCache.get(path);
    return hydrateFragment(cached.html, cached.basePath);
  }

  // Check if request already in flight (deduplication)
  if (pendingFragments.has(path)) {
    await pendingFragments.get(path);
    if (fragmentHTMLCache.has(path)) {
      const cached = fragmentHTMLCache.get(path);
      return hydrateFragment(cached.html, cached.basePath);
    }
    return null;
  }

  // Fetch and cache
  const fetchPromise = (async () => {
    try {
      const resp = await fetch(`${path}.plain.html`);
      if (resp.ok) {
        const html = await resp.text();
        fragmentHTMLCache.set(path, { html, basePath: path });

        // Cache successful path for future requests
        if (resourceType) {
          await cacheResolvedPath(resourceType, path);
        }

        return 'success';
      }
      // 404 or other error status
      if (resp.status === 404) {
        cacheFailedPath(path); // NEGATIVE CACHE
        return 'not-found';
      }
      return 'error';
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Fragment fetch failed: ${path}`, e);
      return 'error';
    }
  })();

  pendingFragments.set(path, fetchPromise);
  const result = await fetchPromise;
  pendingFragments.delete(path);

  if (result === 'success') {
    const cached = fragmentHTMLCache.get(path);
    return hydrateFragment(cached.html, cached.basePath);
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  let fragment = await loadFragment(path);
  
  // Fallback to Spanish for 404 pages if language-specific fragment not found
  if (!fragment && path.startsWith('/errors/404-')) {
    // eslint-disable-next-line no-console
    console.log(`[Fragment] 404 fragment not found for ${path}, falling back to /errors/404`);
    fragment = await loadFragment('/errors/404');
  }
  
  if (fragment) {
    // Find the first VISIBLE section (not hidden by targeting)
    // Fallback to first section if none are visible
    const allSections = [...fragment.querySelectorAll(':scope .section')];
    const visibleSection = allSections.find(
      (s) => !s.classList.contains('!h-0') && s.style.display !== 'none',
    ) || allSections[0];

    if (visibleSection) {
      // Filter out hiding utility classes that hideBlockWithSection may have added
      const hidingClasses = ['!p-0', '!m-0', '!h-0', '!overflow-hidden'];
      const safeClasses = [...visibleSection.classList].filter(
        (c) => !hidingClasses.includes(c),
      );
      block.closest('.section').classList.add(...safeClasses);
      block.closest('.fragment').replaceWith(...fragment.childNodes);
    }
  }
}
