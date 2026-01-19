import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * ActionButton - Botón de acceso rápido con icono y texto para top section del Booking Box
 *
 * ## Props
 * - `icon`: `string | VNode` – Icono (path de imagen o VNode SVG).
 * - `label`: `string` – Texto del botón (requerido para accessibility).
 * - `variant`: `"default" | "iconRight"` – Variante del botón (default: "default").
 * - `href`: `string` – URL de destino.
 * - `target`: `"_self" | "_blank"` – Target del link (default: "_self").
 * - `onClick`: `function` – Callback onClick (opcional, si no hay href).
 * - `customClassName`: `string` – Clases CSS adicionales.
 * - `...rest`: Otras propiedades válidas.
 *
 * ## Variantes
 * - **default**: Icono circular (32px) a la izquierda, texto a la derecha (Autos, Hoteles, etc.)
 * - **iconRight**: Texto a la izquierda, icono pequeño (20px) a la derecha (Compra con millas)
 *
 * ## Estados (según diseño Figma - node-id: 2742-3158)
 * 1. **Default**: Background white, shadow 6px rgba(90,90,90,0.2), sin outline
 * 2. **Focus**: Outline 2px azul (#2196F3) con offset 2px
 * 3. **Hover**: Mantiene apariencia default (sin cambios visuales)
 * 4. **Pressed**: Background gris oscuro (#E0E0E0)
 *
 * ## Ejemplo de uso
 * ```javascript
 * <${ActionButton}
 *   icon="/icons/calendar.svg"
 *   label="Autos"
 *   variant="default"
 *   href="/autos"
 * />
 *
 * <${ActionButton}
 *   icon="/icons/miles.svg"
 *   label="Compra con millas"
 *   variant="iconRight"
 *   href="/millas"
 * />
 * ```
 */
export const ActionButton = ({
  icon,
  label,
  variant = 'default',
  href,
  target = '_self',
  onClick,
  customClassName = '',
  ...rest
}) => {
  // Determinar si es link o button
  const isLink = !!href;

  const commonClasses = 'inline-flex justify-start min-h-[48px] items-center gap-2 py-2 bg-[var(--bg-card-lighter)] rounded-4xl shadow-[0px_0px_6px_0px_rgba(90,90,90,0.2)] !no-underline transition-[background-color,transform] duration-[var(--transition-normal)] cursor-pointer focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--focus-primary)]';

  const variantClasses = variant === 'iconRight'
    ? 'self-stretch px-3 active:bg-[var(--state-disabled-gray)]'
    : 'pl-2 pr-3 active:bg-[var(--state-disabled)]';

  const baseClasses = `${commonClasses} ${variantClasses} ${customClassName}`;

  // Accessibility: Renderizar icono según variante
  const renderIcon = () => {
    if (!icon) return null;

    // Performance: Evitar recrear elementos en cada render
    const iconContent = typeof icon === 'string'
      ? html`<img
          src=${icon}
          alt=""
          role="presentation"
          class="w-5 h-5 object-contain"
          loading="lazy"
          decoding="async"
        />`
      : html`<div class="w-5 h-5 flex items-center justify-center" role="img" aria-hidden="true">${icon}</div>`;

    if (variant === 'iconRight') {
      // iconRight variant: icono pequeño (15px) sin background
      return html`
        <div class="w-[15px] h-[15px] flex justify-center items-center overflow-hidden" aria-hidden="true">
          ${iconContent}
        </div>
      `;
    }

    // default variant: icono circular con background zinc-100
    return html`
      <div
        class="w-8 h-8 p-1.5 bg-[#efefef] rounded-[66.67px] outline outline-[0.67px] outline-offset-[-0.67px] flex justify-center items-center gap-1.5 overflow-hidden"
        aria-hidden="true"
      >
        ${iconContent}
      </div>
    `;
  };

  // Common props
  const commonProps = {
    class: baseClasses,
    'data-name': 'actionButton',
    'data-variant': variant,
    ...rest,
  };

  // Content con typography según variante
  const labelClasses = 'justify-center text-[var(--text-normal-primary)] text-base font-normal leading-4 whitespace-nowrap';

  const content = variant === 'iconRight'
    ? html`
        <div class="${labelClasses}">${label}</div>
        ${renderIcon()}
      `
    : html`
        ${renderIcon()}
        <div class="${labelClasses}">${label}</div>
      `;

  // Render as link
  if (isLink) {
    return html`
      <a
        href=${href}
        target=${target}
        rel=${target === '_blank' ? 'noopener noreferrer' : undefined}
        ...${commonProps}
      >
        ${content}
      </a>
    `;
  }

  // Render as button
  return html`
    <button
      type="button"
      onClick=${onClick}
      ...${commonProps}
    >
      ${content}
    </button>
  `;
};

export default ActionButton;
