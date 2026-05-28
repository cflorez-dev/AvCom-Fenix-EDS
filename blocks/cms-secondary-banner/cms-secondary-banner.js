import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { SecondaryBanner } from '../../design-system/organisms/banners/secondary-banner/secondary-banner.js';
import { SecondaryBannerLeft } from '../../design-system/organisms/banners/secondary-banner/secondary-banner-variant.js';
import { mapCmsSecondaryBannerData } from './cms-secondary-banner-helper.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

/**
 * Decorates the CMS Secondary Banner block
 * @param {Element} block The cms-secondary-banner block element
 */
export default function decorate(block) {
  // 1. Extract data BEFORE clearing the block
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
    targetCountries: mappedConfig.targetCountries || fallbackConfig.targetCountries || '',
    targetLanguages: mappedConfig.targetLanguages || fallbackConfig.targetLanguages || '',
    showCondor: (() => {
      if (mappedConfig.showCondor !== undefined) return mappedConfig.showCondor;
      if (fallbackConfig.showCondor !== undefined) return fallbackConfig.showCondor;
      return true;
    })(),
    imagePosition: mappedConfig.imagePosition || fallbackConfig.imagePosition || 'right',
    cta2Text: mappedConfig.cta2Text || fallbackConfig.cta2Text || '',
    cta2Url: mappedConfig.cta2Url || fallbackConfig.cta2Url || '',
    cta2LinkType: mappedConfig.cta2LinkType || fallbackConfig.cta2LinkType || 'dofollow',
    ctaStyle: mappedConfig.ctaStyle || fallbackConfig.ctaStyle || 'dark',
  };

  // Country and language filtering
  if (!shouldShowByTargeting(config.targetCountries, config.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // Validate required fields — title or image must exist; CTA is optional
  if (!config.title && !config.imageDesktop) {
    block.style.display = 'none';
    return;
  }

  // Fallback: use desktop image for mobile when mobile image is not provided
  if (!config.pictureMobile && config.pictureDesktop) {
    config.pictureMobile = {
      ...config.pictureDesktop,
      pictureElement: config.pictureDesktop.pictureElement.cloneNode(true),
    };
    config.imageMobile = config.imageDesktop;
  }

  // 3. Clear block and render INSIDE (compatible with editor-support.js re-decoration)
  block.textContent = '';

  const container = document.createElement('div');
  container.className = 'cms-secondary-banner-content w-[100%]';
  block.appendChild(container);

  // 4. Render the SecondaryBanner organism (or left variant)
  const BannerComponent = config.imagePosition === 'left' ? SecondaryBannerLeft : SecondaryBanner;
  render(
    html`
      <${BannerComponent}
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
        showCondor=${config.showCondor}
        loading=${config.loading}
        cta2Text=${config.cta2Text}
        cta2Url=${config.cta2Url}
        cta2LinkType=${config.cta2LinkType}
        ctaStyle=${config.ctaStyle}
      />
    `,
    container,
  );
}
