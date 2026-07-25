import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { SummaryText } from '../../atoms/summary-text/summary-text.js';
import { Button } from '../../atoms/button/button.js';
import { Chip } from '../../atoms/chip/chip.js';
import { buildIconPath } from '../../../scripts/utils/hlx.helper.js';

const html = htm.bind(h);

const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

/**
 * PaymentNetworkLogo — logo de la red del método de pago con fallback placeholder.
 * MISMO patrón pending-asset que `saved-card-item.NetworkLogo` (los 5 SVGs de red
 * `icons/members/cards/<key>.svg` son pending-asset, Figma `1291:48163`): sin SVG
 * o sin `networkKey`, cae a un pill gris con el nombre de la red — no una imagen
 * rota. NO es desviación de diseño.
 */
const PaymentNetworkLogo = ({ networkKey = '', networkLabel = '', codeBasePath = '' }) => {
  const [errored, setErrored] = useState(false);
  if (errored || !networkKey) {
    return html`
      <span
        class="inline-flex items-center justify-center h-6 min-w-[38px] px-2 rounded-md
          bg-[var(--bg-card-lighter)] border border-[var(--border-stroke-default)]
          text-[10px] font-bold uppercase leading-none text-[var(--text-normal-secondary)]"
        data-name="lm-plus-payment-network-placeholder"
        aria-label=${networkLabel}
      >${networkLabel}</span>
    `;
  }
  return html`
    <img
      src=${buildIconPath(`members/cards/${networkKey}.svg`, codeBasePath)}
      alt=${networkLabel}
      class="h-6 w-auto max-w-[38px] object-contain"
      data-name="lm-plus-payment-network-logo"
      onError=${() => setErrored(true)}
    />
  `;
};

/** Indicador de estado del plan: check verde (activo) / círculo gris (suspendido). */
const PlanStateIndicator = ({ suspended }) => (suspended
  ? html`
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0" style=${{ color: 'var(--text-normal-secondary)' }}>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <rect x="5.4" y="4.8" width="1.7" height="6.4" rx="0.6" fill="#ffffff" />
      <rect x="8.9" y="4.8" width="1.7" height="6.4" rx="0.6" fill="#ffffff" />
    </svg>
  `
  : html`
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0" style=${{ color: 'var(--icon-accent-positive)' }}>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M11.4 5.6a.8.8 0 0 1 0 1.2L7.5 10.7a.8.8 0 0 1-1.1 0L4.6 8.9a.8.8 0 1 1 1.1-1.1l1.2 1.2 3.3-3.4a.8.8 0 0 1 1.2 0Z" fill="#ffffff" />
    </svg>
  `);

const ChevronIcon = () => html`
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0">
    <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

/**
 * CTA pill de la card de suscripción. `Button variant="secondary"` (átomo) con
 * chevron. URL vacía → `disabled` (sin navegación muerta, D21).
 */
const SubscriptionCta = ({ label, url }) => html`
  <${Button}
    variant="secondary"
    size="sm"
    href=${url || undefined}
    disabled=${!url}
    customClassName="whitespace-nowrap"
  >
    ${label} <${ChevronIcon} />
  </${Button}>
`;

/**
 * LmPlusSubscriptionCard — card de la suscripción Lifemiles Plus en el tab Wallet
 * (1279362, Entrega 4; nodos `1056:41428` activa / `1056:42373` suspendida).
 *
 * ⚠️ Es una molécula NUEVA, distinta del `LmPlusPlanCard` de 1271694 (esa muestra
 * lista de beneficios + upsell y vive en la tab Beneficios de elite). Esta card
 * es la de gestión de la suscripción del socio (datos + resumen de pago + CTAs).
 *
 * Estructura:
 * - Header morado por token (`--text-lmplus-brand`): "Lifemiles Plus: {plan}".
 * - Datos (SummaryText): Fecha de suscripción · Tiempo suscrito · Próxima fecha de
 *   cobro (en `suspended` → label "Suscripción activa hasta") · Estado del plan con
 *   indicador de color (check verde / círculo gris).
 * - Sub-card "Resumen de pago" (`--bg-cards-accent`): método de pago (logo + ••••4
 *   + chip cobrand) · Valor · Frecuencia · texto promocional (i18n).
 * - 3 CTAs pill `Button secondary`: "Editar método de pago" / "Cancelar suscripción"
 *   (en `suspended` → "Renovar suscripción") / "Mejorar suscripción". URL vacía →
 *   disabled.
 *
 * Regla de datos: lo que el VM real de `loadClubSubscription` no traiga → `–`
 * (SummaryText lo pinta solo). No se inventan valores.
 *
 * ## Props
 * - `state`: 'active' | 'suspended'.
 * - `planName`: nombre del plan (VM `plan.name`) → header.
 * - `subscriptionDate` / `subscribedTime` / `nextChargeDate` / `value` / `frequency`:
 *   strings de datos; ausentes → `–`.
 * - `paymentMethod`: `{networkKey, networkLabel, maskedNumber, isCobrand, cobrandLabel, mock}`
 *   | null. `mock:true` se marca en el DOM (`data-mock`) para trazabilidad de qa.
 * - `labels`: i18n account (`walletLmPlus*`, `lmPlusPaymentLabel`).
 * - `editPaymentUrl` / `cancelUrl` / `upgradeUrl`: URLs configurables (CF).
 * - `codeBasePath`: base para el SVG de red (window.hlx.codeBasePath).
 * - `customClassName`: string.
 */
export const LmPlusSubscriptionCard = ({
  state = 'active',
  planName = '',
  subscriptionDate = '',
  subscribedTime = '',
  nextChargeDate = '',
  value = '',
  frequency = '',
  paymentMethod = null,
  labels = {},
  editPaymentUrl = '',
  cancelUrl = '',
  upgradeUrl = '',
  codeBasePath = '',
  customClassName = '',
  ...rest
}) => {
  const suspended = state === 'suspended';
  const nextChargeLabel = suspended
    ? (labels.walletLmPlusActiveUntilLabel || '')
    : (labels.walletLmPlusNextChargeLabel || '');
  const stateLabel = suspended
    ? (labels.walletLmPlusStateSuspended || '')
    : (labels.walletLmPlusStateActive || '');
  const cancelLabel = suspended
    ? (labels.walletLmPlusRenewCta || '')
    : (labels.walletLmPlusCancelCta || '');

  const pmText = paymentMethod
    ? [paymentMethod.networkLabel, paymentMethod.maskedNumber].filter(Boolean).join(' ')
    : '';

  return html`
    <div
      class=${`w-full max-w-[1248px] rounded-2xl border border-[var(--border-stroke-default)] bg-white p-4 md:p-6 flex flex-col gap-4 md:gap-5 ${customClassName}`.trim()}
      data-name="lm-plus-subscription-card"
      data-state=${state}
      ...${rest}
    >
      ${/* Header morado por token. */ ''}
      <span class="text-base font-bold leading-normal text-[var(--text-lmplus-brand)]" data-name="lm-plus-subscription-title">
        ${tpl(labels.walletLmPlusCardTitle, { plan: planName || '–' })}
      </span>

      ${/* Datos: 4 pares (1 col mobile / 2 tablet / 4 desktop). */ ''}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-name="lm-plus-subscription-data">
        <${SummaryText} label=${labels.walletLmPlusSubDateLabel || ''} value=${subscriptionDate} />
        <${SummaryText} label=${labels.walletLmPlusSubTimeLabel || ''} value=${subscribedTime} />
        <${SummaryText} label=${nextChargeLabel} value=${nextChargeDate} />
        <div class="flex flex-col gap-1 min-w-0" data-name="lm-plus-plan-state">
          <span class="text-xs leading-tight text-[var(--text-normal-secondary)]">${labels.walletLmPlusPlanStateLabel || ''}</span>
          <span class="flex items-center gap-1.5 text-base font-bold leading-tight text-[var(--text-normal-primary)]">
            <${PlanStateIndicator} suspended=${suspended} />
            ${stateLabel}
          </span>
        </div>
      </div>

      ${/* Sub-card "Resumen de pago" (panel #FAFAFA). */ ''}
      <div class="flex flex-col gap-4 rounded-2xl bg-[var(--bg-cards-accent)] p-4 md:p-6" data-name="lm-plus-payment-summary">
        <span class="text-base font-bold leading-normal text-[var(--text-normal-primary)]">
          ${labels.walletLmPlusPaymentSummaryTitle || ''}
        </span>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${/* Método de pago: value + (logo + chip cobrand). */ ''}
          <div
            class="flex flex-col gap-1 min-w-0"
            data-name="lm-plus-payment-method"
            data-mock=${paymentMethod && paymentMethod.mock ? 'true' : undefined}
          >
            <span class="text-xs leading-tight text-[var(--text-normal-secondary)]">${labels.lmPlusPaymentLabel || ''}</span>
            <span class="text-base font-bold leading-tight break-words text-[var(--text-normal-primary)]">
              ${pmText || '–'}
            </span>
            ${paymentMethod && html`
              <span class="flex items-center gap-2 flex-wrap mt-1">
                <${PaymentNetworkLogo}
                  networkKey=${paymentMethod.networkKey || ''}
                  networkLabel=${paymentMethod.networkLabel || ''}
                  codeBasePath=${codeBasePath}
                />
                ${paymentMethod.isCobrand && html`
                  <${Chip} variant="lifemiles">${paymentMethod.cobrandLabel || labels.walletCobrandChip || ''}</${Chip}>
                `}
              </span>
            `}
          </div>
          <${SummaryText} label=${labels.walletLmPlusValueLabel || ''} value=${value} />
          <${SummaryText} label=${labels.walletLmPlusFrequencyLabel || ''} value=${frequency} />
        </div>
        ${labels.walletLmPlusPromoText && html`
          <span class="text-xs leading-tight text-[var(--text-normal-secondary)]" data-name="lm-plus-promo-text">
            ${labels.walletLmPlusPromoText}
          </span>
        `}
      </div>

      ${/* 3 CTAs pill secondary. */ ''}
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4" data-name="lm-plus-subscription-ctas">
        <${SubscriptionCta} label=${labels.walletLmPlusEditPaymentCta || ''} url=${editPaymentUrl} />
        <${SubscriptionCta} label=${cancelLabel} url=${cancelUrl} />
        <${SubscriptionCta} label=${labels.walletLmPlusUpgradeCta || ''} url=${upgradeUrl} />
      </div>
    </div>
  `;
};

export default LmPlusSubscriptionCard;
