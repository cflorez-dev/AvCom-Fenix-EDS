import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { getTierTheme } from '../../helpers/members-tier-theme.js';
import { MembersDataGrid } from '../members-data-grid/members-data-grid.js';
import { MembersMembershipCard } from '../members-membership-card/members-membership-card.js';
import { MembersQuickActions } from '../members-quick-actions/members-quick-actions.js';
import { MembersEliteProgress } from '../members-elite-progress/members-elite-progress.js';
import { MembersCopyMembership } from '../../atoms/members-copy-membership/members-copy-membership.js';
import Breadcrumb from '../breadcrumb/breadcrumb.js';

const html = htm.bind(h);

/**
 * MembersHeroExpanded — estado EXPANDIDO del hero (1263924). Figma 518:23344
 * (Dashboard) / 518:27631 (Mi Lifemiles desktop). COMPARTIDO con el Dashboard
 * hermano 1263921 (decisión P1=A): recibe TODO por props (VM + config + copies),
 * sin acoplarse a "Mi Lifemiles".
 *
 * Compone, sobre el gradient del tier: saludo + toggle "Ocultar detalle ▴" +
 * `members-data-grid` + `members-membership-card` (solo ≥1024, vía
 * `hidden lg:block` — breakpoint `lg:` de Tailwind) +
 * `members-quick-actions` + `members-elite-progress`.
 *
 * ## Props
 * - `greeting`: string — saludo ya compuesto (ej. "Hola, Sebastián").
 * - `tier`, `tierThemes`, `tierLabel` — tema y label del tier.
 * - `toggleLabel`, `toggleAriaLabel`, `onToggle` — toggle "Ocultar detalle".
 * - `grid`: object — props de `members-data-grid` (valores YA formateados).
 * - `quickActions`: array — acciones (de `cfg.hero.quickActions`).
 * - `opensInNewWindowLabel`: string — a11y de acciones en nueva pestaña.
 * - `elite`: object|null — `EliteProgressVM`.
 * - `eliteCopies`: object — copies de `members-elite-progress`.
 * - `memberName`: string — nombre para la tarjeta de membresía.
 * - `logoUrl`, `logoAlt` — lockup de la tarjeta.
 * - `formatValue`: (n)=>string — formateo por locale (barras elite).
 * - `borderAccentColor`: string|null.
 * - `showToggle`: boolean — render del botón "Ocultar detalle" (toggle
 *   colapsable). Default `true` (comportamiento histórico). En `/members/profile`
 *   el bloque lo pasa en `false` (hero siempre expandido, sin toggle). Otras
 *   superficies que SÍ permitan colapsar (ej. Mi Lifemiles landing) deben
 *   dejarlo en `true` y cablear `onToggle`.
 * - `customClassName`: string.
 */
export const MembersHeroExpanded = ({
  greeting = '',
  tier = 'lifemiles',
  tierThemes = null,
  tierLabel = '',
  toggleLabel = 'Ocultar detalle',
  toggleAriaLabel = '',
  onToggle = null,
  showToggle = true,
  grid = {},
  quickActions = [],
  opensInNewWindowLabel = '',
  elite = null,
  eliteCopies = {},
  memberName = '',
  logoUrl = null,
  logoAlt = 'Avianca LifeMiles',
  formatValue = (n) => String(n),
  borderAccentColor = null,
  breadcrumbItems = null,
  breadcrumbHomeLabel = 'Mi Lifemiles',
  customClassName = '',
  ...rest
}) => {
  const theme = getTierTheme(tier, tierThemes || {});
  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, ${theme.gradientFrom} ${theme.gradientFromStop}, ${theme.gradientTo} ${theme.gradientToStop})`,
    ...(borderAccentColor ? { borderColor: borderAccentColor } : {}),
  };

  // Toggle "Ocultar detalle": SOLO se construye si la superficie permite colapsar.
  // En `/members/profile` (Cuenta Lifemiles) `showToggle=false` ⇒ hero estático
  // expandido sin botón. En Mi Lifemiles landing/otras páginas con colapsable,
  // mantener `showToggle=true` y pasar `onToggle`.
  const toggle = showToggle ? html`
    <button
      type="button"
      onClick=${onToggle}
      aria-expanded="true"
      aria-label=${toggleAriaLabel || toggleLabel}
      class="group inline-flex items-center gap-[4px] shrink-0 bg-transparent border-0 p-0 cursor-pointer text-white font-normal! text-[14px]! leading-[14px]! lg:text-[16px]! lg:leading-[16px]! outline-none rounded-[4px] focus-visible:[box-shadow:0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff]"
      data-name="members-hero-toggle"
    >
      ${/* Estados del CTA (Figma 518:22242 "Action Button"): hover = SUBRAYADO solo
           en la etiqueta; active/pressed = SemiBold. El `!` es obligatorio por el
           `font: inherit` sin capa de `styles.css` (ver members-hero-compact). */ ''}
      <span class="group-hover:underline group-hover:decoration-solid group-active:no-underline group-active:font-semibold!">${toggleLabel}</span>
      ${/* chevron-up (estado expandido): mismo path relleno del DS que usa
           `header-button.js`, rotado 180°. Antes era un chevron STROKED dibujado a
           mano, distinto del recurso de diseño (1284630). */ ''}
      <svg width="24" height="24" viewBox="0 0 16 16" fill="none" aria-hidden="true" class="rotate-180">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M11.06 5.72656L8 8.7799L4.94 5.72656L4 6.66656L8 10.6666L12 6.66656L11.06 5.72656Z"
          fill="currentColor"
        />
      </svg>
    </button>
  ` : null;

  return html`
    <div
      class=${`relative w-full flex flex-col gap-[24px] px-[16px] pt-[24px] pb-[16px] md:px-[24px] md:pt-[32px] md:pb-[24px] lg:px-[32px] lg:pt-[32px] lg:pb-[32px] ${borderAccentColor ? 'border border-solid' : ''} ${customClassName}`}
      style=${gradientStyle}
      data-name="members-hero-expanded"
      data-tier=${theme.key}
      ...${rest}
    >
      ${Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0 && html`
        <div
          class=${`max-w-[1248px] w-full mx-auto ${!showToggle ? 'lg:mb-[16px]' : ''}`}
          data-name="members-hero-breadcrumb"
        >
          <${Breadcrumb}
            tone="dark"
            items=${breadcrumbItems}
            homeLabel=${breadcrumbHomeLabel}
          />
        </div>
      `}
      <div class="flex items-center gap-[24px] max-w-[1248px] w-full mx-auto">
        <div class="flex flex-col min-w-0 flex-1">
          <h2
            class="m-0! min-w-0 font-semibold! text-white! text-[20px]! leading-[26px]! max-w-full min-[640px]:text-[24px]! min-[640px]:leading-[32px]! lg:max-w-none lg:text-[28px]! lg:leading-[37px]!"
            data-name="members-hero-greeting"
          >${greeting}</h2>
          ${/* Figma 518:24516 (mobile <680): nº socio inline bajo el saludo
              (sin label). En ≥680 vive dentro de MembersDataGrid (col derecha). */ ''}
          ${grid?.membershipNumber && html`
            <div class="hidden max-[679px]:block mt-[4px]" data-name="members-hero-membership-inline">
              <${MembersCopyMembership}
                membershipNumber=${grid.membershipNumber}
                copyAriaLabel=${grid.copyAriaLabel || 'Copiar número de socio'}
                copiedLabel=${grid.copiedLabel || 'Copiado'}
                size="lg"
              />
            </div>
          `}
        </div>
        ${toggle}
      </div>

      ${/* Comp 518:27631 (profile) / 518:22622 (dashboard colapsable): el área
          de datos es un bloque de 2 columnas (balance + quick-actions | divisor
          + estatus + nº socio); la tarjeta va a la derecha (≥1024). Las
          quick-actions entran como slot de la columna izquierda. Alto del grid
          capado a 171px en ≥1024 (aplica a AMBOS modos) para que MembersDataGrid
          nunca crezca más allá de esa medida; el card slot puede visualmente
          crecer a 200px porque usa `overflow-visible` (el max-h del grid no
          clipa gracias al overflow del propio slot). En `/members/profile`
          (`!showToggle`) usamos `items-start` en vez de `items-stretch` para no
          forzar al DataGrid a estirarse al alto de la fila cuando la card
          asoma 29px extra. Ancho de la 2ª columna varía por modo: dashboard
          usa 289px (variante compact Figma 518:22622); profile usa 340px
          (variante grande 224×200 con margen extra).
          Visibilidad de la card: `lg:` (≥1024px) — confirmado por producto:
          en <1024 el hero queda con el data-grid full-width y la card no se
          renderiza. Ver JSDoc del organism y de MembersMembershipCard. */ ''}
      <div class=${`grid grid-cols-1 gap-6 lg:gap-[32px] ${showToggle ? 'lg:grid-cols-[minmax(0,1fr)_289px]' : 'lg:grid-cols-[minmax(0,1fr)_340px]'} ${showToggle ? 'lg:items-stretch' : 'lg:items-start'} lg:max-h-[171px] lg:overflow-visible max-w-[1248px] w-full mx-auto`}>
        <${MembersDataGrid}
          ...${grid}
          dividerColor=${theme.dividerColor || ''}
          quickActions=${html`
            <${MembersQuickActions}
              actions=${quickActions}
              opensInNewWindowLabel=${opensInNewWindowLabel}
            />
          `}
        />
        <div
          class=${`hidden lg:block lg:overflow-visible ${showToggle ? 'lg:max-h-[170px]' : 'lg:max-h-[200px] lg:relative lg:-top-[42px]'}`}
          data-name="members-hero-card-slot"
        >
          <${MembersMembershipCard}
            tier=${tier}
            tierThemes=${tierThemes}
            tierLabel=${tierLabel}
            memberName=${memberName}
            logoUrl=${logoUrl}
            logoAlt=${logoAlt}
            compact=${showToggle}
            customClassName=${showToggle ? 'lg:max-h-[170px]' : 'lg:max-h-[200px]'}
          />
        </div>
      </div>

      ${/* Tira elite: barra BLANCA full-width al pie del hero (comp 518:27631),
          NO stacked dentro de la columna izquierda. */ ''}
      ${elite && html`
        <div class="max-w-[1248px] w-full mx-auto lg:mt-4" data-name="members-hero-elite-slot">
          <${MembersEliteProgress}
            elite=${elite}
            formatValue=${formatValue}
            barFillStyle=${theme.progressBarFill || ''}
            ...${eliteCopies}
          />
        </div>
      `}
    </div>
  `;
};

export default MembersHeroExpanded;
