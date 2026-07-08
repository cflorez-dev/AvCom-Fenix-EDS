import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * MembersProgressBar — barra simple de una condición de progreso elite (1263924).
 * Figma 518:25778 + tira inline del hero 518:27631 (I518:27634;898:25484).
 *
 * Track + fill + label + valor `x/meta`, con estados (empty / progress / completed).
 *
 * **Color del fill**: ahora se toma del **tier theme** (Figma final 518:24090
 * et al.) vía `fillStyle` (string CSS, ej. `linear-gradient(90deg,#B50080 0%,
 * #D5013B 100%)`). Si `fillStyle` está vacío, se cae al modo legacy `variant`
 * (navy/magenta) para mantener compat con consumidores fuera del hero Members.
 * - completed → verde `#1ea93c` + check (siempre, ignora `fillStyle`).
 *
 * `surface`:
 *  - 'light' (default en el hero): sobre la barra blanca → texto `#1b1b1b`, `/meta`
 *    en `#494949`, track `#d9d9d9`.
 *  - 'dark': sobre gradient oscuro → texto blanco, track `white/20`.
 *
 * Tipografía fija (Static2/14, no escala). El formateo del valor por locale lo hace
 * el caller vía `formatValue` (P3).
 *
 * ## Props
 * - `label`: string — etiqueta de la condición en progreso/empty (Static2).
 * - `labelCompleted`: string — etiqueta alternativa cuando se completa (Figma
 *   518:26305 / 26523: "Millas calificables completadas"). Si está vacía, se
 *   reutiliza `label`.
 * - `labelAccessory`: vnode — elemento opcional tras el label (ej. tooltip de info).
 * - `value`: number — progreso actual.
 * - `goal`: number — meta.
 * - `variant`: 'navy'|'magenta' — color del fill en progreso (LEGACY; se ignora
 *   si se pasa `fillStyle`). Default 'navy'.
 * - `fillStyle`: string CSS — valor de `background` para el fill (gradient del
 *   tier). Tiene prioridad sobre `variant`. Ignorado en estado completed.
 * - `surface`: 'light'|'dark' — paleta según el fondo. Default 'light'.
 * - `formatValue`: (n:number)=>string — formateo por locale. Default String.
 * - `loading`: boolean — skeleton (animate-pulse).
 * - `completedAriaLabel`: string — texto SR del check. Default 'Completado'.
 * - `customClassName`: string.
 */
const SURFACE = {
  light: {
    label: 'text-[#1b1b1b]', value: 'text-[#1b1b1b]', goal: 'text-[#494949]', track: 'bg-[#d9d9d9]', sk: 'bg-black/10',
  },
  dark: {
    label: 'text-white', value: 'text-white', goal: 'text-white/70', track: 'bg-white/20', sk: 'bg-white/20',
  },
};

export const MembersProgressBar = ({
  label = '',
  labelCompleted = '',
  labelAccessory = null,
  value = 0,
  goal = 0,
  variant = 'navy',
  fillStyle = '',
  surface = 'light',
  formatValue = (n) => String(n),
  loading = false,
  completedAriaLabel = 'Completado',
  customClassName = '',
  ...rest
}) => {
  const s = SURFACE[surface] || SURFACE.light;

  // Skeleton: label + track grises pulsando (loading mientras resuelven los wrappers).
  if (loading) {
    return html`
      <div
        class=${`flex flex-col gap-2 ${customClassName}`}
        data-name="members-progress-bar"
        data-loading="true"
        aria-hidden="true"
      >
        <span class=${`block h-[14px] w-2/5 rounded ${s.sk} animate-pulse`}></span>
        <span class=${`block h-[10px] w-full rounded-full ${s.sk} animate-pulse`}></span>
      </div>
    `;
  }

  const safeGoal = Number(goal) > 0 ? Number(goal) : 0;
  const rawValue = Math.max(0, Number(value) || 0);
  const safeValue = safeGoal > 0 ? Math.min(rawValue, safeGoal) : rawValue;
  const pct = safeGoal > 0 ? Math.min(100, Math.round((safeValue / safeGoal) * 100)) : 0;
  const completed = safeGoal > 0 && rawValue >= safeGoal;

  // Color del fill (sin ternario anidado → lint).
  // Prioridad: completed (verde) > fillStyle (tier theme) > variant (legacy).
  // `fillStyle` se aplica vía inline-style porque es un string dinámico que
  // Tailwind no puede purgar; las clases legacy `bg-[...]` quedan como
  // fallback estático para callers que no migran al theme.
  const useFillStyle = !completed && !!fillStyle;
  let fillClass = 'bg-[#2b3c46]'; // navy (condition 1 en progreso, legacy)
  if (completed) fillClass = 'bg-[#1ea93c]'; // verde completado
  else if (useFillStyle) fillClass = ''; // el background lo pone inline-style
  else if (variant === 'magenta') fillClass = 'bg-[linear-gradient(90deg,#ff0000_0%,#b50080_100%)]';

  const fillInlineStyle = { width: completed ? '100%' : `${pct}%` };
  if (useFillStyle) fillInlineStyle.background = fillStyle;

  // Label que se muestra: si está completed y hay `labelCompleted`, lo usamos
  // (Figma 518:26305 / 26523 → "Millas calificables completadas"); en otro
  // caso, mantenemos `label`.
  const displayLabel = (completed && labelCompleted) ? labelCompleted : label;

  // Check inline ICONO (16x16) — sólo cuando `completed`. Va a la IZQUIERDA del
  // label (Figma desktop 518:26304 / mobile 518:26522), no a la derecha. Color
  // verde `#1ea93c` igual que el fill.
  const checkEl = completed ? html`
    <span class="inline-flex items-center justify-center w-4 h-4 text-[#1ea93c] shrink-0">
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="w-4 h-4">
        <path
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0z"
          fill="currentColor"
        />
      </svg>
      <span class="sr-only">${completedAriaLabel}</span>
    </span>
  ` : null;

  return html`
    <div
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax=${safeGoal || undefined}
      aria-valuenow=${safeValue}
      aria-valuetext=${completed ? completedAriaLabel : `${formatValue(safeValue)}/${formatValue(safeGoal)}`}
      aria-label=${label || undefined}
      class=${`flex flex-col gap-2 ${customClassName}`}
      data-name="members-progress-bar"
      data-variant=${variant}
      data-surface=${surface}
      data-completed=${completed}
      ...${rest}
    >
      <div class="flex items-center justify-between gap-2">
        <span class="flex items-center gap-2 min-w-0 leading-none">
          ${checkEl}
          ${displayLabel && html`<span class=${`text-sm font-normal leading-[19px] truncate ${s.label}`}>${displayLabel}</span>`}
          ${labelAccessory}
        </span>
        ${!completed && html`
          <span class="text-sm leading-[19px] tabular-nums shrink-0 whitespace-nowrap">
            <span class=${`font-bold ${s.value}`}>${formatValue(safeValue)}</span><span class=${`font-normal ${s.goal}`}>/${formatValue(safeGoal)}</span>
          </span>
        `}
      </div>
      <div class=${`relative h-[10px] w-full rounded-full overflow-hidden ${s.track}`}>
        <div
          class=${`absolute inset-y-0 left-0 rounded-full ${fillClass} motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out`}
          style=${fillInlineStyle}
        ></div>
      </div>
    </div>
  `;
};

export default MembersProgressBar;
