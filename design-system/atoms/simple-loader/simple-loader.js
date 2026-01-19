import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * SimpleLoader - Loading spinner atom
 * Animated circular progress indicator with gradient fade effect
 *
 * @param {Object} props - Component properties
 * @param {'small'|'medium'} [props.size='medium'] - Spinner size (small: 16px, medium: 20px)
 * @param {boolean} [props.onDark=false] - Use light colors for dark backgrounds
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {Object} [props.rest] - Additional props spread to container
 * @returns {import('preact').VNode} SimpleLoader component
 */
export const SimpleLoader = ({
  size = 'medium',
  onDark = false,
  customClassName = '',
  ...rest
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
  };

  const colorClasses = onDark
    ? 'bg-[conic-gradient(from_0deg,#FFFFFF_0%,#FFFFFFCC_25%,#FFFFFF99_50%,#FFFFFF66_75%,transparent_100%)]'
    : 'bg-[conic-gradient(from_0deg,#1B1B1B_0%,#1B1B1BCC_25%,#1B1B1B99_50%,#1B1B1B66_75%,transparent_100%)]';

  return html`
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando..."
      data-name="simpleLoader"
      class="
        inline-block
        box-border
        rounded-full
        animate-spin
        ${sizeClasses[size] || sizeClasses.medium}
        ${colorClasses}
        mask-[radial-gradient(circle,transparent_calc(50%_-_1px),black_calc(50%_-_1px))]
        [-webkit-mask:radial-gradient(circle,transparent_calc(50%_-_1px),black_calc(50%_-_1px))]
        ${customClassName}
      "
      ...${rest}
    >
      <span class="sr-only">Cargando...</span>
    </div>
  `;
};

export default SimpleLoader;
