import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * SummaryText — átomo par label/valor de vista lectura del kit "Gestión de
 * cuenta" (1279360). Figma "summaryText" (613 instancias, contexto §B/§D): usado
 * en las grillas de lectura de Datos/Pagos/Ajustes (1279361/62/63).
 *
 * Layout: label 14px `var(--text-normal-secondary)` (line-height 21px,
 * antialiased) arriba; valor bold `var(--text-normal-primary)` debajo,
 * responsive: 14/19px hasta 1023px, 18/24px desde `lg` (1024px). `value`
 * vacío/null → placeholder `–`. `disabled` (fila bloqueada durante edición de
 * otro módulo) pinta todo en `var(--text-normal-light)`.
 *
 * ## Props
 * @param {Object} props
 * @param {string} [props.label=''] - etiqueta gris chica (viene por i18n del consumidor).
 * @param {string|number|null} [props.value=null] - valor; vacío/null → `–`.
 * @param {boolean} [props.disabled=false] - estado atenuado.
 * @param {string} [props.customClassName=''] - clases extra para el contenedor.
 * @param {Object} [props.rest] - otras props válidas.
 */
export const SummaryText = ({
  label = '',
  value = null,
  disabled = false,
  customClassName = '',
  ...rest
}) => {
  const isEmpty = (value ?? '') === '';
  const display = isEmpty ? '–' : value;
  return html`
    <div
      class=${`flex flex-col gap-1 min-w-0 ${customClassName}`.trim()}
      data-name="summary-text"
      ...${rest}
    >
      <span class=${`text-sm leading-[21px] antialiased ${disabled ? 'text-[var(--text-normal-light)]' : 'text-[var(--text-normal-secondary)]'}`}>${label}</span>
      <span class=${`text-sm leading-[19px] lg:text-lg lg:leading-[24px] font-bold break-words ${disabled ? 'text-[var(--text-normal-light)]' : 'text-[var(--text-normal-primary)]'}`}>${display}</span>
    </div>
  `;
};

export default SummaryText;
