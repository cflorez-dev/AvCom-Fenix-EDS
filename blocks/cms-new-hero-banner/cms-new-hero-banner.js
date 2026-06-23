import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { loadCSS } from '../../scripts/aem.js';
import { CmsNewHeroBanner } from '../../design-system/organisms/cms-new-hero-banner/cms-new-hero-banner.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { resolveLocale } from '../../scripts/utils/locale.js';
import extractHeroProps from './cms-new-hero-banner-helper.js';

loadCSS('/design-system/organisms/cms-new-hero-banner/cms-new-hero-banner.css');

const html = htm.bind(h);

/**
 * Adjusts an AEM image URL with width param.
 * Replicates the pattern in blocks/cms-hero-banner/cms-hero-banner.js:115-125.
 */
function heroImageUrl(url, width) {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.href);
    parsed.searchParams.set('width', width);
    parsed.searchParams.delete('optimize');
    return parsed.toString();
  } catch {
    return url;
  }
}

export default async function decorate(block) {
  // Author Mode: keep block editable, no transformation
  const isAuthorEnv = window.xwalk?.isAuthorEnv;
  if (isAuthorEnv) {
    block.classList.add('cms-new-hero-banner-author-mode');
    const indicator = document.createElement('div');
    indicator.className = 'cms-new-hero-banner-author-indicator';
    indicator.textContent = '🎨 CMS New Hero Banner (Author Mode - Edit below)';
    indicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(indicator, block.firstChild);
    return;
  }

  // Extract props via positional helper (container block pattern)
  const props = extractHeroProps(block);

  // Targeting: hide if it doesn't match the user's market/language
  if (!shouldShowByTargeting(props['target-countries'], props['target-languages'])) {
    hideBlockWithSection(block);
    return;
  }

  // Resolve i18n for BookingBox ONLY when actionMode = 'booking'
  let i18Data = {};
  if (props.actionMode === 'booking') {
    const locale = await resolveLocale();
    const language = locale.language || 'es';
    const configData = await fetchAEMData(language);
    i18Data = Object.fromEntries(
      configData.data.map(({ Key, Text }) => [Key, Text]),
    );
  }

  // Inject CSS vars for the 3 responsive images (with fallback chain)
  const desktopBg = heroImageUrl(props.imageDesktop || props.imageTablet || props.imageMobile, '1920');
  const tabletBg = heroImageUrl(props.imageTablet || props.imageDesktop || props.imageMobile, '1248');
  const mobileBg = heroImageUrl(props.imageMobile || props.imageTablet || props.imageDesktop, '768');

  block.style.setProperty('--cms-new-hero-desktop', desktopBg ? `url(${desktopBg})` : 'none');
  block.style.setProperty('--cms-new-hero-tablet', tabletBg ? `url(${tabletBg})` : 'none');
  block.style.setProperty('--cms-new-hero-mobile', mobileBg ? `url(${mobileBg})` : 'none');

  // Preload de las 3 imágenes cuando loading=eager.
  // Sin esto, al cruzar los media-query boundaries (767↔768, 1247↔1248) el
  // browser fetcha la imagen del nuevo breakpoint on-demand y produce un
  // parpadeo visible. fetchpriority alto sólo en la del breakpoint actual.
  if (props.loading === 'eager') {
    const vw = window.innerWidth;
    const currentBg = vw >= 1248 ? desktopBg : vw >= 768 ? tabletBg : mobileBg;
    [desktopBg, tabletBg, mobileBg]
      .filter((url, i, arr) => url && arr.indexOf(url) === i)
      .forEach((url) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        if (url === currentBg) link.setAttribute('fetchpriority', 'high');
        document.head.appendChild(link);
      });
  }

  // Hide original children instead of removing them — preserves data-aue-*
  // attributes that Universal Editor uses to add/edit child action button items
  // (same pattern as blocks/cms-informative-cards-rail/cms-informative-cards-rail.js).
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  const container = document.createElement('div');
  container.className = 'cms-new-hero-banner-content w-full';

  render(
    html`
      <${CmsNewHeroBanner}
        title=${props.title}
        titleLevel=${props.titleLevel}
        description=${props.description}
        imageAlt=${props.imageAlt}
        loading=${props.loading}
        contentAlignment=${props.contentAlignment}
        textColor=${props.textColor}
        showTextShadow=${props.showTextShadow}
        textShadowOffsetX=${props.textShadowOffsetX}
        textShadowOffsetY=${props.textShadowOffsetY}
        textShadowBlur=${props.textShadowBlur}
        textShadowColor=${props.textShadowColor}
        actionMode=${props.actionMode}
        ctaText=${props.ctaText}
        ctaUrl=${props.ctaUrl}
        defaultTripType=${props.defaultTripType}
        actionButtons=${props.actionButtons}
        i18n=${i18Data}
      />
    `,
    container,
  );

  block.appendChild(container);
}
