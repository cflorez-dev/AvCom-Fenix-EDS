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

  // Anillo limpio (fix de los "quiebres" a tamaños chicos):
  //  - conic-gradient = fade SUAVE sólido → transparente del MISMO color (solo baja el alpha →
  //    sin bandas/escalones como tenían los stops 0/25/50/75%).
  //  - la máscara de abajo usa `circle closest-side` para que el 100% del gradiente sea el BORDE
  //    real del círculo (no la esquina, que es el default `farthest-corner` y dejaba el anillo
  //    grueso con borde interno cortado) → anillo fino de 2px y circular por dentro y por fuera.
  const colorClasses = onDark
    ? 'bg-[conic-gradient(from_0deg,#FFFFFF,rgba(255,255,255,0))]'
    : 'bg-[conic-gradient(from_0deg,#1B1B1B,rgba(27,27,27,0))]';

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
        mask-[radial-gradient(circle_closest-side,transparent_calc(100%_-_2px),black_calc(100%_-_2px))]
        [-webkit-mask:radial-gradient(circle_closest-side,transparent_calc(100%_-_2px),black_calc(100%_-_2px))]
        ${customClassName}
      "
      ...${rest}
    >
      <span class="sr-only">Cargando...</span>
    </div>
  `;
};

export default SimpleLoader;
