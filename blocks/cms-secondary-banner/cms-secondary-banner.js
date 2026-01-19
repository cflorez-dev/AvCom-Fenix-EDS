import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { SecondaryBanner } from '../../design-system/organisms/banners/secondary-banner/secondary-banner.js';
import { mapCmsSecondaryBannerData } from './cms-secondary-banner-helper.js';

const html = htm.bind(h);

/**
 * Decorates the CMS Secondary Banner block
 * @param {Element} block The cms-secondary-banner block element
 */
export default function decorate(block) {
  const isAuthorEnv = window.xwalk?.isAuthorEnv;
  if (isAuthorEnv) {
    block.classList.add('cms-secondary-banner-author-mode');
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'cms-secondary-banner-author-indicator';
    authorIndicator.textContent = '🎨 CMS Secondary Banner (Author Mode - Edit below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666; font-family: system-ui;';
    block.insertBefore(authorIndicator, block.firstChild);

    return;
  }

  const mappedConfig = mapCmsSecondaryBannerData(block);
  const fallbackConfig = readBlockConfig(block);

  // Merge mapped config with fallback config
  const config = {
    title: mappedConfig.title || fallbackConfig.title || '',
    firstLabel: mappedConfig.firstLabel || fallbackConfig.firstLabel || '',
    secondaryLabel: mappedConfig.secondaryLabel || fallbackConfig.secondaryLabel || '',
    imageDesktop: mappedConfig.imageDesktop || fallbackConfig.imageDesktop || '',
    imageMobile: mappedConfig.imageMobile || fallbackConfig.imageMobile || '',
    pictureDesktop: mappedConfig.pictureDesktop || null,
    pictureMobile: mappedConfig.pictureMobile || null,
    imageAlt: mappedConfig.imageAlt || fallbackConfig.imageAlt || '',
    ctaText: mappedConfig.ctaText || fallbackConfig.ctaText || '',
    ctaUrl: mappedConfig.ctaUrl || fallbackConfig.ctaUrl || '',
    ctaLinkType: mappedConfig.ctaLinkType || fallbackConfig.ctaLinkType || 'dofollow',
    mode: mappedConfig.mode || fallbackConfig.mode || 'light',
    backgroundType: mappedConfig.backgroundType || fallbackConfig.backgroundType || 'solid',
    backgroundColor: mappedConfig.backgroundColor || fallbackConfig.backgroundColor || '#1b1b1b',
    gradientColorStart: mappedConfig.gradientColorStart || fallbackConfig.gradientColorStart || '',
    gradientColorEnd: mappedConfig.gradientColorEnd || fallbackConfig.gradientColorEnd || '',
    condorStrokeColor: mappedConfig.condorStrokeColor || fallbackConfig.condorStrokeColor || '',
    loading: mappedConfig.loading || fallbackConfig.loading || 'lazy',
  };

  // Validate required fields
  if (!config.ctaText || !config.ctaUrl) {
    block.style.display = 'none';
    return;
  }

  // Create container for the banner
  const container = document.createElement('div');
  container.className = 'cms-secondary-banner-wrapper w-[100%]';

  // Render the SecondaryBanner organism
  render(
    html`
      <${SecondaryBanner}
        title=${config.title}
        firstLabel=${config.firstLabel}
        secondaryLabel=${config.secondaryLabel}
        imageDesktop=${config.imageDesktop}
        imageMobile=${config.imageMobile}
        pictureDesktop=${config.pictureDesktop}
        pictureMobile=${config.pictureMobile}
        imageAlt=${config.imageAlt}
        ctaText=${config.ctaText}
        ctaUrl=${config.ctaUrl}
        ctaLinkType=${config.ctaLinkType}
        mode=${config.mode}
        backgroundType=${config.backgroundType}
        backgroundColor=${config.backgroundColor}
        gradientColorStart=${config.gradientColorStart}
        gradientColorEnd=${config.gradientColorEnd}
        condorStrokeColor=${config.condorStrokeColor}
        loading=${config.loading}
      />
    `,
    container,
  );

  // Hide the original block and insert the rendered banner
  block.style.display = 'none';
  block.parentNode.insertBefore(container, block.nextSibling);
}
