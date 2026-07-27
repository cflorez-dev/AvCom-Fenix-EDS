import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { CobrandCard } from './cobrand-card.js';
import { CarouselNavigationButton } from '../../atoms/carousel-navigation-button/carousel-navigation-button.js';

const html = htm.bind(h);

/**
 * CobrandSlider — slider de tarjetas cobrand + acciones de gestión (1271694,
 * AC bloque 10.2; exhibits 819-32732: casos "1 Co-brand" y "+1 Co-brand").
 *
 * Stepper de UNA CobrandCard por slide con paginación "N de M" + flechas
 * prev/next (átomo CarouselNavigationButton — "las flechas del Carousel" —
 * con estado disabled en los extremos, sin loop). **Con 1 sola tarjeta la
 * paginación y las flechas se OCULTAN** (§D). El mock ubica la paginación
 * bajo la tarjeta.
 *
 * Debajo: acciones "+ Agregar tarjeta" / "Solicitar nueva tarjeta"
 * (shortcut button pill del Figma 819:33267 / 819:33279 / 819:33292 — pill
 * blanco rounded-32, sombra `shadows/small`, ícono 16 + label 14 Bold
 * centrados con gap-8; texto/URL/visibilidad del sheet por POS —
 * `vm.actions` del cobrand.service; sin sheet → labels default de i18n).
 * Alturas: **44** mobile+tablet (0-1023) / **32** desktop (≥1024). Full-width
 * apiladas en mobile (gap-16); desde 768px pasan a fila con **ancho por
 * contenido** (`md:w-auto`, hug content) separadas por gap-16.
 *
 * ## Props
 * - `cards`: cards del VM (`buildCobrandVM().cards`).
 * - `actions`: acciones del VM (`buildCobrandVM().actions`) o null → defaults.
 * - `labels`: i18n (`cobrandPagination` "{n} de {m}", `cobrandAdd`,
 *   `cobrandRequest`, `cobrandSeeMore`).
 * - `milesLabel`: string — label de millas ya interpolado (pasa a cada card).
 * - `customClassName`: string.
 */
const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

// Íconos inline (16px). Figma 819:33267 muestra un `+` fino stroke y una
// tarjeta de crédito sólida. Se dejan como SVG local (no hay equivalente
// exacto en `/icons/`) para pintar con `currentColor` y garantizar 16×16.
const PlusIcon = () => html`
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-4 h-4">
    <path d="M8 2.7v10.6M2.7 8h10.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  </svg>
`;

const CardIcon = () => html`
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="w-4 h-4">
    <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h9A1.5 1.5 0 0 1 14 4.5V6H2V4.5ZM2 7.5h12v4A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5v-4Z" />
  </svg>
`;

/**
 * ShortcutButton — pill blanco 44×full con sombra `shadows/small`, ícono 16 +
 * label 14 Bold centrados. Espejo directo del componente Figma 819:33267
 * `shortcutButton`. Renderiza `<a>` cuando recibe `href`, `<button>` en caso
 * contrario.
 */
const ShortcutButton = ({
  icon, label, href, dataName,
}) => {
  // `!no-underline` fuerza a saltarse la regla global de `<a>` dentro de
  // secciones de contenido AEM que aplica `text-decoration: underline`.
  // Mobile ≤767 → `w-full h-44` (Figma 819:33267). Tablet 768-1023 → `w-auto
  // h-44` (Figma 819:33279). Desktop ≥1024 → `w-auto h-32` (Figma 819:33292).
  const cls = 'group inline-flex items-center justify-center gap-2 h-[44px] lg:h-[32px] w-full md:w-auto px-4 rounded-[32px] bg-[var(--bg-card-lighter)] text-[var(--text-normal-primary)] shadow-[0px_0px_3px_0px_rgba(90,90,90,0.2)] !no-underline transition-shadow hover:shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-primary)] cursor-pointer';
  const content = html`
    <span class="inline-flex items-center justify-center w-4 h-4 shrink-0" aria-hidden="true">${icon}</span>
    <span class="!text-[14px] !leading-normal !font-bold">${label}</span>
  `;
  if (href) {
    return html`<a href=${href} class=${cls} data-name=${dataName}>${content}</a>`;
  }
  return html`<button type="button" class=${cls} data-name=${dataName}>${content}</button>`;
};

export const CobrandSlider = ({
  cards = [],
  actions = null,
  labels = {},
  milesLabel = '',
  customClassName = '',
  ...rest
}) => {
  const [index, setIndex] = useState(0);
  const list = Array.isArray(cards) ? cards : [];
  if (!list.length) return null;

  const total = list.length;
  const current = Math.max(0, Math.min(index, total - 1));
  const showPagination = total > 1; // 1 sola tarjeta → sin paginación ni flechas

  const showAdd = actions ? actions.add !== false : true;
  const showRequest = actions ? actions.request !== false : true;
  const addLabel = (actions && actions.addLabel) || labels.cobrandAdd || '';
  const requestLabel = (actions && actions.requestLabel) || labels.cobrandRequest || '';

  return html`
    <div
      class=${`flex flex-col gap-4 w-full max-w-[1248px] ${customClassName}`}
      data-name="cobrand-slider"
      data-total=${total}
      ...${rest}
    >
      <${CobrandCard}
        card=${list[current]}
        labels=${labels}
        milesLabel=${milesLabel}
      />

      ${showPagination && html`
        <div class="flex items-center justify-center gap-4" data-name="cobrand-slider-pagination">
          <${CarouselNavigationButton}
            direction="left"
            absolute=${false}
            disabled=${current === 0}
            onClick=${() => setIndex((i) => Math.max(0, i - 1))}
          />
          <span class="text-[14px] font-normal leading-[19px] text-[#1b1b1b] tabular-nums" aria-live="polite">
            ${tpl(labels.cobrandPagination, { n: current + 1, m: total })}
          </span>
          <${CarouselNavigationButton}
            direction="right"
            absolute=${false}
            disabled=${current === total - 1}
            onClick=${() => setIndex((i) => Math.min(total - 1, i + 1))}
          />
        </div>
      `}

      ${(showAdd || showRequest) && html`
        <div class="flex flex-col gap-4 md:flex-row md:gap-4" data-name="cobrand-slider-actions">
          ${showAdd && html`
            <${ShortcutButton}
              icon=${html`<${PlusIcon} />`}
              label=${addLabel}
              href=${(actions && actions.addUrl) || undefined}
              dataName="cobrand-slider-add"
            />
          `}
          ${showRequest && html`
            <${ShortcutButton}
              icon=${html`<${CardIcon} />`}
              label=${requestLabel}
              href=${(actions && actions.requestUrl) || undefined}
              dataName="cobrand-slider-request"
            />
          `}
        </div>
      `}
    </div>
  `;
};

export default CobrandSlider;
