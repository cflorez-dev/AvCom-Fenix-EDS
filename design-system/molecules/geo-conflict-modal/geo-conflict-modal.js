import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { ModalAviancaLayout } from '../modal/modal-avianca-layout.js';

const html = htm.bind(h);

/**
 * GeoConflictModal
 *
 * Wraps `ModalAviancaLayout` with the PBI geolocation-conflict flow:
 * - Shown when the cookie POS ≠ geo-resolved POS
 * - Two actions: primary (switch to geo POS) and secondary (keep cookie POS)
 * - All copy is passed in from the orchestrator (loaded from i18n AEM sheets)
 *
 * Example props:
 *   title:              "Estás en el sitio de Colombia"
 *   description:        "Cambia a Estados Unidos para ver precios en tu moneda local…"
 *   primaryButtonLabel: "Ir a Estados Unidos"
 *   secondaryLabel:     "Continuar en Colombia"
 *   imageUrl:           "/assets/icons/travel/geo-conflict.svg" (optional)
 *   onPrimary:          () => switch POS + reload
 *   onSecondary:        () => dismiss + persist decision
 */
export const GeoConflictModal = ({
  isOpen,
  title,
  description,
  primaryButtonLabel,
  secondaryButtonLabel,
  imageUrl,
  imageAlt = '',
  onPrimary,
  onSecondary,
  onClose,
}) => html`
  <${ModalAviancaLayout}
    isOpen=${isOpen}
    onClose=${onClose || onSecondary}
    title=${title}
    description=${description}
    primaryButtonLabel=${primaryButtonLabel}
    secondaryButtonLabel=${secondaryButtonLabel}
    image=${imageUrl || undefined}
    imageAlt=${imageAlt || title || ''}
    onPrimaryClick=${onPrimary}
    onSecondaryClick=${onSecondary}
    showCloseButton=${true}
    clickOutsideToClose=${false}
    escapeToClose=${true}
    customClassName="geo-conflict-modal"
  />
`;

export default GeoConflictModal;
