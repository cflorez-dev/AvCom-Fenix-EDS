import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * Tooltip - Reusable hover/focus tooltip container.
 *
 * Variants
 *  - `default`: estilo bold compacto (py-2px). Para labels de campos / chips
 *    truncados (texto que el usuario YA ve cortado y necesita expandir).
 *  - `hint`: estilo regular más espaciado (py-4px), pensado para identificar
 *    la acción de un trigger icon-only en headers / barras de acciones
 *    (Figma node 12:18324). El wrapper aplica `cursor-pointer` al trigger
 *    para cumplir con la AC: "al hover sobre un botón icon-only debe
 *    aparecer un tooltip con el label de la acción y el cursor debe
 *    cambiar a pointer".
 *
 * @param {Object} props - Component properties
 * @param {string} [props.content=''] - Tooltip content text
 * @param {('default'|'hint')} [props.variant='default'] - Style variant
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
  variant = 'default',
  position = 'top',
  disabled = false,
  customClassName = '',
  triggerClassName = '',
  tooltipClassName = '',
  children,
  ...rest
}) => {
  const isHint = variant === 'hint';

  // Variante `hint` usa gap más amplio (10px Figma) que la `default` (8px).
  const positionClasses = isHint
    ? {
      top: 'left-1/2 -translate-x-1/2 bottom-full mb-[10px]',
      bottom: 'left-1/2 -translate-x-1/2 top-full mt-[4px]',
    }
    : {
      top: 'left-1/2 -translate-x-1/2 bottom-full mb-[var(--spacing-x-small)]',
      bottom: 'left-1/2 -translate-x-1/2 top-full mt-[var(--spacing-x-small)]',
    };

  if (disabled || !content) {
    return html`
      <span class=${`relative ${customClassName}`.trim()} data-name="tooltip" ...${rest}>
        <span class=${triggerClassName}>${children}</span>
      </span>
    `;
  }

  // Estilos compartidos por ambas variantes (posición absoluta, z-index,
  // color de texto, transición y triggers de visibilidad).
  // El BG se define por variante (no aquí) porque `default` usa el color
  // `hover` (legacy) y `hint` usa el `default` (#1B1B1B según Figma).
  //
  // Reglas de visibilidad (AC cliente / Figma 73:10981 hover, 289:13607 focus):
  //  - hover → visible
  //  - focus por teclado en el trigger interno (`focus-visible`) → visible
  //  - active (mientras el usuario presiona) → oculto
  // Usamos `group-has-[:focus-visible]/tooltip` porque el foco lo recibe el
  // elemento interno (button/link), no el wrapper.
  // El orden importa: las reglas `active` se declaran al final para ganar
  // sobre `hover` / `focus-visible` cuando coinciden estados.
  const baseTooltip = 'absolute z-[1000] pointer-events-none'
    + ' rounded-[8px]'
    + ' text-text-normal-lighter'
    + ' opacity-0 invisible'
    + ' motion-safe:transition-opacity motion-safe:duration-150'
    + ' group-hover/tooltip:opacity-100 group-hover/tooltip:visible'
    + ' group-has-[:focus-visible]/tooltip:opacity-100 group-has-[:focus-visible]/tooltip:visible'
    + ' group-active/tooltip:!opacity-0 group-active/tooltip:!invisible';

  // Diferencias por variante:
  // - hint  → spec Figma 12:18324 al pie de la letra:
  //     display:flex; flex-direction:column; justify-content:center;
  //     align-items:center; gap:12px; padding:4px 8px;
  //     background:#1B1B1B (background/brand/primary/default);
  //     14px regular, line-height 1.5; shadow suave.
  //   `whitespace-nowrap` se omite a propósito para permitir contenido
  //   multilínea (gap-3 separa las líneas según el spec).
  // - default → 14px bold, padding 8/2, shadow más marcada, single-line
  //   (whitespace-nowrap). Mantiene el comportamiento previo.
  const variantTooltip = isHint
    ? 'flex flex-col items-center justify-center gap-[var(--spacing-small,12px)]'
      + ' whitespace-nowrap'
      + ' bg-background-brand-primary-default'
      + ' text-sm font-normal leading-[1.5]'
      + ' px-[var(--spacing-x-small,8px)] py-[var(--spacing-tiny,4px)]'
      + ' shadow-[0_0_3px_0_rgba(90,90,90,0.2)]'
    : 'whitespace-nowrap'
      + ' bg-background-brand-primary-hover'
      + ' text-sm font-bold leading-[var(--line-height-tight)]'
      + ' px-[8px] py-[2px]'
      + ' shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)]';

  // Wrapper: la variante `hint` añade `cursor-pointer` para cumplir la AC
  // del cliente (botón icon-only debe mostrar cursor pointer al hover),
  // sin obligar al consumidor a recordarlo.
  const wrapperClasses = `group/tooltip relative ${isHint ? 'inline-flex cursor-pointer' : ''} ${customClassName}`.trim();

  return html`
    <span class=${wrapperClasses} data-name="tooltip" data-variant=${variant} ...${rest}>
      <span class=${triggerClassName}>${children}</span>
      <span
        role="tooltip"
        class=${`${baseTooltip} ${variantTooltip} ${positionClasses[position] || positionClasses.top} ${tooltipClassName}`.trim()}
      >
        ${content}
      </span>
    </span>
  `;
};

export default Tooltip;

