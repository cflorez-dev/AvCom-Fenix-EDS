import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { CobrandCard } from './cobrand-card.js';
import { CarouselNavigationButton } from '../../atoms/carousel-navigation-button/carousel-navigation-button.js';
import { ActionButton } from '../../atoms/action-button/action-button.js';

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
 * (ActionButton; texto/URL/visibilidad del sheet por POS — `vm.actions` del
 * cobrand.service; sin sheet → labels default de i18n). Inline en desktop,
 * apiladas en mobile. Ocultables por POS (columnas `accion_*`).
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

const PlusIcon = () => html`
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-4 h-4">
    <path d="M8 3.3v9.4M3.3 8h9.4" stroke="#1b1b1b" stroke-width="1.6" stroke-linecap="round" />
  </svg>
`;

const CardPlusIcon = () => html`
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-4 h-4">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="#1b1b1b" stroke-width="1.4" />
    <path d="M1.5 6.5h13" stroke="#1b1b1b" stroke-width="1.4" />
  </svg>
`;

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
        <div class="flex flex-col gap-3 md:flex-row md:gap-4" data-name="cobrand-slider-actions">
          ${showAdd && html`
            <${ActionButton}
              icon=${html`<${PlusIcon} />`}
              label=${addLabel}
              href=${(actions && actions.addUrl) || undefined}
            />
          `}
          ${showRequest && html`
            <${ActionButton}
              icon=${html`<${CardPlusIcon} />`}
              label=${requestLabel}
              href=${(actions && actions.requestUrl) || undefined}
            />
          `}
        </div>
      `}
    </div>
  `;
};

export default CobrandSlider;
