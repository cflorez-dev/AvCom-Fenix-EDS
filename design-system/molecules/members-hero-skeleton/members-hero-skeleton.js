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
 * ## Figma
 *  - Desktop ≥ 1024px: 518:23125 — content section (greeting + balance/shortcuts
 *    + status + tier card 289×170) + promo banner 1248×86.
 *  - Tablet 768–1024px: 518:23193 — content section sin tier card; promo 704×186.
 *  - Mobile < 768px: 518:23258 — vertical stack (name + status pill + balance +
 *    shortcuts + promo 361×200). NO renderiza la columna status ni la tier card.
 *
 * Los anchos/altos arbitrarios (`w-[174px]`, `h-[18px]`, etc.) vienen de los
 * frames Figma y NO son tokens del DS porque son específicos del skeleton —
 * estabilizar las proporciones evita el "salto" al hidratar con datos reales.
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

  // 4 shortcuts (circle + 2 label lines). Mismo patrón en los 3 viewports.
  const shortcut = () => html`
    <div class="flex flex-col items-center gap-0.5 px-1 pt-2 pb-1">
      ${sk('w-12 h-12 rounded-full')}
      <div class="flex flex-col gap-1.5 w-[72px] pt-1">
        ${sk('h-3 rounded-[4px]')}
        ${sk('h-3 rounded-[4px]')}
      </div>
    </div>
  `;

  return html`
    <div
      class=${`flex flex-col gap-6 lg:gap-10 ${customClassName}`}
      data-name="members-hero-skeleton"
    >
      ${/* Content section: mobile stack → tablet+ grid horizontal con divider. */ ''}
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-8">
        <div class="flex flex-1 flex-col gap-6 min-w-0">
          ${/* Greeting: mobile 174×18 (Figma 518:23262), tablet 251×20
              (518:23197), desktop 285×23 (518:23129). */ ''}
          ${sk('h-[18px] w-[174px] md:h-5 md:w-[251px] lg:h-[23px] lg:w-[285px] rounded-[4px]')}

          ${/* Status pill EXCLUSIVA mobile (Figma 518:23285): 118×16 — sustituye
              la columna "Lifemiles Status" que en tablet/desktop vive a la derecha. */ ''}
          ${sk('h-4 w-[118px] rounded-[4px] md:hidden')}

          <div class="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
            ${/* IZQ (siempre visible): balance container + 4 shortcuts. */ ''}
            <div class="flex flex-col gap-5 w-full md:w-[361px] md:shrink-0">
              ${/* Balance container con 2 loyalty-points + divisor central
                  (Figma 518:23132 / 23200 / 23291). */ ''}
              <div class="flex gap-8 items-start rounded-2xl">
                <div class="flex flex-col gap-1.5">
                  ${sk('h-3 w-[42px] rounded-[4px]')}
                  ${sk('h-4 w-[115px] rounded-[4px]')}
                </div>
                ${sk('w-px h-11 rounded-[2px]')}
                <div class="flex flex-col gap-1.5">
                  ${sk('h-3 w-[136px] rounded-[4px]')}
                  ${sk('h-4 w-[110px] rounded-[4px]')}
                </div>
              </div>

              ${/* Shortcuts grid 4-cols (Figma 518:23144 / 23212 / 23307). */ ''}
              <div class="grid grid-cols-4 gap-x-2 gap-y-6 w-full max-w-[344px]">
                ${shortcut()}
                ${shortcut()}
                ${shortcut()}
                ${shortcut()}
              </div>
            </div>

            ${/* DER (tablet+desktop): Lifemiles Status con divisor vertical
                (Figma 518:23237 / 518:23169). Mobile no muestra esta columna —
                ya está representada por la "status pill" arriba. */ ''}
            <div class="hidden md:flex md:items-stretch md:gap-8 md:flex-1 md:min-w-0">
              ${sk('w-px self-stretch rounded-[2px]')}
              <div class="flex flex-col gap-6">
                <div class="flex flex-col gap-1.5">
                  ${sk('h-3 w-[105px] rounded-[4px]')}
                  ${sk('h-4 w-[51px] rounded-[4px]')}
                  ${sk('h-3 w-[131px] rounded-[4px]')}
                </div>
                <div class="flex flex-col gap-1.5">
                  ${sk('h-3 w-[106px] rounded-[4px]')}
                  ${sk('h-4 w-[124px] rounded-[4px]')}
                </div>
              </div>
            </div>
          </div>
        </div>

        ${/* Columna derecha EXCLUSIVA desktop (Figma 518:23187): pill 160×23 +
            tier card 289×170. En tablet la tier card no existe; en mobile
            tampoco (la card real aparece embebida dentro del compact). */ ''}
        <div class="hidden lg:flex lg:flex-col lg:gap-8 lg:items-end lg:shrink-0">
          ${sk('h-[23px] w-[160px] rounded-[4px]')}
          ${sk('h-[170px] w-[289px] rounded-2xl')}
        </div>
      </div>

      ${/* Promo banner full-width. Alturas por viewport (Figma): mobile 200
          (518:23332), tablet 186 (518:23254), desktop 86 (518:23190). */ ''}
      ${sk('h-[200px] md:h-[186px] lg:h-[86px] w-full rounded-2xl')}
    </div>
  `;
};

export default MembersHeroSkeleton;
