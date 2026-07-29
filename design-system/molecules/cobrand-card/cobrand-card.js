import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * CobrandCard — card de una tarjeta cobrand del socio (1271694, AC bloque
 * 10.2; exhibits pixel-perfect Figma 819-33260 mobile / 819-33272 tablet /
 * 819-33285 desktop).
 *
 * Imagen de tarjeta (~150x150 frame en tablet/desktop; ~200x200 en mobile
 * con placeholder punteado si falta) + nombre + banco + línea "Total
 * acumulado…" (SIEMPRE visible con el label; si `milesPeriod` es null —
 * GATE v1: la fuente por-tarjeta del wrapper LM aún no existe — pinta "—"
 * en vez de esconderse) + botón "Ver más beneficios" (pill white + sombra
 * suave, Figma 765:40086) + panel PUNTEADO con hasta N beneficios (label +
 * chip con bg gris #f5f5f5 por defecto; si el sheet trae `color_fondo_chip`/
 * `color_texto_chip` esos PISAN el color vía estilo inline — configurable).
 *
 * Layout responsive (Figma 819-33260/272/285):
 *  - Mobile (≤767): columna única — imagen top full-width, name/bank,
 *    divider dashed, miles (si aplica), divider, benefits box, divider,
 *    botón "Ver más" full-width outline pill.
 *  - Tablet (768-1023): grid con imagen+name en top row, miles/botón en
 *    middle row (right-aligned), benefits box full-width abajo. Dividers
 *    dashed entre secciones.
 *  - Desktop (≥1024): 3 columnas horizontales — imagen | (name +
 *    divider-dashed + miles + botón) | benefits box.
 *
 * ## Props
 * - `card`: card del VM de cobrand.service — `{name, bank, imageUrl,
 *   isVerticalImage, chip, benefits[{text,value}], seeMoreUrl, milesPeriod,
 *   generic}`. `isVerticalImage` (sheet flag `imagen_vertical`, 2026-07-24)
 *   invierte la orientación del frame de la imagen: false (default) = 219:144
 *   landscape; true = square 150×150 desktop / 200×200 mobile con la imagen
 *   portrait centrada (Figma 819:32867 / 819:32936).
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

/**
 * Placeholder cuando `card.imageUrl` está vacío. Simula el outline de una
 * tarjeta con un "chip" gris en la esquina top-left (Figma 765:36536 dentro
 * del `CobrandEmptyState` 765:41898 — Card 144×94 dashed + Image Placeholder
 * 34×26 en top-left). Aspect según orientación:
 *  - horizontal (default): 219:144 (landscape, Figma 819:33266 `Card Image`).
 *  - vertical (sheet flag `imagen_vertical`): 93:150 (portrait; Figma
 *    819:32944/32870 con la imagen portrait centrada dentro del frame square
 *    150×150 desktop / 200×200 mobile).
 *
 * Estilo (Figma 765:36536):
 *  - bg `#f6f6f6`, border dashed 2px `#b6b6b6`, radius 14px
 *  - chip interno: bg `#e9e9e9`, radius 2px, en top-left al 8.33%/12.77% del
 *    frame (proporciones del outline 144×94), ancho 23.6% / alto 27.66%.
 */
const Placeholder = ({ mobile = false, vertical = false }) => {
  const shape = vertical ? 'aspect-[93/150] h-full' : 'aspect-[219/144] w-full';
  const size = mobile ? 'max-w-[200px]' : 'max-w-[150px]';
  return html`
    <span
      class=${`relative block ${shape} ${size} rounded-[14px] border-2 border-dashed border-[#b6b6b6] bg-[#f6f6f6]`}
      aria-hidden="true"
      data-name="cobrand-card-placeholder"
    >
      <span
        class="absolute top-[12.77%] left-[8.33%] w-[23.6%] h-[27.66%] rounded-[2px] bg-[#e9e9e9] block"
        data-name="cobrand-card-placeholder-chip"
      ></span>
    </span>
  `;
};

const CardImage = ({
  imageUrl, name, mobile = false, vertical = false,
}) => {
  // Frame de la imagen. Horizontal (default): 219:144 landscape que preserva
  // la orientación de tarjeta de crédito (mobile w-full max-200 / desktop
  // w-150). Vertical (2026-07-24, sheet `imagen_vertical`): SQUARE 200×200
  // mobile / 150×150 desktop (Figma 819:32944 / 819:32870) — la imagen portrait
  // (~93:150) queda centrada por `flex items-center justify-center` y
  // `object-contain`.
  let frameCls;
  if (vertical) {
    frameCls = mobile
      ? 'flex items-center justify-center w-full max-w-[200px] aspect-square shrink-0 mx-auto'
      : 'flex items-center justify-center w-[150px] aspect-square shrink-0';
  } else {
    frameCls = mobile
      ? 'flex items-center justify-center w-full max-w-[200px] aspect-[219/144] shrink-0 mx-auto'
      : 'flex items-center justify-center w-[150px] aspect-[219/144] shrink-0';
  }
  return html`
    <div class=${frameCls} data-vertical=${vertical || undefined}>
      ${imageUrl ? html`
        <img
          src=${imageUrl}
          alt=${name || ''}
          class="max-h-full max-w-full rounded-md object-contain"
          loading="lazy"
        />
      ` : html`<${Placeholder} mobile=${mobile} vertical=${vertical} />`}
    </div>
  `;
};

const NameBlock = ({ name, bank }) => html`
  <div class="flex flex-col gap-0.5" data-name="cobrand-card-name">
    <span class="text-[18px] font-semibold leading-normal text-[#1b1b1b]">${name}</span>
    ${bank && html`<span class="text-[14px] font-normal leading-[19px] text-[#5a5a5a]">${bank}</span>`}
  </div>
`;

const MilesBlock = ({ milesLabel, milesPeriod, formatValue }) => html`
  <div class="flex flex-col gap-0.5" data-name="cobrand-card-miles">
    <span class="text-[14px] font-normal leading-[19px] text-[#5a5a5a]">${milesLabel}</span>
    <span class="text-[18px] font-semibold leading-normal text-[#1b1b1b]">${milesPeriod != null ? `${formatValue(milesPeriod)} millas` : '—'}</span>
  </div>
`;

const SeeMoreButton = ({ seeMoreUrl, label, full = false }) => {
  if (!seeMoreUrl) return null;
  // Figma 765:40086 "Ver más beneficios": pill bg-white SIN borde visible +
  // sombra suave (shadow/small), texto bold 14px #1b1b1b, chevron 16px a la
  // derecha. Es el variant `tertiary` (white, borde transparente) tamaño `xs`
  // (h-32 / px-16 / text-14) — NO `secondary`, que pinta el outline visible.
  return html`
    <${Button}
      variant="tertiary"
      size="xs"
      href=${seeMoreUrl}
      customClassName=${`shadow-[0_0_6px_rgba(90,90,90,0.2)] ${full ? 'w-full' : ''}`}
    >
      <span class="inline-flex items-center gap-2">
        ${label}
        <${Icon} icon="navigation/chevron-right" customSize=${16} />
      </span>
    </${Button}>
  `;
};

const BenefitsBox = ({ benefits, chip, chipStyle }) => {
  if (!benefits || benefits.length === 0) return null;
  return html`
    <div
      class="flex flex-col gap-2 rounded-xl border border-dashed border-[#d9d9d9] p-3 w-full"
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
  `;
};

/** Divider dashed full-width, gris del design system. */
const Divider = () => html`<div class="h-px w-full border-t border-dashed border-[#d9d9d9]" aria-hidden="true"></div>`;

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
    isVerticalImage = false,
    chip = null,
    benefits = [],
    seeMoreUrl = '',
    milesPeriod = null,
  } = card;

  // Colores CUSTOM del sheet para los chips de beneficio (fallback #f5f5f5).
  // Si `color_fondo_chip`/`color_texto_chip` vienen del sheet, PISAN el gris
  // por defecto vía estilo inline (configurable por card).
  const chipStyle = {};
  if (chip?.bg) chipStyle.background = chip.bg;
  if (chip?.color) chipStyle.color = chip.color;

  // La línea "Total acumulado" se muestra SIEMPRE que haya label (mantiene el
  // layout del diseño); si `milesPeriod` es null (gate v1: la fuente por-tarjeta
  // del wrapper LM aún no existe) el MilesBlock pinta "—" en vez de esconderse.
  const showMiles = !!milesLabel;
  const showBenefits = benefits.length > 0;
  const showSeeMore = !!seeMoreUrl;
  const seeMoreLabel = labels.cobrandSeeMore || '';

  return html`
    <div
      class=${`bg-white rounded-2xl p-4 md:p-6 w-full ${customClassName}`}
      data-name="cobrand-card"
      data-generic=${card.generic ? 'true' : 'false'}
      ...${rest}
    >
      ${/* ── MOBILE (≤767) ─────────────────────────────────────────────── */ ''}
      <div class="md:hidden flex flex-col gap-4">
        <${CardImage} imageUrl=${imageUrl} name=${name} mobile=${true} vertical=${isVerticalImage} />
        <${NameBlock} name=${name} bank=${bank} />
        ${(showMiles || showBenefits || showSeeMore) && html`<${Divider} />`}
        ${showMiles && html`
          <${MilesBlock} milesLabel=${milesLabel} milesPeriod=${milesPeriod} formatValue=${formatValue} />
          ${(showBenefits || showSeeMore) && html`<${Divider} />`}
        `}
        ${showBenefits && html`
          <${BenefitsBox} benefits=${benefits} chip=${chip} chipStyle=${chipStyle} />
          ${showSeeMore && html`<${Divider} />`}
        `}
        ${showSeeMore && html`
          <${SeeMoreButton} seeMoreUrl=${seeMoreUrl} label=${seeMoreLabel} full=${true} />
        `}
      </div>

      ${/* ── TABLET (768-1023) ─────────────────────────────────────────── */ ''}
      <div class="hidden md:flex lg:hidden flex-col gap-4">
        ${/* Top row: imagen + name/bank */ ''}
        <div class="flex items-center gap-6">
          <${CardImage} imageUrl=${imageUrl} name=${name} vertical=${isVerticalImage} />
          <div class="flex-1 min-w-0">
            <${NameBlock} name=${name} bank=${bank} />
          </div>
        </div>
        ${(showMiles || showSeeMore) && html`<${Divider} />`}
        ${(showMiles || showSeeMore) && html`
          <div class="flex items-center justify-between gap-4">
            ${showMiles
    ? html`<${MilesBlock} milesLabel=${milesLabel} milesPeriod=${milesPeriod} formatValue=${formatValue} />`
    : html`<div></div>`}
            ${showSeeMore && html`
              <${SeeMoreButton} seeMoreUrl=${seeMoreUrl} label=${seeMoreLabel} />
            `}
          </div>
        `}
        ${showBenefits && html`
          <${Divider} />
          <${BenefitsBox} benefits=${benefits} chip=${chip} chipStyle=${chipStyle} />
        `}
      </div>

      ${/* ── DESKTOP (≥1024) ───────────────────────────────────────────── */ ''}
      <div class="hidden lg:flex items-center gap-6">
        <${CardImage} imageUrl=${imageUrl} name=${name} vertical=${isVerticalImage} />
        ${/* Middle column: name, divider, miles, botón */ ''}
        <div class="flex flex-col gap-3 min-w-0 shrink-0 w-[360px]">
          <${NameBlock} name=${name} bank=${bank} />
          ${showMiles && html`
            <${Divider} />
            <${MilesBlock} milesLabel=${milesLabel} milesPeriod=${milesPeriod} formatValue=${formatValue} />
          `}
          ${showSeeMore && html`
            <div class="mt-1">
              <${SeeMoreButton} seeMoreUrl=${seeMoreUrl} label=${seeMoreLabel} />
            </div>
          `}
        </div>
        ${/* Benefits column: ocupa el resto */ ''}
        ${showBenefits && html`
          <div class="flex-1 min-w-0">
            <${BenefitsBox} benefits=${benefits} chip=${chip} chipStyle=${chipStyle} />
          </div>
        `}
      </div>
    </div>
  `;
};

export default CobrandCard;
