import { h } from '@dropins/tools/preact.js';
import { useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';
import { Tooltip } from '../../atoms/tooltip/tooltip.js';
import { SummaryText } from '../../atoms/summary-text/summary-text.js';
import { StatusProfileChip } from '../../atoms/status-profile-chip/status-profile-chip.js';

const html = htm.bind(h);

/**
 * SecurityEditRow — fila del bloque "Configuraciones de seguridad" (1279363, §D,
 * nodos `1056:120211` lectura / `1056:121982` incompleto / `1056:120596` edición).
 *
 * A diferencia de `EditableAccordionSection` (card independiente de la tab Datos —
 * NO se toca por riesgo de regresión en 1279361), esta molécula es una **fila
 * horizontal compacta** pensada para vivir DENTRO de una sola card con divisores
 * (`divide-y`) entre filas. Tres zonas en desktop:
 *   1. **Título + descripción** (+ badge "Información incompleta" DEBAJO de la
 *      descripción cuando `status='incomplete'`; en `complete` no se pinta nada —
 *      Figma no muestra check ni chip para el estado completo).
 *   2. **Label + valor** (`SummaryText`; vacío → `–`).
 *   3. **Lápiz** (iconOnly circular, extremo derecho, centrado vertical).
 *
 * En **edición** la zona derecha (col 2-3) se reemplaza por el form (`editContent`,
 * slot que provee el organism — los forms existentes se REUBican, no se reescriben)
 * con el footer Cancelar/Guardar DEBAJO de los campos, a la derecha. El lápiz se
 * oculta. Mientras otra fila edita, ésta llega `disabled` (atenuada, sin
 * interacción) — bloqueo cross-módulo controlado por el organism.
 *
 * CONTROLADO por el padre: el organism es dueño de `editing`/`saving`/`disabled`.
 *
 * ## Props
 * @param {string} title título de la fila (zona 1).
 * @param {string} [description] descripción (zona 1, bajo el título).
 * @param {string} [valueLabel] etiqueta chica del valor (zona 2).
 * @param {string|number|null} [value] valor en lectura; vacío/null → `–`.
 * @param {('complete'|'incomplete')} [status='complete'] `incomplete` → badge bajo
 *   la descripción; `complete` → sin adorno (Figma).
 * @param {boolean} [editing=false] controlado por el padre.
 * @param {boolean} [saving=false] muestra "Guardando" y oculta Cancelar.
 * @param {boolean} [disabled=false] bloqueo cross-módulo (fila atenuada).
 * @param {boolean} [canEdit=true] `false` → sin lápiz (kill-switch de config).
 * @param {boolean} [saveDisabled=false] deshabilita Guardar (form inválido).
 * @param {import('preact').ComponentChildren} [editContent] slot del form de edición.
 * @param {()=>void} onEdit
 * @param {()=>void} onCancel
 * @param {()=>void} onSave
 * @param {object} [labels] { btnCancel, btnSave, btnSaving, editTooltip, btnEdit,
 *   statusIncomplete }
 */
export const SecurityEditRow = ({
  title = '',
  description = '',
  valueLabel = '',
  value = null,
  status = 'complete',
  editing = false,
  saving = false,
  disabled = false,
  canEdit = true,
  saveDisabled = false,
  editContent = null,
  onEdit,
  onCancel,
  onSave,
  labels = {},
  ...rest
}) => {
  const editRef = useRef(null);

  // Foco al primer campo al entrar en edición (A11y — mismo idiom que
  // EditableAccordionSection).
  useEffect(() => {
    if (!editing || !editRef.current) return;
    const focusable = editRef.current.querySelector(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), [role="combobox"], textarea:not([disabled])',
    );
    if (focusable) requestAnimationFrame(() => focusable.focus());
  }, [editing]);

  const editTooltip = labels.editTooltip || labels.btnEdit || 'Editar';

  const pencil = html`
    <${Tooltip} content=${editTooltip} position="top">
      <button
        type="button"
        onClick=${onEdit}
        disabled=${disabled}
        aria-label=${editTooltip}
        class="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border-stroke-default)] bg-[var(--bg-card-lighter)] transition-colors hover:bg-[var(--bg-page-light)] disabled:opacity-50 disabled:pointer-events-none"
      >
        <${Icon} icon="action/edit" customSize=${18} color="var(--icon-normal-primary)" />
      </button>
    </${Tooltip}>
  `;

  const readRight = html`
    <div class="flex items-center justify-between gap-4 md:col-span-2" data-name="security-edit-row-read">
      <div class="min-w-0">
        <${SummaryText} label=${valueLabel} value=${value} />
      </div>
      ${canEdit && html`<div class="shrink-0">${pencil}</div>`}
    </div>
  `;

  const editRegion = html`
    <div class="md:col-span-2">
      <div class="flex flex-col gap-4 md:max-w-[440px]" ref=${editRef}>
        <div>${editContent}</div>
        <div class="flex items-center justify-end gap-3">
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
    </div>
  `;

  return html`
    <div
      class=${`grid grid-cols-1 gap-3 py-5 md:grid-cols-3 md:items-start md:gap-6 md:py-6 transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      data-name="security-edit-row"
      data-editing=${editing ? 'true' : 'false'}
      aria-disabled=${disabled ? 'true' : undefined}
      ...${rest}
    >
      <div class="flex flex-col gap-1 min-w-0">
        ${/* !text-lg: el h3 global (styles.css, sin @layer) vence a la utility de
             Tailwind v4 por especificidad de capa → forzar con ! (gotcha del lote). */ ''}
        <h3 class="!m-0 !text-lg font-bold leading-normal text-[var(--text-normal-primary)]">${title}</h3>
        ${description && html`
          <p class="text-sm leading-normal text-[var(--text-normal-secondary)]">${description}</p>
        `}
        ${status === 'incomplete' && !editing && html`
          <${StatusProfileChip}
            variant="incomplete"
            label=${labels.statusIncomplete || ''}
            customClassName="mt-1 self-start"
          />
        `}
      </div>
      ${editing ? editRegion : readRight}
    </div>
  `;
};

export default SecurityEditRow;
