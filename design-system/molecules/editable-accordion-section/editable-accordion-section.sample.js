import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { EditableAccordionSection } from './editable-accordion-section.js';
import { SummaryText } from '../../atoms/summary-text/summary-text.js';
import { Input } from '../../atoms/inputs/input/input.js';

const html = htm.bind(h);

const LABELS = {
  btnEdit: 'Editar', btnCancel: 'Cancelar', btnSave: 'Guardar', btnSaving: 'Guardando', editTooltip: 'Editar',
};

/**
 * EditableAccordionSectionSample — estados de la card del Data Panel (1279361):
 * lectura completa / lectura incompleta / edición interactiva / guardando /
 * disabled (bloqueo cross-módulo).
 */
export const EditableAccordionSectionSample = () => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const readGrid = html`
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <${SummaryText} label="Género" value="Femenino" />
      <${SummaryText} label="Nombre completo" value="Ana García" />
      <${SummaryText} label="Ciudad" value="Bogotá" />
    </div>
  `;
  const editForm = html`
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <${Input} label="Ciudad" value="Bogotá" required=${true} />
      <${Input} label="Dirección" value="" required=${true} />
    </div>
  `;
  const onSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setEditing(false); }, 900);
  };

  return html`
    <section style=${{
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#EEEFF1',
  }}>
      <h2>EditableAccordionSection (molécula — 1279361)</h2>

      <p style=${{ color: '#666', margin: 0, fontWeight: 600 }}>Interactiva (lápiz → edición → guardando → lectura)</p>
      <${EditableAccordionSection}
        title="Datos personales"
        status="complete"
        editing=${editing}
        saving=${saving}
        readContent=${readGrid}
        editContent=${editForm}
        onEdit=${() => setEditing(true)}
        onCancel=${() => setEditing(false)}
        onSave=${onSave}
        labels=${LABELS}
      />

      <p style=${{ color: '#666', margin: 0, fontWeight: 600 }}>Lectura incompleta (chip naranja)</p>
      <${EditableAccordionSection}
        title="Información de contacto"
        status="incomplete"
        readContent=${html`<div class="grid grid-cols-1 md:grid-cols-3 gap-4"><${SummaryText} label="Correo electrónico" value="ana@example.com" /><${SummaryText} label="Teléfono" value="" /></div>`}
        onEdit=${() => {}}
        labels=${LABELS}
      />

      <p style=${{ color: '#666', margin: 0, fontWeight: 600 }}>Disabled (bloqueo cross-módulo)</p>
      <${EditableAccordionSection}
        title="Contacto de emergencia"
        status="incomplete"
        disabled=${true}
        readContent=${html`<div class="grid grid-cols-1 md:grid-cols-3 gap-4"><${SummaryText} label="Nombre completo" value="" disabled=${true} /></div>`}
        labels=${LABELS}
      />
    </section>
  `;
};

export default EditableAccordionSectionSample;
