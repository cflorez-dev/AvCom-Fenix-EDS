import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import Breadcrumb from '../../design-system/molecules/breadcrumb/breadcrumb.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';

const html = htm.bind(h);

let i18Cache = null;

/**
 * Gets language from 'selected-language' cookie
 * @returns {string} Language code from cookie, default 'es'
 */
function getLanguageFromCookie() {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split('; selected-language=');
    if (parts.length === 2) {
      const language = parts.pop().split(';').shift();
      return language || 'es';
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error reading selected-language cookie:', error);
  }
  return 'es';
}

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
    if (resp.ok) {
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
 * Builds breadcrumb items from current path
 * @param {string} pathname - Current pathname
 * @param {string} customSlug - Optional custom text for last item
 * @returns {Promise<Array>} Array of breadcrumb items
 */
const buildBreadcrumbItems = async (pathname, customSlug = '') => {
  const items = [
    {
      label: 'Home',
      url: window.location.origin,
      isHome: true,
      isActive: pathname === '/' || pathname === '',
    },
  ];

  if (pathname === '/' || pathname === '') {
    return items;
  }

  // Remove first and last slash, split path
  const pathsList = pathname.replace(/^\/|\/$/g, '').split('/');

  for (let i = 0; i < pathsList.length - 1; i += 1) {
    const pathPart = pathsList[i];
    const prevPath = items[i].url.replace(window.location.origin, '');
    const path = `${prevPath}/${pathPart}`;
    const url = `${window.location.origin}${path}`;

    /* eslint-disable-next-line no-await-in-loop */
    const name = await getPageTitle(url);

    items.push({
      label: name || pathPart.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      url,
      isHome: false,
      isActive: false,
    });
  }

  const titleElement = document.querySelector('title');
  if (titleElement && pathsList.length > 0) {
    const label = customSlug && customSlug.trim() !== '' ? customSlug : titleElement.innerText;

    items.push({
      label,
      url: window.location.href,
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

  const language = getLanguageFromCookie();
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
