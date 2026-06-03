import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import Breadcrumb from '../../design-system/molecules/breadcrumb/breadcrumb.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { getStoredLanguage } from '../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

let i18Cache = null;

/**
 * Gets i18n label from cache
 * @param {string} key - i18n key
 * @returns {string} Translated text or empty string
 */
function getI18nLabel(key) {
  if (!i18Cache) return '';
  const labelData = i18Cache.find((item) => item.Key === key);
  return labelData?.Text || '';
}

/**
 * Gets page title (jcr:title) from a URL.
 * Fetches the full page HTML and extracts og:title which reflects the clean
 * jcr:title configured in AEM page properties.
 * Verifies the canonical URL matches the request to discard redirect/rewrite
 * pages whose content belongs to a different URL.
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} Page title or empty string
 */
const getPageTitle = async (url) => {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return '';

    const text = await resp.text();

    // Discard if canonical points elsewhere (redirect/rewrite page)
    const canonicalMatch = text.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
    if (canonicalMatch) {
      const canonical = new URL(canonicalMatch[1], url).pathname.replace(/\/$/, '');
      const requested = new URL(url).pathname.replace(/\/$/, '');
      if (canonical !== requested) return '';
    }

    // Prefer nav-title (jcr:title — clean navigation label)
    const navTitleMatch = text.match(/<meta[^>]+name="nav-title"[^>]+content="([^"]+)"/);
    if (navTitleMatch) return navTitleMatch[1];

    // Fallback to <title> (may include brand prefix from jcr:pageTitle)
    const titleMatch = text.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) return titleMatch[1];

    // Last resort: og:title
    const ogMatch = text.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/);
    if (ogMatch) return ogMatch[1];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching page title:', error);
  }
  return '';
};

/**
 * Returns absolute URL without query/hash.
 * @param {string} url - URL to normalize
 * @returns {string} Canonical absolute URL
 */
function getCanonicalUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.search = '';
    parsed.hash = '';
    return parsed.href;
  } catch (error) {
    return url;
  }
}

/**
 * Builds BreadcrumbList JSON-LD object.
 * @param {Array} items - Breadcrumb items
 * @returns {Object|null} JSON-LD object
 */
function buildBreadcrumbJsonLd(items) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: getCanonicalUrl(item.url),
    })),
  };
}

/**
 * Injects breadcrumb JSON-LD script in head.
 * @param {Array} items - Breadcrumb items
 */
function upsertBreadcrumbJsonLd(items) {
  const jsonLd = buildBreadcrumbJsonLd(items);
  if (!jsonLd) return;

  const oldScript = document.querySelector('script[data-breadcrumb-json-ld="true"]');
  if (oldScript) oldScript.remove();

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-breadcrumb-json-ld', 'true');
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
}

/**
 * Builds breadcrumb items from current path
 * @param {string} pathname - Current pathname
 * @param {string} customSlug - Optional custom text for last item
 * @returns {Promise<Array>} Array of breadcrumb items
 */
const buildBreadcrumbItems = async (pathname, customSlug = '') => {
  // Remove first and last slash
  const cleanPath = pathname.replace(/^\/|\/$/g, '');
  const pathSegments = cleanPath.split('/').filter((seg) => seg.length > 0);

  // Extract language from first segment (es, en, pt, etc.)
  const language = pathSegments.length > 0 ? pathSegments[0] : 'es';
  const homeUrl = `${window.location.origin}/${language}/`;

  // Home item always points to /{lang}/
  const items = [
    {
      label: 'Home',
      url: homeUrl,
      isHome: true,
      isActive: pathSegments.length <= 1, // Active if only language in path
    },
  ];

  // If only language in path (e.g., /es/ or /es), we're at home
  if (pathSegments.length <= 1) {
    return items;
  }

  // Process path segments after language
  const contentSegments = pathSegments.slice(1);

  for (let i = 0; i < contentSegments.length - 1; i += 1) {
    const pathPart = contentSegments[i];
    const parentPath = contentSegments.slice(0, i + 1).join('/');
    const defaultUrl = `${window.location.origin}/${language}/${parentPath}`;

    // Check for i18n overrides: breadcrumb.labels.{slug} and breadcrumb.urls.{slug}
    const labelOverride = getI18nLabel(`breadcrumb.labels.${pathPart}`);
    const urlOverride = getI18nLabel(`breadcrumb.urls.${pathPart}`);

    let name;
    let itemUrl;

    if (labelOverride) {
      name = labelOverride;
      itemUrl = urlOverride
        ? `${window.location.origin}/${language}/${urlOverride.replace(/^\//, '')}`
        : defaultUrl;
    } else {
      /* eslint-disable-next-line no-await-in-loop */
      name = await getPageTitle(defaultUrl)
        || pathPart.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      itemUrl = defaultUrl;
    }

    items.push({
      label: name,
      url: itemUrl,
      isHome: false,
      isActive: false,
    });
  }

  // Add current page — prefer nav-title (jcr:title) for clean breadcrumb label.
  // customSlug (from block content) takes highest priority when present.
  const navTitle = document.querySelector('meta[name="nav-title"]')?.getAttribute('content');
  const currentTitle = navTitle
    || document.title
    || document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  if (currentTitle && contentSegments.length > 0) {
    const label = customSlug && customSlug.trim() !== '' ? customSlug : currentTitle;

    items.push({
      label,
      url: getCanonicalUrl(window.location.href),
      isHome: false,
      isActive: true,
    });
  }

  return items;
};

/**
 * Decorates the Breadcrumb block
 * @param {Element} block The breadcrumb block element
 */
export default async function decorate(block) {
  let customSlug = '';
  const firstChild = block.querySelector('div > div > p');
  if (firstChild) {
    customSlug = firstChild.textContent?.trim() || '';
  }

  block.textContent = '';

  const language = getStoredLanguage() || 'es';
  if (!i18Cache) {
    const i18Data = await fetchAEMData(`${language}`);
    i18Cache = i18Data?.data || [];
  }

  const homeLabel = getI18nLabel('breadcrumb.labels.home') || 'Inicio';

  const container = document.createElement('div');
  container.className = 'breadcrumb-container relative';
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Navegación breadcrumb');

  const { pathname } = window.location;

  const items = await buildBreadcrumbItems(pathname, customSlug);

  if (!items || items.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('No breadcrumb items to display');
    return;
  }

  items[0].label = homeLabel;
  upsertBreadcrumbJsonLd(items);

  const handleItemClick = (url) => {
    window.location.href = url;
  };

  render(
    html`<${Breadcrumb} items=${items} onItemClick=${handleItemClick} homeLabel=${homeLabel} />`,
    container,
  );

  block.appendChild(container);

  const scrollArea = container.querySelector('.breadcrumb-scroll-area');

  // Below this width (mobile) the trail collapses to Home > previous > current
  // when there are more than 3 levels. At >= 768 (tablet/desktop) all levels show.
  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const levels = items.length;

  // Mobile collapse: with more than 3 levels keep only the last two items
  // (previous + current) inside the scroll area; the middle ones are hidden
  // (display:none — still in the DOM and in the structured data for SEO).
  const applyCollapse = () => {
    if (!scrollArea) return;
    const children = Array.from(scrollArea.children);
    children.forEach((el) => { el.style.display = ''; });

    if (mobileQuery.matches && levels > 3) {
      const itemEls = children.filter((el) => !el.classList.contains('breadcrumb-separator'));
      const previousEl = itemEls[itemEls.length - 2];
      const keepFrom = children.indexOf(previousEl);
      for (let i = 0; i < keepFrom; i += 1) children[i].style.display = 'none';
    }
  };

  // Width (px) of the edge fade that signals hidden content while scrolling.
  const FADE = 28;
  // Distance (px) before the right end over which the "..." indicator fades out.
  const DOTS_FADE_ZONE = 32;

  // Overflow indicators, both background-independent (no painted color):
  // - a literal "..." (::after, driven by --bc-more-right) on the right: full
  //   while there is more content ahead, fading over the last DOTS_FADE_ZONE px
  //   and gone at the far right / when there is no overflow.
  // - a CSS edge fade-mask on the scroll area: right while more is ahead, left
  //   once scrolled (covers what's behind). It also keeps the "..." legible by
  //   fading the underlying text at the right edge.
  const updateScrollMask = () => {
    if (!scrollArea) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollArea;
    const maxScroll = scrollWidth - clientWidth;

    const moreRight = maxScroll > 0
      ? Math.min(Math.max((maxScroll - scrollLeft) / DOTS_FADE_ZONE, 0), 1)
      : 0;
    container.style.setProperty('--bc-more-right', String(moreRight));

    const fadeLeft = scrollLeft > 1 ? FADE : 0;
    const fadeRight = scrollLeft < maxScroll - 1 ? FADE : 0;

    if (!fadeLeft && !fadeRight) {
      scrollArea.style.webkitMaskImage = '';
      scrollArea.style.maskImage = '';
      return;
    }

    const mask = `linear-gradient(to right, rgba(0,0,0,0) 0, rgba(0,0,0,1) ${fadeLeft}px, rgba(0,0,0,1) calc(100% - ${fadeRight}px), rgba(0,0,0,0) 100%)`;
    scrollArea.style.webkitMaskImage = mask;
    scrollArea.style.maskImage = mask;
  };

  let rafId = null;
  let pendingCollapse = false;
  const schedule = (recheckCollapse) => {
    if (recheckCollapse) pendingCollapse = true;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (pendingCollapse) {
        pendingCollapse = false;
        applyCollapse();
      }
      updateScrollMask();
    });
  };
  const scheduleMask = () => schedule(false); // scroll: collapse doesn't change
  const scheduleAll = () => schedule(true); // resize / breakpoint change

  applyCollapse();
  updateScrollMask();

  if (scrollArea) scrollArea.addEventListener('scroll', scheduleMask, { passive: true });
  const resizeObserver = new ResizeObserver(scheduleAll);
  if (scrollArea) resizeObserver.observe(scrollArea);
  window.addEventListener('resize', scheduleAll);
  mobileQuery.addEventListener('change', scheduleAll);
  // Re-check once fonts/icons settle (content width changes after load)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleAll);
  }
  const settleTimeout = setTimeout(scheduleAll, 200);

  block.addEventListener('unload', () => {
    if (rafId) cancelAnimationFrame(rafId);
    clearTimeout(settleTimeout);
    resizeObserver.disconnect();
    if (scrollArea) scrollArea.removeEventListener('scroll', scheduleMask);
    window.removeEventListener('resize', scheduleAll);
    mobileQuery.removeEventListener('change', scheduleAll);
  });
}
