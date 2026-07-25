import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { InlineDateField } from './inline-date-field.js';

const html = htm.bind(h);

// Meses ES de ejemplo (en producción llegan por i18n del consumidor, no se
// hardcodean en el componente).
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/**
 * InlineDateFieldSample — showcase de la molécula fecha 3-selects (1279360).
 * Figma `datePicker` 1291:53013. Cubre las 4 "Variantes del componente"
 * documentadas (Default/Disabled/Error global/Error individual, nodos
 * 1291:53616/53645/53682/53731), tooltip opcional, readonly y el
 * comportamiento mobile-first (el padding lateral de cada segmento pasa de
 * 8px a 12px desde `md:` — ver `Select` `variant="segment"`).
 */
export const InlineDateFieldSample = () => {
  const [birth, setBirth] = useState({ day: '15', month: '6', year: '1990' });

  return html`
    <section class="p-6 flex flex-col gap-8 max-w-[560px]">
      <h2 class="text-2xl font-bold">InlineDateField (molécula · fecha 3 selects)</h2>
      <p class="text-sm text-[var(--text-normal-secondary)]">
        Redimensiona la ventana por debajo de 768px (breakpoint <code>md</code>) para ver el
        padding lateral de cada segmento pasar de 12px a 8px (Figma "Device": <code>inlineDateFileMobile</code>).
      </p>

      <!-- Default (1291:53616) -->
      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-bold">Default</h3>
        <${InlineDateField}
          label="Fecha de nacimiento"
          required=${true}
          value=${birth}
          onChange=${setBirth}
          monthLabels=${MONTHS_ES}
          minYear=${1920}
          maxYear=${2026}
        />
        <p class="text-sm text-[var(--text-normal-secondary)]">
          Valor: <strong>${birth.year}-${birth.month}-${birth.day}</strong>
        </p>
      </div>

      <!-- Con tooltip (Figma <tooltipIcon>, fuera de la caja) -->
      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-bold">Con tooltip (tooltipContent)</h3>
        <${InlineDateField}
          label="Fecha de nacimiento"
          value=${{ day: '', month: '', year: '' }}
          monthLabels=${MONTHS_ES}
          tooltipContent="Ingresa la fecha tal como aparece en tu documento de identidad."
        />
      </div>

      <!-- Readonly (1291:53616, uso real: fecha de nacimiento en modo lectura) -->
      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-bold">Readonly</h3>
        <${InlineDateField}
          label="Fecha de nacimiento"
          value=${{ day: '2', month: '1', year: '1985' }}
          monthLabels=${MONTHS_ES}
          readonly=${true}
        />
      </div>

      <!-- Disabled (1291:53645) -->
      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-bold">Disabled</h3>
        <${InlineDateField}
          label="Fecha de nacimiento"
          value=${{ day: '25', month: '6', year: '2025' }}
          monthLabels=${MONTHS_ES}
          disabled=${true}
          helperText="Helper Text"
        />
      </div>

      <!-- Error global (1291:53682): borde/label/helper en rojo, los 3 valores en negro normal -->
      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-bold">Error de nivel global (componente completo)</h3>
        <p class="text-xs text-[var(--text-normal-secondary)]">
          Afecta la fecha como unidad completa: los 3 valores están llenos y se muestran en negro
          normal, solo la caja/label/helper se pintan de rojo.
        </p>
        <${InlineDateField}
          label="Fecha de salida"
          required=${true}
          value=${{ day: '25', month: '1', year: '2023' }}
          monthLabels=${MONTHS_ES}
          error=${true}
          helperText="La fecha de salida no puede ser anterior a la fecha actual."
        />
      </div>

      <!-- Error individual (1291:53731): además del borde/label/helper, el segmento puntual se pinta de rojo -->
      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-bold">Error de nivel individual (selector específico)</h3>
        <p class="text-xs text-[var(--text-normal-secondary)]">
          Un valor falta en un campo puntual (Día): además de la caja/label/helper en rojo, ESE
          segmento se pinta de rojo — Mes y Año, con valor válido, quedan en negro normal.
        </p>
        <${InlineDateField}
          label="Fecha de nacimiento"
          required=${true}
          value=${{ day: '', month: '1', year: '2023' }}
          monthLabels=${MONTHS_ES}
          fieldErrors=${{ day: true }}
          helperText="Por favor selecciona un día."
        />
      </div>
    </section>
  `;
};

export default InlineDateFieldSample;
