import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Modal } from '../modal/modal.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * NewYearStatusModal — modal de "Empiezas un nuevo año" (1271694, decisión A3;
 * Figma 767:83913 desktop / 767:83903 mobile).
 *
 * Reusa el `Modal` base (overlay, Esc, click-fuera, scroll-lock, animación,
 * focus). Layout de 2 paneles: IZQUIERDA gradiente oscuro con cóndor + saludo
 * "Empiezas un nuevo año" + TIER grande (viene del SERVICIO, no de AEM — nota de
 * diseño) + cuerpo + CTA "Ir al perfil"; DERECHA tres tarjetas grises (ícono +
 * texto) + link terciario "Conoce el programa Elite…".
 *
 * GATED: la visibilidad la decide el caller (`cfg.newYearModal.enabled` +
 * `shouldShowNewYearModal` de `new-year-modal.logic.js`). Este componente solo
 * pinta cuando `open` es true.
 *
 * ## Props
 * - `open`: boolean — monta/desmonta (lo pasa el organism).
 * - `onClose`: () => void — cierre (✕ / Esc / click-fuera / CTA). El caller
 *   marca el "visto" del año (`markNewYearModalSeen`).
 * - `tier`: string — nombre del tier del socio (del servicio; ej. "Silver",
 *   "Diamond Cenit One Million").
 * - `year`: number|string — año en curso (interpola `{year}` del item 2).
 * - `labels`: labels i18n (`newYear*`, `getEliteLabelsSync`/`loadEliteLabels`).
 * - `profileUrl`: string — destino de "Ir al perfil".
 * - `tertiaryUrl`: string — destino de "Conoce el programa Elite…" (CF; vacío →
 *   no navega).
 * - `icons`: { item1?, item2?, item3?, condor? } vnodes — overrides de ícono
 *   (AEM). Defaults: autorenew / calendar / lm; cóndor decorativo inline.
 * - `customClassName`: string.
 */

const DARK_GRADIENT = 'linear-gradient(90deg, #393838 0%, #6c6c6c 100%)';

const tpl = (s, params = {}) => String(s || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] != null ? String(params[k]) : m),
);

/** Cóndor decorativo del panel izquierdo (watermark, aria-hidden). */
const DefaultCondor = () => html`
  <svg
    viewBox="0 0 83 93" fill="none" aria-hidden="true"
    class="absolute top-[-6px] right-1 h-[93px] w-[83px] pointer-events-none select-none opacity-40"
    data-name="new-year-modal-condor"
  >
    <path
      d="M84 -5V80H70C58.7 76.5 48.6 70 39.8 61.7H47.7C51 61.7 52.4 62 53.3 62.4C51.9 58 47.5 54.6 32 53.4C16.9 35.9 6.8 13.5 2.7 -5H84Z"
      fill="#ffffff" fill-opacity="0.22"
    />
    <path
      d="M32 53.4C16.9 35.9 6.8 13.5 2.7 -5C2.7 -5 -5.6 2.3 -6.3 17.6C-7 34.4 2 51.3 31.8 53.4Z"
      stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.7"
    />
  </svg>
`;

const InfoCard = ({ icon, text }) => html`
  <div class="flex items-start gap-3 rounded-2xl bg-[#f5f5f5] px-3 py-4" data-name="new-year-info-card">
    <span class="flex items-center justify-center w-5 h-5 shrink-0" aria-hidden="true">${icon}</span>
    <p class="!m-0 flex-1 min-w-0 text-base font-normal leading-normal text-[var(--text-normal-primary)]">${text}</p>
  </div>
`;

export const NewYearStatusModal = ({
  open = false,
  onClose = null,
  tier = '',
  year = new Date().getFullYear(),
  labels = {},
  profileUrl = '',
  tertiaryUrl = '',
  icons = {},
  customClassName = '',
}) => {
  const close = () => { if (onClose) onClose(); };

  const goProfile = () => {
    close();
    if (profileUrl && typeof window !== 'undefined') window.location.assign(profileUrl);
  };

  const item1 = icons.item1 || html`<${Icon} icon="action/autorenew" customSize=${20} color="var(--icon-normal-primary)" />`;
  const item2 = icons.item2 || html`<${Icon} icon="action/calendar" customSize=${20} color="var(--icon-normal-primary)" />`;
  const item3 = icons.item3 || html`<${Icon} icon="members/lm" customSize=${18} color="var(--icon-normal-primary)" />`;
  const condor = icons.condor || html`<${DefaultCondor} />`;

  return html`
    <${Modal}
      isOpen=${open}
      onClose=${close}
      variant="center"
      showCloseButton=${false}
      escapeToClose=${true}
      clickOutsideToClose=${true}
      role="dialog"
      contentClassName=${`w-full sm:w-[90%] !max-w-[766px] !rounded-2xl ${customClassName}`}
    >
      <div
        class="grid grid-cols-1 md:grid-cols-[0.75fr_1fr]"
        data-name="new-year-status-modal"
        data-tier=${tier}
      >
        ${/* Panel izquierdo — gradiente oscuro + cóndor + saludo + tier + CTA */ ''}
        <div
          class="relative flex flex-col justify-end gap-2 p-6 overflow-hidden"
          style=${{ background: DARK_GRADIENT }}
        >
          ${condor}
          <div class="relative z-10 flex flex-col">
            <span class="!m-0 text-2xl font-normal leading-normal text-white">${labels.newYearTitle || 'Empiezas un nuevo año'}</span>
            ${tier && html`<span class="!m-0 text-[32px] font-semibold leading-normal text-white">${tier}</span>`}
          </div>
          <div class="relative z-10 flex flex-col gap-10 pb-8">
            <p class="!m-0 text-base font-normal leading-normal text-white">${labels.newYearBody || ''}</p>
            <button
              type="button"
              onClick=${goProfile}
              class="inline-flex items-center justify-center self-start h-8 px-[18px] rounded-full border-2 border-[#fafafa] bg-[#fafafa] cursor-pointer"
            >
              <span class="!m-0 text-sm font-bold leading-normal text-[var(--text-normal-primary)]">${labels.newYearCta || 'Ir al perfil'}</span>
            </button>
          </div>
        </div>

        ${/* Panel derecho — ✕ + 3 tarjetas + link terciario */ ''}
        <div class="flex flex-col gap-3 px-6 py-6">
          <div class="flex justify-end">
            <button
              type="button"
              onClick=${close}
              aria-label=${labels.newYearCloseLabel || 'Cerrar'}
              data-modal-close="true"
              class="inline-flex items-center justify-center w-6 h-6 cursor-pointer text-[var(--icon-normal-primary)]"
            >
              <${Icon} icon="navigation/close" customSize=${24} color="var(--icon-normal-primary)" />
            </button>
          </div>
          <${InfoCard} icon=${item1} text=${labels.newYearItem1 || ''} />
          <${InfoCard} icon=${item2} text=${tpl(labels.newYearItem2 || '', { year })} />
          <${InfoCard} icon=${item3} text=${labels.newYearItem3 || ''} />
          <a
            href=${tertiaryUrl || null}
            onClick=${close}
            class=${`inline-flex items-center justify-center gap-0.5 pt-1 text-sm font-normal leading-normal text-[var(--text-link-default)] ${tertiaryUrl ? '' : 'pointer-events-none'}`}
          >
            <span>${labels.newYearTertiary || ''}</span>
            <${Icon} icon="open_in_new" customSize=${16} color="var(--text-link-default)" />
          </a>
        </div>
      </div>
    </${Modal}>
  `;
};

export default NewYearStatusModal;
