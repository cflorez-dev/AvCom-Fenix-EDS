import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * MembersCard — card individual del grid del Dashboard (PBI 1263921, "Bloque 4").
 * Figma OMNI-Members-01062026 nodo 518:27638 (`balanceCard-Desktop`) +
 * 518:25323 (`balanceCard-Mobile`, ≤767px).
 *
 * Acceso de navegación a una sección operativa del perfil. Estructura del Figma:
 *  - **Card** (`<a>`): `flex-col`, gap 16px, padding 16px, fondo blanco
 *    (`background/card/lighter`), borde 1px `border/stroke/default` (#d9d9d9),
 *    radio 16px. **Toda la card clickable** (link nativo) → Enter del browser,
 *    right-click "abrir en pestaña", etc.
 *  - **Fila titleBox** (`flex-row`, gap 12px, items-start): círculo gris
 *    (#f5f5f5) con ícono · título SemiBold (`text/normal/primary` #1b1b1b) ·
 *    chevron 24px centrado.
 *  - **Fila descripción** (full-width, debajo): `static2` 14px Regular,
 *    `text/normal/secondary` #5a5a5a, truncada a `lineClamp` líneas (idiomas
 *    largos FR/PT no rompen la card).
 *
 * **Responsive (mobile-first, breakpoint `md:` = 768px):**
 *  - ≤767px (mobile): círculo 32px, ícono interno 20px, título 16px (h5),
 *    chevron container 32px.
 *  - ≥768px (tablet/desktop): círculo 40px, ícono interno 24px, título 20px,
 *    chevron container 40px.
 *
 * **Estados interactivos (Figma 518:25630/25659/25690/25719):** transición
 * 200ms `ease-in-out` sobre `box-shadow,border-color`.
 *  - **default**: border 1px `border/stroke/default` (#d9d9d9), sin sombra.
 *  - **hover**: border transparent + shadow `0 2px 10px 2px rgba(73,73,73,.25)`
 *    (Figma: `shadows/axis/medium` 2 / `shadows/blur/medium` 20 ÷ 2 = 10, spread 2).
 *  - **focus-visible** (teclado): border transparent + outline 2px
 *    `border/stroke/focus` (#1d9bf0) con `outline-offset: 2px` (el ring queda
 *    a 17px de radio efectivo, fuera del envelope de 16px).
 *  - **active** (pressed): vuelve al default (border 1px + sin sombra) — overrides
 *    `!important` para ganarle a `hover:*` mientras el botón del mouse está abajo.
 *
 * UI pura: no fetcha config ni CF. El organism `members-cards` le pasa los datos
 * ya resueltos (CF + i18n + defaults).
 *
 * ## Props
 * @param {string} props.icon - Nombre del ícono del catálogo `/icons/`. Si es
 *   falsy, se omite el círculo del ícono.
 * @param {string} props.title - Título visible.
 * @param {string} [props.description] - Descripción visible (se trunca a `lineClamp`).
 * @param {string} [props.href='#'] - URL interna de destino al click.
 * @param {string|null} [props.target=null] - target del `<a>` (`_blank` para externos).
 * @param {string|null} [props.rel=null] - rel del `<a>` (ej. `noopener noreferrer`).
 * @param {string|null} [props.ariaLabel=null] - Override del aria-label (default `title`).
 * @param {number} [props.lineClamp=3] - Máximo de líneas de la descripción (1..4).
 * @param {{label:string, complete?:boolean}|null} [props.badge=null] - Chip de
 *   estado (Figma `statusProfileChip`, card `account`): pill ámbar pegado al
 *   borde superior-derecho. Si es null/sin label, no se renderiza.
 * @param {string} [props.customClassName=''] - Clases extra del root.
 */
const CLAMP = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
};

export const MembersCard = ({
  icon = null,
  title = '',
  description = '',
  href = '#',
  target = null,
  rel = null,
  ariaLabel = null,
  lineClamp = 3,
  badge = null,
  customClassName = '',
  ...rest
}) => {
  const finalAriaLabel = ariaLabel || title;
  const clampClass = CLAMP[lineClamp] || CLAMP[3];

  return html`
    <a
      class="group relative w-full h-full p-4 bg-background-card-lighter border border-[var(--color-border-stroke-default)] rounded-2xl no-underline inline-flex flex-col justify-start items-start gap-4 cursor-pointer transition-[box-shadow,border-color] duration-200 ease-in-out hover:border-transparent hover:shadow-[0px_2px_10px_2px_rgba(73,73,73,0.25)] active:!border-[var(--color-border-stroke-default)] active:!shadow-none focus-visible:!border-transparent focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-border-stroke-focus focus-visible:!outline-offset-2 ${customClassName}"
      data-name="members-card"
      href=${href}
      target=${target || undefined}
      rel=${rel || undefined}
      aria-label=${finalAriaLabel}
      ...${rest}
    >
      ${badge && badge.label && html`
        <div
          class="absolute top-[-14px] right-[-1px] inline-flex items-center gap-1 pl-2 pr-3 py-1 bg-[#fff3e0] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"
          data-name="members-card-badge"
          data-complete=${badge.complete ? 'true' : 'false'}
        >
          <span class="w-4 h-4 shrink-0 flex items-center justify-center text-[#c55000] [&_svg_path]:fill-[currentColor]">
            <${Icon} icon="alert/info" size="s" color="currentColor" />
          </span>
          <span class="text-[#c55000] text-sm font-bold leading-[normal] whitespace-nowrap">${badge.label}</span>
        </div>
      `}
      <div class="w-full inline-flex flex-row justify-start items-center gap-3">
        ${icon && html`
          <div
            class="w-8 h-8 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-full bg-[#f5f5f5] text-text-normal-primary [&_svg_path]:fill-[currentColor]"
          >
            <${Icon} icon=${icon} size="xl" color="currentColor" customClassName="!w-5 !h-5 md:!w-6 md:!h-6" />
          </div>
        `}
        <div class="flex-1 min-w-0 inline-flex flex-col justify-center items-start">
          <span class="self-stretch text-text-normal-primary text-base md:text-xl font-semibold leading-[normal]">${title}</span>
        </div>
        <div
          class="h-8 md:h-10 shrink-0 flex items-center text-text-normal-primary [&_svg_path]:fill-[currentColor]"
        >
          <${Icon} icon="navigation/chevron-right" size="xl" color="currentColor" />
        </div>
      </div>
      ${description && html`
        <span
          class="w-full text-[var(--color-text-normal-secondary)] text-sm font-normal leading-[normal] ${clampClass}"
        >${description}</span>
      `}
    </a>
  `;
};

export default MembersCard;
