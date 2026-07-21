import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * CobrandEmptyState — estado vacío del módulo de tarjetas cobrand (1271694,
 * AC bloque 10.2; exhibits 765-79151/765-79208/765-79388).
 *
 * Card PUNTEADA: placeholder de tarjeta + título ("Con tu tarjeta Avianca
 * Lifemiles, tus beneficios aparecen aquí") + body + 2 botones ÍCONO-ARRIBA
 * ("Agregar tarjeta" con + · "Solicitar tarjeta" con ícono de tarjeta) con
 * estados Default/Hover/Active/Focus. Horizontal en desktop / vertical
 * centrado en mobile.
 *
 * Se muestra cuando `buildCobrandVM().empty` (socio sin `cobrandInfo` — caso
 * real de TODAS las cuentas UAT). Textos por i18n; acciones ocultables por
 * POS vía `actions` del sheet.
 *
 * ## Props
 * - `labels`: i18n (`cobrandEmptyTitle`, `cobrandEmptyBody`, `cobrandAdd`,
 *   `cobrandRequest`).
 * - `actions`: acciones del sheet (`buildCobrandVM().actions`) o null →
 *   ambas visibles con labels default.
 * - `customClassName`: string.
 */
const PlusIcon = () => html`
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="w-5 h-5">
    <path d="M10 4.2v11.6M4.2 10h11.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
  </svg>
`;

const CardIcon = () => html`
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="w-5 h-5">
    <rect x="2" y="4.5" width="16" height="11" rx="1.8" stroke="currentColor" stroke-width="1.5" />
    <path d="M2 8h16" stroke="currentColor" stroke-width="1.5" />
  </svg>
`;

const IconTopButton = ({
  icon, label, href = '', dataName,
}) => {
  const cls = `flex flex-col items-center gap-1 rounded-xl px-3 py-2 min-w-[72px] text-[#1b1b1b]
    hover:bg-[#f5f5f5] active:bg-[#e9e9e9]
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1b1b]
    motion-safe:transition-colors`;
  const content = html`
    <span class="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-[0_0_6px_rgba(90,90,90,0.2)]">
      ${icon}
    </span>
    <span class="text-[12px] font-normal leading-[16px] text-center">${label}</span>
  `;
  if (href) {
    return html`<a href=${href} class=${cls} data-name=${dataName}>${content}</a>`;
  }
  return html`<button type="button" class=${cls} data-name=${dataName}>${content}</button>`;
};

export const CobrandEmptyState = ({
  labels = {},
  actions = null,
  customClassName = '',
  ...rest
}) => {
  const showAdd = actions ? actions.add !== false : true;
  const showRequest = actions ? actions.request !== false : true;

  return html`
    <div
      class=${`w-full max-w-[1248px] rounded-2xl border-2 border-dashed border-[#d9d9d9] bg-white
        p-4 md:p-6 flex flex-col items-center gap-4 text-center
        md:flex-row md:items-center md:gap-6 md:text-left ${customClassName}`}
      data-name="cobrand-empty-state"
      ...${rest}
    >
      ${/* Placeholder de tarjeta (gris, punteado). */ ''}
      <span
        class="block w-[72px] h-[48px] rounded-md bg-[#ededed] border border-[#d9d9d9] shrink-0"
        aria-hidden="true"
        data-name="cobrand-empty-placeholder"
      ></span>

      <div class="flex flex-col gap-1 md:flex-1 min-w-0">
        <span class="text-base font-bold leading-normal text-[#1b1b1b]">${labels.cobrandEmptyTitle || ''}</span>
        ${labels.cobrandEmptyBody && html`
          <span class="text-[14px] font-normal leading-[19px] text-[#5a5a5a]">${labels.cobrandEmptyBody}</span>
        `}
      </div>

      ${(showAdd || showRequest) && html`
        <div class="flex items-start gap-2 shrink-0" data-name="cobrand-empty-actions">
          ${showAdd && html`
            <${IconTopButton}
              icon=${html`<${PlusIcon} />`}
              label=${(actions && actions.addLabel) || labels.cobrandAdd || ''}
              href=${(actions && actions.addUrl) || ''}
              dataName="cobrand-empty-add"
            />
          `}
          ${showRequest && html`
            <${IconTopButton}
              icon=${html`<${CardIcon} />`}
              label=${(actions && actions.requestLabel) || labels.cobrandRequest || ''}
              href=${(actions && actions.requestUrl) || ''}
              dataName="cobrand-empty-request"
            />
          `}
        </div>
      `}
    </div>
  `;
};

export default CobrandEmptyState;
