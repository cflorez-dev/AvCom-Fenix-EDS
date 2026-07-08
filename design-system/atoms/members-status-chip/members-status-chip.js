import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Icon } from '../icon/icon.js';

const html = htm.bind(h);

/**
 * MembersStatusChip — chip de estatus por card Members (1263924, Sub B). Figma
 * 518:25754 / 518:25758 / 518:25748. Átomo NUEVO (no variante del `chip`: aquél usa
 * radio uniforme y no tiene estados success/warning — ver plan §3.4).
 *
 * Shape: ícono (16px) + texto bold (Static2/14, no escala), `pl-8 pr-12 py-4`, ancho
 * HUG (crece a la izquierda). **Radio asimétrico:** TL/TR/BL = 16, **BR = 0** (esquina
 * cuadrada para anclar al borde superior-derecho de la card).
 *
 * El POSICIONAMIENTO absoluto (`top:2px; right:0`) lo aplica la CARD contenedora — el
 * átomo solo expone el shape (plan §5). `status=null` → no renderiza (toggle por card).
 *
 * Estados:
 *  - `complete`  → "Perfil completo"  (bg `#d9fdd2`, texto `#107f28`, ícono alert/success)
 *  - `incomplete`→ "Perfil incompleto" (bg `#fff3e0`, texto `#88431c`, ícono alert/Important)
 *
 * ## Props
 * - `status`: 'complete'|'incomplete'|null — estado; null → no renderiza.
 * - `label`: string — texto del chip (i18n del caller).
 * - `customClassName`: string.
 */
const STATUS_STYLES = {
  complete: { bg: '#d9fdd2', text: '#107f28', icon: 'alert/success' },
  incomplete: { bg: '#fff3e0', text: '#88431c', icon: 'alert/Important' },
};

export const MembersStatusChip = ({
  status = null,
  label = '',
  customClassName = '',
  ...rest
}) => {
  if (!status) return null;
  const s = STATUS_STYLES[status] || STATUS_STYLES.complete;
  return html`
    <span
      class=${`inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl text-sm font-bold leading-[19px] whitespace-nowrap ${customClassName}`}
      style=${{ backgroundColor: s.bg, color: s.text }}
      data-name="members-status-chip"
      data-status=${status}
      ...${rest}
    >
      <${Icon} icon=${s.icon} size="s" color=${s.text} />
      <span>${label}</span>
    </span>
  `;
};

export default MembersStatusChip;
