import { h } from '@dropins/tools/preact.js';
import { useRef, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { FabBoltIcon } from '../../atoms/floating-action-button/floating-action-button.js';
import { Button } from '../../atoms/button/button.js';

const html = htm.bind(h);

/**
 * AcceleratorTooltip — tooltip del FAB de gamificación (1271694, AC bloque
 * 10.1; specs §B parte d: panel 300×147, borde 2px del color del tier, CTA
 * full-width, × arriba a la derecha).
 *
 * Posicionamiento: recibe `anchorPct` (0-100, el % de avance donde está el
 * FAB) y se ubica ABSOLUTO sobre la barra, CLAMPEADO al width del contenedor
 * (nota §B: se desplaza con el FAB pero SIEMPRE dentro del recorrido de la
 * barra — nunca recortado en los extremos). El contenedor padre debe ser
 * `position: relative`.
 *
 * Cierres (AC): × · click FUERA (listener en document con cleanup) · Esc —
 * todos SIN navegar. Al abrir, el foco va al CTA.
 *
 * ## Props
 * - `open`: boolean — false → no renderiza.
 * - `anchorPct`: number 0-100 — posición del FAB sobre la barra.
 * - `borderColor`: string CSS — `gradientStrongFrom` del tier del socio
 *   (lo pasa el caller con `getEliteTierTokens`).
 * - `title`: string — header (ícono rayo + título, i18n/CF).
 * - `body`: string — texto descriptivo (i18n/CF).
 * - `ctaLabel`: string — etiqueta del CTA.
 * - `ctaUrl`: string — URL de redirección; VACÍA (POS sin autoría) → el CTA
 *   no navega (cierra el tooltip).
 * - `onClose`: () => void.
 * - `closeAriaLabel`: string — label de la ×. Default 'Cerrar'.
 * - `customClassName`: string.
 */
export const AcceleratorTooltip = ({
  open = false,
  anchorPct = 0,
  borderColor = '#1b1b1b',
  title = '',
  body = '',
  ctaLabel = '',
  ctaUrl = '',
  onClose = null,
  closeAriaLabel = 'Cerrar',
  customClassName = '',
  ...rest
}) => {
  const panelRef = useRef(null);
  const ctaRef = useRef(null);

  // Cierre por click FUERA + Esc (con cleanup); foco al CTA al abrir (AC).
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        if (onClose) onClose();
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    // En el próximo tick: el click que ABRIÓ el tooltip no debe cerrarlo.
    const timer = setTimeout(() => {
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKeyDown);
    }, 0);
    // Foco al CTA (el Button no reenvía refs → se busca el focusable real).
    const ctaEl = ctaRef.current && ctaRef.current.querySelector('a, button');
    if (ctaEl && typeof ctaEl.focus === 'function') ctaEl.focus();
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const pct = Math.max(0, Math.min(100, Number(anchorPct) || 0));

  return html`
    <div
      ref=${panelRef}
      role="dialog"
      aria-label=${title || undefined}
      class=${`absolute bottom-full mb-3 z-20 w-[300px] min-h-[147px] bg-white rounded-xl
        px-4 py-3 flex flex-col gap-2 shadow-[0_4px_16px_rgba(27,27,27,0.2)] ${customClassName}`}
      style=${{
    border: `2px solid ${borderColor}`,
    // Clamp al contenedor: centrado en el anchor, sin salirse por los extremos.
    // Prefiere `var(--progress-fill-pct)` (posici\u00f3n REAL medida por
    // `MembersProgressBar` en modo 'spread' \u2014 vista completa \u2014 donde los
    // dots ya no son equidistantes); fallback al `anchorPct` prop para
    // consumidores fuera de una barra con la var (samples, 'anchored').
    left: `clamp(0px, calc(var(--progress-fill-pct, ${pct}%) - 150px), calc(100% - 300px))`,
  }}
      data-name="accelerator-tooltip"
      ...${rest}
    >
      <div class="flex items-center gap-2 pr-8">
        <span class="shrink-0 w-6 h-6" aria-hidden="true"><${FabBoltIcon} /></span>
        <span class="text-base font-bold leading-normal text-[#1b1b1b]">${title}</span>
      </div>
      ${body && html`
        <span class="text-[14px] font-normal leading-[19px] text-[#494949]">${body}</span>
      `}
      <span ref=${ctaRef} class="block w-full mt-auto" data-name="accelerator-tooltip-cta">
        <${Button}
          variant="primary"
          size="sm"
          href=${ctaUrl || undefined}
          onClick=${ctaUrl ? undefined : onClose}
          customClassName="w-full justify-center"
        >
          ${ctaLabel}
        </${Button}>
      </span>
      <button
        type="button"
        onClick=${onClose}
        aria-label=${closeAriaLabel}
        class="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full text-[#1b1b1b] hover:bg-black/5 focus-visible:outline focus-visible:outline-2"
        data-name="accelerator-tooltip-close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" class="block" aria-hidden="true">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12.6663 4.27398L11.7263 3.33398L7.99967 7.06065L4.27301 3.33398L3.33301 4.27398L7.05967 8.00065L3.33301 11.7273L4.27301 12.6673L7.99967 8.94065L11.7263 12.6673L12.6663 11.7273L8.93967 8.00065L12.6663 4.27398Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  `;
};

export default AcceleratorTooltip;
