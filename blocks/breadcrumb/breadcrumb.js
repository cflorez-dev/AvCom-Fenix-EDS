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
 * Gets page title from URL
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} Page title
 */
const getPageTitle = async (url) => {
  try {
    const resp = await fetch(url);
    // Only use title if request was successful AND no redirect occurred
    if (resp.ok && resp.url === url) {
      const htmlContent = document.createElement('div');
      htmlContent.innerHTML = await resp.text();
      const title = htmlContent.querySelector('title');
      return title ? title.innerText : '';
    }
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
    const url = `${window.location.origin}/${language}/${parentPath}`;

    /* eslint-disable-next-line no-await-in-loop */
    const name = await getPageTitle(url);

    items.push({
      label: name || pathPart.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      url,
      isHome: false,
      isActive: false,
    });
  }

  // Add current page (last segment)
  const titleElement = document.querySelector('title');
  if (titleElement && contentSegments.length > 0) {
    const label = customSlug && customSlug.trim() !== '' ? customSlug : titleElement.innerText;

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

  let scrollTimeout;

  const updateOverflowIndicator = () => {
    if (!scrollArea) return;

    const hasOverflow = scrollArea.scrollWidth > scrollArea.clientWidth;

    if (!hasOverflow) {
      container.style.setProperty('--overflow-indicator-opacity', '0');
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = scrollArea;
    const maxScroll = scrollWidth - clientWidth;

    const scrollProgress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    const opacity = Math.max(0, 1 - scrollProgress);

    container.style.setProperty('--overflow-indicator-opacity', opacity.toString());
  };

  const throttledUpdate = () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      scrollTimeout = null;
      updateOverflowIndicator();
    }, 16); // ~60fps
  };

  const initialCheckTimeout = setTimeout(updateOverflowIndicator, 100);

  const resizeHandler = () => throttledUpdate();
  const scrollHandler = () => throttledUpdate();

  window.addEventListener('resize', resizeHandler);
  if (scrollArea) {
    scrollArea.addEventListener('scroll', scrollHandler, { passive: true });
  }

  block.addEventListener('unload', () => {
    clearTimeout(initialCheckTimeout);
    clearTimeout(scrollTimeout);
    window.removeEventListener('resize', resizeHandler);
    if (scrollArea) {
      scrollArea.removeEventListener('scroll', scrollHandler);
    }
  });
}
