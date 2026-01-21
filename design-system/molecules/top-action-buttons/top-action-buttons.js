import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * TopActionButtons - Container para botones de acciones rápidas (max 5)
 *
 * ## Props
 * - `children`: `VNode[]` – ActionButton components (max 5).
 * - `customClassName`: `string` – Clases CSS adicionales.
 * - `...rest`: Otras propiedades válidas.
 *
 * ## Comportamiento
 * - Valida que no haya más de 5 action buttons (solo en dev)
 * - Layout horizontal con gap-2 (8px)
 * - Mobile: items-center (alineación izquierda)
 * - Desktop: justify-end (alineación derecha)
 * - Scroll horizontal si overflow (flex-nowrap + overflow-x-auto)
 * - Smooth scroll behavior para mejor UX
 *
 * ## Diseño (Figma)
 * - Mobile: node-id 2742-6683
 * - Desktop: node-id 2742-6763
 * - Gap: 8px entre botones
 * - Scroll horizontal cuando no hay espacio suficiente
 *
 * ## Ejemplo de uso
 * ```javascript
 * <${TopActionButtons}>
 *   <${ActionButton} icon="/icons/calendar.svg" label="Agregar fechas" />
 *   <${ActionButton} icon="/icons/user.svg" label="Viajeros" />
 * </${TopActionButtons}>
 * ```
 *
 * @param {Object} props
 * @param {import('preact').VNode[]} props.children - Action buttons (max 5)
 * @param {string} [props.customClassName=''] - Clases CSS adicionales
 */
export const TopActionButtons = ({
  children,
  customClassName = '',
  ...rest
}) => {
  // Performance: Normalizar children una sola vez
  const childrenArray = Array.isArray(children) ? children : (children ? [children] : []);
  const validChildren = childrenArray.slice(0, 5);

  // Performance: Pre-calcular clases (template string compacto)
  const baseClasses = `flex flex-row flex-nowrap gap-2 items-center md:justify-end overflow-x-auto w-full p-[4px] scroll-smooth ${customClassName}`;

  return html`
    <div
      class=${baseClasses}
      role="group"
      aria-label="Acciones rápidas"
      data-name="topActionButtons"
      ...${rest}
    >
      ${validChildren}
    </div>
  `;
};

export default TopActionButtons;
