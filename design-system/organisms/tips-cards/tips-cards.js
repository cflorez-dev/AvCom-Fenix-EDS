import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { processContentHTML } from '../../helpers/process-content-html.js';

const html = htm.bind(h);

/**
 * TipsCards - Container component for multiple tip cards
 * Renders cards in a responsive grid layout with rounded border
 * All-in-one component that includes card items rendering
 * @param {Object} props - Component props
 * @param {Array<Object>} props.cards - Array of card objects
 *   with {icon, iconAlt, title, subtitle, description, footer}. Todos opcionales
 *   excepto title (recomendado). `subtitle` y `footer` se muestran solo si
 *   vienen; `footer` queda alineado al fondo cuando el tema es `'dark'`
 *   (justify-between + self-stretch).
 * @param {string} props.loading - Image loading strategy ('lazy' | 'eager')
 * @param {boolean} props.showTitle - Whether to show container title
 * @param {string} props.size - Card size variant ('large' | 'medium' | 'small')
 * @param {'light'|'dark'} [props.theme='light'] - Tema visual. `'light'` (default)
 *   usa los tokens de fondo claro habituales. `'dark'` invierte a fondo
 *   transparente + borde `--logo-lifemiles-light` + textos blancos, para
 *   consumo desde el interstitial darksite (Figma 9611:8019).
 * @param {string} props.customClassName - Additional CSS classes
 * @returns {import('preact').VNode} Preact component
 */
const TipsCards = ({
  cards = [],
  loading = 'lazy',
  size = 'large',
  theme = 'light',
  customClassName = '',
  ...rest
}) => {
  const isDark = theme === 'dark';

  // Contenedor: en light usa fondo brand-primary-lighter + outline; en dark
  // queda transparente con borde gris #969696 (Figma 9611:8019 — Figma alias
  // `--logo/lifemiles/light`, equivale al token semántico `--color-border-default`).
  // Dark en desktop: `lg:w-fit` — el ancho se deriva del número de cards
  // (Figma: cada card 250px + gap 48px + 24px de padding a cada lado + 1px
  // de borde). Con 2 cards ⇒ ~598px; con 3 cards ⇒ ~896px. Móvil: `w-full`.
  const containerClasses = isDark
    ? 'w-full lg:w-fit lg:max-w-[1248px] p-6 bg-transparent rounded-2xl border border-[var(--color-border-default)] inline-flex flex-col justify-start items-start gap-6'
    : 'w-full lg:max-w-[1248px] p-4 lg:px-8 lg:py-6 bg-background-brand-primary-lighter rounded-2xl outline outline-offset-[-1px] outline-border-brand-primary-disable inline-flex flex-col justify-start items-start gap-6';

  // Grid interno: mismo layout en ambos temas, solo cambia el gap horizontal
  // desktop (Figma pide 48px entre columnas en dark; light mantiene su 24px).
  // OJO: `gap-12` en este proyecto no resuelve a 48px por el font-size root,
  // así que en dark forzamos el valor pixel-exacto con `lg:gap-[48px]`.
  const gridClasses = isDark
    ? 'self-stretch flex flex-col lg:inline-flex lg:flex-row justify-start items-stretch gap-6 lg:gap-[48px]'
    : 'self-stretch flex flex-col lg:inline-flex lg:flex-row justify-start items-start gap-6';

  // Divider entre columnas: color depende del tema (dark = #969696).
  const dividerClasses = isDark
    ? 'self-stretch border-t border-[var(--color-border-default)] lg:border-t-0 lg:border-l lg:border-t-transparent lg:self-stretch'
    : 'self-stretch border-t border-border-stroke-default lg:border-t-0 lg:border-l lg:self-stretch';

  // Card wrapper: en dark cada card lleva ancho fijo 250px en desktop (Figma
  // 9611:8020) — así el contenedor `w-fit` se ajusta al número real de
  // cards en vez de estirarlas para llenar el max. Light conserva `flex-1`.
  const cardWrapperClasses = isDark
    ? 'self-stretch lg:w-[250px] lg:flex-none inline-flex justify-start items-start gap-3'
    : 'self-stretch lg:flex-1 lg:min-w-0 inline-flex justify-start items-start gap-3';

  const cardInnerClasses = isDark
    ? 'flex-1 inline-flex flex-col justify-between items-start gap-4 self-stretch'
    : 'flex-1 min-w-0 inline-flex flex-col justify-start items-start gap-3';

  // Grupo título+subtítulo: en dark el gap es 4px (Figma 9611:8021).
  const headGroupClasses = isDark
    ? 'self-stretch flex flex-col justify-start items-start gap-1'
    : 'self-stretch flex flex-col justify-start items-start gap-1';

  // Título: en dark blanco 24px (H600) fijo (no responsive: Figma no varía).
  const titleClasses = isDark
    ? 'self-stretch justify-start text-white text-2xl font-bold leading-normal'
    : 'self-stretch justify-start text-text-normal-primary text-lg lg:text-xl font-bold leading-[1.5rem] lg:!leading-auto';

  // Subtitle (dark-only, opcional): gris claro 16px, line-height 1.5.
  const subtitleClasses = 'self-stretch text-[#d9d9d9] text-base font-normal leading-[1.5]';

  // Description: en dark blanco 20px (P500); en light hereda tokens actuales.
  const descriptionClasses = isDark
    ? 'tips-card-description self-stretch justify-start text-white text-lg font-normal leading-[1.5]'
    : 'tips-card-description self-stretch justify-start text-text-normal-primary text-sm font-normal leading-normal';

  const descriptionPClass = isDark
    ? 'text-lg font-normal leading-[1.5] !m-0'
    : 'text-sm font-normal leading-normal !m-0';

  // Footer text (dark-only, opcional): Figma P500 → 20px Regular blanco
  // line-height 1.5. Se pinta como último bloque de la columna para aprovechar
  // el justify-between del card inner.
  const footerClasses = 'self-stretch text-white text-xl font-normal leading-[1.5] whitespace-pre-line';

  return html`
    <div
      class="${containerClasses} ${customClassName}"
      ...${rest}
    >
      <div class="self-stretch flex flex-col justify-start items-start gap-6">
        <div class=${gridClasses}>
          ${cards.map((card, index) => html`
            ${index > 0 && html`
              <div class=${dividerClasses}></div>
            `}
            <div data-size=${size} class=${cardWrapperClasses}>
              ${card.icon && html`
                <div class="w-6 h-6 relative flex-shrink-0">
                  <img
                    src=${card.icon}
                    alt=${card.iconAlt || 'Tip icon'}
                    loading=${loading}
                    decoding="async"
                    class="w-5 h-5 left-[2px] top-[2px] absolute object-contain"
                  />
                </div>
              `}
              <div class=${cardInnerClasses}>
                <div class=${headGroupClasses}>
                  ${card.title && html`
                    <div class=${titleClasses}>
                      ${card.title}
                    </div>
                  `}
                  ${card.subtitle && html`
                    <div class=${subtitleClasses}>
                      ${card.subtitle}
                    </div>
                  `}
                  ${card.description && html`
                    <div
                      class=${descriptionClasses}
                      dangerouslySetInnerHTML=${{
    __html: processContentHTML(card.description || '', 'informative', {
      pClassName: descriptionPClass,
    }),
  }}
                    ></div>
                  `}
                </div>
                ${card.footer && html`
                  <div class=${footerClasses}>${card.footer}</div>
                `}
              </div>
            </div>
          `)}
        </div>
      </div>
    </div>
  `;
};

export default TipsCards;
