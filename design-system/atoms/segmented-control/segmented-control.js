import { h } from '@dropins/tools/preact.js';
import { useRef, useCallback } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * SegmentedControl — toggle tipo pill del sistema de Members (1271689).
 *
 * Control segmentado genérico usado como (a) la barra de tabs de página
 * "Progreso | Beneficios" y (b) el sub-selector "Detalle de progreso | Vista
 * completa" del panel de progreso (1271699). Fondo gris `#EEEFF1`; la opción
 * activa es una píldora blanca con sombra (Figma 765:42338 / 765:42380).
 *
 * A11y (patrón ARIA tablist): el contenedor es `role="tablist"`, cada opción es
 * `role="tab"` con `aria-selected`, roving `tabindex` (solo la activa es
 * tabbable) y navegación por teclado ←/→ (y ↑/↓) + Home/End que mueve foco y
 * activa (activación automática). Si el consumidor pasa `idBase`, cada tab
 * recibe `id="{idBase}-tab-{key}"` y `aria-controls="{idBase}-panel-{key}"` para
 * asociarse con su `role="tabpanel"` (lo cablea `MembersTabs`).
 *
 * Tipografía **Static1 (16px) fija, no escala** entre viewports (regla de diseño
 * del lote): `text-base` en ambos tamaños (refinamiento 2026-07-14 punto 1.2 —
 * medido en Figma 765:42374 / 765:50775: botón 40px + padding 2px del contenedor
 * = 44px totales en los dos controles; solo difiere el padding-x 20/16).
 *
 * ## Props
 * - `options`: `Array<{ key: string, label: string, disabled?: boolean }>` –
 *   opciones del control. `disabled: true` → opción gris, no clickeable, sin foco
 *   y saltada en la navegación por teclado (ej. tab "Beneficios" aún no habilitada).
 * - `value`: `string` – `key` de la opción activa.
 * - `onChange`: `(key: string) => void` – callback al seleccionar.
 * - `size`: `'md' | 'sm'` – tamaño (default `'md'`; `'sm'` para el sub-selector).
 * - `ariaLabel`: `string` – etiqueta accesible del tablist.
 * - `idBase`: `string | null` – prefijo para `id`/`aria-controls` de cada tab.
 * - `customClassName`: clases extra para el contenedor.
 * - `...rest`: otras props válidas.
 */
const SIZE_CLASSES = {
  // md (tabs de página): segmentos IGUALES de 130px (Figma 765:42374: pill 130 +
  // zona no seleccionada 130 + 2px de padding = 264); min-w para no truncar
  // locales con labels más largos.
  md: 'h-[40px] min-w-[130px] px-[20px] !text-base',
  // sm (sub-selector del panel): hug al contenido (Figma 765:50775).
  sm: 'h-[40px] px-[16px] !text-base',
};
// `!text-base` (no `text-base`): Tailwind v4 pone las utilidades en `@layer`, y
// la regla base SIN capa `button { font: inherit }` (styles.css) vence a cualquier
// capa → el botón heredaba el `font-size` del body (22px) y el sub-selector "Detalle
// de progreso | Vista completa" se desbordaba de la card en ≤393px. El `!important`
// gana a la regla sin capa y fija los 16px de diseño (Static1). Mismo idiom que el
// elite-header (`!text-2xl`/`!text-lg`).

export const SegmentedControl = ({
  options = [],
  value,
  onChange,
  size = 'md',
  ariaLabel = '',
  idBase = null,
  customClassName = '',
  ...rest
}) => {
  const btnRefs = useRef([]);

  const select = useCallback((key) => {
    const opt = options.find((o) => o.key === key);
    if (opt && opt.disabled) return;
    if (onChange && key !== value) onChange(key);
  }, [onChange, value, options]);

  const focusIndex = (i) => {
    const el = btnRefs.current[i];
    if (el && typeof el.focus === 'function') el.focus();
  };

  const onKeyDown = useCallback((e) => {
    if (!options.length) return;
    const current = options.findIndex((o) => o.key === value);
    const base = current === -1 ? 0 : current;
    // Siguiente índice HABILITADO en la dirección dada (wrap, saltando disabled).
    const seek = (dir) => {
      let n = base;
      for (let k = 0; k < options.length; k += 1) {
        n = (n + dir + options.length) % options.length;
        if (!options[n].disabled) return n;
      }
      return base;
    };
    // Primer habilitado recorriendo desde `from` en dirección `dir` (Home/End).
    const edge = (from, dir) => {
      for (let n = from; n >= 0 && n < options.length; n += dir) {
        if (!options[n].disabled) return n;
      }
      return base;
    };
    let next = base;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        next = seek(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        next = seek(-1);
        break;
      case 'Home':
        e.preventDefault();
        next = edge(0, 1);
        break;
      case 'End':
        e.preventDefault();
        next = edge(options.length - 1, -1);
        break;
      default:
        return;
    }
    if (next !== base) {
      select(options[next].key);
      focusIndex(next);
    }
  }, [options, value, select]);

  const sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return html`
    <div
      role="tablist"
      aria-label=${ariaLabel || null}
      class=${`inline-flex items-center p-[2px] rounded-full bg-[#EEEFF1] max-w-max ${customClassName}`.trim()}
      data-name="segmented-control"
      onKeyDown=${onKeyDown}
      ...${rest}
    >
      ${options.map((opt, i) => {
    const isActive = opt.key === value;
    const isDisabled = !!opt.disabled;
    let stateCls = 'bg-transparent text-[var(--text-normal-secondary)] cursor-pointer';
    if (isDisabled) {
      stateCls = 'bg-transparent text-[var(--text-normal-light)] cursor-not-allowed';
    } else if (isActive) {
      stateCls = 'bg-white text-[var(--text-normal-primary)] shadow-[0px_1px_4px_0px_rgba(73,73,73,0.20)] cursor-pointer';
    }
    return html`
      <button
        key=${opt.key}
        ref=${(el) => { btnRefs.current[i] = el; }}
        type="button"
        role="tab"
        id=${idBase ? `${idBase}-tab-${opt.key}` : null}
        aria-selected=${isActive ? 'true' : 'false'}
        aria-disabled=${isDisabled ? 'true' : null}
        disabled=${isDisabled || null}
        aria-controls=${idBase ? `${idBase}-panel-${opt.key}` : null}
        tabindex=${isActive && !isDisabled ? 0 : -1}
        class=${`inline-flex items-center justify-center shrink-0 rounded-full leading-none whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-stroke-focus ${sizeCls} ${stateCls}`}
        onClick=${() => select(opt.key)}
      >
        ${/* El peso va en el <span>: la regla base sin @layer `button { font-weight: inherit }`
            vence a `.font-bold` de Tailwind sobre el <button>; el <span> no es target de ese
            reset, así que el peso sí aplica (mismo idiom que chip.js). */ ''}
        <span class=${`!m-0 antialiased ${isActive ? 'font-bold' : 'font-normal'}`}>${opt.label}</span>
      </button>
    `;
  })}
    </div>
  `;
};

export default SegmentedControl;
