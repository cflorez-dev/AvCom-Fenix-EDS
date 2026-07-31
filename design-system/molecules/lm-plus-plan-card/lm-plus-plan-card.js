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
const PURPLE_GRADIENT = 'linear-gradient(100deg, #5303B6 30.5%, #9810FA 101%)';

const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

/** Segmentos `**bold**` → <strong> (parse local, texto plano — sin HTML). */
const renderBoldSegments = (raw) => String(raw || '').split('**').map((part, i) => (
  i % 2 === 1 ? html`<strong class="font-bold">${part}</strong>` : part
));

const CheckIcon = ({ color = '#5303b6' }) => html`
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0">
    <path
      d="M13.3 4.3a.9.9 0 0 1 0 1.3l-5.6 5.9a.9.9 0 0 1-1.3 0L3.6 8.6a.9.9 0 1 1 1.3-1.3l2.2 2.3 4.9-5.3a.9.9 0 0 1 1.3 0Z"
      fill=${color}
    />
  </svg>
`;

const ChevronRightIcon = ({ color = 'currentColor' }) => html`
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0">
    <path d="M6 4l4 4-4 4" stroke=${color} stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
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
  const chipColor = suspended
    ? 'bg-[#f1f1f1] text-[#5a5a5a] border border-[#d9d9d9]'
    : 'bg-white text-[#5303b6] lg:bg-[#faf3ff]';
  const benefitsBorder = suspended ? 'border-[#d9d9d9]' : 'border-[#5303b6]';
  const upsellBg = 'bg-[#f8f1ff]';
  const upsellText = 'text-[#5303b6]';
  const suspendedBg = 'bg-[#f1f1f1]';

  const manageLinkInner = html`
    <span class="text-[14px] font-normal leading-normal whitespace-nowrap">${labels.lmPlusManage || ''}</span>
    <${ChevronRightIcon} color=${suspended ? '#5a5a5a' : '#ffffff'} />
  `;

  return html`
    <div
      class=${`bg-white border border-[#d9d9d9] rounded-2xl p-4 md:p-6 w-full max-w-[1248px] flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-8 ${customClassName}`}
      data-name="lm-plus-plan-card"
      data-state=${state}
      ...${rest}
    >
      <div class="flex flex-col gap-4">
        ${/* Header con gradiente púrpura (gris en suspendida) + chip de estado. */ ''}
        <div
          class="h-[81px] rounded-[12px] p-4 flex items-center"
          style=${headerStyle}
          data-name="lm-plus-header"
        >
          <div class="flex-1 min-w-0 flex items-start justify-between gap-4">
            <div class="flex flex-col gap-1 min-w-0">
              <span class=${`text-[16px] font-bold leading-normal md:text-[18px] md:font-semibold lg:text-[20px] ${headerText}`}>Lifemiles Plus</span>
              ${manageUrl ? html`
                <a
                  href=${manageUrl}
                  class=${`flex items-center gap-0.5 hover:underline underline-offset-2 ${suspended ? 'text-[#5a5a5a]' : 'text-white'}`}
                >
                  ${manageLinkInner}
                </a>
              ` : html`
                <div class=${`flex items-center gap-0.5 ${suspended ? 'text-[#5a5a5a]' : 'text-white'}`}>
                  ${manageLinkInner}
                </div>
              `}
            </div>
            <span
              class=${`shrink-0 flex items-center whitespace-nowrap rounded-full pl-2 pr-3 py-1 text-[14px] font-bold leading-normal md:rounded-[8px] md:px-2 ${chipColor}`}
              data-name="lm-plus-state-chip"
            >
              ${suspended ? (labels.lmPlusSuspended || '') : (labels.lmPlusActive || '')}
            </span>
          </div>
        </div>

        ${/* Divider + resumen: Suscripción / Millas por mes (oculta si null — §7.3). */ ''}
        <div class="h-px w-full bg-[#d9d9d9]" aria-hidden="true"></div>
        <div class="flex gap-8">
          <div class="flex flex-col">
            <span class="text-[14px] font-normal leading-normal text-[#5a5a5a]">${labels.lmPlusSubscriptionLabel || ''}</span>
            <span class="text-[16px] font-bold leading-normal text-[#1b1b1b] md:text-[18px] md:font-semibold lg:text-[20px]">${plan?.name || ''}</span>
          </div>
          ${plan?.monthlyMiles != null && html`
            <div class="flex flex-col" data-name="lm-plus-monthly-miles">
              <span class="text-[14px] font-normal leading-normal text-[#5a5a5a]">${labels.lmPlusMilesMonthLabel || ''}</span>
              <span class="text-[16px] font-bold leading-normal text-[#1b1b1b] md:text-[18px] md:font-semibold lg:text-[20px]">${formatValue(plan.monthlyMiles)} millas</span>
            </div>
          `}
        </div>
      </div>

      <div class="flex flex-col min-w-0">
        ${benefits.length > 0 && html`
          <div
            class=${`flex flex-col rounded-[12px] border border-dashed ${benefitsBorder} overflow-hidden`}
            data-name="lm-plus-benefits"
          >
            <div class="flex flex-col gap-4 p-3">
              ${benefits.map((b) => html`
                <div key=${b} class="flex items-start gap-2">
                  <span class="shrink-0 flex items-center py-1">
                    <${CheckIcon} color=${suspended ? '#5a5a5a' : '#5303b6'} />
                  </span>
                  <span class="flex-1 text-[14px] font-normal leading-normal text-[#1b1b1b]">${renderBoldSegments(b)}</span>
                </div>
              `)}
            </div>

            ${suspended ? html`
              <div
                class=${`${suspendedBg} px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between`}
                data-name="lm-plus-suspended-notice"
              >
                <span class="flex-1 text-[14px] font-normal leading-normal text-[#5a5a5a]">
                  ${tpl(labels.lmPlusSuspendedNotice, { date: suspendedUntil })}
                </span>
                <a
                  href=${activateUrl || '#'}
                  class="shrink-0 flex items-center gap-0.5 text-[14px] font-bold leading-normal text-[#1b1b1b] hover:underline underline-offset-2"
                >
                  <span>${labels.lmPlusActivate || ''}</span>
                  <${ChevronRightIcon} color="#1b1b1b" />
                </a>
              </div>
            ` : (upsell && html`
              <div
                class=${`${upsellBg} px-4 py-3 flex items-start justify-between gap-2 md:flex-col md:items-start md:gap-2 md:py-2 lg:flex-row lg:items-start lg:justify-between lg:py-3`}
                data-name="lm-plus-upsell"
              >
                <span class=${`flex-1 text-[14px] font-normal leading-normal ${upsellText}`}>
                  ${renderBoldSegments(tpl(labels.lmPlusUpsell, {
      plan: `**${upsell.name || ''}**`,
      price: upsell.priceDelta != null ? `**${formatPrice(upsell.priceDelta)}**` : '',
    }))}
                </span>
                <a
                  href=${upgradeUrl || '#'}
                  class=${`shrink-0 flex items-center gap-0.5 text-[14px] font-bold leading-normal hover:underline underline-offset-2 ${upsellText}`}
                >
                  <span>${labels.lmPlusImprove || ''}</span>
                  <${ChevronRightIcon} color="#5303b6" />
                </a>
              </div>
            `)}
          </div>
        `}
      </div>
    </div>
  `;
};

export default LmPlusPlanCard;
