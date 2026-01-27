import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';
import { initLocaleGlobals, resolveLocale } from './utils/locale.js';
import { showLoader } from './services/loader/loader.service.js';
import gtmMartech from './gtm-martech.js';
import {
  getEnvironment,
  isTrackingDisabled,
  ADOBE_LAUNCH_URLS,
  ONETRUST_CONFIG,
} from './martech-config.js';

/**
 * Load OneTrust consent banner
 * Must load early to capture consent before other scripts
 */
function loadOneTrust() {
  if (isTrackingDisabled()) return;

  // Load OneTrust SDK
  const script = document.createElement('script');
  script.src = ONETRUST_CONFIG.scriptUrl;
  script.type = 'text/javascript';
  script.charset = 'UTF-8';
  script.setAttribute('data-document-language', 'true');
  script.setAttribute('data-domain-script', ONETRUST_CONFIG.domainScript);
  document.head.appendChild(script);

  // Define OptanonWrapper (required by OneTrust)
  window.OptanonWrapper = function OptanonWrapper() {
    // Dispatch event when consent changes
    window.dispatchEvent(new CustomEvent('consent-updated'));
  };
}

/**
 * Load Adobe Launch script based on environment
 */
function loadAdobeLaunch() {
  if (isTrackingDisabled()) return;

  const env = getEnvironment();
  const script = document.createElement('script');
  script.src = ADOBE_LAUNCH_URLS[env];
  script.async = true;
  document.head.appendChild(script);
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto block `*/fragments/*` references
    const fragments = main.querySelectorAll('a[href*="/fragments/"]');
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(frag.firstElementChild);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Check if main content is empty or has minimal content
 * @param {Element} main The main element
 * @returns {boolean} True if main is empty or has only whitespace/empty sections
 */
function isMainEmpty(main) {
  if (!main) return true;

  const sections = main.querySelectorAll('.section');
  if (sections.length === 0) return true;

  // Check if all sections are empty
  const hasContent = Array.from(sections).some((section) => {
    const text = section.textContent.trim();
    const blocks = section.querySelectorAll('[data-block-name]');
    return text.length > 0 || blocks.length > 0;
  });

  return !hasContent;
}

/**
 * Get current time in HH:MM format
 * @returns {string} Current time formatted as HH:MM
 */
function getCurrentTimeFormatted() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get timezone offset in GMT format (e.g., GMT-05:00)
 * @returns {string} Timezone offset formatted as GMT±HH:MM
 */
function getTimezoneGMTOffset() {
  const now = new Date();
  const timeZoneOffset = now.getTimezoneOffset();
  const sign = timeZoneOffset > 0 ? '-' : '+';
  const absOffset = Math.abs(timeZoneOffset);
  const hours = Math.floor(absOffset / 60).toString().padStart(2, '0');
  const minutes = (absOffset % 60).toString().padStart(2, '0');
  return `GMT${sign}${hours}:${minutes}`;
}

/**
 * Get page view event data for analytics
 * @returns {Object} Page view event data with location, user, and device information
 */
function pageViewEventData() {
  const locale = resolveLocale();

  return {
    page_location: window.location.href,
    page_referrer: document.referrer || 'direct',
    page_title: document.title,
    language: navigator.language,
    screen_resolution: `${screen.width}x${screen.height}`,
    country_pos: locale.country,
    language_nav: document.documentElement.lang || locale.language,
    time_zone: getTimezoneGMTOffset(),
    user_hour: getCurrentTimeFormatted(),
    user_type: 'Guest',
    user_id: 'NA',
  };
}

/**
 * Load global fallback content when POS-specific content is empty
 * Implements "global by default, override by exception" pattern
 * Supports ANY page path: /{pos}/{lang}/{pagePath} → /global/{lang}/{pagePath}
 * @param {Element} main The main element
 * @returns {Promise<boolean>} True if fallback was loaded
 */
async function loadGlobalFallbackContent(main) {
  if (!isMainEmpty(main)) {
    return false; // Has content, no fallback needed
  }

  // Loop guard: Skip if we're already on /global/ to prevent infinite recursion
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/global/')) {
    return false;
  }

  // Skip in Universal Editor / Author environment
  // eslint-disable-next-line no-undef
  if (window.hlx?.aue || document.querySelector('meta[name="urn:auecon:aemconnection"]')) {
    // eslint-disable-next-line no-console
    console.log('[Content Inheritance] Skipped in author environment');
    return false;
  }

  const locale = resolveLocale();

  // Extract page name from current URL path
  // Pattern: /{pos}/{lang}/{pagePath} → extract {pagePath}
  // Examples:
  //   /co/es/lifemiles → lifemiles
  //   /co/es/ → index (default)
  //   /co/es/category/sub → category/sub
  const pathParts = currentPath.split('/').filter(Boolean);

  // pathParts[0] = pos (e.g., 'co'), pathParts[1] = lang (e.g., 'es')
  // pathParts[2+] = page path
  let pageName = 'index'; // default for home page
  if (pathParts.length > 2) {
    pageName = pathParts.slice(2).join('/');
    // Remove trailing slash if present
    if (pageName.endsWith('/')) {
      pageName = pageName.slice(0, -1);
    }
    // If empty after removing slash, default to index
    if (!pageName) {
      pageName = 'index';
    }
  }

  const globalPath = `/global/${locale.language}/${pageName}`;

  try {
    // eslint-disable-next-line no-console
    console.log(`[Content Inheritance] POS content empty, loading global fallback: ${globalPath}`);

    const resp = await fetch(`${globalPath}.plain.html`);
    if (!resp.ok) {
      // eslint-disable-next-line no-console
      console.warn(`[Content Inheritance] Global fallback not found: ${globalPath}`);
      return false;
    }

    const html = await resp.text();

    // AEM .plain.html returns section divs directly, not wrapped in <main>
    // Parse and inject them directly into main
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const sections = doc.body.children;

    if (!sections || sections.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('[Content Inheritance] No content in global fallback');
      return false;
    }

    // Clear current main and add all sections from global
    main.innerHTML = '';
    Array.from(sections).forEach((section) => {
      main.appendChild(section.cloneNode(true));
    });

    // Re-decorate the new content
    decorateMain(main);

    // eslint-disable-next-line no-console
    console.log(`✅ [Content Inheritance] Loaded global content from: ${globalPath}`);

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Content Inheritance] Failed to load global fallback:', error);
    return false;
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  // Load OneTrust first to capture consent before other tracking scripts
  loadOneTrust();

  await initLocaleGlobals();
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);

    // Check if we need to load global fallback content
    const loadedGlobal = await loadGlobalFallbackContent(main);
    
    // If we loaded global content, sections need to be loaded
    if (loadedGlobal) {
      await loadSections(main);
    }
    
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  // Initialize GTM Martech eager phase
  await gtmMartech.eager();

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  // Load sections but don't hide loader yet - wait for header/footer
  await loadSections(main, false);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  // Wait for header and footer to finish loading
  const headerElement = doc.querySelector('header');
  await Promise.all([
    headerElement ? loadHeader(headerElement) : Promise.resolve(),
    loadFooter(doc.querySelector('footer')),
  ]);

  // If header exists, wait for header-template-ready event to ensure header structure is ready
  // This ensures the header containers exist and child blocks have rendered
  if (headerElement) {
    await new Promise((resolve) => {
      // Check if event already fired (containers exist)
      const headerContainer = document.querySelector('.header-wrapper');
      const logoContainer = document.querySelector('.header-logo');
      
      if (headerContainer && logoContainer) {
        // Containers already exist, wait a bit for child blocks to finish rendering
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      } else {
        // Wait for the event
        const handleHeaderReady = () => {
          window.removeEventListener('header-template-ready', handleHeaderReady);
          // Wait a bit more for child blocks (header-logo, header-navbar, etc.) to render
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        };
        window.addEventListener('header-template-ready', handleHeaderReady, { once: true });
        // Timeout fallback (2 seconds max wait)
        setTimeout(() => {
          window.removeEventListener('header-template-ready', handleHeaderReady);
          resolve();
        }, 2000);
      }
    });
  }

  // Now hide the loader after everything is loaded (sections + header + footer + header children)
  showLoader(false);

  // Initialize GTM Martech lazy phase - loads GTM containers
  await gtmMartech.lazy();

  // Push page_view event to dataLayer after GTM initialization
  gtmMartech.pushToDataLayer({
    event: 'page_view',
    ...pageViewEventData(),
  });

  // Load Adobe Launch based on environment (avianca.com = PROD, else DEV)
  loadAdobeLaunch();

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
