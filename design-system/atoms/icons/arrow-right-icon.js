import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * ArrowRightIcon - Icono chevron derecha para link buttons (basado en diseño Figma)
 *
 * ## Props
 * - `color`: Color del icono - usa 'currentColor' para heredar del padre (por defecto: 'currentColor')
 * - `customClassName`: Clases CSS adicionales
 * - `...rest`: Otras propiedades válidas como `style`, `aria-label`, etc.
 *
 * ## Uso
 * ```javascript
 * // Hereda color del padre (recomendado para links/botones)
 * html`<${ArrowRightIcon} />`
 *
 * // Color específico
 * html`<${ArrowRightIcon} color="var(--link-button-default)" />`
 * ```
 *
 * ## Diseño Figma
 * - Tamaño real del chevron: 7x10px (NO escalado)
 * - ViewBox: 0 0 7 10
 * - Se centra verticalmente con el texto mediante flex alignment
 */
export const ArrowRightIcon = ({
  color = 'currentColor',
  customClassName = '',
  ...rest
}) => {
  return html`
    <svg
      width="7"
      height="10"
      viewBox="0 0 7 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="inline-block shrink-0 ${customClassName}"
      aria-hidden="true"
      ...${rest}
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M1.175 0L0 1.175L3.81667 5L0 8.825L1.175 10L6.175 5L1.175 0Z"
        fill=${color}
      />
    </svg>
  `;
};

export default ArrowRightIcon;
