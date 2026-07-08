import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * Generates CSS classes for LinkButton component based on configuration
 *
 * @param {Object} options - Configuration options
 * @param {string} options.variant - Link variant: "link" | "outlined"
 *   (default: "link")
 * @param {string} options.size - Link size: "compact" | "default" | "medium" | "large"
 *   | "huge" (default: "default")
 * @param {string} options.colorVariant - Color variant: "informative" | "promotional" | "caution"
 *   (default: "informative")
 * @param {boolean} options.iconOnly - Icon-only mode (default: false)
 * @param {boolean} options.disabled - Disabled state (default: false)
 * @param {boolean} options.underline - Opt-in underline for `variant='link'`. Defaults to `false`
 *   so links look like buttons/CTAs by default (as required inside cards, headers, etc.).
 *   Set to `true` when the link lives inside rich-text contexts (cms-rich-text, marquesina)
 *   where a visible underline is expected. Ignored for `variant='outlined'` and when `iconOnly`.
 * @param {string} options.customClassName - Additional CSS classes
 *   (default: "")
 * @param {string|null} options.customColor - Optional inline color (hex/rgba). When provided,
 *   the function returns an object { className, style } instead of a plain string.
 *   Backward-compat: if customColor is null/undefined, returns plain string as before.
 * @returns {string|{ className: string, style: { color: string } }}
 *   - Plain string of CSS classes (when customColor is null/undefined) — backward-compat default.
 *   - Object { className, style } when customColor is provided. Caller must handle both shapes
 *     OR always pass customColor consistently to get predictable type.
 *
 * @example
 * const classes = getLinkButtonStyles({
 *   variant: 'link',
 *   size: 'default',
 *   colorVariant: 'promotional',
 *   iconOnly: false,
 *   disabled: false,
 *   customClassName: 'my-custom-class'
 * });
 */
export const getLinkButtonStyles = ({
  variant = 'link',
  size = 'default',
  colorVariant = 'informative',
  iconOnly = false,
  disabled = false,
  underline = false,
  customClassName = '',
  customColor = null,
} = {}) => {
  // Underline applies only to `variant='link'` (not `outlined`). Icon-only links
  // never get underline. When `underline=true` (opt-in, p.ej. enlaces dentro de
  // rich-text) el underline es permanente. When `underline=false` (default) el
  // CTA / botón terciario (variante "Link button") NO lleva underline en ningún
  // estado — el feedback de hover es el cambio de color informative-active
  // (VSTS 1282389 / 1282253; ver JSDoc de process-content-html).
  const underlineModifiers = 'decoration-solid [text-decoration-skip-ink:none] [text-underline-position:from-font]';
  let linkDecoration = '';
  if (!iconOnly) {
    linkDecoration = underline ? `underline ${underlineModifiers}` : 'no-underline';
  }
  // Base classes - layout and typography
  const baseClasses = 'inline-flex items-center justify-center '
    + 'font-[\'Red_Hat_Display\'] '
    + 'text-center text-nowrap '
    + 'leading-normal tracking-[0px] '
    + 'transition-colors duration-200 ';

  // Variant styles - different visual treatments
  // IMPORTANT: Classes must be written explicitly for Tailwind to detect them at compile time
  // Cannot use dynamic template strings like `hover:${variable}` because Tailwind won't detect them
  const variantStyles = {
    informative: {
      link: {
        baseClasses: disabled
          ? 'text-text-brand-disable'
          : 'text-text-link-informative-default',
        interactionClasses: disabled
          ? ''
          : 'hover:text-text-link-informative-active active:text-text-link-informative-active',
        decoration: linkDecoration,
      },
      outlined: {
        baseClasses: disabled
          ? 'text-text-brand-disable border-2 border-text-brand-disable'
          : 'text-text-link-informative-default border-2 border-text-link-informative-default',
        interactionClasses: disabled
          ? ''
          : 'hover:text-text-link-informative-active hover:border-text-link-informative-active active:text-text-link-informative-active active:border-text-link-informative-active',
        decoration: 'rounded-[5px]',
      },
      // members: igual que link pero SIN subrayado.
      // Usar en el bloque de navegación Members. El focus ring se mantiene para teclado.
      // Figma: node 104-10337 (Entregable OMNI Members 01062026)
      members: {
        baseClasses: disabled
          ? 'text-text-brand-disable'
          : 'text-text-link-informative-default',
        interactionClasses: disabled
          ? ''
          : 'hover:text-text-link-informative-active active:text-text-link-informative-active',
        decoration: '',
      },
    },
    promotional: {
      link: {
        baseClasses: disabled
          ? 'text-text-brand-disable'
          : 'text-text-link-promotional-default',
        interactionClasses: disabled
          ? ''
          : 'hover:text-text-link-promotional-active active:text-text-link-promotional-active',
        decoration: linkDecoration,
      },
      outlined: {
        baseClasses: disabled
          ? 'text-text-brand-disable border-2 border-text-brand-disable'
          : 'text-text-link-promotional-default border-2 border-text-link-promotional-default',
        interactionClasses: disabled
          ? ''
          : 'hover:text-text-link-promotional-active hover:border-text-link-promotional-active active:text-text-link-promotional-active active:border-text-link-promotional-active',
        decoration: 'rounded-[5px]',
      },
      // members: igual que link pero SIN subrayado (ver informative.members para referencia)
      members: {
        baseClasses: disabled
          ? 'text-text-brand-disable'
          : 'text-text-link-promotional-default',
        interactionClasses: disabled
          ? ''
          : 'hover:text-text-link-promotional-active active:text-text-link-promotional-active',
        decoration: '',
      },
    },
    caution: {
      link: {
        baseClasses: disabled
          ? 'text-text-brand-disable'
          : 'text-text-link-caution-default',
        interactionClasses: disabled
          ? ''
          : 'hover:text-text-link-caution-active active:text-text-link-caution-active',
        decoration: linkDecoration,
      },
      outlined: {
        baseClasses: disabled
          ? 'text-text-brand-disable border-2 border-text-brand-disable'
          : 'text-text-link-caution-default border-2 border-text-link-caution-default',
        interactionClasses: disabled
          ? ''
          : 'hover:text-text-link-caution-active hover:border-text-link-caution-active active:text-text-link-caution-active active:border-text-link-caution-active',
        decoration: 'rounded-[5px]',
      },
      // members: igual que link pero SIN subrayado (ver informative.members para referencia)
      members: {
        baseClasses: disabled
          ? 'text-text-brand-disable'
          : 'text-text-link-caution-default',
        interactionClasses: disabled
          ? ''
          : 'hover:text-text-link-caution-active active:text-text-link-caution-active',
        decoration: '',
      },
    },
  };

  // Get chosen variant styles
  const chosenVariantStyles = variantStyles[colorVariant][variant];

  // Size classes - exact Figma specs
  // Outlined variant always has padding: py-[8px] px-[12px] and gap-[8px]
  const getSizeBaseClasses = (sizeKey, isIconOnly, isOutlined) => {
    if (isIconOnly) {
      const iconSizes = {
        compact: 'size-[19px]',
        default: 'size-[26px]',
        medium: 'size-[30px]',
        large: 'size-[53px] min-w-[48px] min-h-[48px]',
        huge: 'size-[58px]',
      };
      return iconSizes[sizeKey];
    }

    if (isOutlined) {
      const outlinedSizes = {
        compact: 'py-[8px] px-[12px] gap-[8px] !text-[14px] !leading-normal font-normal',
        default: 'py-[8px] px-[12px] gap-[8px] !text-[16px] !leading-[21px] font-normal',
        medium: 'py-[8px] px-[12px] gap-[8px] !text-[20px] !leading-normal font-normal',
        large: 'min-w-[100px] min-h-[48px] py-[8px] px-[12px] gap-[8px] !text-[28px] !leading-normal font-bold',
        huge: 'py-[8px] px-[12px] gap-[8px] !text-[32px] !leading-normal font-bold',
      };
      return outlinedSizes[sizeKey];
    }

    const linkSizes = {
      compact: 'gap-[2px] !text-[14px] !leading-normal font-normal',
      default: 'gap-[8px] !text-[16px] !leading-[21px] font-normal',
      medium: 'gap-[8px] !text-[20px] !leading-normal font-normal',
      large: 'min-w-[100px] min-h-[48px] px-[12px] py-[8px] gap-[8px] !text-[28px] !leading-normal font-bold',
      huge: 'px-[12px] py-[8px] gap-[8px] !text-[32px] !leading-normal font-bold',
      // `inline` is intended for links rendered INSIDE rich text (e.g. inside a <p>).
      // Inherits font-size and line-height from the parent element so the link visually
      // matches the surrounding text instead of forcing its own size.
      inline: 'gap-[2px] !text-[length:inherit] !leading-[inherit] font-normal',
    };
    return linkSizes[sizeKey];
  };

  const sizeStyles = {
    compact: {
      base: getSizeBaseClasses('compact', iconOnly, variant === 'outlined'),
    },
    default: {
      base: getSizeBaseClasses('default', iconOnly, variant === 'outlined'),
    },
    medium: {
      base: getSizeBaseClasses('medium', iconOnly, variant === 'outlined'),
    },
    large: {
      base: getSizeBaseClasses('large', iconOnly, variant === 'outlined'),
    },
    huge: {
      base: getSizeBaseClasses('huge', iconOnly, variant === 'outlined'),
    },
    inline: {
      base: getSizeBaseClasses('inline', iconOnly, variant === 'outlined'),
    },
  };

  // Get chosen size styles
  const chosenSizeStyles = sizeStyles[size];

  // Focus state - common for both variants
  const focusClasses = disabled
    ? ''
    : 'focus-visible:outline-none focus-visible:relative '
      + 'focus-visible:after:content-[\'\'] focus-visible:after:absolute '
      + 'focus-visible:after:inset-[-2px] focus-visible:after:border-2 '
      + 'focus-visible:after:border-border-stroke-focus '
      + 'focus-visible:after:rounded-[4px] focus-visible:after:pointer-events-none';

  // Combine all classes
  const finalClasses = `
    ${baseClasses}
    ${chosenVariantStyles.baseClasses}
    ${chosenVariantStyles.decoration}
    ${chosenSizeStyles.base}
    ${chosenVariantStyles.interactionClasses}
    ${focusClasses}
    ${disabled ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
    ${customClassName}
  `.trim().replace(/\s+/g, ' ');

  if (customColor) {
    return { className: finalClasses, style: { color: customColor } };
  }

  return finalClasses;
};

/**
 * LinkButton - Avianca link-style button component based on Figma design
 *
 * ## Props
 * - `variant`: `"link" | "outlined"` – Link variant (default: `"link"`).
 * - `size`: `"compact" | "default" | "medium" | "large" | "huge"` – Link size (default: `"default"`).
 * - `colorVariant`: `"informative" | "promotional" | "caution"` – Color variant
 *   (default: `"informative"`).
 * - `iconOnly`: `boolean` – Icon-only mode (default: `false`).
 * - `underline`: `boolean` – Opt-in underline for `variant='link'` (default: `false`).
 *   Enable only inside rich-text contexts (cms-rich-text, marquesina). Cards, CTAs and
 *   button-like links should keep the default (no underline).
 * - `customClassName`: Additional CSS classes.
 * - `children`: Inner content (text or icon elements).
 * - `href`: Link URL (renders as `<a>`, otherwise `<button>`).
 * - `disabled`: `boolean` – Disabled state (default: `false`).
 * - `...rest`: Other valid attributes such as `onClick`, `target`, etc.
 *
 * ## Variants:
 * - `link`: Text-like link. No underline by default — pass `underline={true}` when used
 *   inside rich text (cms-rich-text, marquesina).
 * - `outlined`: Border style without underline
 *
 * ## Color Variants:
 * - `informative`: Teal/cyan color (#177f8c) - default
 * - `promotional`: Purple color (#4B1BBF)
 * - `caution`: Brown color (#88431C)
 *
 * ## Sizes (exact Figma specs):
 * - `compact`: 14px text (text-sm), gap-[2px], font-normal
 * - `default`: 16px text, gap-[8px], font-normal
 * - `medium`: 20px text, gap-[8px], font-normal
 * - `large`: 28px text (text-3xl), gap-[8px], px-[12px] py-[8px],
 *   min-h-[48px] min-w-[100px], font-bold
 * - `huge`: 32px text (text-3xl), gap-[8px], px-[12px] py-[8px],
 *   font-bold
 *
 * ## Interactive states (Tailwind 4):
 * - default: Uses colorVariant default color (e.g., text-text-link-informative-default)
 * - hover: Uses colorVariant active color + font-bold
 *   (e.g., hover:text-text-link-informative-active)
 * - pressed/active: Uses colorVariant active color + font-bold
 * - disabled: text-text-brand-disable
 * - focus: border-2 border-border-stroke-focus inset-[-2px] rounded-[4px]
 */
export const LinkButton = ({
  customClassName = '',
  variant = 'link',
  size = 'default',
  colorVariant = 'informative',
  iconOnly = false,
  underline = false,
  href,
  children,
  disabled = false,
  ...rest
}) => {
  // Use the exported styles function
  const finalClasses = getLinkButtonStyles({
    variant,
    size,
    colorVariant,
    iconOnly,
    disabled,
    underline,
    customClassName,
  });

  // Determine the element to render (a or button)
  const Tag = href ? 'a' : 'button';
  const elementProps = href
    ? { href, ...rest }
    : { type: 'button', disabled, ...rest };

  // Accessibility attributes
  const a11yProps = {
    role: href ? undefined : 'button',
    'aria-disabled': disabled ? 'true' : undefined,
    tabIndex: disabled ? -1 : undefined,
  };

  // Render the LinkButton component
  return html`
    <${Tag}
      class="${finalClasses}"
      ...${elementProps}
      ...${a11yProps}
      data-name="linkButton"
      data-variant=${variant}
      data-size=${size}
      data-color-variant=${colorVariant}
      data-icon-only=${iconOnly}
    >
      ${children}
    </${Tag}>
  `;
};

// Export the LinkButton component as default
export default LinkButton;
