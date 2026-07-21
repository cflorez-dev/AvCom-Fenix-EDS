import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * LmPlusPlanCard — card del plan Lifemiles Plus del socio (1271694; exhibits
 * 765-77681 activa/suspendida, 765-77768 tamaños).
 *
 * Header con GRADIENTE PÚRPURA (`#5303B6 → #9810FA`, mock) + "Lifemiles Plus"
 * + link "Administrar suscripción" + chip de estado; resumen Suscripción /
 * Millas por mes (línea OCULTA si `monthlyMiles` null — §7.3: el contrato
 * REAL trae un planId activo sin match en `plans[]`); panel PUNTEADO de
 * beneficios con check (contenido por i18n `lmPlusBenefits`, segmentos
 * `**bold**`); franja upsell púrpura clara con `{plan}`/`{price}` + CTA
 * "Mejorar plan".
 *
 * VARIANTE `suspended` (GATEADA aguas arriba — solo llega si el wrapper trae
 * indicador explícito): header GRIS, chip "Plan suspendido", franja gris con
 * `lmPlusSuspendedNotice` ({date}) + CTA "Activar plan".
 *
 * ## Props
 * - `state`: 'active'|'suspended'.
 * - `plan`: {name, monthlyMiles|null} — del VM de club-subscription.service.
 * - `upsell`: {name, priceDelta|null}|null — franja oculta si null.
 * - `labels`: i18n (lmPlus*).
 * - `manageUrl` / `upgradeUrl` / `activateUrl`: URLs configurables (CF/sheet).
 * - `suspendedUntil`: string — fecha para `{date}` del aviso de suspensión.
 * - `formatPrice`: (n)=>string — formateo del precio del upsell. Default
 *   `COP {n}` es-CO.
 * - `formatValue`: (n)=>string — formateo de millas.
 * - `customClassName`: string.
 */
const PURPLE_GRADIENT = 'linear-gradient(98deg, #5303B6 30.5%, #9810FA 101%)';

const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

/** Segmentos `**bold**` → <strong> (parse local, texto plano — sin HTML). */
const renderBoldSegments = (raw) => String(raw || '').split('**').map((part, i) => (
  i % 2 === 1 ? html`<strong class="font-bold">${part}</strong>` : part
));

const CheckIcon = () => html`
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0 mt-0.5">
    <path
      d="M13.3 4.3a.9.9 0 0 1 0 1.3l-5.6 5.9a.9.9 0 0 1-1.3 0L3.6 8.6a.9.9 0 1 1 1.3-1.3l2.2 2.3 4.9-5.3a.9.9 0 0 1 1.3 0Z"
      fill="#1b1b1b"
    />
  </svg>
`;

export const LmPlusPlanCard = ({
  state = 'active',
  plan = null,
  upsell = null,
  labels = {},
  manageUrl = '',
  upgradeUrl = '',
  activateUrl = '',
  suspendedUntil = '',
  formatPrice = (n) => `COP ${Number(n || 0).toLocaleString('es-CO')}`,
  formatValue = (n) => Number(n || 0).toLocaleString('en-US'),
  customClassName = '',
  ...rest
}) => {
  const suspended = state === 'suspended';
  const benefits = String(labels.lmPlusBenefits || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  const headerStyle = suspended ? { background: '#f2f2f2' } : { background: PURPLE_GRADIENT };
  const headerText = suspended ? 'text-[#5a5a5a]' : 'text-white';

  return html`
    <div
      class=${`bg-white rounded-2xl p-4 md:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 w-full max-w-[1248px] ${customClassName}`}
      data-name="lm-plus-plan-card"
      data-state=${state}
      ...${rest}
    >
      <div class="flex flex-col gap-4 lg:w-[280px] shrink-0">
        ${/* Header gradiente púrpura (gris en suspendida) + chip de estado. */ ''}
        <div
          class="rounded-xl px-4 py-3 flex items-start justify-between gap-3"
          style=${headerStyle}
          data-name="lm-plus-header"
        >
          <div class="flex flex-col gap-0.5 min-w-0">
            <span class=${`text-base font-bold leading-normal ${headerText}`}>Lifemiles Plus</span>
            ${manageUrl ? html`
              <a href=${manageUrl} class=${`text-[12px] font-normal leading-[16px] underline-offset-2 hover:underline ${suspended ? 'text-[#5a5a5a]' : 'text-white/90'}`}>
                ${labels.lmPlusManage || ''}
              </a>
            ` : html`
              <span class=${`text-[12px] font-normal leading-[16px] ${suspended ? 'text-[#5a5a5a]' : 'text-white/90'}`}>
                ${labels.lmPlusManage || ''}
              </span>
            `}
          </div>
          <span
            class=${`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold leading-[16px] ${suspended ? 'bg-[#f1f1f1] text-[#5a5a5a] border border-[#d9d9d9]' : 'bg-[#d9afed] text-[#1b1b1b]'}`}
            data-name="lm-plus-state-chip"
          >
            ${suspended ? (labels.lmPlusSuspended || '') : (labels.lmPlusActive || '')}
          </span>
        </div>

        ${/* Resumen: Suscripción / Millas por mes (oculta si null — §7.3). */ ''}
        <div class="flex gap-8">
          <div class="flex flex-col gap-0.5">
            <span class="text-[14px] font-normal leading-[19px] text-[#5a5a5a]">${labels.lmPlusSubscriptionLabel || ''}</span>
            <span class="text-base font-semibold leading-normal text-[#1b1b1b]">${plan?.name || ''}</span>
          </div>
          ${plan?.monthlyMiles != null && html`
            <div class="flex flex-col gap-0.5" data-name="lm-plus-monthly-miles">
              <span class="text-[14px] font-normal leading-[19px] text-[#5a5a5a]">${labels.lmPlusMilesMonthLabel || ''}</span>
              <span class="text-base font-semibold leading-normal text-[#1b1b1b]">${formatValue(plan.monthlyMiles)} millas</span>
            </div>
          `}
        </div>
      </div>

      <div class="flex flex-col gap-3 flex-1 min-w-0">
        ${benefits.length > 0 && html`
          <div
            class="flex flex-col gap-2.5 rounded-xl border border-dashed border-[#d9d9d9] p-3"
            data-name="lm-plus-benefits"
          >
            ${benefits.map((b) => html`
              <div key=${b} class="flex items-start gap-2">
                <${CheckIcon} />
                <span class="text-[14px] font-normal leading-[19px] text-[#1b1b1b]">${renderBoldSegments(b)}</span>
              </div>
            `)}
          </div>
        `}

        ${suspended ? html`
          <div
            class="flex flex-col md:flex-row md:items-center gap-2 rounded-xl bg-[#f1f1f1] px-4 py-3"
            data-name="lm-plus-suspended-notice"
          >
            <span class="flex-1 text-[14px] font-normal leading-[19px] text-[#5a5a5a]">
              ${tpl(labels.lmPlusSuspendedNotice, { date: suspendedUntil })}
            </span>
            <a
              href=${activateUrl || '#'}
              class="shrink-0 text-[14px] font-bold leading-[19px] text-[#1b1b1b] hover:underline underline-offset-2"
            >${labels.lmPlusActivate || ''}</a>
          </div>
        ` : (upsell && html`
          <div
            class="flex flex-col md:flex-row md:items-center gap-2 rounded-xl bg-[#faf3ff] px-4 py-3"
            data-name="lm-plus-upsell"
          >
            <span class="flex-1 text-[14px] font-normal leading-[19px] text-[#7e40cf]">
              ${renderBoldSegments(tpl(labels.lmPlusUpsell, {
      plan: `**${upsell.name}**`,
      price: upsell.priceDelta != null ? `**${formatPrice(upsell.priceDelta)}**` : '',
    }))}
            </span>
            <a
              href=${upgradeUrl || '#'}
              class="shrink-0 text-[14px] font-bold leading-[19px] text-[#7e40cf] hover:underline underline-offset-2"
            >${labels.lmPlusImprove || ''}</a>
          </div>
        `)}
      </div>
    </div>
  `;
};

export default LmPlusPlanCard;
