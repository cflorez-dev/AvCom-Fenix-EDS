import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { SecurityEditRow } from './security-edit-row.js';
import { Input } from '../../atoms/inputs/input/input.js';

const html = htm.bind(h);

const LABELS = {
  btnCancel: 'Cancelar',
  btnSave: 'Guardar',
  btnSaving: 'Guardando',
  editTooltip: 'Editar',
  statusIncomplete: 'Información incompleta',
};

/**
 * SecurityEditRowSample — showcase de la fila de seguridad (1279363): 3 filas en
 * UNA card con divisores (Figma §D). Contraseña (complete, sin badge), PIN
 * (incomplete → badge bajo la descripción), Método (edición inline con footer).
 * Un solo `editing` a la vez → bloqueo cross-módulo (las otras filas se atenúan).
 */
export const SecurityEditRowSample = () => {
  const [editing, setEditing] = useState(null);

  const pinForm = html`
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <${Input} label="PIN" type="password" showPasswordToggle=${true} required=${true} />
    </div>
  `;

  return html`
    <section style=${{ padding: '24px', background: '#EEEFF1' }}>
      <h2 style=${{ marginBottom: '16px' }}>SecurityEditRow (molécula — fila seguridad 1279363)</h2>
      <div style=${{ maxWidth: '1248px' }}>
        <div class="w-full rounded-2xl bg-[var(--bg-card-lighter)] border border-[var(--border-stroke-default)] px-4 md:px-6 divide-y divide-[var(--border-stroke-default)]">
          <${SecurityEditRow}
            title="Contraseña" description="Protege tu cuenta y accede de forma segura."
            valueLabel="Contraseña" value="••••••••" status="complete"
            editing=${editing === 'password'} disabled=${editing !== null && editing !== 'password'}
            editContent=${pinForm}
            onEdit=${() => setEditing('password')} onCancel=${() => setEditing(null)} onSave=${() => setEditing(null)}
            labels=${LABELS} data-section="password"
          />
          <${SecurityEditRow}
            title="PIN de redención" description="Confirma tus transacciones y el uso de tus millas."
            valueLabel="PIN" value="" status="incomplete"
            editing=${editing === 'pin'} disabled=${editing !== null && editing !== 'pin'}
            editContent=${pinForm}
            onEdit=${() => setEditing('pin')} onCancel=${() => setEditing(null)} onSave=${() => setEditing(null)}
            labels=${LABELS} data-section="pin"
          />
          <${SecurityEditRow}
            title="Método de verificación" description="Elige cómo confirmar tu identidad al iniciar sesión o realizar cambios."
            valueLabel="Método" value="SMS" status="complete"
            editing=${editing === 'method'} disabled=${editing !== null && editing !== 'method'}
            editContent=${pinForm}
            onEdit=${() => setEditing('method')} onCancel=${() => setEditing(null)} onSave=${() => setEditing(null)}
            labels=${LABELS} data-section="method"
          />
        </div>
      </div>
    </section>
  `;
};

export default SecurityEditRowSample;
