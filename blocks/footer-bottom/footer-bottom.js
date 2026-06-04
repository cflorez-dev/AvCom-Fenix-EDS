import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { FooterBottom } from '../../design-system/organisms/footer/footer-bottom/footer-bottom.js';
import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { resolveLocale } from '../../scripts/utils/locale.js';
import {
  getFooterCompactMode,
  FOOTER_COMPACT_MODE_EVENT,
} from '../../scripts/utils/event-constants.js';

const html = htm.bind(h);

function extractImageSrc(element) {
  if (!element) return '';

  const img = element.querySelector('picture img') || element.querySelector('img');
  if (img && img.src) {
    return img.src;
  }

  const picture = element.querySelector('picture');
  if (picture) {
    const svgSource = picture.querySelector('source[type="image/svg+xml"]');
    if (svgSource && svgSource.srcset) {
      const srcset = svgSource.srcset.split(/[\s,]/)[0];
      if (srcset) return srcset;
    }

    const anySource = picture.querySelector('source[srcset]');
    if (anySource && anySource.srcset) {
      const srcset = anySource.srcset.split(/[\s,]/)[0];
      if (srcset) return srcset;
    }
  }

  return '';
}

function extractBoolean(element) {
  if (!element) return false;
  const text = (element.textContent || '').trim().toLowerCase();
  return text === 'true';
}

function extractUrl(element) {
  if (!element) return '';
  const link = element.querySelector('a');
  if (!link) return '';
  const url = link.href || link.getAttribute('href') || '';
  // Convert relative URLs to absolute
  if (url && !url.startsWith('http') && !url.startsWith('//')) {
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    return `${window.location.origin}/${url}`;
  }
  return url;
}

function mapFooterBottomData(block) {
  const children = [...block.children];

  // Content fields always start at index 0.
  // target-countries=30, target-languages=31 (read positionally in decorate)
  const data = {};
  const themeText = (children[0]?.textContent || '').trim().toLowerCase();
  // eslint-disable-next-line no-nested-ternary
  data.theme = themeText === 'dark' ? 'dark' : themeText === 'white' ? 'white' : 'light';

  data['show-app-store-buttons'] = extractBoolean(children[1]);
  data['app-store-imagen-dark'] = extractImageSrc(children[2]);
  data['app-store-imagen-light'] = extractImageSrc(children[3]);
  data['app-store-url'] = extractUrl(children[4]);
  data['app-store-nueva-pestana'] = extractBoolean(children[5]);
  data['google-play-imagen-dark'] = extractImageSrc(children[6]);
  data['google-play-imagen-light'] = extractImageSrc(children[7]);
  data['google-play-url'] = extractUrl(children[8]);
  data['google-play-nueva-pestana'] = extractBoolean(children[9]);

  const baseIndex = 10;
  const maxSocialNetworks = 5;
  const fieldsPerSocialNetwork = 4;

  for (let socialNum = 1; socialNum <= maxSocialNetworks; socialNum += 1) {
    const index = baseIndex + ((socialNum - 1) * fieldsPerSocialNetwork);

    data[`red-social-${socialNum}-imagen-dark`] = extractImageSrc(children[index]);
    data[`red-social-${socialNum}-imagen-light`] = extractImageSrc(children[index + 1]);
    data[`red-social-${socialNum}-url`] = extractUrl(children[index + 2]);
    data[`red-social-${socialNum}-nueva-pestana`] = extractBoolean(children[index + 3]);
  }

  return data;
}

function groupFooterBottomData(flatData) {
  const grouped = {
    theme: flatData.theme,
    'show-app-store-buttons': flatData['show-app-store-buttons'],
    appstore: {
      'imagen-dark': flatData['app-store-imagen-dark'] || '',
      'imagen-light': flatData['app-store-imagen-light'] || '',
      url: flatData['app-store-url'] || '',
      'nueva-pestana': flatData['app-store-nueva-pestana'] || false,
    },
    googleplay: {
      'imagen-dark': flatData['google-play-imagen-dark'] || '',
      'imagen-light': flatData['google-play-imagen-light'] || '',
      url: flatData['google-play-url'] || '',
      'nueva-pestana': flatData['google-play-nueva-pestana'] || false,
    },
    'redes-sociales': [],
  };

  for (let i = 1; i <= 5; i += 1) {
    const url = flatData[`red-social-${i}-url`];
    if (url) {
      grouped['redes-sociales'].push({
        'imagen-dark': flatData[`red-social-${i}-imagen-dark`] || '',
        'imagen-light': flatData[`red-social-${i}-imagen-light`] || '',
        url,
        'nueva-pestana': flatData[`red-social-${i}-nueva-pestana`] || false,
      });
    }
  }

  return grouped;
}

/**
 * Decorates the Footer Bottom block (Copyright & Social Media)
 * @param {Element} block The footer-bottom block element
 */
export default async function decorate(block) {
  const flatData = mapFooterBottomData(block);
  const mappedData = groupFooterBottomData(flatData);

  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    block.classList.add('footer-bottom-author-mode');

    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'footer-bottom-author-indicator';
    authorIndicator.textContent = '©️ Footer Bottom (Author Mode - Edit below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);

    return;
  }

  const hideForCompact = () => {
    block.style.display = 'none';
    const wrapper = document.querySelector('footer .footer-bottom-wrapper');
    if (wrapper) wrapper.innerHTML = '';
  };

  // Caso 1: footer-partners-logos compact ya decoró antes
  if (getFooterCompactMode() === true) {
    hideForCompact();
    return;
  }

  // Caso 2: footer-bottom decora primero — suscribirse y reaccionar después
  window.addEventListener(FOOTER_COMPACT_MODE_EVENT, ({ detail }) => {
    if (detail.active) hideForCompact();
  }, { once: true });

  // Targeting: positional rows 30=target-countries, 31=target-languages
  const rows = [...block.children];
  const getRowText = (rowIndex) => {
    const row = rows[rowIndex];
    if (!row || !row.children.length) return '';
    return row.children[0]?.textContent?.trim() || '';
  };

  const targetCountries = getRowText(30);
  const targetLanguages = getRowText(31);

  if (!shouldShowByTargeting(targetCountries, targetLanguages)) {
    block.style.display = 'none';
    return;
  }

  const container = document.createElement('div');

  const socialLinks = mappedData['redes-sociales'].map((redSocial) => {
    let socialName = 'link';
    try {
      const urlObj = new URL(redSocial.url);
      const pathname = urlObj.pathname.replace(/^\//, '').split('/')[0];
      socialName = pathname || 'link';
    } catch (e) {
      const match = redSocial.url.match(/\/([^/]+)/);
      socialName = match ? match[1] : 'link';
    }

    return {
      url: redSocial.url,
      name: socialName,
      title: socialName,
      iconDark: redSocial['imagen-dark'],
      iconLight: redSocial['imagen-light'],
      isExternal: redSocial['nueva-pestana'],
    };
  });

  const locale = await resolveLocale();
  const language = locale.language || 'es';
  const configData = await fetchAEMData(language);
  const i18Data = Object.fromEntries(
    configData.data.map(({ Key, Text }) => [Key, Text]),
  );

  render(
    html`<${FooterBottom}
      theme=${mappedData.theme}
      showAppStoreButtons=${mappedData['show-app-store-buttons']}
      appStoreImage=${mappedData.theme === 'dark' ? mappedData.appstore['imagen-dark'] : mappedData.appstore['imagen-light']}
      googlePlayImage=${mappedData.theme === 'dark' ? mappedData.googleplay['imagen-dark'] : mappedData.googleplay['imagen-light']}
      appStoreUrl=${mappedData.appstore.url}
      googlePlayUrl=${mappedData.googleplay.url}
      socialLinks=${socialLinks}
      data=${mappedData}
      i18n=${i18Data}
    />`,
    container,
  );

  const injectIntoFooter = () => {
    const footerWrapper = document.querySelector('.footer-bottom-wrapper');
    if (footerWrapper) {
      // PROTECTION: Skip if container already has content (first matching block wins)
      if (footerWrapper.children.length > 0) {
        block.style.display = 'none';
        return true;
      }
      footerWrapper.appendChild(container);
      footerWrapper.classList.remove('hidden');
      return true;
    }
    return false;
  };

  if (!injectIntoFooter()) {
    const retryInterval = setInterval(() => {
      if (injectIntoFooter()) {
        clearInterval(retryInterval);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(retryInterval);
      if (!document.querySelector('footer .footer-bottom-wrapper')?.contains(container)) {
        block.parentNode.insertBefore(container, block.nextSibling);
      }
    }, 5000);
  }

  block.style.display = 'none';
}
