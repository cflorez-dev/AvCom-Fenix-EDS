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
import { mapCountryToPos } from './utils/pos-mapping.js';
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
    // IMPORTANT: Exclude links inside .fragment blocks — those are handled
    // by the fragment block decorator (blocks/fragment/fragment.js)
    const allFragmentLinks = main.querySelectorAll('a[href*="/fragments/"]');
    const inlineFragments = [...allFragmentLinks].filter(
      (a) => !a.closest('.fragment'),
    );
    if (inlineFragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        inlineFragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            if (frag) {
              fragment.parentElement.replaceWith(...frag.childNodes);
            }
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

  // Check if main has any child elements at all
  if (main.children.length === 0) return true;

  const sections = main.querySelectorAll('.section');
  if (sections.length === 0) return true;

  // Check if all sections are empty or only have whitespace
  const hasContent = Array.from(sections).some((section) => {
    const text = section.textContent.trim();
    const blocks = section.querySelectorAll('[data-block-name]');
    const imgs = section.querySelectorAll('img, picture');
    const links = section.querySelectorAll('a[href]');
    
    // Has meaningful content if:
    // - Has non-whitespace text (more than 10 chars to ignore empty divs)
    // - Has blocks
    // - Has images
    // - Has links
    return text.length > 10 || blocks.length > 0 || imgs.length > 0 || links.length > 0;
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
 * @returns {Promise<Object>} Page view event data with location, user, and device information
 */
async function pageViewEventData() {
  const locale = await resolveLocale();

  return {
    page_location: window.location.href,
    page_referrer: document.referrer || 'direct',
    page_title: document.title,
    language: navigator.language,
    screen_resolution: `${screen.width}x${screen.height}`,
    country_pos: mapCountryToPos(locale.country),
    language_nav: document.documentElement.lang || locale.language,
    time_zone: getTimezoneGMTOffset(),
    user_hour: getCurrentTimeFormatted(),
    user_type: 'Guest',
    user_id: 'NA',
  };
}

/**
 * Load fallback content when page is empty
 * Pattern: /{lang}/ URLs - no /global/ folder, content lives at /{lang}/
 * @param {Element} main The main element
 * @returns {Promise<boolean>} True if fallback was loaded
 */
async function loadGlobalFallbackContent(main) {
  // Skip fallback for error pages (404, 500, etc.)
  if (window.isErrorPage) {
    return false;
  }

  if (!isMainEmpty(main)) {
    return false; // Has content, no fallback needed
  }

  const currentPath = window.location.pathname;

  // Skip fallback for /errors/ paths (system pages)
  if (currentPath.startsWith('/errors/')) {
    return false;
  }

  // Skip in Universal Editor / Author environment
  // eslint-disable-next-line no-undef
  if (window.hlx?.aue || document.querySelector('meta[name="urn:auecon:aemconnection"]')) {
    // eslint-disable-next-line no-console
    console.log('[Content] Skipped fallback in author environment');
    return false;
  }

  const locale = await resolveLocale();

  // Extract page name from current URL path
  // Pattern: /{lang}/{pagePath} → extract {pagePath}
  // Examples:
  //   /es/lifemiles → lifemiles
  //   /es/ → index (default)
  //   /es/category/sub → category/sub
  const pathParts = currentPath.split('/').filter(Boolean);

  // pathParts[0] = lang (e.g., 'es')
  // pathParts[1+] = page path
  let pageName = 'index'; // default for home page
  if (pathParts.length > 1) {
    pageName = pathParts.slice(1).join('/');
    // Remove trailing slash if present
    if (pageName.endsWith('/')) {
      pageName = pageName.slice(0, -1);
    }
    // If empty after removing slash, default to index
    if (!pageName) {
      pageName = 'index';
    }
  }

  // Fallback to default language version of same page
  const fallbackPath = `/${locale.language}/${pageName}`;

  try {
    // eslint-disable-next-line no-console
    console.log(`[Content] Page empty, trying fallback: ${fallbackPath}`);

    const resp = await fetch(`${fallbackPath}.plain.html`);
    if (!resp.ok) {
      // eslint-disable-next-line no-console
      console.warn(`[Content] Fallback not found: ${fallbackPath}`);
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
      console.warn('[Content] No content in fallback');
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
    console.log(`✅ [Content] Loaded fallback from: ${fallbackPath}`);

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Content] Failed to load fallback:', error);
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
    
    const mainIsEmpty = isMainEmpty(main);
    // eslint-disable-next-line no-console
    console.log('[Debug] After global fallback - loadedGlobal:', loadedGlobal, 'isMainEmpty:', mainIsEmpty, 'isErrorPage:', window.isErrorPage, 'mainContent:', main.textContent.trim().substring(0, 100));
    
    // If we loaded global content, sections need to be loaded
    if (loadedGlobal) {
      await loadSections(main);
    } else if (mainIsEmpty) {
      // If still empty after global fallback, load 404 content
      try {
        // Determine language-based 404 path
        // ES uses /errors/404, other languages use /errors/404-{lang}
        const supportedLangs = ['en', 'pt', 'fr'];
        const lang = window.errorPageLang || 'es';
        const fragmentPath = supportedLangs.includes(lang)
          ? `/errors/404-${lang}.plain.html`
          : '/errors/404.plain.html';
        
        // eslint-disable-next-line no-console
        console.log(`[404 Fallback] Loading 404 content for lang=${lang}, path=${fragmentPath}`);
        let resp = await fetch(fragmentPath);
        
        // Fallback to Spanish if language-specific 404 doesn't exist
        if (!resp.ok && fragmentPath !== '/errors/404.plain.html') {
          // eslint-disable-next-line no-console
          console.log('[404 Fallback] Language-specific 404 not found, falling back to Spanish');
          resp = await fetch('/errors/404.plain.html');
        }
        if (resp.ok) {
          const html = await resp.text();
          const parser = new DOMParser();
          const doc404 = parser.parseFromString(html, 'text/html');
          const sections = doc404.body.children;
          
          if (sections && sections.length > 0) {
            main.innerHTML = '';
            Array.from(sections).forEach((section) => {
              main.appendChild(section.cloneNode(true));
            });
            decorateMain(main);
            await loadSections(main);
            
            // Set window flags for 404
            window.isErrorPage = true;
            window.errorCode = '404';
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[404 Fallback] Failed to load 404 content:', error);
      }
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

  // If on a destinations detail page, wait for Smartvel content before hiding the loader.
  // window.__smartvelLoadedPromise is set at module level in destinations.js and is only
  // present when the Destinations organism is on the page. A 15s timeout acts as safety net.
  if (window.__smartvelLoadedPromise) {
    await Promise.race([
      window.__smartvelLoadedPromise,
      new Promise((resolve) => setTimeout(resolve, 15000)),
    ]);
  }

  // Now hide the loader after everything is loaded (sections + header + footer + header children)
  showLoader(false);

  // Initialize GTM Martech lazy phase - loads GTM containers
  await gtmMartech.lazy();

  // Push page_view event to dataLayer after GTM initialization
  const pageViewData = await pageViewEventData();
  gtmMartech.pushToDataLayer({
    event: 'page_view',
    ...pageViewData,
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
