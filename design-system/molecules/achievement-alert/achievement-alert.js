import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { getEliteTierTokens } from '../../helpers/members-tier-theme.js';
import { sanitizeHTMLAsync } from '../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * AchievementAlert — banner dismissible de logro del tab Progreso elite
 * (1271699, AC bloques 7-8; §B: "Update de estatus" / alertas Cenit 1M/2M /
 * "cumpliste meta para mantener").
 *
 * Fondo = gradiente SUTIL del tier (`colorGradientSubtleStart/End`, tokens
 * Fase 1b vía `getEliteTierTokens`) + cóndor decorativo line-art a la
 * IZQUIERDA (stroke = gradiente STRONG del tier — exhibit 765-52263) + título
 * COLOREADO con el token del tier + body + X de cierre.
 *
 * Seguridad: el body puede venir RICH del CF/i18n → si trae HTML se sanitiza
 * con `sanitizeHTMLAsync` (whitelist DOMPurify del repo) ANTES de inyectarse;
 * nunca `innerHTML` crudo. Texto plano va por `body` (sin innerHTML).
 *
 * La PERSISTENCIA del dismiss NO vive acá: el host la maneja con
 * `alert-persistence.js` vía `onDismiss` (T10, flag `alertsPersistDismiss`).
 *
 * ## Props
 * - `tier`: string — tier para el theming (gradiente sutil + cóndor).
 * - `title`: string — título (editable AEM).
 * - `body`: string — descripción en TEXTO PLANO (preferida).
 * - `bodyHTML`: string — descripción RICH (HTML del CF) → sanitizada async.
 * - `onDismiss`: () => void — callback al cerrar (el host persiste).
 * - `dismissAriaLabel`: string — label accesible de la X. Default 'Cerrar'.
 * - `cfTiers`: dict de tiers del CF (override de tokens).
 * - `customClassName`: string.
 */
const AlertCondor = ({ tierKey, strokeFrom, strokeTo }) => {
  const strokeId = `achievement-alert-condor-${tierKey}-stroke`;
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 224 200"
      fill="none"
      aria-hidden="true"
      class="absolute top-0 left-0 h-full w-auto pointer-events-none select-none -scale-x-100"
      data-name="achievement-alert-condor"
    >
      <path
        d="M137.23 156.059C145.501 156.059 149.167 156.743 151.474 157.786C147.934 146.798 136.777 138.232 97.4587 135.293C103.738 142.563 110.333 149.527 117.287 156.059H137.23Z"
        stroke=${`url(#${strokeId})`}
        stroke-width="1.09228"
      />
      <path
        d="M97.4589 135.304C59.2993 90.9597 33.5927 34.226 23.2889 -13.0469C23.2889 -13.0469 2.31274 5.45348 0.648127 44.3611C-1.19559 86.8824 21.6137 129.751 96.732 135.219C96.9743 135.261 97.2271 135.262 97.4589 135.293V135.304Z"
        stroke=${`url(#${strokeId})`}
        stroke-width="1.09228"
      />
      <path
        d="M117.286 156.058C87.6702 156.058 36.5414 156.058 36.5414 156.058C37.616 158.566 41.314 160.325 49.7319 160.82C100.134 163.812 107.266 203.363 179.403 203.363C185.735 203.363 189.686 202.983 193.679 202.235C165.17 193.47 139.568 176.992 117.286 156.048V156.058Z"
        stroke=${`url(#${strokeId})`}
        stroke-width="1.09228"
      />
      <defs>
        <linearGradient id=${strokeId} x1="8.82968" y1="69.2845" x2="164.2" y2="208.808" gradientUnits="userSpaceOnUse">
          <stop stop-color=${strokeFrom} />
          <stop offset="1" stop-color=${strokeTo} />
        </linearGradient>
      </defs>
    </svg>
  `;
};

export const AchievementAlert = ({
  tier = '',
  title = '',
  body = '',
  bodyHTML = '',
  onDismiss = null,
  dismissAriaLabel = 'Cerrar',
  cfTiers = {},
  customClassName = '',
  ...rest
}) => {
  const [visible, setVisible] = useState(true);
  const [safeBodyHTML, setSafeBodyHTML] = useState('');

  // Body rich del CF → sanitizado ANTES de renderizarse (whitelist del repo).
  useEffect(() => {
    let alive = true;
    if (bodyHTML) {
      sanitizeHTMLAsync(bodyHTML).then((clean) => { if (alive) setSafeBodyHTML(clean); });
    } else {
      setSafeBodyHTML('');
    }
    return () => { alive = false; };
  }, [bodyHTML]);

  if (!visible) return null;

  const tokens = getEliteTierTokens(tier, cfTiers);
  const background = (tokens.gradientSubtleFrom && tokens.gradientSubtleTo)
    ? `linear-gradient(90deg, ${tokens.gradientSubtleFrom} 0%, ${tokens.gradientSubtleTo} 100%)`
    : '#f5f5f5';

  const handleDismiss = () => {
    setVisible(false);
    if (typeof onDismiss === 'function') onDismiss();
  };

  return html`
    <aside
      class=${`relative overflow-hidden rounded-2xl py-3 px-4 ${customClassName}`}
      style=${{ background }}
      role="status"
      aria-live="polite"
      data-name="achievement-alert"
      data-tier=${tokens.key}
      ...${rest}
    >
      <${AlertCondor}
        tierKey=${tokens.key}
        strokeFrom=${tokens.gradientStrongFrom}
        strokeTo=${tokens.gradientStrongTo}
      />
      <div class="relative flex items-start gap-3 pl-16 md:pl-24 pr-10">
        <div class="flex flex-col gap-0.5 min-w-0">
          <span class="text-[14px] font-bold leading-[19px]" style=${{ color: tokens.overlay }}>${title}</span>
          ${safeBodyHTML ? html`
            <span
              class="text-[14px] font-normal leading-[19px] text-[#1b1b1b]"
              dangerouslySetInnerHTML=${{ __html: safeBodyHTML }}
            ></span>
          ` : (body && html`
            <span class="text-[14px] font-normal leading-[19px] text-[#1b1b1b]">${body}</span>
          `)}
        </div>
      </div>
      <button
        type="button"
        onClick=${handleDismiss}
        aria-label=${dismissAriaLabel}
        class="absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center w-6 h-6 rounded-full text-[#1b1b1b] hover:bg-black/5 focus-visible:outline focus-visible:outline-2"
        data-name="achievement-alert-dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" class="block" aria-hidden="true">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12.6663 4.27398L11.7263 3.33398L7.99967 7.06065L4.27301 3.33398L3.33301 4.27398L7.05967 8.00065L3.33301 11.7273L4.27301 12.6673L7.99967 8.94065L11.7263 12.6673L12.6663 11.7273L8.93967 8.00065L12.6663 4.27398Z" fill="currentColor" />
        </svg>
      </button>
    </aside>
  `;
};

export default AchievementAlert;
