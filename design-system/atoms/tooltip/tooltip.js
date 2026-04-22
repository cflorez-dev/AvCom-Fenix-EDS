import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * Tooltip - Reusable hover/focus tooltip container
 *
 * @param {Object} props - Component properties
 * @param {string} [props.content=''] - Tooltip content text
 * @param {'top'|'bottom'} [props.position='top'] - Tooltip placement
 * @param {boolean} [props.disabled=false] - Disable tooltip rendering
 * @param {string} [props.customClassName=''] - Additional wrapper classes
 * @param {string} [props.triggerClassName=''] - Additional trigger classes
 * @param {string} [props.tooltipClassName=''] - Additional tooltip classes
 * @param {import('preact').ComponentChildren} props.children - Trigger content
 * @param {Object} props.rest - Additional HTML attributes
 * @returns {import('preact').VNode}
 */
export const Tooltip = ({
  content = '',
  position = 'top',
  disabled = false,
  customClassName = '',
  triggerClassName = '',
  tooltipClassName = '',
  children,
  ...rest
}) => {
  const positionClasses = {
    top: 'left-1/2 -translate-x-1/2 bottom-full mb-[var(--spacing-x-small)]',
    bottom: 'left-1/2 -translate-x-1/2 top-full mt-[var(--spacing-x-small)]',
  };

  const arrowClasses = {
    top: 'left-1/2 -translate-x-1/2 top-full',
    bottom: 'left-1/2 -translate-x-1/2 bottom-full',
  };

  if (disabled || !content) {
    return html`
      <span class=${`relative ${customClassName}`.trim()} data-name="tooltip" ...${rest}>
        <span class=${triggerClassName}>${children}</span>
      </span>
    `;
  }

  return html`
    <span class=${`group/tooltip relative ${customClassName}`.trim()} data-name="tooltip" ...${rest}>
      <span class=${triggerClassName}>${children}</span>
      <span
        role="tooltip"
        class=${`
          absolute z-[1000]
          pointer-events-none
          whitespace-nowrap
          rounded-[8px]
          bg-background-brand-primary-hover
          text-text-normal-lighter
          text-sm
          font-bold
          leading-[var(--line-height-tight)]
          px-[8px]
          py-[2px]
          shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)]
          opacity-0 invisible
          transition-opacity duration-150
          group-hover/tooltip:opacity-100 group-hover/tooltip:visible
          group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:visible
          ${positionClasses[position] || positionClasses.top}
          ${tooltipClassName}
        `}
      >
        ${content}
      </span>
    </span>
  `;
};

export default Tooltip;
