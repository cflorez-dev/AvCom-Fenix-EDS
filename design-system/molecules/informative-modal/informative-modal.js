import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Modal } from '../modal/modal.js';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * InformativeModal — popup de confirmación/error del kit "Gestión de cuenta"
 * (1279361, Figma `1064:71640`, 440×388). Compuesto sobre `Modal` (variant center,
 * que ya resuelve X, click-fuera, foco y scroll-lock sin reiniciar el scroll —
 * sticky del popup eliminar). Estructura: **avatar de persona gris en círculo con
 * badge rojo (exclamación) superpuesto arriba-derecha** (Figma unifica el ícono
 * para AMBOS casos — error nº LM `1064:71640` y confirmación de borrado
 * `1056:39858`) + título + cuerpo + CTA primaria full-width (Button) + CTA
 * secundaria OPCIONAL como LINK teal (patrón "Cancelar" del popup eliminar — link,
 * NO botón).
 *
 * Usos: confirmar eliminación de acompañante (variant `confirm`) y error de nº LM
 * (variant `error`, "Intentar nuevamente" → cierra y foco al campo). `variant` se
 * conserva por compatibilidad de API pero ya NO cambia el ícono (Figma unifica).
 *
 * ## Props
 * @param {boolean} isOpen
 * @param {()=>void} onClose
 * @param {('error'|'confirm')} [variant='error'] conservado por compat — no altera el ícono
 * @param {string} title
 * @param {string} body
 * @param {string} primaryLabel
 * @param {()=>void} onPrimary
 * @param {boolean} [primaryLoading=false] estado "Eliminando…"
 * @param {string} [secondaryLabel] link teal opcional
 * @param {()=>void} [onSecondary]
 */
export const InformativeModal = ({
  isOpen = false,
  onClose,
  variant = 'error',
  title = '',
  body = '',
  primaryLabel = '',
  onPrimary,
  primaryLoading = false,
  secondaryLabel = '',
  onSecondary,
}) => html`
    <${Modal}
      isOpen=${isOpen}
      onClose=${onClose}
      variant="center"
      size="sm"
      contentClassName="!max-w-[440px]"
      role="alertdialog"
    >
      <div class="flex flex-col items-center text-center gap-4 px-6 pb-8 pt-10" data-name="informative-modal" data-variant=${variant}>
        <div class="relative w-16 h-16 shrink-0" aria-hidden="true" data-name="informative-modal-avatar">
          <div class="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--illustrations-gray-light)] overflow-hidden">
            <${Icon} icon="person-icon" customSize=${40} color="var(--text-normal-secondary)" />
          </div>
          <span
            class="absolute top-0 right-0 flex items-center justify-center w-6 h-6 rounded-full bg-[var(--alert-error-icon-bg)] border-2 border-[var(--bg-card-lighter)] text-[var(--alert-error-icon-fg)] text-sm font-bold leading-none"
          >!</span>
        </div>
        <h2 id="modal-title" class="!m-0 !text-xl !font-bold !text-[var(--text-normal-primary)]">${title}</h2>
        ${body && html`<p class="!m-0 text-sm text-[var(--text-normal-secondary)]">${body}</p>`}
        <div class="flex flex-col items-center gap-3 w-full mt-2">
          <${Button}
            variant="primary"
            size="md"
            onClick=${onPrimary}
            loading=${primaryLoading}
            disabled=${primaryLoading}
            customClassName="w-full"
          >
            ${primaryLabel}
          </${Button}>
          ${secondaryLabel && html`
            <${Button}
              variant="transparent"
              size="sm"
              onClick=${onSecondary || onClose}
              disabled=${primaryLoading}
              customClassName="!text-[var(--text-link-default)] hover:!bg-transparent"
            >
              ${secondaryLabel}
            </${Button}>
          `}
        </div>
      </div>
    </${Modal}>
  `;

export default InformativeModal;
