import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Accordion } from '../accordion/accordion.js';
import { MembersProgressBar } from '../../atoms/members-progress-bar/members-progress-bar.js';
import { FloatingActionButton } from '../../atoms/floating-action-button/floating-action-button.js';
import { AcceleratorTooltip } from '../accelerator-tooltip/accelerator-tooltip.js';
import { resolveFabEntry } from '../../../scripts/services/members/members-config.js';
import { getStoredCountry } from '../../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

/** POS activo tolerante (tests/SSR sin document → ''). */
const safeStoredCountry = () => {
  try { return getStoredCountry() || ''; } catch (e) { return ''; }
};

/**
 * CenitPanel — dropdown "Progreso Cenit" (1271699, AC bloque 7; redlines
 * 765-43108/765-43107).
 *
 * Accordion COLAPSADO por defecto (header: ícono + "Progreso Cenit" + chevron;
 * toda el área del header clickeable — base `Accordion` con su animación de
 * height). Expandido: body 1M o 2M (texto configurable con `{goal}`/`{tier}`,
 * ya interpolado en el modelo) + fila única "Millas totales con Avianca" con
 * barra gradiente Cenit (`#FF0000→#B50080`), hitos `{tier} 1M` / `Diamond 2M`
 * y contador `X/1,000,000` (o `/2,000,000`).
 *
 * Estado 2M COMPLETADO (nota 765-43107): barra llena, hito 1M en check, el
 * contador se REEMPLAZA por el texto configurable (`cenitDoneText`,
 * "¡Disfruta de Diamond de por vida!") y NO se renderiza el hook del FAB
 * ("no debe aparecer el botón de acelerador" — el FAB es del PBI 1271694).
 *
 * SIN lógica de negocio: recibe el modelo `cenit` de `buildPanelModel`.
 *
 * ## Props
 * - `cenit`: modelo — `{visible, version, done, title, body, barTitle,
 *   counterValue, counterGoal, remaining, doneText, fillPct, fillStyleKey,
 *   milestones}`. `visible: false` → no renderiza.
 * - `labels`: labels de i18n (usa `remainingLabel`).
 * - `icon`: vnode — ícono del header (configurable desde AEM a nivel host;
 *   default SIN ícono, mock canónico).
 * - `defaultOpen`: boolean — default false (colapsado, AC bloque 7).
 * - `onToggle`: (open:boolean)=>void.
 * - `formatValue`: (n)=>string — formateo del contador.
 *
 * ## Props FAB Gamification (1271694 paso 5)
 * - `fabConfig`: array — entradas del CF (cfg.fabConfig); null → defaults.
 * - `pos`: string — POS activo; vacío → `getStoredCountry()`.
 * - `fabBorderColor`: string CSS — borde del tooltip (gradientStrongFrom).
 * - `withFab`: boolean — montar el FAB (AC bloque 10.1: activo cuando el
 *   módulo está habilitado; CTA SIEMPRE "Reservar un vuelo"). En 2M completado
 *   NO se renderiza (regla 765-43107 — ni FAB ni ancla).
 * - `fabIcon`: vnode — ícono del BOTÓN FAB (misma fuente `eliteIcons` del CF;
 *   Figma muestra avión en el círculo Cenit, no rayo — el rayo va en el header
 *   del tooltip). Vacío → fallback rayo del átomo FAB.
 * - `customClassName`: string.
 */
const CENIT_GRADIENT = 'linear-gradient(90deg, #FF0000 0%, #B50080 100%)';

const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

/** Interpola `{placeholders}` envolviendo los valores en <strong> (el body del
 * mock lleva `{goal}` y `{tier}` en negrita — exhibit 765-52170). */
const renderRich = (template, params = {}) => String(template || '')
  .split(/(\{\w+\})/)
  .map((part) => {
    const m = part.match(/^\{(\w+)\}$/);
    if (!m) return part;
    const val = params[m[1]];
    if (val === null || val === undefined) return '';
    return html`<strong class="font-bold">${val}</strong>`;
  });

export const CenitPanel = ({
  cenit = null,
  labels = {},
  icon = null,
  defaultOpen = false,
  onToggle = null,
  formatValue = (n) => Number(n || 0).toLocaleString('en-US'),
  fabConfig = null,
  pos = '',
  fabBorderColor = '#1b1b1b',
  withFab = true,
  fabIcon = null,
  customClassName = '',
  ...rest
}) => {
  const [fabOpen, setFabOpen] = useState(false);
  if (!cenit || !cenit.visible) return null;
  const {
    version = '1m',
    done = false,
    title = '',
    body = '',
    bodyParams = {},
    barTitle = '',
    counterValue = 0,
    counterGoal = 0,
    remaining = 0,
    remainingTier = '',
    doneText = '',
    fillPct = 0,
    milestones = [],
  } = cenit;

  // Faltantes hacia la meta ("Faltan: X millas para Gold/Diamond" — el mock usa
  // el NOMBRE del tier, no el label del hito). Oculto al completar.
  const remainingText = (!done && remaining > 0)
    ? tpl(labels.remainingLabel, { n: formatValue(remaining), tier: remainingTier })
    : '';

  // --- FAB Gamification sobre la barra Cenit (1271694, AC bloque 10.1):
  // visible con meta pendiente y NUNCA en 2M completado; CTA default
  // "Reservar un vuelo" (entrada 'cenit' de fabConfig, default multiplicación).
  let fabContent = null;
  if (withFab && !done && Number(fillPct) < 100) {
    const entry = resolveFabEntry(fabConfig, { pos: pos || safeStoredCountry(), bar: 'cenit' });
    const fabTitle = entry.title || labels[entry.titleKey || 'fabTitle'] || '';
    const fabBody = entry.body || labels[entry.bodyKey || 'fabBodyAvianca'] || '';
    const fabCta = entry.ctaLabel || labels[entry.ctaLabelKey || 'fabCtaFly'] || '';
    fabContent = html`
      <${AcceleratorTooltip}
        open=${fabOpen}
        anchorPct=${fillPct}
        borderColor=${fabBorderColor}
        title=${fabTitle}
        body=${fabBody}
        ctaLabel=${fabCta}
        ctaUrl=${entry.ctaUrl || ''}
        onClose=${() => setFabOpen(false)}
      />
      <span
        class="absolute top-1/2 z-10"
        style=${{ left: `${fillPct}%`, transform: 'translate(-50%, -50%)' }}
      >
        <${FloatingActionButton}
          icon=${fabIcon}
          expanded=${fabOpen}
          ariaLabel=${labels.fabAriaLabel || ''}
          onClick=${() => setFabOpen((v) => !v)}
        />
      </span>
    `;
  }

  const headerTitle = html`
    <span class="flex items-center gap-3">
      ${icon && html`<span class="shrink-0" data-name="cenit-panel-icon">${icon}</span>`}
      <span class="text-xl font-semibold leading-normal text-[var(--text-normal-primary)]">${title}</span>
    </span>
  `;

  return html`
    <section
      class=${`bg-white rounded-2xl border border-[var(--border-stroke-default)] px-4 md:px-6 ${customClassName}`}
      data-name="cenit-panel"
      data-version=${version}
      data-done=${done}
      ...${rest}
    >
      <${Accordion} title=${headerTitle} defaultOpen=${defaultOpen} onToggle=${onToggle} overflowVisibleWhenOpen=${true} chevronColor="var(--icon-normal-primary)">
        <div class="flex flex-col gap-8 w-full pb-6">
          ${body && html`
            <span class="text-[16px] font-normal leading-[normal] text-[var(--text-normal-primary)]">${renderRich(body, bodyParams)}</span>
          `}
          <div class="grid grid-cols-1 gap-4 md:grid-cols-[0.75fr_1fr] lg:grid-cols-[0.5fr_1fr] md:items-center">
            <div class="flex flex-col gap-2 min-w-0">
              <span class="text-base font-bold leading-normal text-[#12191d]">${barTitle}</span>
              ${done ? html`
                <span class="text-base font-bold leading-normal text-[var(--text-normal-primary)]" data-name="cenit-done-text">
                  ${doneText}
                </span>
              ` : html`
                <div class="flex flex-col">
                  <span class="leading-normal tabular-nums">
                    <span class="text-[20px] font-semibold text-[var(--text-normal-primary)]">${formatValue(counterValue)}</span>
                    <span class="text-[14px] font-normal text-[var(--text-normal-secondary)]"> /${formatValue(counterGoal)}</span>
                  </span>
                  ${remainingText && html`
                    <span class="text-[14px] font-normal leading-[19px] text-[var(--text-normal-secondary)]">${remainingText}</span>
                  `}
                </div>
              `}
            </div>
            <${MembersProgressBar}
              fillPct=${fillPct}
              fillStyle=${CENIT_GRADIENT}
              trackColor="#EEEFF1"
              trackHeight=${16}
              milestones=${milestones}
              fabSlot=${done ? null : { pct: fillPct, kind: 'cenit' }}
              fabContent=${fabContent}
            />
          </div>
        </div>
      </${Accordion}>
    </section>
  `;
};

export default CenitPanel;
