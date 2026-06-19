import { h } from '@dropins/tools/preact.js';
import { useEffect, useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';

const html = htm.bind(h);

const HEX_REGEX = /^#[0-9A-Fa-f]{3,8}$/;
// Subset of CSS named colors the author is allowed to use without quotes.
// Anything outside this list (or hex / rgb*) falls back to the default to avoid
// CSS injection via the `background:` style attribute.
const CSS_COLOR_KEYWORDS = new Set([
  'transparent', 'currentcolor', 'inherit',
  'white', 'black', 'gray', 'grey', 'silver', 'red', 'green', 'blue',
  'yellow', 'orange', 'purple', 'pink', 'brown', 'cyan', 'magenta',
  'maroon', 'olive', 'navy', 'teal', 'lime', 'aqua', 'fuchsia',
]);
const RGB_REGEX = /^rgba?\(\s*[\d.\s,%/]+\s*\)$/i;
const STOP_POSITION_REGEX = /^-?[\d.]+(%|px|em|rem)?$/;
const GRADIENT_DIRECTIONS = new Set([
  'to bottom', 'to top', 'to left', 'to right',
  'to bottom right', 'to bottom left', 'to top right', 'to top left',
  '0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg',
]);

// Accepts hex (#fff, #FFFAEB), CSS named color keywords (white, transparent),
// and rgb()/rgba() functions. Anything else falls back.
const sanitizeColor = (value, fallback = '#1b1b1b') => {
  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  // Hard block characters that could break out of the style declaration.
  if (/[;{}<>]/.test(trimmed)) return fallback;
  if (HEX_REGEX.test(trimmed)) return trimmed;
  if (CSS_COLOR_KEYWORDS.has(trimmed.toLowerCase())) return trimmed;
  if (RGB_REGEX.test(trimmed)) return trimmed;
  return fallback;
};

const sanitizeGradientDirection = (value) => (
  value && GRADIENT_DIRECTIONS.has(value) ? value : 'to bottom'
);

// Accepts CSS length / percentage tokens for a gradient stop ('0%', '50%', '12px').
const sanitizeStopPosition = (value, fallback) => (
  value && typeof value === 'string' && STOP_POSITION_REGEX.test(value.trim())
    ? value.trim()
    : fallback
);

const isExternalUrl = (url) => (
  url && !url.startsWith('/') && !url.startsWith('#') && !url.startsWith('?')
);

const buildRelAttr = (url, linkType) => {
  if (isExternalUrl(url)) {
    return `noopener noreferrer${linkType && linkType !== 'dofollow' ? ` ${linkType}` : ''}`;
  }
  return linkType && linkType !== 'dofollow' ? linkType : undefined;
};

const buildTargetAttr = (url) => (isExternalUrl(url) ? '_blank' : '_self');

/**
 * FlexibleContentBanner — DS organism for the CMS Flexible Content Banner.
 *
 * Responsibilities:
 *  - Render the title (H2) + description (richtext, pre-sanitized upstream)
 *    + up to 2 CTAs over a flexible layout.
 *  - Handle two image modes:
 *    * `split` → image occupies ~50% on tablet/desktop, full-width on top in
 *      mobile. The non-image half uses a solid color or gradient background.
 *    * `image-background` → image fills the banner as background; text + CTAs
 *      overlay it aligned to `textPosition`.
 *  - Switch the colour scheme (`light` vs `dark`) for text + CTA variants.
 *  - Apply CSS-only truncation: title 2 lines, description 3 lines (≥768px);
 *    mobile shows full content.
 *  - CTA layout: tablet/desktop align left or right; mobile horizontal (side
 *    by side, left-aligned) or vertical (stacked, full width).
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description  Pre-sanitized HTML (DOMPurify in the block).
 * @param {'left'|'right'} props.textPosition Desktop/tablet only.
 * @param {'split'|'image-background'} props.imageMode
 * @param {string} props.imageDesktop  Desktop image src (≥ 1024 px).
 * @param {string} props.imageMobile   Mobile image src (< 768 px).
 * @param {string} props.imageTablet   Tablet image src (768 – 1023 px).
 * @param {Object|null} props.pictureDesktop
 * @param {Object|null} props.pictureMobile
 * @param {Object|null} props.pictureTablet
 * @param {string} props.imageAlt
 * @param {'light'|'dark'} props.colorScheme
 * @param {'solid'|'gradient'} props.solidBackgroundType
 * @param {string} props.backgroundColor
 * @param {string} props.gradientColorStart
 * @param {string} props.gradientColorEnd
 * @param {string} props.gradientDirection
 * @param {string} props.cta1Text
 * @param {string} props.cta1Url
 * @param {'dofollow'|'nofollow'|'sponsored'} props.cta1LinkType
 * @param {string} props.cta2Text
 * @param {string} props.cta2Url
 * @param {'dofollow'|'nofollow'|'sponsored'} props.cta2LinkType
 * @param {'left'|'right'} props.ctaAlignmentDesktop
 * @param {'horizontal'|'vertical'} props.ctaOrientationMobile
 * @param {'lazy'|'eager'} props.loading
 * @param {'primary'|'secondary'} props.cta1Variant
 * @param {'primary'|'secondary'} props.cta2Variant
 * @param {string} props.customClassName
 */
export const FlexibleContentBanner = ({
  title = '',
  description = '',
  textPosition = 'right',
  imageMode = 'split',
  imageDesktop = '',
  imageMobile = '',
  imageTablet = '',
  pictureDesktop = null,
  pictureMobile = null,
  pictureTablet = null,
  imageAlt = '',
  colorScheme = 'dark',
  solidBackgroundType = 'solid',
  backgroundColor = '#1b1b1b',
  gradientColorStart = '',
  gradientColorEnd = '',
  gradientDirection = 'to bottom',
  cta1Text = '',
  cta1Url = '',
  cta1LinkType = 'dofollow',
  cta2Text = '',
  cta2Url = '',
  cta2LinkType = 'dofollow',
  ctaAlignmentDesktop = 'left',
  ctaOrientationMobile = 'horizontal',
  loading = 'lazy',
  cta1Variant = 'primary',
  cta2Variant = 'secondary',
  gradientStartPosition = '0%',
  gradientEndPosition = '100%',
  customClassName = '',
}) => {
  // Detect tablet/desktop viewport so we can pick the right Button size:
  // Figma uses button/B200 (md = 52h / 20font) on tablet+desktop (>= 768) and
  // button/B100 (xs = 32h / 14font) on mobile (< 768). The atom Button takes
  // a single `size` prop, so we need JS state for this — null initial is
  // SSR-safe and gets resolved on the client in the effect below.
  const [isMdUp, setIsMdUp] = useState(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia('(min-width: 768px)');
    setIsMdUp(mql.matches);
    const handler = (e) => setIsMdUp(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  // Until the client resolves (SSR / first paint), assume desktop so we don't
  // flash a mobile-sized button on a desktop page.
  const ctaSize = isMdUp === false ? 'xs' : 'md';

  const isImageBackground = imageMode === 'image-background';
  const isLight = colorScheme === 'light';
  const loadingMode = loading === 'eager' ? 'eager' : 'lazy';
  const imageDecoding = loadingMode === 'eager' ? 'sync' : 'async';
  const imageFetchPriority = loadingMode === 'eager' ? 'high' : 'low';

  // Compute background for the solid (non-image) half in split mode.
  const safeBackgroundColor = sanitizeColor(backgroundColor, '#1b1b1b');
  const safeGradientStart = sanitizeColor(gradientColorStart, '');
  const safeGradientEnd = sanitizeColor(gradientColorEnd, '');
  const safeGradientDirection = sanitizeGradientDirection(gradientDirection);
  const safeStartStop = sanitizeStopPosition(gradientStartPosition, '0%');
  const safeEndStop = sanitizeStopPosition(gradientEndPosition, '100%');

  const splitBackgroundStyle = (() => {
    if (solidBackgroundType === 'gradient' && safeGradientStart && safeGradientEnd) {
      return `background: linear-gradient(${safeGradientDirection}, ${safeGradientStart} ${safeStartStop}, ${safeGradientEnd} ${safeEndStop});`;
    }
    if (solidBackgroundType === 'gradient' && (safeGradientStart || safeGradientEnd)) {
      // Fallback to whichever single colour is provided.
      return `background: ${safeGradientStart || safeGradientEnd};`;
    }
    return `background: ${safeBackgroundColor};`;
  })();

  // Colour scheme classes. Use `!` prefix on the title so we beat the global
  // `h2 { color: var(--text-color-secondary); }` rule from styles/styles.css.
  // Same trick is used by secondary-banner.js for the same reason.
  const textColorClass = isLight ? '!text-white' : '!text-[#1b1b1b]';

  // Compute the Button atom variant for each banner CTA. The model now
  // exposes 4 values that map 1:1 to the atom variants:
  //   primary, primary-dark, secondary, secondary-dark
  // No overrides needed — the atom carries all the styling.
  //
  // Backward-compat: the previous 4-option model used '-on-light' / '-on-dark'
  // suffixes; we alias them to the new short names so old author content keeps
  // rendering correctly until the instances are re-saved.
  const LEGACY_ALIAS = {
    'primary-on-light': 'primary',
    'primary-on-dark': 'primary-dark',
    'secondary-on-light': 'secondary',
    'secondary-on-dark': 'secondary-dark',
  };
  const VALID_VARIANTS = new Set(['primary', 'primary-dark', 'secondary', 'secondary-dark']);
  // Bug 1261582: over the banner's dynamic background the LIGHT `secondary`
  // button must follow Figma HOME-26052026 "Secundarios" light mode in every
  // state: default fill white 60% (9195:17757), hover fill #e9e9e9 (9195:17790),
  // active fill #d9d9d9 (9195:17818) — all with a #1b1b1b border (the atom's
  // secondary hover border is #494949, so it is forced here).
  // Scoped HERE (consumer override) on purpose — the shared `secondary` atom
  // variant stays solid for surfaces built against the original spec (header,
  // cards, language-search). The hover/active fills are re-stated with `!` so
  // the important default-fill override does not swallow them on those states.
  const SECONDARY_OVERLAY_CLASS = [
    '!bg-background-brand-secondary-default/60', // default → white 60%
    'hover:!bg-background-brand-secondary-hover', // hover → #e9e9e9
    'active:!bg-background-brand-secondary-active', // active → #d9d9d9
    'hover:!border-border-brand-secondary-default', // hover border → #1b1b1b
  ].join(' ');
  // Bug 1261582: styles/components/component.css forces the :active / :focus
  // border to `var(--button-border-active|focus, inherit) !important`. The
  // bordered secondary variants don't set that custom property, so the
  // `inherit` fallback turns the outline dark on press/focus and it disappears
  // (most visibly secondary-dark's white border). Pin the correct token through
  // the atom's borderActiveColor/borderFocusColor props so the outline keeps its
  // color in every state. (No change to the shared atom.)
  const BORDER_STATE_TOKEN = {
    secondary: 'color-border-brand-secondary-default', // #1b1b1b
    'secondary-dark': 'color-white', // #fff — white outline kept on active/focus
  };
  const resolveCtaVisuals = (authorVariant) => {
    const aliased = LEGACY_ALIAS[authorVariant] || authorVariant;
    const variant = VALID_VARIANTS.has(aliased) ? aliased : 'primary';
    const customClassName = variant === 'secondary' ? SECONDARY_OVERLAY_CLASS : '';
    const borderStateToken = BORDER_STATE_TOKEN[variant] || null;
    return { buttonVariant: variant, customClassName, borderStateToken };
  };

  // CTA resolution. PBI criterio 5: "Si se configura uno solo debe ser primary;
  // si hay dos se diferencia uno y uno." When there's only one CTA we override
  // the author's variant to ensure it always renders as filled primary — this
  // matches the PBI spec literally and prevents an outlined lone CTA looking
  // ambiguous over the banner background.
  const cta1Present = !!(cta1Text && cta1Url);
  const cta2Present = !!(cta2Text && cta2Url);

  // The forced "primary" still respects the banner colorScheme: light scheme
  // → primary-dark (white filled, readable on dark bg); dark scheme → primary
  // (dark filled, readable on light bg).
  const forcedPrimaryVariant = isLight ? 'primary-dark' : 'primary';

  const ctas = [];
  if (cta1Present && cta2Present) {
    const v1 = resolveCtaVisuals(cta1Variant);
    const v2 = resolveCtaVisuals(cta2Variant);
    ctas.push({
      text: cta1Text, url: cta1Url, linkType: cta1LinkType, kind: 'primary', ...v1,
    });
    ctas.push({
      text: cta2Text, url: cta2Url, linkType: cta2LinkType, kind: 'secondary', ...v2,
    });
  } else if (cta1Present) {
    // PBI: lone CTA forced to primary regardless of author selection.
    const v = resolveCtaVisuals(forcedPrimaryVariant);
    ctas.push({
      text: cta1Text, url: cta1Url, linkType: cta1LinkType, kind: 'primary', ...v,
    });
  } else if (cta2Present) {
    // PBI: lone CTA forced to primary regardless of author selection.
    const v = resolveCtaVisuals(forcedPrimaryVariant);
    ctas.push({
      text: cta2Text, url: cta2Url, linkType: cta2LinkType, kind: 'primary', ...v,
    });
  }

  // Mobile width behaviour summary (PBI criterio 6 — 2 valores):
  //  - 'vertical'             → flex-col, items stretch, both CTAs w-full
  //  - 'horizontal' (default) → flex-row, items start aligned left, w-auto + wrap safety
  const isMobileVertical = ctaOrientationMobile === 'vertical';

  const ctaContainerClasses = [
    'flex',
    // Mobile orientation + item alignment
    isMobileVertical ? 'flex-col items-stretch' : 'flex-row items-start flex-wrap justify-start',
    // Mobile gap
    'gap-3',
    // Width: vertical → full so children can stretch; horizontal → auto.
    isMobileVertical ? 'w-full' : 'w-auto',
    // Desktop/tablet: always full so md:justify-end/start works; never stretch
    // items (we want natural button widths on desktop) and never wrap there.
    'md:w-full md:flex-nowrap md:flex-row md:items-center md:gap-4',
    ctaAlignmentDesktop === 'right' ? 'md:justify-end' : 'md:justify-start',
  ].filter(Boolean).join(' ');

  // Identifier-only helper kept for the `data-cta-<kind>` legacy hook class.
  // Width modifiers now live next to the Button atom invocation in renderCta.
  const ctaLinkBaseClass = (kind) => `data-cta-${kind}`;

  const renderCta = (cta) => {
    // Render the link via the Button atom's own `href` prop so there's a single
    // focusable element. Wrapping the Button in an extra <a> caused a double
    // focus indicator (the browser's default outline on the wrapper plus the
    // atom's focus-visible ring on the inner button) — see QA report 2026-05-22.
    // The atom emits `<a data-button>` when href is set; we forward
    // `data-cta-kind` via the rest-props pass-through so existing selectors and
    // tests keep matching `a[data-cta-kind]`.
    const mobileW = isMobileVertical ? 'w-full' : 'w-auto';
    const ctaClassName = [
      ctaLinkBaseClass(cta.kind),
      mobileW,
      'md:w-auto md:flex-none',
      cta.customClassName,
    ].filter(Boolean).join(' ');
    return html`
      <${Button}
        href=${cta.url}
        target=${buildTargetAttr(cta.url)}
        rel=${buildRelAttr(cta.url, cta.linkType)}
        variant=${cta.buttonVariant}
        size=${ctaSize}
        customClassName=${ctaClassName}
        borderActiveColor=${cta.borderStateToken}
        borderFocusColor=${cta.borderStateToken}
        data-cta-kind=${cta.kind}
        aria-label=${cta.text}
      >
        ${cta.text}
      </${Button}>
    `;
  };

  // CSS `object-position` for the picture's <img>. Hardcoded (no longer
  // authorable — the PBI doesn't ask for it).
  //
  // In `image-background` mode the layout differs per breakpoint:
  //   - mobile + tablet: text overlays the bottom of the banner full-width →
  //     image is centered so the subject is visible behind the text.
  //   - desktop (lg+): text sits laterally (50% of the banner) → image's
  //     focal point is pushed to the OPPOSITE side so the subject doesn't get
  //     covered by the overlay.
  // In `split` mode the image lives in its own column → always centered.
  // object-position per breakpoint for image-background:
  //  - mobile + tablet: object-center → tablet uses the desktop panoramic
  //    asset (Figma 9166:12050) which is wider than the tablet banner; cover
  //    crops the sides symmetrically while keeping the centered subject.
  //  - desktop (lg+): object-left/right → the text column sits on the opposite
  //    half, so we push the image focal point away from it.
  let imgPositionClass = 'object-center';
  if (isImageBackground) {
    imgPositionClass = textPosition === 'right'
      ? 'object-center lg:object-left'
      : 'object-center lg:object-right';
  }

  // Single <picture> element with media-controlled sources. The browser
  // evaluates the media queries instantly (no JS state, no re-render lag),
  // so the image and the text utilities (md:/lg:) cross their breakpoints in
  // the same frame. Breakpoints below MUST match Tailwind's md=768 / lg=1024.
  //
  // Asset priority by breakpoint depends on imageMode:
  //  - SPLIT: each breakpoint uses its own asset because the image slot scales
  //    proportionally (mobile ~320 wide, tablet ~384 wide, desktop ~624 wide).
  //      ≥ 1024  → desktop · 768-1023 → tablet · < 768 → mobile
  //  - IMAGE-BACKGROUND: the image fills the FULL banner width on every
  //    breakpoint ≥ 768 (banner is 768 wide on tablet, up to 1248 on desktop).
  //    Tablet asset is sized for the split slot (~384 wide), so it gets
  //    severely cropped when stretched across the whole tablet banner. We use
  //    the desktop (panoramic) asset for tablet too.
  //      ≥ 768  → desktop · < 768 → mobile
  const desktopSrc = imageDesktop || pictureDesktop?.src || '';
  const tabletSrc = imageTablet || pictureTablet?.src || desktopSrc;
  const mobileSrc = imageMobile || pictureMobile?.src || desktopSrc;
  const alt = imageAlt
    || pictureDesktop?.alt
    || pictureTablet?.alt
    || pictureMobile?.alt
    || '';

  // AEM Edge Delivery exposes each asset as a URL with query params like
  // `?width=750&format=jpg&optimize=medium`. We strip the `width` param and
  // only keep `format` so AEM returns the original asset size in WebP or JPG.
  // The browser still gets a smaller transfer thanks to WebP, but resolution
  // matches whatever the author uploaded.
  const buildAemUrl = (baseUrl, format) => {
    if (!baseUrl) return '';
    const [pathPart, queryPart = ''] = baseUrl.split('?');
    const params = new URLSearchParams(queryPart);
    params.delete('width');
    if (format) params.set('format', format);
    const qs = params.toString();
    return qs ? `${pathPart}?${qs}` : pathPart;
  };

  const buildSourcePair = (baseUrl, media) => {
    if (!baseUrl) return '';
    return html`
      <source
        type="image/webp"
        media=${media || undefined}
        srcset=${buildAemUrl(baseUrl, 'webply')}
      />
      <source
        type="image/jpeg"
        media=${media || undefined}
        srcset=${buildAemUrl(baseUrl, 'jpg')}
      />
    `;
  };

  const responsivePicture = () => {
    if (isImageBackground) {
      // Each breakpoint uses its own author-supplied asset so authors can
      // upload a tablet image with the right aspect ratio for the panoramic
      // tablet banner (~2.35:1). tabletSrc falls back to desktopSrc upstream
      // when the author skips it, preserving the old behaviour by default.
      //   >= 1024 → desktopSrc · 768-1023 → tabletSrc · < 768 → mobileSrc
      return html`
        <picture class="w-full h-full block">
          ${buildSourcePair(desktopSrc, '(min-width: 1024px)')}
          ${buildSourcePair(tabletSrc, '(min-width: 768px)')}
          ${buildSourcePair(mobileSrc, null)}
          <img
            src=${buildAemUrl(mobileSrc, 'jpg')}
            alt=${alt}
            loading=${loadingMode}
            decoding=${imageDecoding}
            fetchpriority=${imageFetchPriority}
            class=${`w-full h-full object-cover ${imgPositionClass}`}
          />
        </picture>
      `;
    }
    // Split mode: each breakpoint uses its own author asset.
    return html`
      <picture class="w-full h-full block">
        ${buildSourcePair(desktopSrc, '(min-width: 1024px)')}
        ${buildSourcePair(tabletSrc, '(min-width: 768px)')}
        ${buildSourcePair(mobileSrc, null)}
        <img
          src=${buildAemUrl(mobileSrc, 'jpg')}
          alt=${alt}
          loading=${loadingMode}
          decoding=${imageDecoding}
          fetchpriority=${imageFetchPriority}
          class=${`w-full h-full object-cover ${imgPositionClass}`}
        />
      </picture>
    `;
  };

  // ---- Text content (title + description + CTAs) ----
  // Figma anatomy (node 9156:36442 mainContent):
  //   - outer "mainContent": flex-col, gap 16px, between textContainer and CTAs
  //   - inner "textContainer": flex-col, gap 4px, between title and description
  // Mobile typography drops to H400 (18px) + P200 (14px); desktop is H700 (28px)
  // + P400 (18px). Line-heights: title = 100% (leading-none), desc = 1.5.
  const textContent = html`
    <div class="flex flex-col gap-[16px] lg:py-[24px] z-10 relative">
      ${title || description ? html`
        <div class="flex flex-col gap-[4px]">
          ${title ? html`
            <h2
              data-truncate="title"
              class=${`m-0 ${textColorClass} font-bold font-['Red_Hat_Display'] !text-[18px] !leading-[24px] md:!text-[28px] md:!leading-[37px] line-clamp-none md:line-clamp-2`}
            >
              ${title}
            </h2>
          ` : ''}
          ${description ? html`
            <div
              data-truncate="description"
              class=${`${textColorClass} font-normal font-['Red_Hat_Display'] text-[14px] leading-[21px] md:text-[18px] md:leading-[27px] line-clamp-none md:line-clamp-3 [&_p]:m-0 [&_a]:underline`}
              dangerouslySetInnerHTML=${{ __html: description }}
            ></div>
          ` : ''}
        </div>
      ` : ''}
      ${ctas.length > 0 ? html`
        <div class=${ctaContainerClasses}>
          ${ctas.map(renderCta)}
        </div>
      ` : ''}
    </div>
  `;

  // ---- IMAGE-BACKGROUND mode ----
  if (isImageBackground) {
    // textPosition controls HORIZONTAL placement of the text column inside
    // the banner. The image fills the whole banner as background.
    // Layout per breakpoint:
    //   - mobile + tablet (< lg=1024): text overlay full-width at the bottom.
    //   - desktop (lg+): text takes ~50% of the banner aligned to textPosition.
    // We use justify-* on a flex-row container; w-full vs w-1/2 controls the
    // text column width; items-end vs items-center controls vertical placement.
    const lgOverlayJustify = textPosition === 'left' ? 'lg:justify-start' : 'lg:justify-end';
    return html`
      <section
        data-name="flexible-content-banner"
        data-image-mode="image-background"
        data-text-position=${textPosition}
        data-color-scheme=${colorScheme}
        class=${`relative w-full max-w-xl mx-auto rounded-[16px] overflow-hidden lg:max-h-[290px] ${customClassName}`}
      >
        <div class="absolute inset-0 z-0">
          ${responsivePicture()}
        </div>
        <!-- Image-bg layout follows the Figma anatomy per device:
              - mobile/tablet: vertical stack inside the banner
                  · a 170px transparent spacer (Figma 9166:12051) pushes the
                    text+CTAs toward the bottom half of the banner
                  · the mainContent then takes the remaining space with its own
                    p-[16px] padding (Figma 9166:11400 / 9166:12055)
              - desktop: horizontal layout with the text column sitting on the
                right (or left) half, vertically centered, only horizontal
                padding 24px (Figma 9156:36468). -->
        <div
          class=${`relative z-10 flex flex-col lg:flex-row ${lgOverlayJustify} lg:items-stretch ${ctaOrientationMobile === 'vertical' ? 'min-h-[430px]' : 'min-h-[386px]'} md:min-h-[365px] lg:min-h-[240px]`}
        >
          <div class="h-[170px] w-full shrink-0 lg:hidden" aria-hidden="true"></div>
          <div class="w-full lg:w-1/2 max-w-full flex-1 lg:flex-none flex flex-col justify-center p-[16px] lg:p-0 lg:px-[24px]">
            ${textContent}
          </div>
        </div>
      </section>
    `;
  }

  // ---- SPLIT mode ----
  // Layout per Figma (node 9156:36436 matrix):
  //   - mobile (<768) + tablet (768-1023): vertical stack, image 170px on top
  //   - desktop (lg+): horizontal split 50/50, image side controlled by textPosition
  // The lateral split lives at the `lg:` breakpoint (NOT md), because Figma's
  // tablet variant (9156:36475) keeps the same vertical stack as mobile.
  const splitDirectionClasses = textPosition === 'left'
    ? 'lg:flex-row-reverse' // image right, text left
    : 'lg:flex-row'; // image left (default), text right

  return html`
    <section
      data-name="flexible-content-banner"
      data-image-mode="split"
      data-text-position=${textPosition}
      data-color-scheme=${colorScheme}
      class=${`w-full max-w-xl mx-auto rounded-[16px] overflow-hidden flex flex-col lg:max-h-[290px] ${splitDirectionClasses} ${customClassName}`}
    >
      <!-- Image side. Figma heights per breakpoint: mobile 170px, tablet 170px (vertical), desktop 240px (50% column). -->
      <div class="relative w-full lg:w-1/2 h-[170px] lg:h-auto lg:min-h-[240px] overflow-hidden">
        <div class="absolute inset-0">
          ${responsivePicture()}
        </div>
      </div>
      <!-- Solid / gradient side.
           - mobile/tablet (less than lg): padding all sides on this wrapper
             (the inner textContent has no padding at these breakpoints).
           - desktop (lg+): only horizontal padding here; the vertical 24px
             lives inside the textContent via lg:py-[24px] so the padding
             stays glued to the text and the banner can stretch toward 290
             with the padding pinned to the text edges.
           Image-bg desktop uses the same pattern — vertical padding comes
           from textContent in both modes on desktop. -->
      <div
        class="relative w-full lg:w-1/2 flex items-center p-[16px] lg:p-0 lg:px-[24px] min-h-[170px] lg:min-h-[240px]"
        style=${splitBackgroundStyle}
      >
        ${textContent}
      </div>
    </section>
  `;
};

export default FlexibleContentBanner;
