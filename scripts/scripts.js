import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  loadScript,
} from './aem.js';
import { initLocaleGlobals, resolveLocale } from './utils/locale.js';
import { showLoader } from './services/loader/loader.service.js';

// gtm-martech, martech-config, and pos-mapping are dynamically imported
// after body.appear to reduce the critical module tree for faster LCP.
// ES module caching ensures each is fetched/executed only once.

/**
 * Load OneTrust consent banner
 * Must load early to capture consent before other scripts
 */
async function loadOneTrust() {
  const {
    isTrackingDisabled, isAuthorMode, getEnvironment, ONETRUST_CONFIG,
  } = await import('./martech-config.js');
  if (isTrackingDisabled() || isAuthorMode()) return;
  if (getEnvironment() !== 'production') return;

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
 * Load Adobe Launch script based on environment.
 * Skips if already loaded from head.html early inline script.
 */
async function loadAdobeLaunch() {
  if (window.__adobeLaunchLoaded) return;

  const {
    isTrackingDisabled, isAuthorMode, getEnvironment, ADOBE_LAUNCH_URLS,
  } = await import('./martech-config.js');
  if (isTrackingDisabled() || isAuthorMode()) return;

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

const INITIAL_VISIBLE_SECTIONS_COUNT = 6;

// Mark <html> when running inside the Universal Editor canvas so block CSS can
// override viewport-relative rules (e.g. min-height: 100vh) that otherwise
// trigger an infinite iframe resize loop in the editor.
(function markUniversalEditor() {
  const isAuthorEnv = !!(
    window.xwalk?.isAuthorEnv
    || window.hlx?.aue
    || document.querySelector('meta[name="urn:auecon:aemconnection"]')
    || (window.location.hostname.includes('author-')
      && window.location.pathname.startsWith('/content/'))
  );
  if (isAuthorEnv) document.documentElement.classList.add('is-aue');
}());

/**
 * Read and apply cms-background-image config before its block is loaded.
 * This avoids late background swaps that hurt LCP/CLS.
 * @param {Element} main The main element
 */
function bootstrapCriticalBackgroundImage(main) {
  if (!main) return;

  const isAuthorEnv = !!(
    window.xwalk?.isAuthorEnv
    || window.hlx?.aue
    || document.querySelector('meta[name="urn:auecon:aemconnection"]')
    || (
      window.location.hostname.includes('author-')
      && window.location.pathname.startsWith('/content/')
    )
  );
  if (isAuthorEnv) return;

  const featureFlag = document.head.querySelector('meta[name="feature-cms-background-image"]');
  if (featureFlag && featureFlag.content.toLowerCase() !== 'true') return;

  const block = main.querySelector('.cms-background-image.block');
  if (!block) return;

  const rows = Array.from(block.children);
  const getCell = (index) => rows[index]?.children?.[0] || null;
  const toAbsoluteUrl = (url) => {
    if (!url) return '';
    try {
      return new URL(url, window.location.href).href;
    } catch (e) {
      return '';
    }
  };
  const getImageUrl = (index) => {
    const img = getCell(index)?.querySelector('img');
    const src = img?.getAttribute('src') || '';
    const absUrl = toAbsoluteUrl(src);
    // Use WebP format for smaller payload as CSS background-image
    return absUrl.replace(/([?&])format=(png|jpg|jpeg)/i, '$1format=webply');
  };
  // When `size: auto` is requested, drop the AEM `width`/`optimize` query
  // params so the asset is delivered at its original intrinsic dimensions.
  const stripWidth = (url) => {
    if (!url) return url;
    try {
      const u = new URL(url, window.location.href);
      u.searchParams.delete('width');
      u.searchParams.delete('optimize');
      return u.pathname + (u.search || '') + u.hash;
    } catch (e) {
      return url
        .replace(/([?&])width=\d+&?/i, '$1')
        .replace(/([?&])optimize=[^&]+&?/i, '$1')
        .replace(/[?&]$/, '');
    }
  };
  const getCellValue = (index) => {
    const cell = getCell(index);
    if (!cell) return '';
    const link = cell.querySelector('a');
    if (link) {
      return (link.getAttribute('href') || link.textContent || '').trim();
    }
    return cell.textContent.trim();
  };

  const config = {
    mobileImage: getImageUrl(0),
    tabletImage: getImageUrl(1),
    desktopImage: getImageUrl(2),
    fallbackColor: getCellValue(3) || '#f5f5f5',
    position: getCellValue(4) || 'top right',
    behavior: (getCellValue(5) || 'scroll').toLowerCase(),
    size: (getCellValue(6) || 'contain').toLowerCase(),
    enabled: (getCellValue(7) || 'true').toLowerCase() === 'true',
  };

  if (!config.enabled) return;
  if (!config.mobileImage && !config.tabletImage && !config.desktopImage) return;
  if (!config.tabletImage) config.tabletImage = config.mobileImage;
  if (!config.desktopImage) config.desktopImage = config.tabletImage || config.mobileImage;

  let imageUrl = config.mobileImage;
  if (window.matchMedia('(min-width: 1024px)').matches) {
    imageUrl = config.desktopImage;
  } else if (window.matchMedia('(min-width: 768px)').matches) {
    imageUrl = config.tabletImage;
  }
  if (config.size === 'auto') {
    imageUrl = stripWidth(imageUrl);
  }

  if (imageUrl) {
    let preload = document.head.querySelector('link[data-cms-bg-preload="true"]');
    if (!preload) {
      preload = document.createElement('link');
      preload.setAttribute('data-cms-bg-preload', 'true');
      preload.rel = 'preload';
      preload.as = 'image';
      preload.fetchPriority = 'high';
      // Set href BEFORE appending. A <link rel=preload> inserted into the DOM
      // without an href makes the browser log "invalid href value" and delays
      // the fetch until href is assigned; setting it first closes that window.
      preload.setAttribute('href', imageUrl);
      document.head.appendChild(preload);
    } else if (preload.getAttribute('href') !== imageUrl) {
      preload.setAttribute('href', imageUrl);
    }
  }

  main.style.setProperty('--bg-fallback-color', config.fallbackColor);
  main.style.setProperty('--bg-position', config.position);
  main.style.setProperty('--bg-behavior', config.behavior);
  main.style.setProperty('--bg-size', config.size);
  if (imageUrl) {
    main.style.setProperty('--bg-current', `url('${imageUrl}')`);
    // Layer order (top -> bottom): CMS image  ->  page gradient (if any).
    // A solid `--page-bg-color` is applied via background-color below so it
    // also fills the empty area when the image doesn't cover the viewport.
    main.style.backgroundImage = `url('${imageUrl}'), var(--page-bg-image, none)`;
  }
  // Honor author's solid bg color (CA3); fall back to the block's own
  // fallback color while the image is still loading.
  main.style.backgroundColor = `var(--page-bg-color, ${config.fallbackColor})`;
  main.style.backgroundRepeat = 'no-repeat';
  main.style.backgroundSize = config.size;
  main.style.backgroundPosition = config.position;
  main.style.minHeight = '100vh';
  main.classList.add('has-background-image', 'loaded');
  main.setAttribute('data-bg-behavior', config.behavior);
}

/**
 * Reserve marquee height before the block is rendered to reduce CLS.
 * @param {Element} main The main element
 */
function bootstrapMarqueeHeight(main) {
  if (!main) return;
  const hasMarquesina = !!main.querySelector('.marquesina.block');
  if (!hasMarquesina) return;

  const rootStyles = getComputedStyle(document.documentElement);
  const minHeight = rootStyles.getPropertyValue('--marquee-min-height').trim() || '55px';
  document.documentElement.style.setProperty('--marquee-height', minHeight);

  // Reserve space for marquesina before body.appear to prevent CLS.
  // The marquesina block decorates later (loadLazy) and inserts itself before
  // the header, which would push <main> down. By creating the placeholder now,
  // the space is already occupied when the page first renders.
  const header = document.querySelector('header');
  if (header && !document.querySelector('.marquesina-global-container')) {
    const placeholder = document.createElement('div');
    placeholder.className = 'marquesina-global-container';
    placeholder.style.minHeight = minHeight;
    // Clip overflow so the Preact render (initially ~104px before marquee CSS
    // constrains it to ~56px) doesn't temporarily expand the container.
    placeholder.style.overflow = 'hidden';
    placeholder.style.maxHeight = minHeight;
    header.parentElement.insertBefore(placeholder, header);
  }
}

/**
 * Gets the first section to load in eager mode.
 * Excludes the loader section so its GIF is not promoted to eager/LCP candidate.
 * @param {Element} main The main element
 * @returns {Element|null}
 */
function getFirstEagerSection(main) {
  if (!main) return null;
  const sections = Array.from(main.querySelectorAll(':scope > .section'));
  return sections.find((section) => !section.classList.contains('cms-loader-container'))
    || sections[0]
    || null;
}

function getPendingSections(main) {
  if (!main) return [];
  const sections = Array.from(main.querySelectorAll('div.section'));
  return sections.filter((section) => section.dataset.sectionStatus !== 'loaded');
}

async function loadInitialVisibleSections(main, maxSections = INITIAL_VISIBLE_SECTIONS_COUNT) {
  const sections = getPendingSections(main).slice(0, maxSections);
  for (let i = 0; i < sections.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadSection(sections[i]);
  }
}

function loadRemainingSectionsInBackground(main) {
  const queue = getPendingSections(main);
  if (!queue.length) return;

  const processQueue = async () => {
    for (let i = 0; i < queue.length; i += 1) {
      const section = queue[i];
      if (section.dataset.sectionStatus === 'loaded') {
        // eslint-disable-next-line no-continue
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      await loadSection(section);
      stripInternalTrailingSlashes(section);
      forceVisibleLazyImages(section);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      processQueue();
    }, { timeout: 3000 });
    return;
  }

  setTimeout(() => {
    processQueue();
  }, 0);
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    const isAuthorEnv = !!(
      window.xwalk?.isAuthorEnv
      || window.hlx?.aue
      || document.querySelector('meta[name="urn:auecon:aemconnection"]')
      || (
        window.location.hostname.includes('author-')
        && window.location.pathname.startsWith('/content/')
      )
    );

    if (isAuthorEnv) {
      return;
    }

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

const BG_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s,.%]+\)|transparent)$/;
const BG_DIR_RE = /^\d+$/;
const BG_VALID_TYPES = new Set(['solid', 'linear', 'radial']);
const BG_RADIAL_POSITION_TO_CSS = {
  'top-left': 'top left',
  top: 'top',
  'top-right': 'top right',
  left: 'left',
  center: 'center',
  right: 'right',
  'bottom-left': 'bottom left',
  bottom: 'bottom',
  'bottom-right': 'bottom right',
};

// AEM Universal Editor prepends the page URL when the value starts with '#'
// e.g. "https://example.com/page#00FF00" -> "#00FF00"
function extractBackgroundColor(val) {
  if (!val) return '';
  const trimmed = val.trim();
  try {
    const url = new URL(trimmed);
    if (url.hash) return url.hash;
  } catch { /* not a URL - use as-is */ }
  return trimmed;
}

function computeBackgroundValue({
  color1,
  color2,
  gradientDirection,
  gradientType,
  radialPosition,
}) {
  const c1 = extractBackgroundColor(color1);
  const c2 = extractBackgroundColor(color2);
  const dir = gradientDirection?.trim() || '180';
  const rawType = gradientType?.trim() || 'solid';
  const type = BG_VALID_TYPES.has(rawType) ? rawType : 'solid';
  const rawPos = radialPosition?.trim() || 'center';
  const pos = BG_RADIAL_POSITION_TO_CSS[rawPos] || 'center';

  const c1Valid = c1 && BG_COLOR_RE.test(c1);
  const c2Valid = c2 && BG_COLOR_RE.test(c2);
  const dirValid = BG_DIR_RE.test(dir);

  if (type === 'solid') {
    if (c1Valid && c1 !== 'transparent') return c1;
    return null;
  }

  if (type === 'linear') {
    if (c1Valid && c2Valid && c1 !== c2 && dirValid
        && !(c1 === 'transparent' && c2 === 'transparent')) {
      return `linear-gradient(${dir}deg, ${c1}, ${c2})`;
    }
    if (c1Valid && c1 !== 'transparent') return c1;
    return null;
  }

  if (c1Valid && c2Valid
      && !(c1 === 'transparent' && c2 === 'transparent')) {
    return `radial-gradient(circle at ${pos}, ${c1}, ${c2})`;
  }
  if (c1Valid && c1 !== 'transparent') return c1;
  return null;
}

function applyPageBackground(main) {
  const bg = computeBackgroundValue({
    color1: getMetadata('bg-color-1'),
    color2: getMetadata('bg-color-2'),
    gradientDirection: getMetadata('gradient-direction'),
    gradientType: getMetadata('gradient-type'),
    radialPosition: getMetadata('radial-position'),
  });

  if (!bg) {
    main.style.removeProperty('--page-bg');
    main.style.removeProperty('--page-bg-color');
    main.style.removeProperty('--page-bg-image');
    main.classList.remove('has-custom-bg');
    return;
  }

  // Split --page-bg into a color slot and an image (gradient) slot so the
  // value can coexist with cms-background-image (CA3): a solid color goes to
  // background-color, a gradient goes to background-image as a layer below
  // the CMS image. Keep --page-bg for backward compatibility.
  const isGradient = /^(linear|radial)-gradient\(/i.test(bg);
  main.style.setProperty('--page-bg', bg);
  if (isGradient) {
    main.style.setProperty('--page-bg-image', bg);
    main.style.removeProperty('--page-bg-color');
  } else {
    main.style.setProperty('--page-bg-color', bg);
    main.style.removeProperty('--page-bg-image');
  }
  main.classList.add('has-custom-bg');
}

function observePageBackground(main) {
  const isRelevantMeta = (node) => node?.nodeType === 1 && node.matches?.(
    'meta[name="bg-color-1"],meta[name="bg-color-2"],meta[name="gradient-type"],meta[name="gradient-direction"],meta[name="radial-position"]',
  );

  new MutationObserver((mutations) => {
    const shouldApply = mutations.some((mutation) => {
      if (mutation.type === 'attributes' && isRelevantMeta(mutation.target)) {
        return true;
      }

      const addedRelevant = Array.from(mutation.addedNodes || []).some(isRelevantMeta);
      if (addedRelevant) return true;

      const removedRelevant = Array.from(mutation.removedNodes || []).some(isRelevantMeta);
      return removedRelevant;
    });

    if (shouldApply) applyPageBackground(main);
  }).observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['content'],
  });
}

/**
 * Apply per-section background customization (solid, linear or radial gradient)
 * from section-metadata. Reads data-bg-color-1, data-bg-color-2,
 * data-gradient-direction, data-gradient-type and data-radial-position (all set
 * by decorateSections from section-metadata) and applies validated values as
 * inline style on each .section.
 *
 * Background type dispatch:
 *   - solid (default):  background = color1
 *   - linear:           background = linear-gradient(direction, color1, color2)
 *   - radial:           background = radial-gradient(circle at position, color1, color2)
 *
 * Validation: silent regex whitelist with fallback to default (no inline style
 * applied) if value is invalid. Color values accept hex (#RGB..#RRGGBBAA),
 * rgb/rgba, or the 'transparent' keyword. transparent in solid mode is treated
 * as empty (no background applied). When linear/radial is selected but color2
 * is missing/invalid, falls back to applying color1 as solid (retro-compat).
 *
 * @param {Element} main The main element containing .section nodes
 */
function applySectionBackgrounds(main) {
  // mosaic-cards-v2 hides its desktop carousel section on mobile and renders into
  // a sibling div.mosaic-v2-mobile-container (not a .section). Mirror the bg
  // onto that sibling so the gradient still shows in mobile view.
  const mirrorToMobileSibling = (section, bg) => {
    const next = section.nextElementSibling;
    if (!next?.classList.contains('mosaic-v2-mobile-container')) return;
    if (bg) {
      next.style.setProperty('--section-bg', bg);
      next.classList.add('has-custom-bg');
    } else {
      next.style.removeProperty('--section-bg');
      next.classList.remove('has-custom-bg');
    }
  };

  const clearBg = (section) => {
    section.style.removeProperty('--section-bg');
    section.classList.remove('has-custom-bg');
    mirrorToMobileSibling(section, null);
  };

  const applyToSection = (section) => {
    const bg = computeBackgroundValue({
      color1: section.dataset['bgColor-1'],
      color2: section.dataset['bgColor-2'],
      gradientDirection: section.dataset.gradientDirection,
      gradientType: section.dataset.gradientType,
      radialPosition: section.dataset.radialPosition,
    });

    if (!bg) {
      clearBg(section);
      return;
    }

    section.style.setProperty('--section-bg', bg);
    section.classList.add('has-custom-bg');
    mirrorToMobileSibling(section, bg);
  };

  const observeSection = (section) => {
    applyToSection(section);
    // Re-apply when author edits attribute in place (UE patch path)
    new MutationObserver(() => applyToSection(section)).observe(section, {
      attributes: true,
      attributeFilter: [
        'data-bg-color-1',
        'data-bg-color-2',
        'data-gradient-direction',
        'data-gradient-type',
        'data-radial-position',
      ],
    });
  };

  main.querySelectorAll(':scope > div.section').forEach(observeSection);

  // Re-apply when UE replaces the section div entirely (UE re-render path),
  // or when mosaic-cards-v2 inserts its mobile-only sibling container after a
  // section that already has a bg.
  new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('div.section')) {
          observeSection(node);
        } else if (node.matches?.('.mosaic-v2-mobile-container')) {
          const prev = node.previousElementSibling;
          if (prev?.classList.contains('has-custom-bg')) {
            mirrorToMobileSibling(prev, prev.style.getPropertyValue('--section-bg'));
          }
        }
      });
    });
  }).observe(main, { childList: true });
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
  applyPageBackground(main);
  observePageBackground(main);
  decorateSections(main);
  applySectionBackgrounds(main);
  decorateBlocks(main);
  stripInternalTrailingSlashes(main);
  normalizeSvgPictures(main);
}

/**
 * Prevents SVGs from being rasterized to WebP.
 * The delivery pipeline renders authored images as a <picture> with
 * `type="image/webp"` <source> elements. For an SVG those sources point at a
 * rasterized, oversized copy (e.g. width=2000&format=webply) which the browser
 * prefers over the crisp, lightweight vector. Removing the WebP sources from
 * SVG pictures lets the browser use the SVG source/img instead.
 * @param {Element} root The root element to process
 */
function normalizeSvgPictures(root) {
  root.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img');
    const isSvg = !!picture.querySelector('source[type="image/svg+xml"]')
      || /\.svg(?:$|[?#])/i.test(img?.getAttribute('src') || '');
    if (!isSvg) return;
    picture.querySelectorAll('source[type="image/webp"]').forEach((source) => source.remove());
  });
}

/**
 * Strips trailing slashes from internal links.
 * AEM Franklin delivery adds trailing slashes when resolving JCR paths to HTML,
 * but EDS serves /path → 200 and /path/ → 404.
 * @param {Element} root The root element to process
 */
function stripInternalTrailingSlashes(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    try {
      const url = new URL(a.href, window.location.origin);
      if (url.origin === window.location.origin
        && url.pathname.endsWith('/')
        && url.pathname.length > 1) {
        a.href = url.pathname.slice(0, -1) + url.search + url.hash;
      }
    } catch (e) { /* ignore malformed URLs */ }
  });
}

/**
 * Forces lazy images that are already in the viewport to load eagerly.
 * Browser IntersectionObserver may not trigger for images inside CSS grid/flex
 * containers with certain layout configurations (e.g., grid-3-9 sections).
 * @param {Element} root The root element to process
 * @param {boolean} [all=false] When true, forces ALL lazy images regardless of position
 */
function forceVisibleLazyImages(root, all = false) {
  root.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    if (img.complete && img.naturalWidth > 0) return;
    if (all) {
      img.loading = 'eager';
      return;
    }
    const rect = img.getBoundingClientRect();
    if (rect.top < window.innerHeight * 2) {
      img.loading = 'eager';
    }
  });
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
  const [{ mapCountryToPos }, locale] = await Promise.all([
    import('./utils/pos-mapping.js'),
    resolveLocale(),
  ]);

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
  // OneTrust moved to loadLazy() — consent is still captured before GTM/Adobe Launch
  // Loading it here was making the cookie banner the LCP element on mobile

  // Preload font file ASAP so it arrives before body.appear to avoid CLS from font swap.
  try {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.href = `${window.hlx?.codeBasePath || ''}/fonts/RedHatDisplay-VariableFont_wght.ttf`;
    preload.as = 'font';
    preload.type = 'font/ttf';
    preload.crossOrigin = '';
    document.head.appendChild(preload);
    loadFonts();
  } catch (e) {
    // do nothing
  }

  // Load DOMPurify from CDN early so sanitizeHTML() is available synchronously in blocks.
  // No longer vendored in the repo — loaded from jsdelivr with pinned version (closes F4 / 117).
  // crossorigin matches the <link rel=preload> in head.html so the browser reuses
  // the preloaded resource (otherwise it warns "credentials mode does not match").
  loadScript('https://cdn.jsdelivr.net/npm/dompurify@3.4.0/dist/purify.min.js', { crossorigin: 'anonymous' });

  // Kick off the languages catalog load in parallel with geolocation.
  // (sections.css is preloaded in head.html and awaited at the top of loadLazy.)
  // Synchronous consumers (header, language selector) read the snapshot on first
  // render — this await ensures they see real data instead of the hardcoded
  // seeds. Race against a 400ms budget so a slow AEM endpoint never blocks paint.
  const languagesReady = Promise.race([
    (async () => {
      try {
        const { ensureLanguagesDataLoaded } = await import('./services/header/get-pos-data.js');
        await ensureLanguagesDataLoaded();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[scripts] Languages catalog load failed:', error);
      }
    })(),
    new Promise((resolve) => { setTimeout(resolve, 400); }),
  ]);

  // Pre-warm the country catalog in the language-country-selector before
  // resolvePOS runs. Its reduced 5-row seed (col/us/bra/fra/oth) does not
  // cover every POS the Accept-Language fallback can return — e.g. if the PO
  // changes the `acceptLanguage` column so 'es' maps to EC, `setStoredCountry('ec')`
  // would reject the write because 'ec' is not in the seed yet. This await
  // ensures the full spreadsheet-derived catalog is in the snapshot before any
  // setStoredCountry call. Bounded to 400ms so a slow AEM never blocks paint.
  const countriesReady = Promise.race([
    (async () => {
      try {
        const { ensureCountryDataLoaded } = await import('./services/header/language-country-selector.js');
        await ensureCountryDataLoaded();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[scripts] Country catalog load failed:', error);
      }
    })(),
    new Promise((resolve) => { setTimeout(resolve, 400); }),
  ]);
  await countriesReady;

  // Resolve POS via the geolocation hierarchy (URL → W3C geo → Accept-Language)
  // BEFORE locale — initLocaleGlobals reads the cookies set here.
  try {
    const { resolvePOS } = await import('./services/geolocation/geolocation.service.js');
    await resolvePOS({ timeout: 400 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[scripts] POS geolocation failed; falling back to existing defaults:', error);
  }

  // Reconcile the URL language against the resolved POS now that resolvePOS()
  // has written `selected-country`. Fixes the cross-state where /fr is served
  // for a POS that disallows fr (e.g. geolocated CO/EC) — the URL must redirect
  // to the POS default language instead of staying out of sync with the header.
  // Triggered here (post-resolvePOS) rather than from a module-load IIFE so the
  // country cookie is guaranteed present: removes the prior race that left the
  // page in French while the selector reconciled to Spanish. Fire-and-forget so
  // the catalog wait never blocks paint; it redirects as soon as data settles.
  (async () => {
    try {
      const { reconcileUrlLanguageWithPos } = await import('./services/header/language-country-selector.js');
      await reconcileUrlLanguageWithPos();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[scripts] locale/POS reconciliation failed:', error);
    }
  })();

  // Ensure languages catalog (best-effort, bounded) is settled before decorate.
  await languagesReady;

  // Start locale resolution early but don't block DOM work that doesn't need it
  const localeReady = initLocaleGlobals();

  // Darksite gate: si el modo contingencia está activo, monta el interstitial
  // ANTES de body.appear para evitar flash del sitio normal. Acotado a 900ms
  // y fail-open: nunca bloquea el paint ni rompe la carga.
  // Spec: docs/superpowers/specs/2026-07-07-darksite-design.md
  try {
    const { runDarksiteGate } = await import('./services/darksite/darksite-gate.js');
    await Promise.race([
      runDarksiteGate(),
      new Promise((resolve) => { setTimeout(resolve, 900); }),
    ]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[scripts] Darksite gate failed (fail-open):', error);
  }

  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    bootstrapCriticalBackgroundImage(main);
    bootstrapMarqueeHeight(main);

    // Only block on locale/fallback for pages without content (404, empty pages).
    // Normal pages skip these awaits so body.appear is reached faster → better LCP.
    if (isMainEmpty(main)) {
      await localeReady;
      const loadedGlobal = await loadGlobalFallbackContent(main);

      if (loadedGlobal) {
        await loadSections(main);
      } else {
        // Still empty after global fallback — load 404 content
        try {
          const supportedLangs = ['en', 'pt', 'fr'];
          const lang = window.errorPageLang || 'es';
          const fragmentPath = supportedLangs.includes(lang)
            ? `/errors/404-${lang}.plain.html`
            : '/errors/404.plain.html';

          let resp = await fetch(fragmentPath);

          if (!resp.ok && fragmentPath !== '/errors/404.plain.html') {
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

              window.isErrorPage = true;
              window.errorCode = '404';
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[404 Fallback] Failed to load 404 content:', error);
        }
      }
    }

    const hasLoaderCurtain = !!document.querySelector('.section.cms-loader-container');
    if (hasLoaderCurtain) {
      showLoader(true);
    }
    document.body.classList.add('appear');
    const firstEagerSection = getFirstEagerSection(main);
    if (firstEagerSection) {
      await loadSection(firstEagerSection, waitForFirstImage);
    }
  }

  // Safety net: scripts injected late (e.g. the Centribal/Zendesk chat loaded
  // from delayed.js) assign window.onload after the load event has already
  // fired, so the handler never runs. Intercept the assignment and execute it
  // immediately when late.
  // NOTE: this block can itself install AFTER the load event (loadEager does
  // async section work, so on heavy pages it reaches here past loadEventEnd).
  // We therefore seed pageFullyLoaded from document.readyState and also check
  // readyState in the setter — relying only on the 'load' listener would leave
  // the net inert whenever it installs late (the very case it must cover).
  {
    let pageFullyLoaded = document.readyState === 'complete';
    let currentOnloadHandler = window.onload;
    window.addEventListener('load', () => { pageFullyLoaded = true; });
    Object.defineProperty(window, 'onload', {
      get() { return currentOnloadHandler; },
      set(fn) {
        currentOnloadHandler = fn;
        if ((pageFullyLoaded || document.readyState === 'complete') && typeof fn === 'function') {
          setTimeout(fn, 0);
        }
      },
      configurable: true,
    });
  }

  // Initialize GTM Martech (disabled in author mode).
  // Eager loads GA4 tags; lazy loads GTM containers. Both run here
  // (after body.appear) so GTM-injected scripts can register handlers
  // before the browser load event fires. Consent defaults to "denied"
  // (set in GtmMartech constructor); OneTrust updates it asynchronously.
  {
    const [{ isAuthorMode }, { default: gtmMartech }] = await Promise.all([
      import('./martech-config.js'),
      import('./gtm-martech.js'),
    ]);
    if (!isAuthorMode()) {
      await gtmMartech.eager();
      loadOneTrust();
      gtmMartech.lazy();
    }
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  const hasHash = Boolean(window.location.hash);
  try {
    // sections.css and grid-layout.css are preloaded in head.html as
    // non-blocking; await their attach here so section layouts
    // (hero-destinations data-section-type, grid-4-8, ...) are styled before
    // sections lose display:none in loadSection. Awaiting grid-layout.css here
    // prevents the title/rich-text reflow that occurs when the grid columns
    // apply only after the section is already visible (large CLS).
    await Promise.all([
      loadCSS(`${window.hlx.codeBasePath}/styles/sections.css`),
      loadCSS(`${window.hlx.codeBasePath}/styles/grid-layout.css`),
    ]);

    // Keep curtain active until visible content is ready.
    // If deep-linking to a hash, load all sections first for anchor reliability.
    if (hasHash) {
      await loadSections(main, false, true);
    } else {
      await loadInitialVisibleSections(main);
    }

    const { hash } = window.location;
    const element = hash ? doc.getElementById(hash.substring(1)) : false;
    if (hash && element) element.scrollIntoView();

    // For destinations pages with Smartvel, wait for content before hiding loader.
    // window.__smartvelLoadedPromise is set at module level in destinations.js.
    if (window.__smartvelLoadedPromise) {
      await Promise.race([
        window.__smartvelLoadedPromise,
        new Promise((resolve) => setTimeout(resolve, 15000)),
      ]);
    }
    // Re-strip trailing slashes after blocks have rendered their content.
    // decorateMain catches static HTML links, but web component blocks
    // (cms-rich-text, cards, etc.) populate links after initial decoration.
    stripInternalTrailingSlashes(main);
    // Force lazy images that are already in viewport to load eagerly.
    // Browser's IntersectionObserver may not trigger for images inside
    // CSS grid/flex containers with certain layout configurations.
    forceVisibleLazyImages(main);
    // Second pass after a delay: force ALL remaining lazy images.
    // By this point sections are loaded; no performance benefit to keeping them lazy.
    setTimeout(() => forceVisibleLazyImages(main, true), 2000);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[loadLazy] Error while preparing visible shell:', error);
  } finally {
    // Hide loader as soon as main content sections are ready.
    // Don't wait for header/footer — their space is already reserved
    // via CSS (--nav-height, --marquee-height) so no CLS.
    // This dramatically improves Speed Index by showing content earlier.
    // EXCEPCIÓN: en las páginas-puente /members/auth/* la cortina cms-loader debe
    // permanecer hasta que el handler redirija (la espera a Lifemiles ocurre DESPUÉS
    // de que las secciones están listas). El handler de auth la gestiona.
    if (!window.location.pathname.includes('/members/auth/')) {
      showLoader(false);
    }
  }

  // Load header and footer without blocking content visibility.
  const headerElement = doc.querySelector('header');

  // Darksite: en las landings de detalle (`/darksite/{lang}/...`, gated por
  // AV_DARKSITE_DETAIL_PAGES_ROOT + enabled) se carga el chrome propio del
  // darksite (HeaderDarksite light + FooterBottom darksite-light) en vez del
  // header/footer general. Si lo toma, se salta el loadHeader/loadFooter normal
  // y su espera de header-template-ready (el chrome darksite no emite ese evento
  // ni crea `.header-wrapper`). Fail-open: cualquier error cae al chrome normal.
  let darksiteChromeLoaded = false;
  try {
    const { maybeLoadDarksiteChrome } = await import('./services/darksite/darksite-chrome.js');
    darksiteChromeLoaded = await maybeLoadDarksiteChrome(doc);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[scripts] Darksite chrome failed (fail-open):', error);
  }

  if (!darksiteChromeLoaded) {
    await Promise.all([
      headerElement ? loadHeader(headerElement) : Promise.resolve(),
      loadFooter(doc.querySelector('footer')),
    ]);
  }

  // If header exists, wait for header-template-ready event to ensure header structure is ready
  // This ensures the header containers exist and child blocks have rendered
  if (headerElement && !darksiteChromeLoaded) {
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

  // Load remaining sections without blocking first paint/interaction.
  if (!hasHash) {
    loadRemainingSectionsInBackground(main);
  }

  // GTM containers and OneTrust already started in loadEager().
  // Push page_view event and load Adobe Launch here once content is ready.
  {
    const [{ isAuthorMode }, { default: gtmMartech }] = await Promise.all([
      import('./martech-config.js'),
      import('./gtm-martech.js'),
    ]);
    if (!isAuthorMode()) {
      const pageViewData = await pageViewEventData();
      gtmMartech.pushToDataLayer({
        event: 'page_view',
        ...pageViewData,
      });

      loadAdobeLaunch();
    }
  }

  // Non-critical global CSS (moved from head.html to avoid render-blocking).
  // sections.css is awaited at the top of loadLazy (preloaded in head.html).
  loadCSS(`${window.hlx.codeBasePath}/styles/components/component.css`);
  loadCSS(`${window.hlx.codeBasePath}/styles/components/custom-scrollbar.css`);
  loadCSS(`${window.hlx.codeBasePath}/styles/migration-cards.css`);
  loadCSS(`${window.hlx.codeBasePath}/styles/utilities.css`);

  // Show geo POS conflict modal if `resolvePOS()` tagged one during loadEager.
  // Runs post-render so it doesn't block LCP. Also wires the manual-POS-change
  // listener so the modal reappears when the user picks a different country
  // from the header selector (PBI rule: "Al cambiar POS: nuevo ciclo completo").
  try {
    const { maybeShowGeoConflictModal, registerManualPosChangeListener } = await import(
      './services/geolocation/geo-conflict-modal.service.js'
    );
    registerManualPosChangeListener();
    await maybeShowGeoConflictModal();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[scripts] geo conflict modal failed:', error);
  }

  // Lazy phase: request geolocation permission from the user (shows native
  // browser prompt) now that LCP is complete. If they allow, runs the full
  // geo triangulation and may show the conflict modal.
  try {
    const { lazyGeolocationRequest } = await import(
      './services/geolocation/geolocation.service.js'
    );
    const result = await lazyGeolocationRequest();
    // If the lazy phase resolved to W3C geo and detected a conflict with the
    // existing cookie, re-show the modal with the new tag.
    if (result?.source === 'w3c-geo' && result?.hasConflict) {
      const { maybeShowGeoConflictModal } = await import(
        './services/geolocation/geo-conflict-modal.service.js'
      );
      await maybeShowGeoConflictModal();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[scripts] lazy geolocation request failed:', error);
  }

  // Re-emit the origin-dropdown event after all blocks are decorated.
  // Fixes race condition where cms-promotional-cards-rail may decorate before
  // origin-dropdown-selector, rendering with the fallback origin (BOG) instead
  // of the geo-nearest (PPN). Re-dispatching ensures cards re-render.
  if (window.lastOriginDropdownCity) {
    const { dispatchCityFromOriginDropdownEvent } = await import(
      './utils/event-constants.js'
    );
    dispatchCityFromOriginDropdownEvent(window.lastOriginDropdownCity);
  }

  // grid-layout.css is now preloaded in head.html and awaited at the top of
  // loadLazy (before sections become visible) to avoid the title reflow/CLS.
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
async function loadDelayed() {
  const { isAuthorMode } = await import('./martech-config.js');
  if (isAuthorMode()) {
    return;
  }

  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here

  // Members: kill-switch maestro (AV_MEMBERS_ENABLED en environment.json). Con la feature
  // OFF ni siquiera se cargan los módulos ni se inyectan los scripts de terceros (Lifemiles
  // + Google One Tap). Los servicios además tienen un guard interno (defense-in-depth).
  import('./services/members/members-flag.js')
    .then(({ isMembersEnabled }) => isMembersEnabled())
    .then((membersOn) => {
      if (!membersOn) return;

      // Members (P5): precargar el script de Lifemiles eager-ish pero fuera del critical
      // path (loadDelayed) para el silent-check futuro de 1255354. Dynamic import → no entra
      // al bundle eager. El botón sign-in lo carga on-demand igual si esto falla.
      import('./services/members/lm-script.loader.js')
        .then(({ loadLmScript }) => loadLmScript())
        .catch(() => { /* no-op: carga on-demand desde login.service */ });

      // Members (P2 / CU-282): Google One Tap. El gate de ruta (Home + páginas corporativas) lo
      // resuelve `initOneTap` desde el CF (`config.oneTap.corporatePaths`; default solo Home si el
      // CF cae), junto con `enabled`, frecuencia y el guard de sesión anónima. Import incondicional:
      // el servicio corta temprano (sesión/ruta/frecuencia) sin trabajo extra.
      import('./services/members/google-one-tap.service.js')
        .then(({ initOneTap }) => initOneTap())
        .catch(() => { /* no-op */ });
    })
    .catch(() => { /* no-op */ });
}

/**
 * Gate de zona privada Members (1263924) — capa SÍNCRONA y temprana. En rutas del
 * Portal (`/{lang}/members`, NO las páginas-puente `/members/auth/*`), si no hay
 * cookie de sesión (`access_token`), oculta el contenido de inmediato (clase en
 * `<html>` + cortina CSS de styles.css) ANTES de pintar, para que un anónimo nunca
 * vea el perfil. El redirect real al login lo dispara `session.service`
 * (guardPortalSession); acá solo evitamos el flash. Matcher GENÉRICO (cubre los 4
 * idiomas, inmune a `portalRoutes` mal autoreada en el CF). El dev-mock local
 * (localhost + ?mockMembers=1) se excluye para poder previsualizar. El check de cookie
 * espeja `isLoggedIn()` de session.service (access_token NO es httpOnly). Fail-open
 * total: cualquier error NO rompe la carga de la página.
 */
function gateMembersPortalEarly() {
  try {
    const { pathname, hostname, search } = window.location;
    const isPortal = /(^|\/)members(\/|$)/.test(pathname) && !pathname.includes('/members/auth');
    if (!isPortal) return;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalhost && new URLSearchParams(search).get('mockMembers') === '1') return;
    const hasToken = document.cookie.split('; ').some((c) => c.startsWith('access_token='));
    if (!hasToken) document.documentElement.classList.add('members-gate-pending');
  } catch (e) { /* fail-open: nunca bloquear la carga de la página */ }
}

async function loadPage() {
  // Gate Portal Members (capa sync temprana): oculta el contenido a anónimos ANTES de
  // pintar; el redirect al login lo hace session.service. Ver gateMembersPortalEarly.
  gateMembersPortalEarly();

  // Members: kill-switch maestro (AV_MEMBERS_ENABLED). Con la feature OFF no se re-hidrata
  // sesión, no se manejan rutas /members/auth ni el modal de error. El gate síncrono
  // `gateMembersPortalEarly()` de arriba queda (es fail-open y en prod OFF no habrá páginas
  // /members publicadas).
  import('./services/members/members-flag.js')
    .then(({ isMembersEnabled }) => isMembersEnabled())
    .then((membersOn) => {
      if (!membersOn) return;

      // Members: páginas-puente members/auth/* (callback / redirect-login / redirect-logout).
      // Servicio por ruta (reemplaza al bloque): muestra loader + corre la lógica del modo.
      if (window.location.pathname.includes('/members/auth/')) {
        import('./services/members/members-auth.route.js')
          .then(({ handleAuthRoute }) => handleAuthRoute())
          .catch(() => { /* no-op */ });
      }

      // Members (1255354): re-hidratar la sesión desde cookies en cada page load (MPA).
      // Singleton por página: setea el estado + perfil (sessionStorage) + gancho multi-tab.
      import('./services/members/session.service.js')
        .then(({ initSession }) => initSession())
        .catch(() => { /* no-op */ });

      // Members: mostrar pending auth-error modal si existe (guardado por callback fallido).
      import('./services/members/members-auth.route.js')
        .then(({ showPendingErrorModal }) => showPendingErrorModal())
        .catch(() => { /* no-op */ });
    })
    .catch(() => { /* no-op */ });

  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
