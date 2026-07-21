import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { MembersProgressBar } from '../../atoms/members-progress-bar/members-progress-bar.js';

const html = htm.bind(h);

/**
 * GoalProgressRow — fila del panel de progreso elite (1271699, AC bloque 5):
 * bloque de texto (ícono + título + hint + contador `X /meta` con X en bold +
 * indicador de faltantes) | barra extendida con milestones.
 *
 * Layout (decisión D2 provisional — mocks = canónico):
 *  - ≥1024: grid `0.5fr / 1fr`.
 *  - 768-1023: grid `0.75fr / 1fr`.
 *  - ≤767: columna (texto arriba, barra abajo), gap 16.
 *
 * CERO lógica de negocio: recibe el MODELO del row ya resuelto por
 * `goal-progress.logic.js` (`buildPanelModel().rows[]`) y solo lo pinta.
 *
 * Hook FAB (PBI 1271694): la fila pasa `fabSlot` a la barra → ancla vacía
 * oculta `.goal-progress-fab-slot` posicionada en el % de avance.
 *
 * ## Props
 * - `row`: modelo del row — `{kind, mode, title, hint, counterValue,
 *   counterGoal, remaining, remainingTier, fillPct, fillStyleKey, milestones}`.
 * - `labels`: labels de i18n; usa `remainingLabel` ("Faltan: {n} millas para
 *   {tier}").
 * - `icon`: vnode — ícono ilustrativo del bloque de texto (configurable desde
 *   AEM a nivel organism). Default: círculo gris placeholder.
 * - `tierColor`: string CSS — color del estado `current` de los hitos (vista
 *   completa).
 * - `formatValue`: (n)=>string — formateo del contador. Default coma-grouping
 *   (formato de los mocks).
 * - `withFabSlot`: boolean — renderizar el ancla del FAB. Default true.
 * - `fab`: vnode — FAB + tooltip ya resueltos por el organism (1271694 paso 5);
 *   se montan sobre el ancho de la barra vía `fabContent`. Default null.
 * - `customClassName`: string.
 */
const FILL_STYLES = {
  total: '#2B3C46',
  avianca: 'linear-gradient(90deg, #FF0000 0%, #B50080 100%)',
  cenit: 'linear-gradient(90deg, #FF0000 0%, #B50080 100%)',
};
const TRACK_COLOR = '#EEEFF1';
const TRACK_HEIGHT = 16;

const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

export const GoalProgressRow = ({
  row = null,
  labels = {},
  icon = null,
  tierColor = '#1b1b1b',
  formatValue = (n) => Number(n || 0).toLocaleString('en-US'),
  withFabSlot = true,
  fab = null,
  customClassName = '',
  ...rest
}) => {
  if (!row) return null;
  const {
    kind = 'total',
    mode = 'detail',
    title = '',
    hint = '',
    counterValue = 0,
    counterGoal = 0,
    remaining = 0,
    remainingTier = '',
    fillPct = 0,
    fillStyleKey = kind,
    milestones = [],
  } = row;

  const remainingText = remaining > 0
    ? tpl(labels.remainingLabel, { n: formatValue(remaining), tier: remainingTier })
    : '';

  return html`
    <div
      class=${`grid grid-cols-1 gap-4 md:grid-cols-[0.75fr_1fr] lg:grid-cols-[0.5fr_1fr] md:items-center ${customClassName}`}
      data-name="goal-progress-row"
      data-kind=${kind}
      data-mode=${mode}
      ...${rest}
    >
      <div class="flex items-start gap-3 min-w-0">
        <span
          class="flex items-center justify-center w-6 h-6 rounded-full bg-[#f5f5f5] shrink-0 overflow-hidden"
          data-name="goal-progress-row-icon"
        >${icon}</span>
        <div class="flex flex-col gap-2 min-w-0">
          <div class="flex flex-col">
            <span class="text-base font-bold leading-normal text-[#12191d]">${title}</span>
            ${hint && html`<span class="text-[14px] font-normal leading-[19px] text-[var(--text-normal-secondary)]">${hint}</span>`}
          </div>
          <div class="flex flex-col">
            <span class="leading-normal tabular-nums">
              <span class="text-[20px] font-semibold text-[var(--text-normal-primary)]">${formatValue(counterValue)}</span>
              <span class="text-[14px] font-normal text-[var(--text-normal-secondary)]"> /${formatValue(counterGoal)}</span>
            </span>
            ${remainingText && html`
              <span class="text-[14px] font-normal leading-[19px] text-[var(--text-normal-secondary)]">${remainingText}</span>
            `}
          </div>
        </div>
      </div>
      <${MembersProgressBar}
        fillPct=${fillPct}
        fillStyle=${FILL_STYLES[fillStyleKey] || FILL_STYLES.total}
        trackColor=${TRACK_COLOR}
        trackHeight=${TRACK_HEIGHT}
        milestones=${milestones}
        milestoneStateColor=${tierColor}
        fabSlot=${withFabSlot ? { pct: fillPct, kind: fillStyleKey } : null}
        fabContent=${fab}
      />
    </div>
  `;
};

export default GoalProgressRow;
