import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * Chip - Avianca chip/tag component based on Figma design
 *
 * ## Props
 * - `variant`: `"lifemiles" | "discount" | "dark" | "alert" | "white" | "control"` –
 *   Visual variant of the chip (default: `"lifemiles"`).
 *   - `lifemiles`: Light blue background with dark text and shadow
 *   - `discount`: Red background with centered white text
 *   - `dark`: Dark gray background (#2B3C46) with white text
 *   - `alert`: Alert red background (#E9010D) with white text
 *   - `white`: White background with red text (#E9010D)
 *   - `control`: White background with secondary gray text, larger padding, shadow
 * - `icon`: `string | null` –
 *   URL or content of the icon to display before the text (default: `null`).
 * - `customClassName`: Additional CSS classes.
 * - `children`: Chip content (text).
 * - `...rest`: Other valid properties.
 */
export const Chip = ({
  variant = 'lifemiles',
  icon = null,
  customClassName = '',
  children,
  ...rest
}) => {
  // Base classes using Tailwind
  const baseClasses = `
    inline-flex
    items-center
    box-border
    whitespace-nowrap
    text-xs
    font-bold
    leading-none
    tracking-normal
    px-[8px]
    py-[4px]
    h-[24px]
    rounded-[1rem]
  `;

  // Variant-specific classes
  const variantClasses = {
    lifemiles: `
      justify-start
      gap-1
      bg-[var(--color-chip-lifemiles-bg)]
      text-[var(--color-chip-lifemiles-text)]
      shadow-[0_0_0.375rem_rgba(90,90,90,0.2)]
    `,
    discount: `
      justify-center
      gap-[0.375rem]
      bg-[var(--color-chip-discount-bg)]
      text-[var(--color-chip-discount-text)]
    `,
    dark: `
      justify-center
      gap-[0.375rem]
      bg-[var(--color-chip-dark-bg)]
      text-[var(--color-chip-dark-text)]
    `,
    alert: `
      justify-center
      gap-[0.375rem]
      bg-[var(--color-chip-alert-bg)]
      text-[var(--color-chip-alert-text)]
    `,
    white: `
      justify-center
      gap-[0.375rem]
      bg-[var(--color-chip-white-bg)]
      text-[var(--color-chip-white-text)]
    `,
    control: `
      justify-center
      gap-2
      bg-[var(--color-background-card-lighter)]
      text-[var(--color-text-normal-secondary)]
      text-sm
      h-[32px]
      !py-0
      px-[16px]
      rounded-full
      shadow-[0px_0px_6px_rgba(90,90,90,0.20)]
    `,
  };

  const currentVariantClasses = variantClasses[variant];
  const finalClasses = `${baseClasses} ${currentVariantClasses} ${customClassName}`.trim();

  return html`
    <div
      class=${finalClasses}
      data-name="chip"
      data-variant=${variant}
      ...${rest}
    >
      ${icon && html`
        <div class="flex items-center justify-center shrink-0 ">
          <img src=${icon} alt="" class="w-full h-full block max-w-none" />
        </div>
      `}
      <span class=${variant === 'control'
      ? '!m-0 font-[700] leading-[14px] tracking-inherit whitespace-inherit antialiased'
      : '!m-0 font-inherit leading-inherit tracking-inherit whitespace-inherit antialiased'}>
        ${children}
      </span>
    </div>
  `;
};

export default Chip;
