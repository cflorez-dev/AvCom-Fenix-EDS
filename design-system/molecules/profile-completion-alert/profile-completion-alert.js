import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';
import { donutBand, donutColor, donutArc } from './profile-completion-alert.logic.js';

const html = htm.bind(h);

const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

// Donut geometry en viewBox 120 (SVG res-independiente). Figma D35 pide anillo
// fino que toca el borde exterior:
//  · `sm` (56×56) → grosor 2.8, r=25.2..28 → en viewBox 120: stroke 6, r=57
//  · `lg` (80×80) → grosor 4,   r=36..40   → en viewBox 120: stroke 6, r=57
// Coinciden en viewBox porque ambos son proporcionales (grosor/tamaño ≈ 1/20).
const R = 57;
const STROKE = 6;

/**
 * Donut SVG de completitud. Track gris + arco coloreado por banda (D35), % al
 * centro. `aria-label` legible; el SVG en sí es decorativo. `size`:
 *  - `'lg'` (default) → 80px + `%` en 20px ExtraBold (banner incompleto, D35 mobile+desktop).
 *  - `'sm'`           → 56px + `%` en 14px ExtraBold (banner slim COMPLETE, D35).
 */
const Donut = ({ percent, color, ariaLabel, size = 'lg' }) => {
  const isSm = size === 'sm';
  const dim = isSm ? 'w-[56px] h-[56px]' : 'w-[80px] h-[80px]';
  const textCls = isSm ? 'text-sm' : 'text-xl';
  const { circumference, dashOffset } = donutArc(percent, R);
  return html`
    <div class=${`relative shrink-0 ${dim}`} role="img" aria-label=${ariaLabel}>
      <svg viewBox="0 0 120 120" class="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r=${R} fill="none" stroke="var(--border-stroke-default)" stroke-width=${STROKE} />
        <circle
          cx="60" cy="60" r=${R} fill="none"
          stroke=${color} stroke-width=${STROKE} stroke-linecap="round"
          stroke-dasharray=${circumference}
          stroke-dashoffset=${dashOffset}
          style=${{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      </svg>
      <span
        class=${`absolute inset-0 flex items-center justify-center ${textCls} !leading-[19px] font-extrabold tabular-nums`}
        style=${{ color }}
        aria-hidden="true"
      >${Math.round(Number(percent) || 0)}%</span>
    </div>
  `;
};

/**
 * SVG chevron-right inline (16×16, currentColor). Reutiliza el path de
 * `icons/navigation/chevron-right.svg` para esquivar la race condition del
 * atom `Icon` cuando varios chips lo montan a la vez (el useEffect no
 * dispara re-render si otro Icon ya pobló el cache entre render y effect),
 * que dejaría el chevron como placeholder. Mismo patrón que
 * `design-system/atoms/member-status-button/member-status-button.js` (D35).
 */
const ChevronRightInline = () => html`
  <svg
    class="shrink-0 w-4 h-4"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M6.47027 4L5.53027 4.94L8.58361 8L5.53027 11.06L6.47027 12L10.4703 8L6.47027 4Z"
      fill="currentColor"
    />
  </svg>
`;

/**
 * SVG close inline (16×16, currentColor). Figma D35 (`1056:32509`) pide el
 * ícono X con contenedor 16×16 pero el path interno de solo 9.333×9.333
 * (centrado → ~3.333px de padding a cada lado). El atom `Icon` con
 * `customSize=16` usaría el `close.svg` (viewBox 14 full-bleed) que
 * renderizaría la X ocupando los 16px completos. Path derivado escalando el
 * original 14×14 por 9.333/14 (≈0.667) y trasladado (3.333, 3.333).
 * Además evita la race condition del atom `Icon` en render concurrente.
 */
const CloseInline = () => html`
  <svg
    class="shrink-0 w-4 h-4"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12.667 4.273L11.727 3.333L8 7.06L4.273 3.333L3.333 4.273L7.06 8L3.333 11.727L4.273 12.667L8 8.94L11.727 12.667L12.667 11.727L8.94 8L12.667 4.273Z"
      fill="currentColor"
    />
  </svg>
`;

/**
 * Chip-ancla de una sección incompleta (icono error naranja + label + chevron).
 * Figma D35: pill blanca con borde, ícono `alert/Error` 16px, label 14px
 * static2, chevron 16px. Padding responsivo per Figma:
 *  - mobile (`1154:47070`): `pl-3 pr-4 py-2` — right-pad extra (16) para
 *    aliviar la proximidad del chevron al borde.
 *  - desktop (`1056:32702`): `px-3 py-2` (12/12/8/8) — simétrico.
 * Es control de navegación → `<button>` semántico (no reutilizamos `Button` DS
 * porque el variant "secondary" trae tokens brand-secondary que no matchean).
 * El chevron va inline (ver `ChevronRightInline`) para evitar el placeholder
 * intermitente del atom `Icon` en render concurrente.
 */
const ChecklistChip = ({ label, onClick }) => html`
  <button
    type="button"
    onClick=${onClick}
    class="inline-flex items-center gap-2 rounded-full border border-[var(--border-stroke-default)] bg-[var(--bg-card-lighter)] pl-3 pr-4 md:pr-3 py-2 shrink-0 whitespace-nowrap text-[var(--text-normal-primary)] transition-colors hover:bg-[var(--bg-page-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
    data-name="checklist-chip"
  >
    <${Icon} icon="alert/Error" customSize=${16} color="var(--icon-accent-warning)" />
    <span class="text-sm font-normal">${label}</span>
    <${ChevronRightInline} />
  </button>
`;

/**
 * ProfileCompletionAlert — banner de completitud del perfil (1279361, Figma
 * `1056:32634`/`1056:32646`). Banner full-width arriba de la tab Datos:
 *  - **incompleto**: donut 3 colores (rojo/naranja/verde por umbrales D35) +
 *    título + contador "N pendientes" + checklist de secciones incompletas
 *    (chips ancla → `onNavigate(sectionKey)`). Scroll-x en mobile.
 *  - **100%**: donut verde + "¡Tu perfil está completo!" + (opcional)
 *    descripción + X (`onDismiss`). Figma `1056:32509` (mobile ≤767) /
 *    `1056:32350` (desktop): mismo layout slim en ambos breakpoints.
 *
 * NO recalcula completitud: recibe `percent` (de `computeProfileCompleteness`) +
 * `pending` + `sections` (incompletas) por props.
 *
 * ## Props
 * @param {number} percent 0–100
 * @param {number} pending nº de ítems pendientes (para el contador)
 * @param {Array<{key:string,label:string}>} sections secciones INCOMPLETAS (chips)
 * @param {{warning:number, positive:number}} thresholds umbrales D35
 * @param {object} labels copies i18n (completion*, etc.)
 * @param {boolean} showDescription si `true` en estado 100%, renderiza
 *   `labels.completionCompleteBody` debajo del título (spec Figma "Debe
 *   permitir que se configure si tiene o no descripción"). Default `false`
 *   para matchear el snapshot Figma actual (1056:32509 / 1056:32350).
 * @param {(key:string)=>void} onNavigate click en un chip
 * @param {()=>void} onDismiss click en la X del estado 100%
 */
export const ProfileCompletionAlert = ({
  percent = 0,
  pending = 0,
  sections = [],
  thresholds = {},
  labels = {},
  showDescription = false,
  onNavigate,
  onDismiss,
  ...rest
}) => {
  const pct = Math.round(Number(percent) || 0);
  const isComplete = pct >= 100;
  const band = donutBand(pct, thresholds.warning, thresholds.positive);
  const color = donutColor(isComplete ? 'positive' : band);
  const donutAria = tpl(labels.completionDonutAria, { percent: pct });

  // Estado COMPLETE (D35, 100%) — banner SLIM (Figma `1056:32509` mobile /
  // `1056:32350` desktop, ambos idénticos): fila única = donut 56 + título 14
  // Bold + (opcional) descripción + X 16. Border verde `--alert-success-border`
  // para reforzar el estado positivo. Estructura anidada replicando Figma:
  //  · outer `items-center` → donut vertical-center
  //  · inner `items-start` → X anclado arriba (visible cuando hay descripción)
  //  · text-col `justify-center gap-1` → título + optional body con separación
  if (isComplete) {
    const body = showDescription ? (labels.completionCompleteBody || '') : '';
    return html`
      <section
        class="flex items-center gap-4 w-full rounded-2xl bg-[var(--bg-card-lighter)] border border-[var(--alert-success-border)] p-4"
        data-name="profile-completion-alert"
        data-state="complete"
        aria-label=${labels.completionCompleteTitle || ''}
        ...${rest}
      >
        <${Donut} percent=${pct} color=${color} ariaLabel=${donutAria} size="sm" />
        <div class="flex-1 min-w-0 flex items-start gap-4">
          <div class="flex-1 min-w-0 flex flex-col gap-1 justify-center">
            <p class="text-sm font-bold text-[var(--text-normal-primary)] leading-normal !m-0">
              ${labels.completionCompleteTitle || ''}
            </p>
            ${body && html`
              <p class="text-sm font-normal text-[var(--text-normal-secondary)] leading-normal m-0">
                ${body}
              </p>
            `}
          </div>
          <${Button}
            variant="transparent"
            size="xxs"
            iconOnly=${true}
            onClick=${onDismiss}
            aria-label=${labels.completionDismissAria || 'Cerrar'}
            customClassName="shrink-0 text-[var(--icon-normal-primary)] relative top-[-2px]"
          >
            <${CloseInline} />
          </${Button}>
        </div>
      </section>
    `;
  }

  // Estado INCOMPLETE (D35) — banner con donut 80px + título + counter + chips
  // wrap. Layout responsivo (Figma):
  //  - mobile (`1154:47054`): donut + [Col: título · counter]; chips wrap abajo.
  //    Padding asimétrico `pt-4 pb-5 px-4` (Figma `pb-[20px]`).
  //  - desktop (`1056:32686`): donut + [Col: [Row: título · counter] · chips].
  //    `p-6` simétrico + gap `md:gap-6` entre título-row y chips-row (User Info
  //    Container en Figma tiene `gap-[var(--x-large,24px)]`).
  return html`
    <section
      class="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full rounded-2xl bg-[var(--bg-card-lighter)] border border-[var(--border-stroke-default)] pt-4 pb-5 px-4 md:p-6"
      data-name="profile-completion-alert"
      data-state=${band}
      aria-label=${labels.completionIncompleteTitle || ''}
      ...${rest}
    >
      <div class="flex items-center gap-4 md:gap-6 w-full md:w-auto md:flex-1 min-w-0">
        <${Donut} percent=${pct} color=${color} ariaLabel=${donutAria} size="lg" />
        <div class="flex-1 min-w-0 flex flex-col gap-2 md:gap-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
            <span class="text-sm md:text-lg font-semibold text-[var(--text-normal-primary)] leading-tight">
              ${labels.completionIncompleteTitle || ''}
            </span>
            <span class="inline-flex items-center gap-2 shrink-0 whitespace-nowrap text-sm text-[var(--text-normal-secondary)]">
              <span class="w-2 h-2 rounded-full bg-[var(--icon-accent-warning)] shrink-0" aria-hidden="true"></span>
              ${tpl(labels.completionPending, { n: pending })}
            </span>
          </div>
          ${sections.length > 0 && html`
            <div class="hidden md:flex flex-wrap gap-2 md:gap-4" data-name="completion-checklist">
              ${sections.map((s) => html`
                <${ChecklistChip}
                  key=${s.key}
                  label=${s.label}
                  onClick=${() => onNavigate && onNavigate(s.key)}
                />
              `)}
            </div>
          `}
        </div>
      </div>
      ${sections.length > 0 && html`
        <div
          class="md:hidden flex flex-nowrap gap-2 w-full overflow-x-auto scrollbar-hide"
          data-name="completion-checklist"
          role="list"
        >
          ${sections.map((s) => html`
            <${ChecklistChip}
              key=${s.key}
              label=${s.label}
              onClick=${() => onNavigate && onNavigate(s.key)}
            />
          `)}
        </div>
      `}
    </section>
  `;
};

export default ProfileCompletionAlert;
