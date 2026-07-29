import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * CobrandEmptyState — estado vacío del módulo de tarjetas cobrand (1271694,
 * AC bloque 10.2; exhibits 765-79151/765-79208/765-79388).
 *
 * Card PUNTEADA (border `#b6b6b6`, radius 16, gap 24, padding 24): placeholder
 * de tarjeta 144×94 + copy (h6 SemiBold 18 + body 16 `#1b1b1b`) + 2 acciones
 * ÍCONO-ARRIBA (Figma 765:36542/765:36547 — círculo 48 con borde `#d9d9d9`
 * SIN sombra, ícono 24 `stroke #1b1b1b`, label 14 Regular centrado; item
 * 80 wide, gap 2 icon-label, gap 16 entre acciones). Horizontal en desktop /
 * vertical centrado en mobile.
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
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="w-6 h-6">
    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  </svg>
`;

const CardIcon = () => html`
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="w-6 h-6">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.6" />
    <path d="M2 9.5h20" stroke="currentColor" stroke-width="1.6" />
  </svg>
`;

const IconTopButton = ({
  icon, label, href = '', dataName,
}) => {
  // Figma 765:36542/765:36547 (`Shortcut_Item`): item 80 wide, padding
  // `px-[4px] py-[8px]`, gap `2px` icon-label. Círculo 48×48 EXACTO con
  // border `#d9d9d9` solid (SIN sombra). Uso `w-[48px] h-[48px]` (no `w-12
  // h-12`) porque el scale de spacing custom del repo mapea `12` a 76.8px
  // (`--spacing-1: 0.4rem`, ver tailwind-v4-gotchas) → el círculo saldría
  // ovalado dentro del contenedor de 80. La versión con sombra es el pill
  // "+ Agregar tarjeta" del slider (Figma 819:33267, ver `CobrandSlider`).
  const cls = `flex flex-col items-center gap-[2px] px-[4px] py-[8px] w-[80px] rounded-xl text-[#1b1b1b]
    hover:bg-[#f5f5f5] active:bg-[#e9e9e9]
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1b1b]
    motion-safe:transition-colors`;
  const content = html`
    <span class="flex items-center justify-center w-[48px] h-[48px] shrink-0 rounded-full border border-solid border-[#d9d9d9] bg-white">
      ${icon}
    </span>
    <span class="text-[14px] font-normal leading-normal text-center">${label}</span>
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
      class=${`w-full max-w-[1248px] rounded-2xl border-2 border-dashed border-[#b6b6b6] bg-white
        px-6 py-4 flex flex-col items-center justify-center gap-4 text-center
        md:flex-row md:items-center md:justify-start md:p-6 md:gap-6 md:text-left ${customClassName}`}
      data-name="cobrand-empty-state"
      ...${rest}
    >
      ${/* Mini-tarjeta placeholder — Figma 765:36536 (desktop 144×94) /
           765:36570 (mobile 92×60). Border dashed `#b6b6b6`, chip solid
           `#e9e9e9` en top-left (mismas proporciones 23.6%×27.66% con
           offset 8.33%×12.77% en ambos breakpoints). */ ''}
      <span
        class="relative block w-[92px] h-[60px] rounded-[9px] md:w-[144px] md:h-[94px] md:rounded-[14px] border-2 border-dashed border-[#b6b6b6] bg-[#f6f6f6] shrink-0"
        aria-hidden="true"
        data-name="cobrand-empty-placeholder"
      >
        <span
          class="absolute top-[12.77%] left-[8.33%] w-[23.6%] h-[27.66%] rounded-[2px] bg-[#e9e9e9] block"
          data-name="cobrand-empty-placeholder-chip"
        ></span>
      </span>

      <div class="flex flex-col gap-2 md:flex-1 min-w-0">
        <span class="text-[16px] md:text-[18px] font-semibold leading-normal text-[#1b1b1b]">${labels.cobrandEmptyTitle || ''}</span>
        ${labels.cobrandEmptyBody && html`
          <span class="text-[14px] md:text-[16px] font-normal leading-normal text-[#1b1b1b]">${labels.cobrandEmptyBody}</span>
        `}
      </div>

      ${(showAdd || showRequest) && html`
        <div class="flex items-start gap-4 shrink-0" data-name="cobrand-empty-actions">
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
              label=${labels.cobrandEmptyRequest || (actions && actions.requestLabel) || labels.cobrandRequest || ''}
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
