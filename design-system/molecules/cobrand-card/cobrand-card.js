import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * CobrandCard — card de una tarjeta cobrand del socio (1271694, AC bloque
 * 10.2; exhibits 819-32867 desktop / 819-32942 mobile).
 *
 * Imagen de tarjeta (150px desktop / 200px mobile; placeholder punteado si
 * falta) + nombre + banco + [línea "Total acumulado…" SOLO si `milesPeriod !=
 * null` — GATE v1: no hay fuente por-tarjeta confirmada] + link "Conoce todos
 * los beneficios" + panel PUNTEADO con hasta N beneficios (label + chip con
 * bg/texto CUSTOM del sheet — colores solo como estilo inline).
 *
 * Layout: horizontal ≥1024 (imagen | info en grid 0.5fr/1fr) · vertical
 * 768-1023 · columna ≤767; max-width 1248 la pone el contenedor.
 *
 * ## Props
 * - `card`: card del VM de cobrand.service — `{name, bank, imageUrl, chip,
 *   benefits[{text,value}], seeMoreUrl, milesPeriod, generic}`.
 * - `labels`: i18n (`cobrandSeeMore`, `cobrandMilesLabel` opcional — si no,
 *   el caller interpola el año en `milesLabel`).
 * - `milesLabel`: string — label de la línea de millas ("Total acumulado en
 *   {year}") ya interpolado.
 * - `formatValue`: (n)=>string — formateo de millas.
 * - `customClassName`: string.
 */
const splitValue = (value) => {
  const str = String(value || '').trim();
  const idx = str.indexOf(' ');
  if (idx < 0) return { strong: str, rest: '' };
  return { strong: str.slice(0, idx), rest: str.slice(idx + 1) };
};

const CardImage = ({ imageUrl, name }) => html`
  <div class="flex items-center justify-center w-[200px] h-[200px] lg:w-[150px] lg:h-[150px] shrink-0">
    ${imageUrl ? html`
      <img
        src=${imageUrl}
        alt=${name || ''}
        class="max-h-full max-w-full rounded-md object-contain"
        loading="lazy"
      />
    ` : html`
      <span
        class="block w-[94px] h-[150px] lg:w-[70px] lg:h-[112px] rounded-md border-2 border-dashed border-[#d9d9d9] bg-[#fafafa]"
        aria-hidden="true"
        data-name="cobrand-card-placeholder"
      ></span>
    `}
  </div>
`;

export const CobrandCard = ({
  card = null,
  labels = {},
  milesLabel = '',
  formatValue = (n) => Number(n || 0).toLocaleString('en-US'),
  customClassName = '',
  ...rest
}) => {
  if (!card) return null;
  const {
    name = '',
    bank = '',
    imageUrl = '',
    chip = null,
    benefits = [],
    seeMoreUrl = '',
    milesPeriod = null,
  } = card;

  // Colores CUSTOM del sheet para los chips de beneficio (fallback #f5f5f5).
  const chipStyle = {};
  if (chip?.bg) chipStyle.background = chip.bg;
  if (chip?.color) chipStyle.color = chip.color;

  return html`
    <div
      class=${`bg-white rounded-2xl p-4 md:p-6 flex flex-col lg:flex-row items-center gap-4 w-full ${customClassName}`}
      data-name="cobrand-card"
      data-generic=${card.generic ? 'true' : 'false'}
      ...${rest}
    >
      <${CardImage} imageUrl=${imageUrl} name=${name} />

      <div class="w-full min-w-0 grid grid-cols-1 gap-[19px] lg:grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)]">
        <div class="flex flex-col gap-4 min-w-0">
          <div class="flex flex-col gap-0.5">
            <span class="text-lg font-semibold leading-normal text-[#1b1b1b]">${name}</span>
            ${bank && html`<span class="text-[14px] font-normal leading-[19px] text-[#5a5a5a]">${bank}</span>`}
          </div>
          ${milesPeriod != null && html`
            <div class="flex flex-col gap-0.5 border-t border-[#d9d9d9] pt-4" data-name="cobrand-card-miles">
              <span class="text-[14px] font-normal leading-[19px] text-[#5a5a5a]">${milesLabel}</span>
              <span class="text-lg font-semibold leading-normal text-[#1b1b1b]">${formatValue(milesPeriod)}</span>
            </div>
          `}
          <div class="mt-auto">
            <${Button}
              variant="secondary"
              size="sm"
              href=${seeMoreUrl || undefined}
              customClassName=${seeMoreUrl ? '' : 'hidden'}
            >
              ${labels.cobrandSeeMore || ''}
            </${Button}>
          </div>
        </div>

        ${benefits.length > 0 && html`
          <div
            class="flex flex-col justify-center gap-2 rounded-xl border border-dashed border-[#d9d9d9] p-3"
            data-name="cobrand-card-benefits"
          >
            ${benefits.map((b, i) => {
    const { strong, rest: restText } = splitValue(b.value);
    return html`
              <span key=${b.text} class="contents">
                ${i > 0 && html`<span class="block h-px w-full bg-[#ededed]" aria-hidden="true"></span>`}
                <div class="flex items-center gap-4 w-full">
                  <span class="flex-1 min-w-0 text-[14px] font-normal leading-[19px] text-[#1b1b1b]">${b.text}</span>
                  ${b.value && html`
                    <span
                      class="flex items-center gap-1 shrink-0 rounded-lg bg-[#f5f5f5] px-3 py-2 whitespace-nowrap"
                      style=${chipStyle}
                    >
                      <span class="text-base font-bold leading-normal">${strong}</span>
                      ${restText && html`<span class=${`text-[14px] font-normal leading-[19px] ${chip?.color ? '' : 'text-[#5a5a5a]'}`}>${restText}</span>`}
                    </span>
                  `}
                </div>
              </span>
            `;
  })}
          </div>
        `}
      </div>
    </div>
  `;
};

export default CobrandCard;
