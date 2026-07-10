import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { LinkButton } from '../../../atoms/link-button/link-button.js';
import { processContentHTML } from '../../../helpers/process-content-html.js';
import { sanitizeHTML } from '../../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * SvgIcon - Fetches an SVG file and injects it inline so it responds to CSS color/fill via currentColor.
 * Uses DOMPurify.sanitize with RETURN_DOM_FRAGMENT + replaceChildren to avoid dangerouslySetInnerHTML.
 */
const SvgIcon = ({ src, customClass = '' }) => {
  const spanRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;
    fetch(src)
      .then((r) => r.text())
      .then((text) => {
        const processed = text
          .replace(/fill="(?!none|currentColor)[^"]*"/g, 'fill="currentColor"')
          .replace(/stroke="(?!none|currentColor)[^"]*"/g, 'stroke="currentColor"')
          .replace(/<svg\b/, '<svg aria-hidden="true" focusable="false" style="color:inherit;width:100%;height:100%"');
        if (spanRef.current && window.DOMPurify) {
          const clean = window.DOMPurify.sanitize(processed, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ['use'],
            RETURN_DOM_FRAGMENT: true,
          });
          spanRef.current.replaceChildren(...clean.childNodes);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (spanRef.current) spanRef.current.replaceChildren();
      });
  }, [src]);

  return html`<span
    ref=${spanRef}
    class=${`inline-flex items-center justify-center w-[16px] h-[16px] shrink-0 group-hover:scale-125 ${customClass}`}
    aria-hidden="true"
    style=${loaded ? '' : 'visibility:hidden'}
  />`;
};

/**
 * LinkCardHorizontal - Card component with horizontal layout
 *
 * ## Props
 * - `title`: `string` – Card title (required).
 * - `description`: `string` – Card descriptive text (required).
 * - `image`: `string` – Main image URL (required).
 * - `imageAlt`: `string` – Alt text for image (default: `''`).
 * - `linkText`: `string` – Link/button text (default: `"Descubre más"`).
 * - `linkAlt`: `string` – Alt text for link (accessibility).
 * - `href`: `string` – Link URL (required if card should be clickable).
 * - `onClick`: `function` – Click handler for card or button.
 * - `customClassName`: Additional CSS classes.
 * - `...rest`: Other valid properties.
 */
export const LinkCardHorizontal = ({
  title,
  description,
  image,
  imageAlt = '',
  imageDesktop,
  imageDesktopAlt = '',
  imageMobile,
  imageMobileAlt = '',
  linkText = '',
  linkAlt = '',
  href,
  onClick,
  customClassName = '',
  ctaIconBefore = 'none',
  ctaIconAfter = 'arrow',
  clickBehavior = 'fullCard',
  linkOpensIn = 'sameTab',
  loading = 'lazy',
  ...rest
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Detect if this is a "photographic card" (pure image, no text/CTA)
  const isPhotographicCard = !title && !description && !linkText;
  // Always apply border (even for photographic cards)
  const borderClasses = 'border border-solid border-[var(--border-stroke-default)]';
  const focusBorderClasses = 'focus-visible:!border-[var(--focus-primary)]';

  // Card is only clickable if href exists AND clickBehavior is 'fullCard'
  const isClickable = !!(href && clickBehavior === 'fullCard');

  // Base classes for horizontal layout
  // Parent container (mosaic) handles width and height
  const baseClasses = '!p-0 box-border relative rounded-[24px] '
    + 'w-full h-full no-underline '
    + 'overflow-hidden transition-all bg-[var(--bg-card-lighter)] '
    + `${borderClasses} `
    + 'flex flex-col md:flex-row items-start md:items-center justify-center '
    // El hover/focus shadow de TODA la card solo aplica si la card completa es
    // interactiva (isClickable = href && clickBehavior==='fullCard'). Si no hay
    // interacción, o si la única interacción es el botón terciario interno
    // (clickBehavior==='button'), la card no debe mostrar hover; ese feedback lo da
    // el botón por sí mismo.
    + `${!isPhotographicCard && isClickable ? 'hover:shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)] ' : ''}`
    + `${focusBorderClasses} ${!isPhotographicCard && isClickable ? 'focus-visible:shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)] ' : ''}`
    + 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-primary)] focus-visible:outline-offset-2 '
    + '';

  // cointainer class of image for horizontal layout
  const imageContainerClasses = 'image-container flex items-center justify-center overflow-hidden '
    + 'rounded-[var(--border-radius-large)] min-h-0 w-full md:basis-0 md:grow md:flex-1 md:h-full h-full max-[480px]:h-[175px] sm:min-h-[151px] sm:max-h-[151px] md:min-h-[155px] md:max-h-[155px] xl:min-h-[155px] xl:max-h-[155px]  pb-0 p-[16px] md:p-[16px]';

  // container class of content for horizontal layout
  const contentContainerClasses = 'min-h-[151px] box-border flex flex-col justify-between gap-3 '
    + 'items-start p-[16px] w-full md:basis-0 md:grow md:flex-1 md:h-full';

  // container class of text
  const textContainerClasses = 'flex flex-col gap-[8px] '
    + 'items-start relative shrink-0 w-full min-w-0 max-w-full overflow-hidden text-[var(--text-normal-primary)] '
    + 'tracking-[var(--letter-spacing-normal)]';

  // Title classes
  const titleClasses = '!m-0 font-[var(--heading-h500-family)] '
    + 'font-[var(--heading-h500-weight)] text-[var(--heading-h500-size)] '
    + 'leading-[var(--line-height-normal)] '
    + 'tracking-[var(--heading-h500-letter-spacing)] '
    + 'text-[var(--text-normal-primary)] w-full min-w-0 max-w-full relative shrink-0 break-words';

  // Description classes
  const descriptionClasses = '!m-0 font-[var(--paragraph-p300-family)] '
    + 'font-[var(--paragraph-p300-weight)] text-[var(--paragraph-p300-size)] '
    + 'leading-normal '
    + 'tracking-[var(--paragraph-p300-letter-spacing)] '
    + 'text-[var(--text-normal-primary)] !text-[16px] w-full min-w-0 max-w-full relative shrink-0 break-words';

  // VSTS: la descripción es rich text (puede traer <p>, <strong>, listas, enlaces).
  // Se procesa y se inyecta como HTML — antes se renderizaba como texto y mostraba
  // las etiquetas literales (p.ej. "<p>...</p>") en las mosaic cards.
  const processedDescription = processContentHTML(description || '', 'informative', {
    pClassName: descriptionClasses,
    // Los enlaces inline del rich-text deben ir subrayados (sin esto quedan
    // no-underline tras el fix del CTA #1020). VSTS 1282235.
    linkButtonOptions: { underline: true },
  });

  // Handler for card click
  const handleCardClick = (e) => {
    if (isClickable && onClick) {
      onClick(e);
    }
  };

  // Handler for link button click
  const handleLinkClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };

  // Handler for keyboard navigation
  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleCardClick(e);
    }
  };

  // Icon mapping
  const iconMap = {
    airplane: 'action/airplane',
    calendar: 'action/calendar',
    gift: 'action/gift',
    star: 'action/star',
    heart: 'action/heart',
    ticket: 'action/ticket',
    arrow: 'arrow-fordware',
    'arrow-left': 'arrow-fordware',
    'chevron-right': 'navigation/chevron-right',
    'arrow-right': 'arrow-fordware',
  };

  const getIconSrc = (iconKey) => {
    if (!iconKey || iconKey === 'none') return null;
    // Filter out invalid values that aren't icon names
    if (iconKey === 'fullCard' || iconKey === 'ctaOnly' || iconKey === 'sameTab' || iconKey === 'newTab') {
      return null;
    }
    const iconPath = iconMap[iconKey] || iconKey;
    return `${window.hlx?.codeBasePath || ''}/icons/${iconPath}.svg`;
  };

  const iconBeforeSrc = getIconSrc(ctaIconBefore);
  const iconAfterSrc = getIconSrc(ctaIconAfter);
  const loadingMode = loading === 'eager' ? 'eager' : 'lazy';
  const imageDecoding = loadingMode === 'eager' ? 'sync' : 'async';
  const imageFetchPriority = loadingMode === 'eager' ? 'high' : 'low';

  // Determine image source (priority: specific responsive images > fallback image prop)
  const finalImageDesktop = imageDesktop || image;
  const finalImageMobile = imageMobile || imageDesktop || image;
  const finalImageDesktopAlt = imageDesktopAlt || imageAlt;
  const finalImageMobileAlt = imageMobileAlt || imageDesktopAlt || imageAlt;

  // Render card content
  const renderCardContent = () => html`
    <!-- Image container -->
    <div class=${imageContainerClasses}>
      <picture class="w-full h-full">
        ${finalImageMobile && finalImageMobile !== finalImageDesktop ? html`
          <source media="(max-width: 767px)" srcset=${finalImageMobile} />
        ` : null}
        <img
          src=${finalImageDesktop}
          alt=${finalImageDesktopAlt}
          loading=${loadingMode}
          decoding=${imageDecoding}
          fetchpriority=${imageFetchPriority}
          class="inset-0 max-w-none object-cover object-[top_center] pointer-events-none !w-full !h-full rounded-[16px]"
        />
      </picture>
    </div>

    <!-- Content container -->
    <div class=${contentContainerClasses}>
      <!-- Text container -->
      <div class=${textContainerClasses}>
        <p class=${titleClasses}>
          ${title}
        </p>
        <div
          class="w-full min-w-0 max-w-full"
          dangerouslySetInnerHTML=${{ __html: sanitizeHTML(processedDescription) }}
        ></div>
      </div>

      <!-- Link button container -->
      <div class="flex items-end justify-end relative shrink-0 w-full min-w-0 max-h-[21px]">
        <${LinkButton}
          href=${href || '#'}
          title=${linkText}
          ariaLabel=${linkAlt}
          onClick=${handleLinkClick}
          size="default"
          target=${linkOpensIn === 'newTab' ? '_blank' : undefined}
          rel=${linkOpensIn === 'newTab' ? 'noopener noreferrer' : undefined}
          customClassName="group hover:font-bold active:font-bold"
        >
          ${iconBeforeSrc ? html`<${SvgIcon} src=${iconBeforeSrc} customClass=${ctaIconBefore === 'arrow-left' ? 'rotate-180' : ''} />` : null}
          ${linkText}
          ${iconAfterSrc ? html`<${SvgIcon} src=${iconAfterSrc} customClass=${ctaIconAfter === 'arrow-left' ? 'rotate-180' : ''} />` : null}
        </${LinkButton}>
      </div>
    </div>
  `;

  const finalClasses = `${baseClasses} ${customClassName}`.trim();

  // For photographic cards, render simplified content directly
  if (isPhotographicCard) {
    const finalImageDesktop = imageDesktop || image;
    const finalImageMobile = imageMobile || imageDesktop || image;
    const finalImageDesktopAlt = imageDesktopAlt || imageAlt;

    if (isClickable) {
      const Tag = href ? 'a' : 'button';
      const targetAttr = (href && linkOpensIn === 'newTab') ? { target: '_blank', rel: 'noopener noreferrer' } : {};
      const elementProps = href
        ? { href, ...targetAttr, ...rest }
        : { type: 'button', ...rest };

      return html`
        <${Tag}
          class=${finalClasses}
          data-name="linkCardHorizontal"
          onClick=${handleCardClick}
          onKeyDown=${handleKeyDown}
          onMouseEnter=${() => setIsHovered(true)}
          onMouseLeave=${() => setIsHovered(false)}
          ...${elementProps}
        >
          <picture class="w-full h-full absolute inset-0">
            ${finalImageMobile && finalImageMobile !== finalImageDesktop ? html`
              <source media="(max-width: 767px)" srcset=${finalImageMobile} />
            ` : null}
            <img
              src=${finalImageDesktop}
              alt=${finalImageDesktopAlt}
              loading=${loadingMode}
              decoding=${imageDecoding}
              fetchpriority=${imageFetchPriority}
              class="inset-0 object-cover object-center pointer-events-none !w-full !h-full rounded-[24px]"
            />
          </picture>
        </${Tag}>
      `;
    }

    return html`
      <div
        class=${finalClasses}
        data-name="linkCardHorizontal"
        tabIndex=${0}
        onMouseEnter=${() => setIsHovered(true)}
        onMouseLeave=${() => setIsHovered(false)}
        ...${rest}
      >
        <picture class="w-full h-full absolute inset-0">
          ${finalImageMobile && finalImageMobile !== finalImageDesktop ? html`
            <source media="(max-width: 767px)" srcset=${finalImageMobile} />
          ` : null}
          <img
            src=${finalImageDesktop}
            alt=${finalImageDesktopAlt}
            loading=${loadingMode}
            decoding=${imageDecoding}
            fetchpriority=${imageFetchPriority}
            class="inset-0 object-cover object-center pointer-events-none !w-full !h-full rounded-[24px]"
          />
        </picture>
      </div>
    `;
  }

  // If clickable, render as button or a
  if (isClickable) {
    const Tag = href ? 'a' : 'button';
    const targetAttr = (href && linkOpensIn === 'newTab') ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    const elementProps = href
      ? { href, ...targetAttr, ...rest }
      : { type: 'button', ...rest };

    return html`
      <${Tag}
        class=${finalClasses}
        data-name="linkCardHorizontal"
        onClick=${handleCardClick}
        onKeyDown=${handleKeyDown}
        onMouseEnter=${() => setIsHovered(true)}
        onMouseLeave=${() => setIsHovered(false)}
        ...${elementProps}
      >
        ${renderCardContent()}
      </${Tag}>
    `;
  }

  // If not clickable, render as div
  return html`
    <div
      class=${finalClasses}
      data-name="linkCardHorizontal"
      tabIndex=${0}
      onMouseEnter=${() => setIsHovered(true)}
      onMouseLeave=${() => setIsHovered(false)}
      ...${rest}
    >
      ${renderCardContent()}
    </div>
  `;
};

export default LinkCardHorizontal;
