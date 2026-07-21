import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * ProgressItem — hito sobre la barra de progreso elite (1271699, AC bloques
 * 4-5; anatomía de los exhibits 765-50711/765-51837: LABEL arriba (nombre +
 * monto), MARCADOR debajo (check-circle o bandera para "Inicio") y una LÍNEA
 * punteada corta que conecta con el track).
 *
 * El POSICIONAMIENTO sobre la barra lo hace el padre (MembersProgressBar
 * extendida, paso 8) — este átomo solo pinta el hito.
 *
 * ## Props
 * - `label`: string — línea principal (ej. "Mantener Gold en 2027" / "Silver").
 * - `sublabel`: string — línea secundaria (ej. "8,000" / "1M"). Opcional.
 * - `state`: 'default'|'success'|'current'|'cenit' —
 *    · default → check-circle gris `#B6B6B6` (sin acumulación).
 *    · success → check-circle verde `#1ea93c` (meta cumplida, AC bloque 5).
 *    · current → check-circle RELLENO con el color del tier (vista completa,
 *      AC bloque 4); label en bold. Color vía `stateColor` (token del tier).
 *    · cenit → check-circle con el rojo Cenit (hito 1M logrado, exhibit
 *      765-52170) — `#FF0000` sólido del gradiente Cenit.
 * - `align`: 'left'|'center'|'right' — alineación del texto respecto al
 *   marcador (por posición en la barra). Default 'center'.
 * - `icon`: vnode — reemplazo opcional del marcador (slot libre).
 * - `marker`: 'check'|'flag' — forma del marcador. 'check' (badge circular
 *   con check) para metas; 'flag' (bandera) para "Inicio". Default 'check'.
 * - `stateColor`: string CSS — color del tier para `state="current"`.
 * - `customClassName`: string.
 *
 * Tipografía Static2 (14px) FIJA — no escala entre viewports (nota §A).
 */
const STATE_BG = {
  default: 'var(--border-stroke-dark)',   // #b6b6b6 (Figma border/stroke/dark)
  success: 'var(--green-primary)',         // #1ea93c
  cenit: '#E1114C',                        // TODO(token): sin token DS aún (accent Cenit)
};

const CheckBadge = ({ bg }) => html`
  <span
    class="flex items-center justify-center w-4 h-4 rounded-full shrink-0"
    style=${{ background: bg }}
    data-marker="check"
  >
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" class="w-[9px] h-[9px]">
      <path
        d="M10 3.2a.7.7 0 0 1 0 1L5.4 8.8a.7.7 0 0 1-1 0L2.1 6.5a.7.7 0 1 1 1-1l1.8 1.8L9 3.2a.7.7 0 0 1 1 0Z"
        fill="#ffffff"
      />
    </svg>
  </span>
`;

const FlagMarker = ({ color }) => html`
  <span class="flex items-end justify-center w-4 h-4 shrink-0" style=${{ color }} data-marker="flag">
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-3.5 h-3.5">
      <path
        d="M4 1.6a.7.7 0 0 1 1.4 0v.3h6.4a.6.6 0 0 1 .5.92l-1.3 2.13 1.3 2.13a.6.6 0 0 1-.5.92H5.4v5.4a.7.7 0 0 1-1.4 0V1.6Z"
        fill="currentColor"
      />
    </svg>
  </span>
`;

const ALIGN = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

export const ProgressItem = ({
  label = '',
  sublabel = '',
  state = 'default',
  align = 'center',
  icon = null,
  marker = 'check',
  stateColor = '#1b1b1b',
  customClassName = '',
  ...rest
}) => {
  const alignCls = ALIGN[align] || ALIGN.center;
  const isCurrent = state === 'current';

  let markerColor = STATE_BG[state] || STATE_BG.default;
  if (isCurrent) markerColor = stateColor;

  let markerEl;
  if (icon) {
    markerEl = icon;
  } else if (marker === 'flag') {
    markerEl = html`<${FlagMarker} color=${markerColor} />`;
  } else {
    markerEl = html`<${CheckBadge} bg=${markerColor} />`;
  }

  return html`
    <span
      class=${`inline-flex flex-col gap-0.5 ${alignCls} ${customClassName}`}
      data-name="progress-item"
      data-state=${state}
      data-align=${align}
    ...${rest}
    >
      ${label && html`
        <span class="flex flex-col leading-tight pb-1">
          <span
            class=${`text-[14px] leading-[19px] whitespace-nowrap text-[var(--text-normal-secondary)]${isCurrent ? 'font-bold' : 'font-normal'}`}
          >${label}</span>
          ${sublabel && html`
            <span class=${`text-[14px] leading-[19px] whitespace-nowrap text-[var(--text-normal-secondary)]${isCurrent ? 'font-bold' : 'font-normal'}`}>${sublabel}</span>
          `}
        </span>
      `}
      <span class="flex flex-col items-center">
        ${markerEl}
        ${/* Línea punteada CENTRADA bajo el marcador (Figma 765-50736 → la
            bandera queda a la izq de la línea y el check centrado sobre el punto). */ ''}
        <span
          class="block w-px h-5 border-l border-dashed border-[#B6B6B6]"
          aria-hidden="true"
          data-marker-line="true"
        ></span>
      </span>
    </span>
  `;
};

export default ProgressItem;
