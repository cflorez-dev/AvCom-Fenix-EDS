import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { SummaryText } from '../../atoms/summary-text/summary-text.js';
import { LinkButton } from '../../atoms/link-button/link-button.js';

const html = htm.bind(h);

/**
 * AviancaCreditsCard — card informativa de un AV Credit (1279362, §C, nodo
 * `1056:42893`). Módulo mock-first (D27): datos de fixture, marcado `mock:true`
 * aguas arriba.
 *
 * Layout Entrega 4 (re-layout del gate visual): **tile compacto branded a la
 * IZQUIERDA** (lockup "avianca credits" sobre el verde AVC + "Saldo actual" +
 * saldo + link "Consultar movimientos ›") + **detalle a la DERECHA** (header con
 * número/tipo/estado + grid de `SummaryText`: titular, fechas, saldo inicial).
 *
 * **3 estados** con indicador (§C): Activo (check verde `--icon-accent-positive`)
 * / Sin saldo (x gris `--text-normal-secondary`) / Cancelado (x rojo
 * `--icon-accent-negative`).
 *
 * ## Props
 * - `credit`: VM de `avianca-credits.service.toAviancaCreditsVM` (un crédito).
 * - `labels`: i18n account (`avCredits*`).
 * - `movementsUrl`: string — destino de "Consultar movimientos" ('' → disabled).
 * - `formatBalance`: (amount, currency) => string — formateo del saldo.
 * - `customClassName`: string.
 */
const StateCheckIcon = () => html`
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0" style=${{ color: 'var(--icon-accent-positive)' }}>
    <path d="M13.3 4.3a.9.9 0 0 1 0 1.3l-5.6 5.9a.9.9 0 0 1-1.3 0L3.6 8.6a.9.9 0 1 1 1.3-1.3l2.2 2.3 4.9-5.3a.9.9 0 0 1 1.3 0Z" fill="currentColor" />
  </svg>
`;

const StateXIcon = ({ color }) => html`
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0" style=${{ color }}>
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  </svg>
`;

const STATE_META = {
  active: { labelKey: 'avCreditsStateActive', icon: 'check' },
  'no-balance': { labelKey: 'avCreditsStateNoBalance', icon: 'x', color: 'var(--text-normal-secondary)' },
  cancelled: { labelKey: 'avCreditsStateCancelled', icon: 'x', color: 'var(--icon-accent-negative)' },
};

/**
 * AviancaCreditsLockup — lockup tipográfico de marca "avianca credits" sobre el
 * verde AVC. PENDIENTE-ASSET: logo oficial avianca credits (Juan lo exporta de
 * Figma). Mientras, placeholder tipográfico blanco + swoosh.
 */
const AviancaCreditsLockup = () => html`
  <span class="inline-flex items-baseline gap-1 text-white leading-none" data-name="avianca-credits-lockup">
    ${/* PENDIENTE-ASSET: logo oficial avianca credits (reemplazar por SVG del brand). */ ''}
    <span class="text-sm font-bold lowercase tracking-tight">avianca</span>
    <span class="text-sm font-normal lowercase tracking-tight">credits</span>
    <svg viewBox="0 0 18 10" fill="none" aria-hidden="true" class="w-4 h-2.5 shrink-0 self-center">
      <path d="M1 8.5C6 3 12 1.2 17 1c-4 1.6-8 4-12 7.4-.7.6-3.2.7-4 .1Z" fill="#ffffff" />
      <path d="M8.5 6.2C11 4 14 2.6 17 1c-2.3 1.4-4.6 3-6.9 5-.5.4-1.3.5-1.6.2Z" fill="#e00000" />
    </svg>
  </span>
`;

const defaultFormatBalance = (amount, currency) => {
  const n = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `${currency ? `${currency} ` : ''}${n.toLocaleString('es-CO')}`;
};

export const AviancaCreditsCard = ({
  credit = {},
  labels = {},
  movementsUrl = '',
  formatBalance = defaultFormatBalance,
  customClassName = '',
  ...rest
}) => {
  const {
    maskedNumber = '', type = '', state = 'active', currency = null,
    initialBalance = null, balance = null, holderName = '', issueDate = '', expiryDate = '',
  } = credit;
  const meta = STATE_META[state] || STATE_META.active;
  const cardName = labels.avCreditsCardName || 'Avianca Credits';

  return html`
    <div
      class=${`w-full max-w-[1248px] rounded-2xl border border-[var(--border-stroke-default)] bg-[var(--bg-card-lighter)] p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 ${customClassName}`.trim()}
      data-name="avianca-credits-card"
      data-state=${state}
      ...${rest}
    >
      ${/* IZQUIERDA: tile compacto branded (lockup verde + saldo actual + CTA). */ ''}
      <div
        class="w-full md:w-[210px] shrink-0 self-start rounded-xl border border-[var(--border-stroke-default)] overflow-hidden flex flex-col"
        data-name="avianca-credits-tile"
      >
        <div class="px-3 py-2.5 bg-[var(--bg-avcredits-accent)]" data-name="avianca-credits-lockup-bar">
          <${AviancaCreditsLockup} />
        </div>
        <div class="flex flex-col gap-1 px-3 py-3 bg-[var(--bg-card-lighter)]">
          <span class="text-xs leading-tight text-[var(--text-normal-secondary)]">${labels.avCreditsCurrentBalanceLabel || ''}</span>
          <span class="text-xl font-bold leading-tight text-[var(--text-normal-primary)]">${formatBalance(balance, currency)}</span>
          <${LinkButton}
            href=${movementsUrl || undefined}
            disabled=${!movementsUrl}
            size="compact"
            customClassName="mt-1 self-start"
          >
            ${labels.avCreditsMovementsCta || ''} <span aria-hidden="true">›</span>
          </${LinkButton}>
        </div>
      </div>

      ${/* DERECHA: header (número/tipo/estado) + grid de detalle. */ ''}
      <div class="flex-1 min-w-0 flex flex-col gap-4" data-name="avianca-credits-detail">
        <div class="flex flex-col gap-0.5 min-w-0">
          <span class="text-base font-bold leading-tight break-words text-[var(--text-normal-primary)]">
            ${[cardName, maskedNumber].filter(Boolean).join(' ')}
          </span>
          <span class="text-sm leading-tight text-[var(--text-normal-secondary)]">
            ${labels.avCreditsTypeLabel || ''}: <span class="text-[var(--text-normal-primary)]">${type || '–'}</span>
          </span>
          <span class="flex items-center gap-1.5 text-sm leading-tight text-[var(--text-normal-secondary)]" data-name="avianca-credits-state">
            ${labels.avCreditsStateLabel || ''}:
            ${meta.icon === 'check'
    ? html`<${StateCheckIcon} />`
    : html`<${StateXIcon} color=${meta.color} />`}
            <span class="font-bold text-[var(--text-normal-primary)]">${labels[meta.labelKey] || ''}</span>
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${/* Titular: clamp 2 líneas SOLO ≥1024 (nota 1291:50938). */ ''}
          <div class="flex flex-col gap-1 min-w-0" data-name="avianca-credits-holder">
            <span class="text-xs leading-tight text-[var(--text-normal-secondary)]">${labels.avCreditsHolderLabel || ''}</span>
            <span class="text-base font-bold leading-tight break-words lg:line-clamp-2 text-[var(--text-normal-primary)]">
              ${holderName || '–'}
            </span>
          </div>
          <${SummaryText} label=${labels.avCreditsIssueDateLabel || ''} value=${issueDate} />
          <${SummaryText} label=${labels.avCreditsExpiryDateLabel || ''} value=${expiryDate} />
          <${SummaryText}
            label=${labels.avCreditsInitialBalanceLabel || ''}
            value=${initialBalance != null ? formatBalance(initialBalance, currency) : ''}
          />
        </div>
      </div>
    </div>
  `;
};

export default AviancaCreditsCard;
