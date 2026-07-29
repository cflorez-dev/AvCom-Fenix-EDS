import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Icon } from '../icon/icon.js';

const html = htm.bind(h);

/**
 * StatusProfileChip — badge de completitud del kit "Gestión de cuenta" (1279360).
 * Figma `1056:120384`. Dos variantes:
 *  - `incomplete`: pill (radio 8) bg `var(--bg-accent-warning)`, texto + ícono
 *    `var(--text-accent-warning)`, texto 14px, ícono `alert/Error` 16px.
 *  - `complete`: SOLO el ícono check `alert/check_circle` 20px color
 *    `var(--icon-accent-positive)` (sin pill, sin texto).
 *
 * Átomo nuevo (NO se extiende `Chip`: `chip.js:44` es `rounded-[1rem]` h-24
 * text-xs y no matchea el spec → átomo aparte evita regresiones en el Chip).
 *
 * El texto real lo pasa el consumidor por i18n (`label`); el default está solo
 * como fallback de showcase.
 *
 * ## Props
 * @param {Object} props
 * @param {'incomplete'|'complete'} [props.variant='incomplete'] - variante.
 * @param {string} [props.label='Información incompleta'] - texto (solo `incomplete`).
 * @param {string} [props.customClassName=''] - clases extra.
 * @param {Object} [props.rest] - otras props válidas.
 */
export const StatusProfileChip = ({
  variant = 'incomplete',
  label = 'Información incompleta',
  customClassName = '',
  ...rest
}) => {
  if (variant === 'complete') {
    return html`
      <span
        class=${`inline-flex items-center ${customClassName}`.trim()}
        data-name="status-profile-chip"
        data-variant="complete"
        ...${rest}
      >
        <${Icon} icon="alert/check_circle" customSize=${20} color="var(--icon-accent-positive)" ariaLabel=${label || null} />
      </span>
    `;
  }

  return html`
    <span
      class=${`inline-flex items-center gap-1 rounded-[8px] px-2 py-1 bg-[var(--bg-accent-warning)] text-[var(--text-accent-warning)] ${customClassName}`.trim()}
      data-name="status-profile-chip"
      data-variant="incomplete"
      ...${rest}
    >
      <${Icon} icon="alert/Error" customSize=${16} color="var(--icon-accent-warning)" />
      <span class="text-sm leading-tight font-normal">${label}</span>
    </span>
  `;
};

export default StatusProfileChip;
