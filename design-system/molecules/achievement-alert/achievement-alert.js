import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { getEliteTierTokens } from '../../helpers/members-tier-theme.js';
import { sanitizeHTMLAsync } from '../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * AchievementAlert — banner dismissible de logro del tab Progreso elite
 * (1271699, AC bloques 7-8; §B: "Update de estatus" / alertas Cenit 1M/2M /
 * "cumpliste meta para mantener"). Diseño "GoalHeader" (Figma 765:52308-52342,
 * 2026-07-24): banner compacto con vector line-art del tier a la izquierda
 * (81×91), gradiente sutil de fondo, título coloreado con el `overlay` del
 * tier, body en `#1b1b1b`, dismiss 24×24 con ícono 16×16 alineado al centro.
 *
 * Fondo = gradiente SUTIL del tier (`colorGradientSubtleStart/End`, tokens
 * Fase 1b vía `getEliteTierTokens`) + vector decorativo line-art a la IZQUIERDA
 * (stroke = gradiente STRONG del tier) + título COLOREADO con el `overlay` del
 * tier + body + X de cierre. Sombra `shadow/medium @ 0.1` (Figma).
 *
 * Seguridad: el body puede venir RICH del CF/i18n → si trae HTML se sanitiza
 * con `sanitizeHTMLAsync` (whitelist DOMPurify del repo) ANTES de inyectarse;
 * nunca `innerHTML` crudo. Texto plano va por `body` (sin innerHTML).
 *
 * La PERSISTENCIA del dismiss NO vive acá: el host la maneja con
 * `alert-persistence.js` vía `onDismiss` (T10, flag `alertsPersistDismiss`).
 *
 * ## Props
 * - `tier`: string — tier para el theming (gradiente sutil + vector).
 * - `title`: string — título (editable AEM).
 * - `body`: string — descripción en TEXTO PLANO (preferida).
 * - `bodyHTML`: string — descripción RICH (HTML del CF) → sanitizada async.
 * - `onDismiss`: () => void — callback al cerrar (el host persiste).
 * - `dismissAriaLabel`: string — label accesible de la X. Default 'Cerrar'.
 * - `cfTiers`: dict de tiers del CF (override de tokens).
 * - `customClassName`: string.
 */
// Vector decorativo (Figma 765:52308+ · viewBox 81.5178 × 92.1515). Mismas 3
// paths por tier — el color viene del stroke con `gradientStrongFrom/To` del
// token del tier (Red Plus rojo, Silver gris, Gold ocre, Diamond negro, Magno
// carbón). Se posiciona ABSOLUTE dentro del banner (padding-left 88 le deja
// hueco), sale del contenedor 6px a la izquierda y 14px arriba (Figma).
const AlertVector = ({ tierKey, strokeFrom, strokeTo }) => {
  const gradId = `achievement-alert-vec-${tierKey}`;
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 81.5178 92.1515"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
      class="absolute h-[91px] w-[81px] left-[-6px] top-[-14px] pointer-events-none select-none"
      data-name="achievement-alert-vector"
    >
      <g>
        <path
          d="M57.7255 71.8601C61.1941 71.8601 62.7318 72.1481 63.6995 72.5867C62.2148 67.966 57.5355 64.3643 41.0453 63.1283C43.6787 66.1851 46.4448 69.1134 49.3611 71.8601H57.7255Z"
          stroke=${`url(#${gradId})`}
          stroke-width="0.8"
        />
        <path
          d="M41.0453 63.1327C25.0411 44.4861 14.2597 20.6296 9.93835 0.751471C9.93835 0.751471 1.14091 8.53085 0.442766 24.8915C-0.330491 42.7716 9.23577 60.798 40.7404 63.0973C40.8421 63.115 40.9481 63.115 41.0453 63.1283V63.1327Z"
          stroke=${`url(#${gradId})`}
          stroke-width="0.8"
        />
        <path
          d="M49.3607 71.86C36.9399 71.86 15.4964 71.86 15.4964 71.86C15.9471 72.9144 17.4981 73.6542 21.0285 73.8624C42.1672 75.1206 45.1586 91.7515 75.4128 91.7515C78.0684 91.7515 79.7253 91.592 81.4 91.2774C69.4432 87.5915 58.706 80.6628 49.3607 71.8556V71.86Z"
          stroke=${`url(#${gradId})`}
          stroke-width="0.8"
        />
      </g>
      <defs>
        <linearGradient id=${gradId} x1="0.399982" y1="46.2515" x2="81.4" y2="46.2515" gradientUnits="userSpaceOnUse">
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
      class=${`relative overflow-hidden flex items-start gap-2 pl-[88px] pr-4 py-4 rounded-[8px] shadow-[0px_2px_20px_2px_rgba(73,73,73,0.1)] ${customClassName}`}
      style=${{ background }}
      role="status"
      aria-live="polite"
      data-name="achievement-alert"
      data-tier=${tokens.key}
      ...${rest}
    >
      <${AlertVector}
        tierKey=${tokens.key}
        strokeFrom=${tokens.gradientStrongFrom}
        strokeTo=${tokens.gradientStrongTo}
      />
      <div class="relative flex flex-col gap-1 min-w-0 flex-1">
        <span class="text-[14px] font-bold leading-normal" style=${{ color: tokens.overlay }}>${title}</span>
        ${safeBodyHTML ? html`
          <span
            class="text-[14px] font-normal leading-normal text-[#1b1b1b]"
            dangerouslySetInnerHTML=${{ __html: safeBodyHTML }}
          ></span>
        ` : (body && html`
          <span class="text-[14px] font-normal leading-normal text-[#1b1b1b]">${body}</span>
        `)}
      </div>
      <button
        type="button"
        onClick=${handleDismiss}
        aria-label=${dismissAriaLabel}
        class="relative shrink-0 flex items-center justify-center w-6 h-6 rounded-xl text-[#1b1b1b] hover:bg-black/5 focus-visible:outline focus-visible:outline-2"
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
