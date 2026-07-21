import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * LmPlusBanner — banner "Suscríbete a Lifemiles Plus" (1271694; §D casos
 * especiales 765-41707/765-41907: reemplaza a la sección PlanCard ENTERA —
 * incluido título — cuando el socio no tiene plan).
 *
 * Fondo con el gradiente púrpura de LM+ + imagen opcional (DAM configurable)
 * + título + body + CTA blanco "Suscríbete ya".
 *
 * ## Props
 * - `labels`: i18n (`lmPlusBannerTitle`, `lmPlusBannerBody`, `lmPlusBannerCta`).
 * - `ctaUrl`: string — destino del CTA (configurable).
 * - `imageUrl`: string — imagen decorativa del DAM (opcional).
 * - `customClassName`: string.
 */
const PURPLE_GRADIENT = 'linear-gradient(98deg, #5303B6 30.5%, #9810FA 101%)';

export const LmPlusBanner = ({
  labels = {},
  ctaUrl = '',
  imageUrl = '',
  customClassName = '',
  ...rest
}) => html`
  <div
    class=${`rounded-2xl px-4 py-5 md:px-6 flex flex-col md:flex-row md:items-center gap-4 w-full max-w-[1248px] overflow-hidden ${customClassName}`}
    style=${{ background: PURPLE_GRADIENT }}
    data-name="lm-plus-banner"
    ...${rest}
  >
    ${imageUrl && html`
      <img
        src=${imageUrl}
        alt=""
        class="w-[96px] h-[96px] object-contain shrink-0 self-center"
        loading="lazy"
        aria-hidden="true"
      />
    `}
    <div class="flex flex-col gap-1 flex-1 min-w-0">
      <span class="text-lg font-bold leading-normal text-white">${labels.lmPlusBannerTitle || ''}</span>
      ${labels.lmPlusBannerBody && html`
        <span class="text-[14px] font-normal leading-[19px] text-white/90">${labels.lmPlusBannerBody}</span>
      `}
    </div>
    <div class="shrink-0">
      <${Button}
        variant="secondary"
        size="sm"
        href=${ctaUrl || undefined}
        customClassName="whitespace-nowrap"
      >
        ${labels.lmPlusBannerCta || ''}
      </${Button}>
    </div>
  </div>
`;

export default LmPlusBanner;
