import { h } from '@dropins/tools/preact.js';
import { useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';
import { Tooltip } from '../../atoms/tooltip/tooltip.js';
import { StatusProfileChip } from '../../atoms/status-profile-chip/status-profile-chip.js';

const html = htm.bind(h);

/**
 * EditableAccordionSection — card interna del "Data Panel" (1279361, doc
 * `1291:45795`). Conmuta LECTURA ⇄ EDICIÓN inline (NO colapsa). CONTROLADO por el
 * padre (organism), que es dueño del `editing` para el bloqueo cross-módulo (un
 * solo módulo editable a la vez).
 *
 * - Header: título + `StatusProfileChip` (complete/incomplete) + lápiz iconOnly
 *   con Tooltip "Editar" (oculto durante edición y si `canEdit=false`).
 * - LECTURA: slot `readContent` (grilla de `SummaryText`, 3 cols desktop).
 * - EDICIÓN: slot `editContent` (form) + footer Cancelar (secondary) / Guardar
 *   (primary, `loading` al guardar). Durante el guardado, **Cancelar se OCULTA**
 *   (sticky `1056:34276`) y los controles quedan bloqueados.
 * - `disabled`: card atenuada (bloqueo cross-módulo mientras otro módulo edita).
 * - A11y: al entrar en edición, foco al primer campo del form.
 *
 * ## Props
 * @param {string} title
 * @param {('complete'|'incomplete')} [status]
 * @param {boolean} [editing=false] controlado por el padre
 * @param {boolean} [saving=false]
 * @param {boolean} [disabled=false] bloqueo cross-módulo
 * @param {boolean} [canEdit=true] false → sin lápiz (kill-switch editMockEnabled)
 * @param {import('preact').ComponentChildren} readContent
 * @param {import('preact').ComponentChildren} editContent
 * @param {()=>void} onEdit
 * @param {()=>void} onCancel
 * @param {()=>void} onSave
 * @param {object} labels { btnEdit, btnCancel, btnSave, btnSaving, editTooltip, statusIncomplete }
 * @param {boolean} [saveDisabled=false] deshabilita Guardar (form inválido)
 */
export const EditableAccordionSection = ({
  title = '',
  status = 'incomplete',
  editing = false,
  saving = false,
  disabled = false,
  canEdit = true,
  readContent = null,
  editContent = null,
  onEdit,
  onCancel,
  onSave,
  labels = {},
  saveDisabled = false,
  ...rest
}) => {
  const editRef = useRef(null);

  // Foco al primer campo al entrar en edición (A11y).
  useEffect(() => {
    if (!editing || !editRef.current) return;
    const focusable = editRef.current.querySelector(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), [role="combobox"], textarea:not([disabled])',
    );
    if (focusable) requestAnimationFrame(() => focusable.focus());
  }, [editing]);

  return html`
    <div
      class=${`flex flex-col gap-4 w-full rounded-2xl bg-[var(--bg-card-lighter)] border border-[var(--border-stroke-default)] p-4 md:p-6 transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      data-name="editable-accordion-section"
      data-editing=${editing ? 'true' : 'false'}
      aria-disabled=${disabled ? 'true' : undefined}
      ...${rest}
    >
      <div class="flex items-start justify-between gap-3 min-h-[28px]">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <h3 class="m-0! text-sm! leading-[19px]! md:text-lg! md:leading-6! font-semibold! text-[var(--text-normal-primary)]! break-words">${title}</h3>
          <${StatusProfileChip} variant=${status === 'complete' ? 'complete' : 'incomplete'} label=${status === 'complete' ? '' : (labels.statusIncomplete || '')} />
        </div>
        ${!editing && canEdit && html`
          <${Tooltip} content=${labels.editTooltip || labels.btnEdit || ''} variant="hint" position="bottom">
            ${/* Botón "headerButton" del spec Figma (1056:32530 / 1056:32570 /
                1056:32743 …): pill 34×34px exacto, border 1px stroke default,
                rounded-32px (círculo, ya que el radio excede la mitad del
                tamaño), lápiz 16px centrado. `Button` no lo reproduce pixel a
                pixel (su `size="sm"` da 36×36 con border 2px), así que se
                maqueta a mano con las mismas variables de color del átomo
                `HeaderButton` (hover/active/focus). */ ''}
            <button
              type="button"
              class="group relative inline-flex shrink-0 items-center justify-center w-[34px] h-[34px] rounded-[32px] border border-solid border-[var(--border-stroke-default)] bg-transparent cursor-pointer select-none outline-none transition-colors duration-150 ease-in-out hover:bg-[var(--color-background-brand-secondary-hover)] active:bg-[var(--color-background-brand-secondary-active)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--border-stroke-focus)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
              onClick=${onEdit}
              disabled=${disabled}
              aria-label=${labels.editTooltip || labels.btnEdit || 'Editar'}
            >
              <${Icon} icon="action/edit" customSize=${16} color="var(--icon-normal-primary)" />
            </button>
          </${Tooltip}>
        `}
      </div>

      ${editing ? html`
        <div class="flex flex-col gap-4" ref=${editRef}>
          <div>${editContent}</div>
          <div class="flex items-center gap-3 justify-end">
            ${!saving && html`
              <${Button} variant="secondary" size="sm" onClick=${onCancel}>
                ${labels.btnCancel || 'Cancelar'}
              </${Button}>
            `}
            <${Button}
              variant="primary"
              size="sm"
              onClick=${onSave}
              loading=${saving}
              disabled=${saving || saveDisabled}
            >
              ${saving ? (labels.btnSaving || 'Guardando') : (labels.btnSave || 'Guardar')}
            </${Button}>
          </div>
        </div>
      ` : html`
        <div data-name="section-read">${readContent}</div>
      `}
    </div>
  `;
};

export default EditableAccordionSection;
