import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Accordion } from '../accordion/accordion.js';

const html = htm.bind(h);

/**
 * HowToEarnPanel — acordeón INLINE "Cómo ganar millas calificables" (1271699,
 * AC bloque 8 + decisión A4: manda el diseño — acordeón inline bajo el
 * GoalProgressPanel, NO bottomsheet/modal; exhibits 765-75400/75734/75813).
 *
 * Colapsado: ícono + título + chevron (alto ~74 desktop / ~72 mobile per
 * redlines). Expandido: 3 secciones (título + bullets + tip de conversión) en
 * **3 columnas ≥768 con divisores verticales, apiladas ≤767** (decisión D3:
 * mocks = canónico). Tips: 1:1 · 1:2 · 1:20.
 *
 * Secciones 2-3 (Aliados / Bonos) se OCULTAN si el tier del socio es MAYOR a
 * `maxTier23` (config `howToEarnSections23MaxTier`, default 'gold-cenit' —
 * regla AC A5, data-driven aunque el diseño no la muestre). Comparación por
 * orden de la escalera de tiers (incluye variantes cenit).
 *
 * Todo texto por `labels` (i18n `members.elite.progress.howToEarn.*`); las
 * listas de bullets llegan como string separado por `|` (el componente
 * splitea) — así cada sección es UNA fila Key→Text editable en el spreadsheet.
 *
 * ## Props
 * - `tier`: string — tierBase del socio (para la regla A5).
 * - `maxTier23`: string — último tier (inclusive) que VE las secciones 2-3.
 * - `labels`: labels de i18n (howToEarnTitle, howToEarnS{1..3}{Title,Items,Tip}).
 * - `icons`: {header?, s1?, s2?, s3?} vnodes — íconos configurables (AEM;
 *   header default SIN ícono, mock canónico).
 * - `defaultOpen`: boolean — default false.
 * - `onToggle`: (open:boolean)=>void.
 * - `customClassName`: string.
 */
const TIER_ORDER = ['lifemiles', 'red-plus', 'silver', 'gold', 'gold-cenit', 'diamond', 'diamond-cenit', 'magno'];
const orderOf = (tier) => {
  const idx = TIER_ORDER.indexOf(String(tier || '').toLowerCase());
  return idx < 0 ? 0 : idx; // tier desconocido → base (fail-open: ve todo)
};

const TrophyIcon = () => html`
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="w-5 h-5">
    <path
      d="M5 2.5h10v1.7h2.5v2.1a3.3 3.3 0 0 1-3 3.3 4.6 4.6 0 0 1-3.7 3v1.9h2.7v1.7H6.5v-1.7h2.7v-1.9a4.6 4.6 0 0 1-3.7-3 3.3 3.3 0 0 1-3-3.3V4.2H5V2.5Zm-1 3.4v.4c0 .8.5 1.4 1.1 1.7A9 9 0 0 1 5 6.3v-.4H4Zm12 0h-1v.4c0 .6 0 1.1-.1 1.7.6-.3 1.1-1 1.1-1.7v-.4Z"
      fill="#5a5a5a"
    />
  </svg>
`;

const DefaultSectionIcon = () => html`
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="w-[14px] h-[14px]">
    <circle cx="8" cy="8" r="6" stroke="#1b1b1b" stroke-width="1.4" />
  </svg>
`;

const splitItems = (raw) => String(raw || '')
  .split('|')
  .map((s) => s.trim())
  .filter(Boolean);

const Section = ({
  title, items, tip, icon,
}) => html`
  <div class="flex flex-col justify-between gap-4 flex-1 min-w-0" data-name="how-to-earn-section">
    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-[#f5f5f5] shrink-0 overflow-hidden text-[var(--icon-normal-primary)]">
          ${icon || html`<${DefaultSectionIcon} />`}
        </span>
        <span class="text-base font-bold leading-normal text-[var(--text-normal-primary)]">${title}</span>
      </div>
      <ul class="list-disc flex flex-col text-[14px] font-normal leading-[19px] text-[var(--text-normal-primary)]">
        ${items.map((item) => html`<li key=${item} class="ms-[21px]">${item}</li>`)}
      </ul>
    </div>
    ${tip && html`
      <div class="flex items-center gap-2 rounded-xl bg-[#f5f5f5] p-2">
        <${TrophyIcon} />
        <span class="text-[14px] font-normal leading-[19px] text-[var(--text-normal-secondary)]">${tip}</span>
      </div>
    `}
  </div>
`;

export const HowToEarnPanel = ({
  tier = 'lifemiles',
  maxTier23 = 'gold-cenit',
  labels = {},
  icons = {},
  defaultOpen = false,
  onToggle = null,
  customClassName = '',
  ...rest
}) => {
  // Regla A5: secciones 2-3 solo para tiers ≤ maxTier23 (orden de escalera).
  const show23 = orderOf(tier) <= orderOf(maxTier23);

  const sections = [
    {
      key: 's1', title: labels.howToEarnS1Title, items: splitItems(labels.howToEarnS1Items), tip: labels.howToEarnS1Tip, icon: icons.s1,
    },
    ...(show23 ? [
      {
        key: 's2', title: labels.howToEarnS2Title, items: splitItems(labels.howToEarnS2Items), tip: labels.howToEarnS2Tip, icon: icons.s2,
      },
      {
        key: 's3', title: labels.howToEarnS3Title, items: splitItems(labels.howToEarnS3Items), tip: labels.howToEarnS3Tip, icon: icons.s3,
      },
    ] : []),
  ];

  const headerTitle = html`
    <span class="flex items-center gap-3">
      ${icons.header && html`<span class="shrink-0" data-name="how-to-earn-icon">${icons.header}</span>`}
      <span class="text-xl font-semibold leading-normal text-[var(--text-normal-primary)]">${labels.howToEarnTitle || ''}</span>
    </span>
  `;

  return html`
    <section
      class=${`bg-white rounded-2xl border border-[var(--border-stroke-default)] px-4 md:px-6 py-2 md:py-[9px] ${customClassName}`}
      data-name="how-to-earn-panel"
      data-sections=${sections.length}
      ...${rest}
    >
      <${Accordion} title=${headerTitle} defaultOpen=${defaultOpen} onToggle=${onToggle} chevronColor="var(--icon-normal-primary)">
        <div class="flex flex-col md:flex-row gap-6 md:gap-4 w-full items-stretch pb-6">
          ${sections.map((s, i) => html`
            <span key=${s.key} class="contents">
              ${i > 0 && html`<span class="hidden md:block w-px self-stretch bg-[var(--border-stroke-default)] shrink-0" aria-hidden="true"></span>`}
              <${Section} title=${s.title} items=${s.items} tip=${s.tip} icon=${s.icon} />
            </span>
          `)}
        </div>
      </${Accordion}>
    </section>
  `;
};

export default HowToEarnPanel;
