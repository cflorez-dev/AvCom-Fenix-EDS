import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Tooltip } from '../tooltip/tooltip.js';

const html = htm.bind(h);

/**
 * HeaderButton - Botón de acción del header (Figma 14:25237).
 *
 * Pill 36px de alto con borde 1px, padding 9px X / 1px Y, radius 32px.
 * Soporta icono + label, icon-only (con tooltip-hint), notification dot
 * y un estado `open` para cuando dispara un dropdown/popover.
 *
 * Estados visuales:
 *  - default: bg transparente + border `--color-border-stroke-default` (#D9D9D9)
 *  - hover:   bg `--color-background-brand-secondary-hover` (#E9E9E9)
 *  - active:  bg `--color-background-brand-secondary-active` (#D9D9D9)
 *  - focus:   ring azul (`--color-border-stroke-focus`) externo, solo teclado
 *  - open:    border verde `--color-icon-accent-positive` + chevron volteado
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTAS PARA EL BLOQUE CONSUMIDOR:
 *  1. El estado `open` lo controla el block (cuando abre su popover/dropdown)
 *     pasando `state="open"`. El átomo NO mantiene estado interno.
 *  2. Cuando el botón es icon-only (`label=''` o ausente) y se pasa
 *     `tooltipText`, se envuelve con `<Tooltip variant="hint">` y se aplica
 *     `aria-label = tooltipText` para accesibilidad.
 *  3. Cuando dispara un menú, el block debe pasar `aria-haspopup` y
 *     `aria-expanded` vía `...rest` (el átomo NO los infiere para no acoplar
 *     semántica de menú vs dialog vs listbox).
 *  4. El `notification` dot solo se renderiza en modo icon-only y
 *     state='default' (Figma no muestra dot con label visible ni en estado
 *     open). Si el block necesita un badge con número, tendrá que extender
 *     este átomo o renderizar su propio elemento.
 *  5. Para una migración futura: el organismo `LanguageSearch` actualmente
 *     reproduce este patrón con `<Button variant="secondary" size="sm">` +
 *     `customClassName="px-[12px]" borderActiveColor="alert-success-border"` +
 *     SVG chevron inline. Migrarlo a este átomo reduce ~50 líneas y alinea
 *     border (1px aquí vs 2px en `Button`) y padding (9px aquí vs 12-16px).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Props
 * @param {import('preact').VNode|string} [icon=null]
 *   Contenido del slot icono (típicamente <img/> de bandera o SVG inline).
 *   Si es string lo trata como `src` y renderiza un `<img>` 16×16.
 * @param {string} [label='']
 *   Texto del botón. Vacío → modo icon-only (activa tooltip si existe).
 * @param {boolean} [chevron=true]
 *   Mostrar chevron-down al final. Decisión totalmente del block consumidor:
 *   en icon-only puede coexistir con `tooltipText` y con `notification`
 *   (ver Figma 12:19041 y 104:7034). Pasar `false` para chip puro.
 * @param {('default'|'open')} [state='default']
 *   Estado controlado por el block. `open` → border verde + chevron flip.
 * @param {('auto'|'mobile'|'desktop')} [device='auto']
 *   Hint informativo (se expone como `data-device`). No altera la visibilidad
 *   del chevron — ése lo controla 100% el prop `chevron`.
 * @param {boolean} [notification=false]
 *   Punto verde de notificación (Figma 104:7034). Solo se renderiza en
 *   modo icon-only y `state='default'`.
 * @param {string} [tooltipText='']
 *   Texto del tooltip-hint que aparece debajo del botón en modo icon-only.
 *   Ignorado cuando hay `label`.
 * @param {string} [ariaLabel]
 *   Override accesible (si no se pasa, en icon-only usa `tooltipText`).
 * @param {string} [href]
 *   Si se pasa, renderiza `<a>` en lugar de `<button>`.
 * @param {Function} [onClick]
 *   Handler de click.
 * @param {string} [customClassName='']
 *   Clases extra aplicadas al elemento raíz.
 */

// Chevron 16×16 SVG box (alineado a la grilla de iconos del header) con el
// path geométricamente de 8×4.94 px centrado — coincide con la spec Figma del
// chip de carrito (Members 9:16447). Usar 16×16 mantiene la baseline visual
// con el icono principal del botón (también 16×16) y reserva un hit-target
// uniforme cuando el chevron está presente sin label.
const ChevronIcon = ({ open }) => html`
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    class=${`flex-shrink-0 motion-safe:transition-transform motion-safe:duration-150 ${
    open ? 'rotate-180' : 'rotate-0'
  }`}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11.06 5.72656L8 8.7799L4.94 5.72656L4 6.66656L8 10.6666L12 6.66656L11.06 5.72656Z"
      fill="currentColor"
    />
  </svg>
`;

export const HeaderButton = ({
  icon = null,
  label = '',
  chevron = true,
  state = 'default',
  device = 'auto',
  notification = false,
  tooltipText = '',
  ariaLabel = '',
  href = null,
  onClick = null,
  customClassName = '',
  children,
  ...rest
}) => {
  const isOpen = state === 'open';
  const hasLabel = Boolean(label || children);
  const isIconOnly = !hasLabel;
  const showNotification = isIconOnly && !isOpen && notification;
  const showTooltip = isIconOnly && Boolean(tooltipText);

  // -------------------------------------------------------------------------
  // IMPORTANTE: Tailwind escanea código fuente buscando clases LITERALES.
  // No detecta `${prefix}px-[9px]`. Por eso los strings van completos.
  // -------------------------------------------------------------------------

  // ----- Border color según state -----
  // `!` para ganarle al hover/active (que mantienen su bg pero no el borde).
  const borderColor = isOpen
    ? 'border-[var(--color-icon-accent-positive)]'
    : 'border-[var(--color-border-stroke-default)]';

  // La visibilidad del chevron la controla únicamente el prop `chevron`.
  // No se oculta en mobile automáticamente — si el block quiere chip puro
  // (sin chevron) debe pasar `chevron={false}` explícitamente. Esto refleja
  // las variantes Figma 12:19041 (icon + chevron) y 104:7034 (icon + chevron
  // + notification dot), donde el chevron está presente sin importar el
  // viewport.

  const baseClasses = `
    group relative box-border
    inline-flex items-center justify-center
    gap-[var(--spacing-x-small,8px)]
    h-9 px-2
    rounded-[32px] border border-solid bg-transparent
    text-[14px] leading-none text-[var(--color-text-normal-primary)]
    motion-safe:transition-colors motion-safe:duration-150 ease-in-out
    cursor-pointer select-none no-underline
    hover:bg-[var(--color-background-brand-secondary-hover)]
    active:bg-[var(--color-background-brand-secondary-active)]
    outline-none focus:outline-none focus-visible:outline-none
    ${borderColor}
  `;

  // Focus ring — mismo patrón que `LoginButton`: <div> absoluto con outline.
  const focusRing = html`
    <div
      aria-hidden="true"
      class="hidden group-focus-visible:block absolute w-full h-full max-w-full max-h-full pointer-events-none rounded-[32px] outline-2 outline-[var(--color-border-stroke-focus)] outline-offset-[3px] motion-safe:transition-all"
    ></div>
  `;

  // Notification dot — esquina top-right del trigger.
  // Color verde del token `--color-icon-accent-positive` (#1EA93C) según
  // Figma 104:7034. Tamaño 8×8 (sin ring) para no competir visualmente con
  // el chevron cuando ambos están presentes.
  // El dot es decorativo (`aria-hidden`); el estado se anuncia a screen
  // readers con un `<span class="sr-only">` aparte.
  const notificationDot = showNotification
    ? html`
      <span
        aria-hidden="true"
        class="absolute top-0 right-[2px] w-[8px] h-[8px] rounded-full bg-[var(--color-icon-accent-positive)]"
      ></span>
      <span class="sr-only">(notificación pendiente)</span>
    `
    : null;

  // Render del icono: VNode pasa tal cual; string se envuelve en <img>.
  let iconNode = null;
  if (icon) {
    if (typeof icon === 'string') {
      iconNode = html`
        <img
          src=${icon}
          alt=""
          class="block w-[16px] h-[16px] object-contain flex-shrink-0"
        />
      `;
    } else {
      iconNode = html`<span class="inline-flex items-center justify-center w-[16px] h-[16px] flex-shrink-0">${icon}</span>`;
    }
  }

  const labelNode = hasLabel
    ? html`
      <span class="font-normal whitespace-nowrap leading-none">
        ${label || children}
      </span>
    `
    : null;

  const chevronNode = chevron
    ? html`<${ChevronIcon} open=${isOpen} />`
    : null;

  // aria-label: en icon-only, prioriza override → tooltipText.
  let computedAriaLabel = ariaLabel;
  if (!computedAriaLabel && isIconOnly) {
    computedAriaLabel = tooltipText || undefined;
  }

  const cleanClasses = `${baseClasses} ${customClassName}`
    .replace(/\s+/g, ' ')
    .trim();

  const dataAttrs = {
    'data-name': 'headerButton',
    'data-state': state,
    'data-device': device,
    'data-icon-only': isIconOnly ? 'true' : 'false',
  };

  const inner = html`
    ${focusRing}
    ${iconNode}
    ${labelNode}
    ${chevronNode}
    ${notificationDot}
  `;

  let trigger;
  if (href) {
    trigger = html`
      <a
        href=${href}
        class=${cleanClasses}
        aria-label=${computedAriaLabel}
        onClick=${onClick}
        ...${dataAttrs}
        ...${rest}
      >
        ${inner}
      </a>
    `;
  } else {
    trigger = html`
      <button
        type="button"
        class=${cleanClasses}
        aria-label=${computedAriaLabel}
        onClick=${onClick}
        ...${dataAttrs}
        ...${rest}
      >
        ${inner}
      </button>
    `;
  }

  // Tooltip-hint solo en modo icon-only (Figma 14:25237 → variantes con hint).
  if (showTooltip) {
    return html`
      <${Tooltip} content=${tooltipText} variant="hint" position="bottom">
        ${trigger}
      </${Tooltip}>
    `;
  }

  return trigger;
};

export default HeaderButton;
