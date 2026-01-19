import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { LinkButton } from '../../../atoms/link-button/link-button.js';

const html = htm.bind(h);

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
  linkText = '',
  linkAlt = '',
  href,
  onClick,
  customClassName = '',
  ...rest
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isClickable = !!(href || onClick);

  // Base classes for horizontal layout
  // Parent container (mosaic) handles width and height
  const baseClasses = '!p-0 box-border relative rounded-[24px] '
    + 'w-full h-full no-underline '
    + 'overflow-hidden transition-all bg-[var(--bg-card-lighter)] '
    + 'border border-solid border-[var(--border-stroke-default)] '
    + 'flex flex-col md:flex-row items-start md:items-center justify-center '
    + 'hover:shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)] '
    + 'focus:!border-[var(--focus-primary)] focus:shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)] '
    + 'focus:outline focus:outline-2 focus:outline-[var(--focus-primary)] focus:outline-offset-2 '
    + 'active:!border-[var(--focus-primary)] active:shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)]';

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
    + 'font-[var(--heading-h500-weight)] text-[20px] '
    + 'leading-[var(--line-height-normal)] '
    + 'tracking-[var(--heading-h500-letter-spacing)] '
    + 'text-[var(--text-normal-primary)] w-full min-w-0 max-w-full relative shrink-0 break-words';

  // Description classes
  const descriptionClasses = '!m-0 font-[var(--paragraph-p300-family)] '
    + 'font-[var(--paragraph-p300-weight)] text-[var(--paragraph-p300-size)] '
    + 'leading-normal '
    + 'tracking-[var(--paragraph-p300-letter-spacing)] '
    + 'text-[var(--text-normal-primary)] !text-[16px] w-full min-w-0 max-w-full relative shrink-0 break-words';

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

  // Handler for card focus
  const handleFocus = () => {
    if (isClickable) {
      setIsFocused(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Render card content
  const renderCardContent = () => html`
    <!-- Image container -->
    <div class=${imageContainerClasses}>
      <picture class="w-full h-full">
        <img
          src=${image}
          alt=${imageAlt}
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
        <p class=${descriptionClasses}>
          ${description}
        </p>
      </div>

      <!-- Link button container -->
      <div class="flex items-end justify-end relative shrink-0 w-full min-w-0 max-h-[21px]">
        <${LinkButton}
          href=${href}
          title=${linkText}
          ariaLabel=${linkAlt}
          onClick=${handleLinkClick}
          size="default"
        >
          ${linkText}
          <img
            src=${`${window.hlx?.codeBasePath || ''}/icons/arrow-fordware.svg`}
            alt=""
            class="block max-w-none w-[16px] h-[16px] shrink-0"
            aria-hidden="true"
          />
        </${LinkButton}>
      </div>
    </div>
  `;

  const finalClasses = `${baseClasses} ${customClassName}`.trim();

  // If clickable, render as button or a
  if (isClickable) {
    const Tag = href ? 'a' : 'button';
    const elementProps = href
      ? { href, ...rest }
      : { type: 'button', ...rest };

    return html`
      <${Tag}
        class=${finalClasses}
        data-name="linkCardHorizontal"
        onClick=${handleCardClick}
        onMouseEnter=${() => setIsHovered(true)}
        onMouseLeave=${() => setIsHovered(false)}
        onFocus=${handleFocus}
        onBlur=${handleBlur}
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
      onMouseEnter=${() => setIsHovered(true)}
      onMouseLeave=${() => setIsHovered(false)}
      ...${rest}
    >
      ${renderCardContent()}
    </div>
  `;
};

export default LinkCardHorizontal;
