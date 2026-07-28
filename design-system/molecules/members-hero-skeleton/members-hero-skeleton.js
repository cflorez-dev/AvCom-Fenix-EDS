import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * MembersHeroSkeleton — placeholder de carga del MembersHero expandido.
 *
 * Replica la geometría del hero expandido (greeting + balance + shortcuts +
 * status + tier card + promo) con bloques `#e9e9e9` y un barrido lateral
 * continuo de izquierda a derecha (gradient 6-stops del Figma, ver
 * `.members-hero__sk` en members-hero.css). El barrido respeta
 * `prefers-reduced-motion` (la animación se desactiva sin tocar el layout).
 *
 * ## Alineación con el hero real (evita CLS al hidratar)
 * El organism `members-hero` renderiza este skeleton dentro de un wrapper
 * cuyo padding coincide EXACTAMENTE con el root de `MembersHeroExpanded`:
 *   - Mobile:  `px-[16px] pt-[24px] pb-[16px]`
 *   - Tablet:  `md:px-[24px] md:pt-[32px] md:pb-[24px]`
 *   - Desktop: `lg:p-[32px]`
 * Por eso este componente NO añade padding propio. Sí aplica
 * `max-w-[1248px] w-full mx-auto` en el root — el mismo cap que usan las
 * secciones internas del hero real (breadcrumb, greeting+toggle, grid) para
 * centrar el contenido horizontalmente en viewports >1248px. Con eso, al
 * hidratar, breadcrumb/greeting/balance quedan en la misma coordenada X e Y.
 *
 * ## Figma (spec vigente 2026-07-27, "Avianca Members 16072026")
 *  - Mobile < 640px: 518:24796 — greeting 174×18 + status pill 118×16 +
 *    balance container 361×64 (3 líneas por columna con divider `h-[64px]`) +
 *    shortcuts + promo 361×200. NO tier card ni columna status.
 *  - Tablet 640–1023px: 518:24717 — greeting 337×20; LEFT: balance + shortcuts,
 *    RIGHT: Lifemiles Status con divisor vertical. Sin tier card. Promo 704×186.
 *  - Desktop ≥ 1024px: 518:24636 — content section (greeting 309×23 + balance
 *    + shortcuts + status column + tier card 340×200) + promo banner 1248×86.
 *
 * ## Tamaños fijos por Figma (NO tokens DS)
 *  - Circle del shortcut: `w-[48px] h-[48px]`. Este proyecto tiene
 *    `--spacing-1: 6.4px` (no 4px), por lo que `w-12 h-12` renderiza 76.8px
 *    en vez de 48px (ver `.github` memory tailwind-v4-gotchas). SIEMPRE usar
 *    arbitrary values en el skeleton para respetar las proporciones del spec.
 *  - Padding shortcut item: `pt-[8px] pb-[4px] px-[4px] gap-[2px]`.
 *  - Balance divider: mobile `h-[64px]` (3 líneas por columna), tablet+desktop
 *    `h-[44px]` (2 líneas por columna).
 *  - Alturas de líneas de texto: `h-[12px]` (label) / `h-[16px]` (points).
 *
 * ## A11y
 * El consumidor (organism `MembersHero`) envuelve el skeleton con
 * `role="status" aria-live="polite" aria-busy="true"` + texto sr-only con el
 * label de carga. Esta molecule NO repite esos roles para no duplicar
 * anuncios; solo expone `data-name="members-hero-skeleton"` para query/test.
 *
 * @param {Object} props
 * @param {string} [props.customClassName=''] - clases extra para el root.
 */
export const MembersHeroSkeleton = ({ customClassName = '' } = {}) => {
  // Sub-componente helper: un bloque del skeleton con shimmer animado.
  const sk = (extraClasses = '') => html`
    <span class=${`members-hero__sk block ${extraClasses}`} aria-hidden="true"></span>
  `;

  // 4 shortcuts (circle 48px + 2 label lines w-72 × 12). Mismo patrón en los
  // 3 viewports. Padding/gap tomados del Shortcut_Item Figma (518:24863 etc.).
  const shortcut = () => html`
    <div class="flex flex-col items-center gap-[2px] px-[4px] pt-[8px] pb-[4px]">
      ${sk('w-[48px] h-[48px] rounded-full')}
      <div class="flex flex-col gap-[4px] w-[72px] pt-[4px]">
        ${sk('h-[12px] rounded-[4px]')}
        ${sk('h-[12px] rounded-[4px]')}
      </div>
    </div>
  `;

  return html`
    <div
      class=${`w-full max-w-[1248px] mx-auto flex flex-col gap-6 lg:gap-10 ${customClassName}`}
      data-name="members-hero-skeleton"
    >
      ${/* Content section: mobile stack → tablet+ grid horizontal con divider. */ ''}
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div class="flex flex-1 flex-col gap-6 min-w-0">
          ${/* Greeting: mobile 174×18 (518:24817), tablet 337×20 (518:24737),
              desktop 309×23 (518:24656). */ ''}
          ${sk('h-[18px] w-[174px] md:h-[20px] md:w-[337px] lg:h-[23px] lg:w-[309px] rounded-[4px]')}

          ${/* Status pill EXCLUSIVA mobile (Figma 518:24840): 118×16 — sustituye
              la columna "Lifemiles Status" que en tablet/desktop vive a la derecha. */ ''}
          ${sk('h-[16px] w-[118px] rounded-[4px] md:hidden')}

          <div class="flex flex-col gap-6 md:flex-row md:items-start md:gap-6">
            ${/* IZQ (siempre visible): balance container + 4 shortcuts. */ ''}
            <div class="flex flex-col gap-5 w-full md:w-[361px] md:shrink-0">
              ${/* Balance container. Mobile (518:24846): 3 líneas por columna
                  + divider h-[64px]. Tablet/desktop (518:24740 / 24659):
                  2 líneas por columna + divider h-[44px]. */ ''}
              <div class="flex gap-[32px] items-start rounded-2xl">
                <div class="flex flex-col">
                  ${sk('h-[12px] w-[42px] rounded-[4px] mt-[4px]')}
                  ${sk('h-[16px] w-[115px] rounded-[4px] mt-[5px]')}
                  ${sk('h-[12px] w-[110px] rounded-[4px] mt-[4px] md:hidden')}
                </div>
                ${sk('w-px h-[64px] md:h-[44px] rounded-[2px]')}
                <div class="flex flex-col">
                  ${sk('h-[12px] w-[136px] rounded-[4px] mt-[5px]')}
                  ${sk('h-[16px] w-[110px] rounded-[4px] mt-[5px]')}
                  ${sk('h-[12px] w-[110px] rounded-[4px] mt-[4px] md:hidden')}
                </div>
              </div>

              ${/* Shortcuts grid 4-cols (Figma 518:24862 / 24752 / 24671).
                  El ancho fijo 344px viene del spec tablet/desktop; en mobile
                  ocupa el 100% del contenedor (361px). */ ''}
              <div class="grid grid-cols-4 gap-x-[8px] gap-y-[24px] w-full max-w-[344px]">
                ${shortcut()}
                ${shortcut()}
                ${shortcut()}
                ${shortcut()}
              </div>
            </div>

            ${/* DER (tablet+desktop): Lifemiles Status con divisor vertical
                full-height (Figma 518:24777 / 518:24697). Mobile no muestra esta
                columna — ya está representada por la "status pill" arriba. */ ''}
            <div class="hidden md:flex md:items-stretch md:gap-[32px] md:flex-1 md:min-w-0 md:self-stretch">
              ${sk('w-px self-stretch rounded-[2px]')}
              <div class="flex flex-col gap-[24px] justify-center">
                <div class="flex flex-col gap-[4px]">
                  ${sk('h-[12px] w-[105px] rounded-[4px]')}
                  ${sk('h-[16px] w-[51px] rounded-[4px]')}
                  ${sk('h-[12px] w-[131px] rounded-[4px]')}
                </div>
                <div class="flex flex-col gap-[4px]">
                  ${sk('h-[12px] w-[106px] rounded-[4px]')}
                  ${sk('h-[16px] w-[124px] rounded-[4px]')}
                </div>
              </div>
            </div>
          </div>
        </div>

        ${/* Columna derecha EXCLUSIVA desktop (Figma 518:24714): tier card
            340×200. El spec nuevo ya NO incluye pill de tier arriba de la card
            (a diferencia del layout anterior 518:23187). En tablet la tier card
            no existe; en mobile tampoco (la card real aparece embebida dentro
            del compact). */ ''}
        <div class="hidden lg:block lg:shrink-0">
          ${sk('h-[200px] w-[340px] rounded-2xl')}
        </div>
      </div>

      ${/* Promo banner full-width. Alturas por viewport (Figma): mobile 200
          (518:24887), tablet 186 (518:24794), desktop 86 (518:24715). */ ''}
      ${sk('h-[200px] md:h-[186px] lg:h-[86px] w-full rounded-2xl')}
    </div>
  `;
};

export default MembersHeroSkeleton;
