import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { SegmentedControl } from '../../atoms/segmented-control/segmented-control.js';
import { FloatingActionButton } from '../../atoms/floating-action-button/floating-action-button.js';
import { GoalCard } from '../../molecules/goal-card/goal-card.js';
import { GoalProgressRow } from '../../molecules/goal-progress-row/goal-progress-row.js';
import { AcceleratorTooltip } from '../../molecules/accelerator-tooltip/accelerator-tooltip.js';
import { resolveFabEntry } from '../../../scripts/services/members/members-config.js';
import { getStoredCountry } from '../../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

/** POS activo tolerante (tests/SSR sin document → ''). */
const safeStoredCountry = () => {
  try { return getStoredCountry() || ''; } catch (e) { return ''; }
};

/**
 * GoalProgressPanel — panel principal de la tab Progreso (1271699, AC bloques
 * 3-6; exhibits 765-50711 / 765-51837).
 *
 * Compone: GoalCard (meta a cumplir) + header "Progreso elite en {year}" +
 * subtítulo (toggle CMS `progressDescriptionVisible`) + SegmentedControl `sm`
 * "Detalle de progreso | Vista completa" + banner "cumpliste meta para
 * mantener" + las 1-2 GoalProgressRow según el modelo.
 *
 * El cambio de sub-tab es INLINE, SIN tocar la URL (el deep-link `?tab=` es
 * SOLO de las tabs principales Progreso/Beneficios — regla del plan).
 *
 * SIN fetch y SIN lógica de negocio: recibe `panelModel` (de
 * `buildPanelModel`, goal-progress.logic.js) + `labels` y pinta.
 *
 * Layout: panel fondo blanco, radio 16, padding 24 (16 mobile), separaciones
 * 32 entre bloques (D2/D3 provisional: mocks = canónico).
 *
 * ## Props
 * - `panelModel`: modelo de `buildPanelModel` — `{goalCard, subtitleVariant,
 *   rows, metMaintainBanner, cenit, alerts}`.
 * - `labels`: labels de i18n (getEliteLabelsSync/loadEliteLabels).
 * - `year`: number — año del ciclo (del VM) para el título del panel.
 * - `subtitleVisible`: boolean — toggle CMS del subtítulo. Default true.
 * - `tierColor`: string CSS — color del tier actual (hitos `current` de la
 *   vista completa).
 * - `cfTiers`: dict de tiers del CF (tokens del GoalCard).
 * - `rowIcons`: {total?: vnode, avianca?: vnode} — íconos ilustrativos por
 *   fila (configurables desde AEM a nivel host).
 * - `fabIcons`: {total?: vnode, avianca?: vnode} — íconos del BOTÓN FAB por
 *   barra. MISMA fuente que `rowIcons` (= `eliteIcons` del CF): Figma muestra
 *   el ícono de la métrica en el círculo (lm/avión), NO un rayo. El rayo va en
 *   el ENCABEZADO del tooltip (AC 1271694 línea 49). Vacío → fallback rayo del
 *   átomo FAB.
 * - `defaultMode`: 'detail'|'full' — sub-tab inicial. Default 'detail'.
 *
 * ## Props FAB Gamification (1271694 paso 5)
 * - `fabConfig`: array — entradas del CF por POS/barra (cfg.fabConfig); null →
 *   defaults de código vía `resolveFabEntry` (multiplicación, AC bloque 10.1).
 * - `pos`: string — POS activo; vacío → `getStoredCountry()`.
 * - `fabBorderColor`: string CSS — borde 2px del tooltip = `gradientStrongFrom`
 *   del tier del socio (lo pasa el host con getEliteTierTokens).
 * - `withFab`: boolean — montar el FAB (default true). El ancla oculta del
 *   hook se emite igual cuando el FAB no aplica (contrato intacto).
 * - `customClassName`: string.
 */
const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

export const GoalProgressPanel = ({
  panelModel = null,
  labels = {},
  year = new Date().getFullYear(),
  subtitleVisible = true,
  tierColor = '#1b1b1b',
  cfTiers = {},
  rowIcons = {},
  fabIcons = {},
  defaultMode = 'detail',
  fabConfig = null,
  pos = '',
  fabBorderColor = '#1b1b1b',
  withFab = true,
  customClassName = '',
  ...rest
}) => {
  const [mode, setMode] = useState(defaultMode);
  // Tooltip del FAB: uno abierto a la vez, por fila (`${mode}-${kind}`).
  const [openFab, setOpenFab] = useState(null);
  if (!panelModel) return null;

  // --- FAB Gamification (1271694, AC bloque 10.1). Visible solo con meta
  // PENDIENTE en esa barra (fillPct < 100); entrada por POS activo con default
  // multiplicación; CTA: totales según config (buy|multiply), avianca/cenit
  // default "Reservar un vuelo". Ícono del BOTÓN = el de la fila (`fabIcons`,
  // misma fuente eliteIcons: lm/avión); el rayo vive en el header del tooltip.
  const activePos = pos || safeStoredCountry();
  const buildFab = (row) => {
    if (!withFab) return null;
    if (!(Number(row.fillPct) < 100)) return null; // meta cumplida → sin FAB
    const entry = resolveFabEntry(fabConfig, { pos: activePos, bar: row.kind });
    const title = entry.title || labels[entry.titleKey || 'fabTitle'] || '';
    const bodyKeyDefault = row.kind === 'total' ? 'fabBodyMultiply' : 'fabBodyAvianca';
    const body = entry.body || labels[entry.bodyKey || bodyKeyDefault] || '';
    let ctaKeyDefault = 'fabCtaFly';
    if (row.kind === 'total' && entry.action === 'buy') ctaKeyDefault = 'fabCtaBuy';
    const ctaLabel = entry.ctaLabel || labels[entry.ctaLabelKey || ctaKeyDefault] || '';
    const key = `${row.mode}-${row.kind}`;
    const isOpen = openFab === key;
    return html`
      <${AcceleratorTooltip}
        open=${isOpen}
        anchorPct=${row.fillPct}
        borderColor=${fabBorderColor}
        title=${title}
        body=${body}
        ctaLabel=${ctaLabel}
        ctaUrl=${entry.ctaUrl || ''}
        onClose=${() => setOpenFab(null)}
      />
      <span
        class="absolute top-1/2 z-10"
        style=${{ left: `${row.fillPct}%`, transform: 'translate(-50%, -50%)' }}
      >
        <${FloatingActionButton}
          icon=${fabIcons[row.kind] || null}
          expanded=${isOpen}
          ariaLabel=${labels.fabAriaLabel || ''}
          onClick=${() => setOpenFab(isOpen ? null : key)}
        />
      </span>
    `;
  };

  const {
    goalCard = null,
    subtitleVariant = 'default',
    rows = [],
    metMaintainBanner = false,
  } = panelModel;

  const subtitle = subtitleVariant === 'maintain'
    ? (labels.progressSubtitleMaintain || labels.progressSubtitle)
    : labels.progressSubtitle;

  const visibleRows = rows.filter((r) => r && r.mode === mode && r.visible !== false);

  return html`
    <section
      class=${`bg-white rounded-2xl border border-[var(--border-stroke-default)] p-4 md:p-6 flex flex-col gap-8 ${customClassName}`}
      data-name="goal-progress-panel"
      data-submode=${mode}
      ...${rest}
    >
      ${goalCard && html`
        <${GoalCard}
          visible=${goalCard.visible}
          tier=${goalCard.tier}
          title=${goalCard.title}
          titleParams=${goalCard.titleParams}
          body=${goalCard.body}
          bodyParams=${goalCard.bodyParams}
          cfTiers=${cfTiers}
        />
        ${/* Divider bajo la meta (mock 765-50716). */ ''}
        <span class="block w-full border-t border-dashed border-[var(--border-stroke-default)]" aria-hidden="true"></span>
      `}

      ${/* Header del panel: título+subtítulo a la izquierda, sub-selector a la
          derecha en ≥md (mock desktop); apilado y centrado en mobile. */ ''}
      <div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-4">
        <div class="flex flex-col gap-2 min-w-0">
          <span class="text-xl font-semibold leading-normal text-[var(--text-normal-primary)]">
            ${tpl(labels.progressPanelTitle, { year })}
          </span>
          ${subtitleVisible && subtitle && html`
            <span class="text-[14px] font-normal leading-[19px] text-[var(--text-normal-secondary)]">${subtitle}</span>
          `}
        </div>
        <div class="flex justify-center md:justify-end shrink-0">
          <${SegmentedControl}
            size="sm"
            options=${[
    { key: 'detail', label: labels.subTabDetail || 'Detalle de progreso' },
    { key: 'full', label: labels.subTabFull || 'Vista completa' },
  ]}
            value=${mode}
            onChange=${setMode}
            ariaLabel=${`${labels.subTabDetail || ''} / ${labels.subTabFull || ''}`}
            idBase="goal-progress-submode"
          />
        </div>
      </div>

      ${metMaintainBanner && html`
        <div
          class="flex flex-col gap-1 rounded-xl bg-[#f5f5f5] p-4"
          data-name="goal-progress-met-banner"
        >
          <span class="text-base font-bold leading-normal text-[var(--text-normal-primary)]">${labels.metGoalTitle || ''}</span>
          ${labels.metGoalBody && html`
            <span class="text-[14px] font-normal leading-[19px] text-[var(--text-normal-secondary)]">${labels.metGoalBody}</span>
          `}
        </div>
      `}

      <div
        class="flex flex-col gap-8"
        id="goal-progress-submode-panel-${mode}"
        role="tabpanel"
        aria-labelledby="goal-progress-submode-tab-${mode}"
      >
        ${visibleRows.map((row) => html`
          <${GoalProgressRow}
            key=${`${row.kind}-${row.mode}`}
            row=${row}
            labels=${labels}
            tierColor=${tierColor}
            icon=${rowIcons[row.kind === 'total' ? 'total' : 'avianca'] || null}
            fab=${buildFab(row)}
          />
        `)}
      </div>
    </section>
  `;
};

export default GoalProgressPanel;
