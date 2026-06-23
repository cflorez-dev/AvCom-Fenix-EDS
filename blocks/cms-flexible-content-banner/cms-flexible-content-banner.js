import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { FlexibleContentBanner } from '../../design-system/organisms/banners/flexible-content-banner/flexible-content-banner.js';
import { mapFlexibleContentBannerData } from './cms-flexible-content-banner-helper.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';
import { sanitizeHTMLAsync } from '../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * Decorates the CMS Flexible Content Banner block.
 *
 * Pipeline:
 *  1. Map authored content (24 positional rows or key/value config fallback).
 *  2. Apply POS + language targeting.
 *  3. Validate required field (imageDesktop). If missing, hide the block.
 *  4. Fallback imageMobile to imageDesktop when not provided.
 *  5. Sanitize the richtext description with DOMPurify before render.
 *  6. Clear the block and render the FlexibleContentBanner organism inside it.
 *
 * @param {Element} block The cms-flexible-content-banner block element
 */
export default async function decorate(block) {
  const mappedConfig = mapFlexibleContentBannerData(block);
  const fallbackConfig = readBlockConfig(block) || {};

  const config = {
    title: mappedConfig.title || fallbackConfig.title || '',
    description: mappedConfig.description || fallbackConfig.description || '',
    textPosition: mappedConfig.textPosition || fallbackConfig.textposition || fallbackConfig['text-position'] || 'right',
    imageMode: mappedConfig.imageMode || fallbackConfig.imagemode || fallbackConfig['image-mode'] || 'split',
    imageDesktop: mappedConfig.imageDesktop || fallbackConfig.imagedesktop || fallbackConfig['image-desktop'] || '',
    imageMobile: mappedConfig.imageMobile || fallbackConfig.imagemobile || fallbackConfig['image-mobile'] || '',
    imageTablet: mappedConfig.imageTablet || fallbackConfig.imagetablet || fallbackConfig['image-tablet'] || '',
    pictureDesktop: mappedConfig.pictureDesktop || null,
    pictureMobile: mappedConfig.pictureMobile || null,
    pictureTablet: mappedConfig.pictureTablet || null,
    imageAlt: mappedConfig.imageAlt || fallbackConfig.imagealt || fallbackConfig['image-alt'] || '',
    colorScheme: mappedConfig.colorScheme || fallbackConfig.colorscheme || fallbackConfig['color-scheme'] || 'dark',
    solidBackgroundType: mappedConfig.solidBackgroundType || fallbackConfig.solidbackgroundtype || 'solid',
    backgroundColor: mappedConfig.backgroundColor || fallbackConfig.backgroundcolor || '#1b1b1b',
    gradientColorStart: mappedConfig.gradientColorStart || fallbackConfig.gradientcolorstart || '',
    gradientColorEnd: mappedConfig.gradientColorEnd || fallbackConfig.gradientcolorend || '',
    gradientDirection: mappedConfig.gradientDirection || fallbackConfig.gradientdirection || 'to bottom',
    cta1Text: mappedConfig.cta1Text || fallbackConfig.cta1text || '',
    cta1Url: mappedConfig.cta1Url || fallbackConfig.cta1url || '',
    cta1LinkType: mappedConfig.cta1LinkType || fallbackConfig.cta1linktype || 'dofollow',
    cta2Text: mappedConfig.cta2Text || fallbackConfig.cta2text || '',
    cta2Url: mappedConfig.cta2Url || fallbackConfig.cta2url || '',
    cta2LinkType: mappedConfig.cta2LinkType || fallbackConfig.cta2linktype || 'dofollow',
    ctaAlignmentDesktop: mappedConfig.ctaAlignmentDesktop || fallbackConfig.ctaalignmentdesktop || 'left',
    ctaOrientationMobile: mappedConfig.ctaOrientationMobile || fallbackConfig.ctaorientationmobile || 'horizontal',
    loading: mappedConfig.loading || fallbackConfig.loading || 'lazy',
    targetCountries: mappedConfig.targetCountries || fallbackConfig['target-countries'] || fallbackConfig.targetcountries || '',
    targetLanguages: mappedConfig.targetLanguages || fallbackConfig['target-languages'] || fallbackConfig.targetlanguages || '',
    cta1Variant: mappedConfig.cta1Variant || fallbackConfig.cta1variant || 'primary',
    cta2Variant: mappedConfig.cta2Variant || fallbackConfig.cta2variant || 'secondary',
    gradientStartPosition: mappedConfig.gradientStartPosition || fallbackConfig.gradientstartposition || '0%',
    gradientEndPosition: mappedConfig.gradientEndPosition || fallbackConfig.gradientendposition || '100%',
  };

  // 1. Targeting (POS + language).
  if (!shouldShowByTargeting(config.targetCountries, config.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // 2. Required validation — image is the mandatory minimum.
  if (!config.imageDesktop) {
    block.style.display = 'none';
    return;
  }

  // 3. Fallback mobile / tablet images to desktop when the author leaves them empty.
  if (!config.pictureMobile && config.pictureDesktop) {
    config.pictureMobile = {
      ...config.pictureDesktop,
      pictureElement: config.pictureDesktop.pictureElement?.cloneNode(true) || null,
    };
    config.imageMobile = config.imageDesktop;
  }
  if (!config.pictureTablet && config.pictureDesktop) {
    config.pictureTablet = {
      ...config.pictureDesktop,
      pictureElement: config.pictureDesktop.pictureElement?.cloneNode(true) || null,
    };
    config.imageTablet = config.imageDesktop;
  }

  // 4. Sanitize richtext description before passing to the organism (which
  //    uses dangerouslySetInnerHTML and trusts the input).
  const sanitizedDescription = await sanitizeHTMLAsync(config.description, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['p', 'a', 'strong', 'em', 'b', 'i', 'u', 'br', 'span', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
  });

  // 5. Clear and render.
  block.textContent = '';

  const container = document.createElement('div');
  container.className = 'cms-flexible-content-banner-content w-[100%]';
  block.appendChild(container);

  render(
    html`
      <${FlexibleContentBanner}
        title=${config.title}
        description=${sanitizedDescription}
        textPosition=${config.textPosition}
        imageMode=${config.imageMode}
        imageDesktop=${config.imageDesktop}
        imageMobile=${config.imageMobile}
        imageTablet=${config.imageTablet}
        pictureDesktop=${config.pictureDesktop}
        pictureMobile=${config.pictureMobile}
        pictureTablet=${config.pictureTablet}
        imageAlt=${config.imageAlt}
        colorScheme=${config.colorScheme}
        solidBackgroundType=${config.solidBackgroundType}
        backgroundColor=${config.backgroundColor}
        gradientColorStart=${config.gradientColorStart}
        gradientColorEnd=${config.gradientColorEnd}
        gradientDirection=${config.gradientDirection}
        cta1Text=${config.cta1Text}
        cta1Url=${config.cta1Url}
        cta1LinkType=${config.cta1LinkType}
        cta2Text=${config.cta2Text}
        cta2Url=${config.cta2Url}
        cta2LinkType=${config.cta2LinkType}
        ctaAlignmentDesktop=${config.ctaAlignmentDesktop}
        ctaOrientationMobile=${config.ctaOrientationMobile}
        loading=${config.loading}
        cta1Variant=${config.cta1Variant}
        cta2Variant=${config.cta2Variant}
        gradientStartPosition=${config.gradientStartPosition}
        gradientEndPosition=${config.gradientEndPosition}
      />
    `,
    container,
  );
}
