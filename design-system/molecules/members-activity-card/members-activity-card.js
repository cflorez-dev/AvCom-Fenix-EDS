import { h } from '@dropins/tools/preact.js';
import { useMemo } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * MembersActivityCard — card "Actividad de millas" del Dashboard (PBI 1263921,
 * "Bloque 4", CA10). Figma OMNI-Members-01062026 nodos 518:25319 / 518:25340.
 *
 * Misma superficie visual que `MembersCard` (medidas, borde/radio/padding,
 * estados) pero con UN bloque adicional debajo del título: la lista de las
 * últimas N transacciones. **NO es collapsible** — la lista siempre se ve.
 *
 * Toda la card es un `<a>` que navega a `href` (típicamente
 * `/{lang}/members/actividad`). El chevron de la derecha es afordance visual
 * de navegación, no toggle.
 *
 * **Estructura (Figma 518:25340):**
 *  - Card `<a>`: bg `background/card/lighter`, borde 1px `border/stroke/default`
 *    (#d9d9d9), radio 16px, padding 16px, `flex-col gap 16px`.
 *  - titleBox: círculo gris 32px (mobile) / 40px (desktop) con ícono · título
 *    SemiBold h5 · chevron 24px (decorativo, no rota).
 *  - List: label "Últimas transacciones" 14px secondary + N items con borde
 *    inferior dashed (excepto el último). El PRIMER item usa color del logo
 *    Lifemiles (#2B3C46); del 2º en adelante verde (positivo) o rojo (negativo).
 *  - Empty state: si `transactions` está vacío y hay `emptyLabel`, lo muestra.
 *
 * **Responsive (mobile-first, breakpoint `md:` = 768px):**
 *  - ≤767px: círculo 32px / ícono interno 20px / título 16px / chevron 32px.
 *  - ≥768px: círculo 40px / ícono interno 24px / título 20px / chevron 40px.
 *
 * **Estados interactivos** (mismo Figma 518:25630/25659/25690/25719 que el
 * resto de balanceCards): transición 200ms `ease-in-out` sobre
 * `box-shadow,border-color`.
 *  - **default**: border 1px `border/stroke/default` (#d9d9d9), sin sombra.
 *  - **hover**: border transparent + shadow `0 2px 10px 2px rgba(73,73,73,.25)`.
 *  - **focus-visible** (teclado): el ring se pinta directo sobre el root `<a>`
 *    (border transparent + outline 2px `border/stroke/focus` con offset 2px).
 *  - **active** (pressed): vuelve al default con `!important` para ganarle a `hover:*`.
 *
 * ## Props
 * @param {string} [props.icon] - Ícono del catálogo `/icons/` para el círculo.
 * @param {string} [props.title=''] - Título visible (ej. "Actividad de millas").
 * @param {string} [props.lastTransactionsLabel=''] - Subtítulo de la lista
 *   ("Últimas transacciones" en es).
 * @param {string} [props.emptyLabel=''] - Copy cuando no hay transacciones.
 * @param {Array<{date:string|Date, description:string, amount:number}>}
 *   [props.transactions=[]] - Transacciones a mostrar.
 * @param {string} [props.locale='es-CO'] - Locale para formatear fechas/montos.
 * @param {string} [props.href='#'] - URL interna de destino al click.
 * @param {string|null} [props.target=null] - target del `<a>`.
 * @param {string|null} [props.rel=null] - rel del `<a>` (ej. `noopener noreferrer`).
 * @param {string|null} [props.ariaLabel=null] - Override del aria-label (default `title`).
 * @param {string} [props.customClassName='']
 */
export const MembersActivityCard = ({
  icon = null,
  title = '',
  lastTransactionsLabel = '',
  emptyLabel = '',
  transactions = [],
  locale = 'es-CO',
  href = '#',
  target = null,
  rel = null,
  ariaLabel = null,
  customClassName = '',
  ...rest
}) => {
  // Formatter de fecha "Dic 30, 2026" (locale-aware). Memo para no recrearlo en
  // cada render (los formatters de Intl son caros de construir).
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: '2-digit', year: 'numeric' }),
    [locale],
  );
  const numberFmt = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const formatDate = (value) => {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    // "Dic 30, 2026" — el `Intl` puede meter punto en el mes corto en es-*;
    // lo limpiamos para igualar el formato del Figma.
    return dateFmt.format(d).replace('.', '');
  };

  const formatAmount = (amount) => {
    const n = Number(amount) || 0;
    let sign = '';
    if (n > 0) sign = '+';
    else if (n < 0) sign = '-';
    return `${sign}${numberFmt.format(Math.abs(n))}`;
  };

  const finalAriaLabel = ariaLabel || title;

  return html`
    <a
      class="group relative w-full h-full p-4 bg-background-card-lighter border border-[var(--color-border-stroke-default)] rounded-2xl no-underline inline-flex flex-col justify-start items-start gap-4 cursor-pointer transition-[box-shadow,border-color] duration-200 ease-in-out hover:border-transparent hover:shadow-[0px_2px_10px_2px_rgba(73,73,73,0.25)] active:!border-[var(--color-border-stroke-default)] active:!shadow-none focus-visible:!border-transparent focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-border-stroke-focus focus-visible:!outline-offset-2 ${customClassName}"
      data-name="members-activity-card"
      href=${href}
      target=${target || undefined}
      rel=${rel || undefined}
      aria-label=${finalAriaLabel}
      ...${rest}
    >
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
      <div
        class="w-full inline-flex flex-col justify-start items-start gap-4"
        data-name="members-activity-card-list"
      >
        ${lastTransactionsLabel && html`
          <span class="w-full text-text-normal-secondary text-sm font-normal leading-[normal] truncate">${lastTransactionsLabel}</span>
        `}
        ${transactions.length === 0 && emptyLabel && html`
          <span class="w-full text-text-normal-secondary text-sm font-normal leading-[normal]">${emptyLabel}</span>
        `}
        ${transactions.map((tx, i) => {
    const isLast = i === transactions.length - 1;
    const amount = Number(tx.amount) || 0;
    // Color del monto (Figma 518:25319): el PRIMER item usa el color del logo
    // Lifemiles (`--logo-lifemiles-primary`, fallback #2B3C46) — destaca la
    // transacción más reciente. Del 2º en adelante: rojo si negativo
    // (`--color-alert-error-icon-bg`) / verde acreditación si positivo (#1f8330).
    let amountClass;
    if (i === 0) amountClass = 'text-[var(--logo-lifemiles-primary,#2B3C46)]';
    else if (amount < 0) amountClass = 'text-[var(--color-alert-error-icon-bg)]';
    else amountClass = 'text-[#1f8330]';
    return html`
      <div
        class="w-full inline-flex flex-row justify-start items-start gap-2 ${!isLast ? 'pb-3 border-b border-dashed border-[var(--color-border-stroke-default)]' : ''}"
        data-name="members-activity-card-item"
      >
        <div class="flex-1 min-w-0 inline-flex flex-col justify-center items-start">
          <span class="w-full text-text-normal-primary text-sm font-normal leading-[normal]">${tx.description}</span>
          <span class="w-full text-text-normal-secondary text-sm font-normal leading-[normal]">${formatDate(tx.date)}</span>
        </div>
        <div class="w-[90px] shrink-0 self-stretch inline-flex items-center justify-end">
          <span class="text-base font-bold leading-[normal] text-right whitespace-nowrap ${amountClass}">${formatAmount(amount)}</span>
        </div>
      </div>
    `;
  })}
      </div>
    </a>
  `;
};

export default MembersActivityCard;
