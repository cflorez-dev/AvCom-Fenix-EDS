import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * MembersDataPair — par "label + value" del grid de datos del hero (1263924).
 * Figma 518:27631 / 518:23344 ("Tienes / 18.056 millas", "Estatus Lifemiles /
 * Silver — Vence: Ene 30, 2026").
 *
 * Tipografía FIJA (nota Figma 518:22530): `label`/`sublabel` = Static2 (14px) y
 * `value` = Static1 (16px) bold — NO escalan en ningún viewport. Por eso usa
 * tamaños fijos (`text-sm`/`text-base`) sin variantes responsive, y `<span>`
 * (no `<p>`) para evitar el `clamp()` global del sitio que pisaría el tamaño.
 *
 * El FORMATEO del value (millas con separador de miles por locale, fechas) lo
 * hace el CALLER (P3): el átomo solo pinta strings ya formateados.
 *
 * ## Props
 * - `label`: string — etiqueta (Static2). Ej. "Tienes", "Estatus Lifemiles".
 * - `value`: string — valor ya formateado (Static1 bold). Ej. "18.056 millas".
 * - `sublabel`: string — línea secundaria opcional (Static2). Ej. "Vence: Ene 30, 2026".
 * - `tone`: 'light'|'dark' — paleta. 'light' (default) = sobre gradient oscuro
 *   (label + value blancos, sublabel #d9d9d9; el contraste lo da el TAMAÑO, no el
 *   color — comp 518:27631). 'dark' = sobre card blanca (label gris, value oscuro).
 * - `valueSize`: 'base'|'lg' — 'lg' (h5, 20px SemiBold — valores del grid del hero)
 *   o 'base' (16px Bold — otros usos). Default 'base'.
 * - `valueId`: string — id opcional del value (para `aria-describedby`/tests).
 * - `customClassName`: string — clases extra del root.
 */
const TONE = {
  light: { label: 'text-white', value: 'text-white', sub: 'text-[#d9d9d9]' },
  dark: { label: 'text-[#5a5a5a]', value: 'text-[#1b1b1b]', sub: 'text-[#5a5a5a]' },
};

const VALUE_SIZE = {
  // Static1 Bold: 16px / 21px FIJOS (spec Figma 518:22530). Se usa notación
  // arbitraria con `!` para blindar contra el `clamp()` global del sitio que
  // podría pisar `text-base`/`leading-*` con valores fluidos.
  base: '!text-[16px] !leading-[21px] font-bold',
  // Responsive:
  //  - `<640px`  → Static1 Bold 16/21 (balance mobile, Figma 617:44589).
  //  - `≥640px`  → 18/24 SemiBold (tablet, Figma 518:24090 escala intermedia).
  //  - `≥1024px` → h5 20/26 SemiBold (desktop lg, Figma 518:23344).
  // `!` para blindar del `clamp()` global. Los callers de `members-data-grid`
  // pasan `lg` fijo porque el switch por breakpoint lo resuelve este átomo.
  lg: '!text-[16px] !leading-[21px] font-bold min-[640px]:!text-[18px] min-[640px]:!leading-[24px] min-[640px]:font-semibold lg:!text-[20px] lg:!leading-[26px]',
};

export const MembersDataPair = ({
  label = '',
  value = '',
  sublabel = '',
  tone = 'light',
  valueSize = 'base',
  valueId = null,
  customClassName = '',
  ...rest
}) => {
  const t = TONE[tone] || TONE.light;
  const valueClass = VALUE_SIZE[valueSize] || VALUE_SIZE.base;
  return html`
    <div
      class=${`flex flex-col gap-0.5 min-w-0 ${customClassName}`}
      data-name="members-data-pair"
      ...${rest}
    >
      ${label && html`
        <span class=${`text-sm font-normal leading-[19px] antialiased ${t.label}`}>${label}</span>
      `}
      <span
        id=${valueId || undefined}
        class=${`${valueClass} ${t.value}`}
      >${value}</span>
      ${sublabel && html`
        <span class=${`text-sm font-normal leading-[19px] antialiased ${t.sub}`}>${sublabel}</span>
      `}
    </div>
  `;
};

export default MembersDataPair;
