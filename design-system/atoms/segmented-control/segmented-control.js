import { h } from '@dropins/tools/preact.js';
import { useRef, useCallback, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * SegmentedControl — toggle tipo pill del sistema de Members (1271689).
 *
 * Control segmentado genérico usado como (a) la barra de tabs de página
 * "Progreso | Beneficios" y (b) el sub-selector "Detalle de progreso | Vista
 * completa" del panel de progreso (1271699). Fondo gris `#DFDFDF`; la opción
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
 * - `size`: `'md' | 'sm' | 'lg'` – tamaño (default `'md'`; `'sm'` sub-selector;
 *   `'lg'` variante Large de Gestión de cuenta 1279360).
 * - `fluidMinW`: `boolean` – (1279360) si `true`, los botones usan
 *   `min-w-[100px] lg:min-w-[130px]` (reemplaza el min-w del size en mobile/tablet).
 *   Default `false` → el size manda (elite/booking intactos).
 * - `scrollable`: `boolean` – (1279360) si `true`, el contenedor scrollea en X
 *   (overflow-x-auto, scrollbar oculta) y auto-scrollea la opción activa a la vista
 *   (al inicio del viewport, o al final si es la última; nunca parcialmente oculta;
 *   margen 16px). Default `false` → `max-w-max` como hoy.
 * - `ariaLabel`: `string` – etiqueta accesible del tablist.
 * - `idBase`: `string | null` – prefijo para `id`/`aria-controls` de cada tab.
 * - `customClassName`: clases extra para el contenedor.
 * - `...rest`: otras props válidas.
 */
const SIZE_CLASSES = {
  // md (tabs de página): mobile ≤767px los 3 segmentos cubren el ancho a partes
  // iguales (`flex-1 basis-0` — Figma 1056:32504 usa `flex:1 0 0` en cada _segment)
  // con padding inline 12px; ≥768px ancho fijo 106px + padding inline 12px
  // (spec 2026-07-21). Tipografía 16/21 · 700 en ambos estados (activo e inactivo)
  // — arbitrary variant sobre el <span> para vencer `leading-none` del <button> y
  // el `font-normal` del inactivo.
  md: 'h-[40px] flex-1 basis-0 min-w-[100px] px-[12px] md:flex-none md:basis-auto md:w-[106px] md:min-w-0 !text-base [&_span]:!leading-[21px] [&_span]:!font-bold',
  // sm (sub-selector del panel): hug al contenido (Figma 765:50775).
  sm: 'h-[40px] px-[16px] !text-base',
  // lg (Large, Gestión de cuenta 1279360 — Figma §A exhibit 1291:45546): botón 48
  // + 2px padding contenedor = 52px totales; min-w 130 (como md). ADITIVO: md/sm
  // intactos → elite renderiza idéntico.
  lg: 'h-[48px] min-w-[130px] px-[20px] !text-base',
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
  fluidMinW = false,
  scrollable = false,
  ariaLabel = '',
  idBase = null,
  customClassName = '',
  ...rest
}) => {
  const btnRefs = useRef([]);
  const containerRef = useRef(null);

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

  // Auto-scroll de la opción activa a la vista (solo `scrollable`, 1279360). Al
  // inicio del viewport visible (o al final si es la última opción), sin quedar
  // parcialmente oculta, respetando 16px de margen (sticky 1291:45757/45758).
  useEffect(() => {
    if (!scrollable) return;
    const container = containerRef.current;
    const idx = options.findIndex((o) => o.key === value);
    const btn = btnRefs.current[idx];
    if (!container || !btn || typeof container.scrollTo !== 'function') return;
    const MARGIN = 16;
    const contRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const relLeft = (btnRect.left - contRect.left) + container.scrollLeft;
    const isLast = idx === options.length - 1;
    let left = isLast
      ? (relLeft + btnRect.width) - container.clientWidth + MARGIN
      : relLeft - MARGIN;
    if (left < 0) left = 0;
    container.scrollTo({ left, behavior: 'smooth' });
  }, [value, scrollable, options]);

  let sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  if (fluidMinW) {
    // Reemplaza el min-w fijo del size por el par fluido (mobile/tablet 100 →
    // desktop 130). Aditivo: sin `fluidMinW`, el size manda como hoy.
    sizeCls = `${sizeCls.replace(/min-w-\[\d+px\]/g, '')} min-w-[100px] lg:min-w-[130px]`
      .replace(/\s+/g, ' ').trim();
  }
  // Contenedor: `scrollable` scrollea en X en MOBILE (labels FR largos no
  // truncan); a partir de 768px vuelve a hug (Figma 1056:32312 muestra el
  // control centrado y ceñido, no full-width) porque a partir de md los tabs
  // caben sin overflow y el `flex justify-center` del wrapper lo centra. Para
  // `md` (tabs) sin scroll: llena el ancho disponible en mobile (segmentos
  // `flex-1` cubren el espacio — Figma 1056:32504) y hug a partir de 768px.
  // Para `sm`/`lg` mantiene `max-w-max` (hug).
  let containerWidthCls;
  if (scrollable) {
    containerWidthCls = 'max-w-full md:w-auto md:max-w-max overflow-x-auto md:overflow-x-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';
  } else if (size === 'md') {
    containerWidthCls = 'max-w-full md:max-w-max';
  } else {
    containerWidthCls = 'max-w-max';
  }

  return html`
    <div
      role="tablist"
      ref=${containerRef}
      aria-label=${ariaLabel || null}
      class=${`inline-flex items-center p-[2px] rounded-full bg-[#DFDFDF] w-full ${containerWidthCls} ${customClassName}`.trim()}
      data-name="segmented-control"
      onKeyDown=${onKeyDown}
      ...${rest}
    >
      ${options.map((opt, i) => {
    const isActive = opt.key === value;
    const isDisabled = !!opt.disabled;
    let stateCls = 'bg-transparent text-[var(--text-normal-secondary)] cursor-pointer hover:bg-[var(--bg-hover-light)]';
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
