import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Select } from '../../atoms/inputs/select/select.js';
import { Icon } from '../../atoms/icon/icon.js';
import { Tooltip } from '../../atoms/tooltip/tooltip.js';

const html = htm.bind(h);

/**
 * Normaliza el valor entrante (objeto `{day,month,year}` o ISO `YYYY-MM-DD`) al
 * shape interno con strings. Pura → testeable.
 * @param {{day?:any,month?:any,year?:any}|string|null} value
 * @returns {{day:string,month:string,year:string}}
 */
export const normalizeDateValue = (value) => {
  if (value && typeof value === 'object') {
    return {
      day: value.day != null && value.day !== '' ? String(value.day) : '',
      month: value.month != null && value.month !== '' ? String(value.month) : '',
      year: value.year != null && value.year !== '' ? String(value.year) : '',
    };
  }
  if (typeof value === 'string' && value.trim()) {
    const m = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) {
      return {
        year: String(Number(m[1])),
        month: String(Number(m[2])),
        day: String(Number(m[3])),
      };
    }
  }
  return { day: '', month: '', year: '' };
};

/**
 * Compone el valor nuevo al cambiar un selector. Pura → testeable.
 * @param {{day:string,month:string,year:string}} current
 * @param {'day'|'month'|'year'} field
 * @param {any} val
 */
export const composeDate = (current, field, val) => ({
  ...current,
  [field]: val == null ? '' : String(val),
});

/**
 * Estado visual del texto de UN segmento (`Select variant="segment"`). Solo
 * el error INDIVIDUAL (`fieldErrors[field]`) tiñe el valor de ESE segmento.
 * El error GLOBAL (`error`) tiñe el borde compartido, el label de grupo y el
 * helper text (ver `anyError` en el render) pero NO el texto de cada
 * segmento — así lo muestra el diseño Figma `datePicker` 1291:53013:
 *   - "Error de nivel global" (1291:53682, fecha de salida): día/mes/año se
 *     muestran en negro normal, solo el borde/label/helper están en rojo.
 *   - "Error de nivel individual" (1291:53731, fecha de nacimiento): además
 *     del borde/label/helper en rojo, el segmento puntual sin valor ("Día")
 *     se muestra en rojo.
 * Pura → testeable.
 * @param {'day'|'month'|'year'} field
 * @param {{fieldErrors?:object}} opts
 * @returns {'error'|'normal'}
 */
export const resolveFieldState = (field, { fieldErrors = {} } = {}) => (
  (fieldErrors && fieldErrors[field]) ? 'error' : 'normal'
);

const buildDayOptions = () => Array.from({ length: 31 }, (unused, i) => ({
  value: String(i + 1), label: String(i + 1),
}));

const buildMonthOptions = (monthLabels) => Array.from({ length: 12 }, (unused, i) => ({
  value: String(i + 1),
  // Los nombres de mes NO se hardcodean: vienen del consumidor (i18n). Sin
  // `monthLabels` cae al número (nunca un mes en un idioma fijo).
  label: (Array.isArray(monthLabels) && monthLabels[i]) ? monthLabels[i] : String(i + 1),
}));

const buildYearOptions = (minYear, maxYear) => {
  const out = [];
  for (let y = maxYear; y >= minYear; y -= 1) out.push({ value: String(y), label: String(y) });
  return out;
};

// Reglas de uso (Figma datePicker 1291:53013, sección "Variantes del
// componente"): caja compartida — border/background por estado. El
// `--color-border-default` (#969696) y el resto de tokens ya existen en
// `styles/variables/tailwind.css` y coinciden exactamente con los valores
// documentados en Figma (Default #969696, Disabled bg #F5F5F5/border
// #D9D9D9, Error border #FF1C46).
const boxStateClasses = {
  normal: 'border-border-default bg-background-input-default',
  readonly: 'border-border-default bg-background-input-default',
  disabled: 'border-border-input-disabled bg-background-input-disabled',
  error: 'border-border-input-error bg-background-input-default',
};

// Label de grupo ("Fecha de nacimiento*"): #5A5A5A en todos los estados
// salvo error (#C20000) — el disabled NO usa el token de label deshabilitado
// más pálido de `Select` (#B6B6B6), sino el mismo secondary de siempre, tal
// como lo documenta la anatomía Figma (parte 3: "Text color: #5A5A5A").
const labelStateClasses = {
  normal: 'text-text-normal-secondary',
  readonly: 'text-text-normal-secondary',
  disabled: 'text-text-normal-secondary',
  error: 'text-[var(--color-alert-error-icon-bg)]',
};

/**
 * InlineDateField — campo de fecha como 3 `Select variant="segment"` (Día |
 * Mes | Año) dentro de una caja compartida con borde. Kit "Gestión de
 * cuenta" (1279360). Figma `datePicker` 1291:53013 (anatomía 1291:53090,
 * device 1291:53238, layout 1291:53347, variantes 1291:53616/53645/53682/53731):
 * usado en fecha de nacimiento (readonly), expiración de pasaporte, etc.
 *
 * Composición sobre el átomo `Select` vía su `variant="segment"` (borderless,
 * sin label propio, sin fondo/alto propios — ver JSDoc de `Select`): cada
 * segmento recibe su `state` de error INDIVIDUAL, mientras que el borde de la
 * caja compartida, el label de grupo y el helper text reaccionan al error
 * GLOBAL o a cualquier error individual (`anyError`, ver `resolveFieldState`).
 *
 * Mobile-first: el padding lateral interno de cada segmento (8px mobile →
 * 12px desde `md:`, spec "Device": `inlineDateFieldMobile`) vive dentro de
 * `Select`'s `variant="segment"`, no aquí.
 *
 * ## Props
 * @param {Object} props
 * @param {string} [props.label=''] - título del campo (dentro de la caja, arriba).
 * @param {{day?,month?,year?}|string|null} [props.value=null] - objeto o ISO.
 * @param {(next:{day:string,month:string,year:string})=>void} [props.onChange]
 * @param {boolean} [props.required=false]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.readonly=false]
 * @param {boolean} [props.error=false] - error GLOBAL (borde/label/helper en rojo).
 * @param {{day?:boolean,month?:boolean,year?:boolean}} [props.fieldErrors={}] - error
 *   INDIVIDUAL (además tiñe el segmento puntual).
 * @param {string} [props.helperText=''] - texto de ayuda/error (una sola vez,
 *   debajo, fuera de la caja).
 * @param {string} [props.tooltipContent] - texto contextual opcional. Cuando se
 *   define, renderiza un ícono de información (Figma `<tooltipIcon>`) fuera
 *   de la caja, a su derecha, que revela un `Tooltip` (variant="hint") arriba
 *   al hover/focus por teclado — mismo patrón que `Select`/`Input`.
 * @param {number} [props.minYear] - año mínimo (default: año actual - 120).
 * @param {number} [props.maxYear] - año máximo (default: año actual).
 * @param {string[]} [props.monthLabels] - 12 nombres de mes del consumidor (i18n).
 * @param {string} [props.dayLabel='Día']
 * @param {string} [props.monthLabel='Mes']
 * @param {string} [props.yearLabel='Año']
 * @param {string} [props.idBase='inline-date-field']
 * @param {string} [props.customClassName='']
 */
export const InlineDateField = ({
  label = '',
  value = null,
  onChange,
  required = false,
  disabled = false,
  readonly = false,
  error = false,
  fieldErrors = {},
  helperText = '',
  tooltipContent,
  minYear,
  maxYear,
  monthLabels,
  dayLabel = 'Día',
  monthLabel = 'Mes',
  yearLabel = 'Año',
  idBase = 'inline-date-field',
  customClassName = '',
} = {}) => {
  const [parts, setParts] = useState(() => normalizeDateValue(value));

  // Sincroniza si el valor entrante cambia (mismo idiom que Select).
  useEffect(() => {
    setParts(normalizeDateValue(value));
  }, [value]);

  const nowYear = new Date().getFullYear();
  const yMax = typeof maxYear === 'number' ? maxYear : nowYear;
  const yMin = typeof minYear === 'number' ? minYear : nowYear - 120;

  const dayOptions = buildDayOptions();
  const monthOptions = buildMonthOptions(monthLabels);
  const yearOptions = buildYearOptions(yMin, yMax);

  const handle = (field) => (val) => {
    const next = composeDate(parts, field, val);
    setParts(next);
    if (onChange) onChange(next);
  };

  const hasFieldError = !!(
    fieldErrors && (fieldErrors.day || fieldErrors.month || fieldErrors.year)
  );
  const anyError = error || hasFieldError;
  let actualBoxState = 'normal';
  if (disabled) actualBoxState = 'disabled';
  else if (readonly) actualBoxState = 'readonly';
  else if (anyError) actualBoxState = 'error';
  const labelId = label ? `${idBase}-label-text` : undefined;

  return html`
    <div
      class=${`flex flex-col gap-[var(--spacing-tiny,4px)] w-full max-w-[460px] min-w-0 ${customClassName}`.trim()}
      data-name="inline-date-field"
      data-state=${actualBoxState}
    >
      <div class="flex items-center gap-[var(--spacing-x-small,8px)] w-full">
        <div
          role="group"
          aria-labelledby=${labelId}
          class=${`
            flex-1 min-w-0 flex flex-col items-start justify-center gap-[var(--spacing-tiny,4px)]
            min-h-[64px]
            border border-solid rounded-[8px]
            px-[var(--spacing-medium,16px)] pt-[var(--spacing-small,12px)] pb-[var(--spacing-tiny,4px)]
            transition-colors duration-200
            ${boxStateClasses[actualBoxState]}
          `}
        >
          ${label && html`
            <span
              id=${labelId}
              class=${`
                block w-full flex-shrink-0 whitespace-nowrap overflow-hidden text-ellipsis
                font-['Red_Hat_Display'] font-normal text-xs leading-normal tracking-[0px]
                ${labelStateClasses[actualBoxState]}
              `}
            >${label}${required ? '*' : ''}</span>
          `}
          <div class="flex items-center flex-shrink-0 gap-[var(--spacing-tiny,4px)] w-full">
            <${Select}
              id=${`${idBase}-day`}
              variant="segment"
              placeholder=${dayLabel}
              options=${dayOptions}
              value=${parts.day}
              onChange=${handle('day')}
              required=${required}
              disabled=${disabled}
              readonly=${readonly}
              state=${resolveFieldState('day', { fieldErrors })}
              customClassName="flex-1 min-w-0"
            />
            <${Select}
              id=${`${idBase}-month`}
              variant="segment"
              placeholder=${monthLabel}
              options=${monthOptions}
              value=${parts.month}
              onChange=${handle('month')}
              required=${required}
              disabled=${disabled}
              readonly=${readonly}
              state=${resolveFieldState('month', { fieldErrors })}
              customClassName="flex-1 min-w-0"
            />
            <${Select}
              id=${`${idBase}-year`}
              variant="segment"
              placeholder=${yearLabel}
              options=${yearOptions}
              value=${parts.year}
              onChange=${handle('year')}
              required=${required}
              disabled=${disabled}
              readonly=${readonly}
              state=${resolveFieldState('year', { fieldErrors })}
              customClassName="flex-1 min-w-0"
            />
          </div>
        </div>

        <!-- Info Tooltip Icon: fuera de la caja, a su derecha (Figma <tooltipIcon>, parte 7 de la anatomía) -->
        ${tooltipContent && html`
          <${Tooltip} variant="hint" content=${tooltipContent} position="top" customClassName="flex-shrink-0">
            <button
              type="button"
              aria-label="Más información"
              class="flex items-center justify-center w-4 h-4 flex-shrink-0"
            >
              <${Icon} icon="alert/info" size="s" />
            </button>
          </${Tooltip}>
        `}
      </div>

      ${helperText ? html`
        <div
          class=${`
            flex items-start gap-[var(--spacing-tiny,4px)]
            font-['Red_Hat_Display'] font-normal text-sm leading-5 tracking-[0px]
            ${anyError ? 'text-[var(--color-alert-error-icon-bg)]' : 'text-text-normal-secondary'}
          `}
          data-name="inline-date-field-helper"
        >
          ${anyError && html`
            <span class="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true">
              <${Icon} icon="alert/Error" size="s" color="currentColor" />
            </span>
          `}
          <span>${helperText}</span>
        </div>
      ` : null}
    </div>
  `;
};

export default InlineDateField;
