import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * Switch — átomo toggle booleano accesible del kit "Gestión de cuenta" (1279360,
 * kit DS transversal). Usado por los opt-ins de Ajustes (1279363) y donde aplique.
 *
 * Spec Figma (toggle `1056:120408`, contexto §D): pista 40×20 + 2px de padding
 * vertical (44×24 de hit area), thumb blanco circular 20×20.
 *  - ON: track `var(--icon-accent-positive)` (#1ea93c).
 *  - OFF: track `var(--border-stroke-default)` + thumb blanco — estado derivado
 *    (el OFF no aparece renderizado en la Entrega 4). // PENDIENTE-DISEÑO (D16)
 *
 * A11y (patrón ARIA switch): `role="switch"` + `aria-checked`; toggle por click y
 * por teclado (Space/Enter); `disabled` no dispara y sale del tab order; focus
 * ring `focus-visible:outline-border-stroke-focus` (mismo idiom que
 * segmented-control.js:158).
 *
 * ## Props
 * @param {Object} props
 * @param {boolean} [props.checked=false] - estado del switch.
 * @param {(next:boolean)=>void} [props.onChange] - callback con el valor nuevo.
 * @param {boolean} [props.disabled=false] - deshabilitado (no dispara, opacidad 50%).
 * @param {string} [props.ariaLabel=''] - etiqueta accesible (si no hay label visible).
 * @param {string} [props.customClassName=''] - clases extra para el botón.
 * @param {Object} [props.rest] - otras props válidas.
 */
export const Switch = ({
  checked = false,
  onChange,
  disabled = false,
  ariaLabel = '',
  customClassName = '',
  ...rest
}) => {
  const toggle = () => {
    if (!disabled && onChange) onChange(!checked);
  };

  const onKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  };

  return html`
    <button
      type="button"
      role="switch"
      aria-checked=${checked ? 'true' : 'false'}
      aria-label=${ariaLabel || null}
      disabled=${disabled || null}
      onClick=${toggle}
      onKeyDown=${onKeyDown}
      data-name="switch"
      class=${`relative inline-flex w-[40px] h-[24px] items-center rounded-full transition-colors
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-stroke-focus
        ${checked ? 'bg-[var(--icon-accent-positive)]' : 'bg-[var(--border-stroke-default)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${customClassName}`.trim()}
      ...${rest}
    >
      <span
        aria-hidden="true"
        class=${`absolute top-[2px] h-[20px] w-[20px] rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
      ></span>
    </button>
  `;
};

export default Switch;
