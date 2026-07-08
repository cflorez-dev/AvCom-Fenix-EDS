import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { InformativeCard } from '../../design-system/organisms/cards/informative-card/informative-card.js';
import { extractCmsInformativeCardsRailProps, validateCmsInformativeCardsRailProps } from './cms-informative-cards-rail-helper.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

/**
 * Get grid classes based on card count and variant.
 * Returns FULL literal class string (Tailwind JIT needs literals).
 * - Horizontal variant caps at 3 cols (image-left cards need width).
 * - Vertical variant fits up to 3 cols at md; 4 cols only at mdlg+
 *   (4 cards × 220px min-width don't fit at 768-991, keep horizontal scroll).
 * @param {number} cardCount - Total number of cards
 * @param {string} variant - 'horizontal' | 'vertical'
 * @returns {string} Tailwind classes activating grid + columns at the right breakpoint
 */
function getDesktopGridColumns(cardCount, variant) {
  if (variant === 'horizontal') {
    if (cardCount === 1) return 'md:p-0 md:grid md:w-full md:overflow-visible md:grid-cols-1';
    if (cardCount === 2) return 'md:p-0 md:grid md:w-full md:overflow-visible md:grid-cols-2';
    return 'md:p-0 md:grid md:w-full md:overflow-visible md:grid-cols-3';
  }
  if (variant === 'vertical') {
    if (cardCount === 1) return 'md:p-0 md:grid md:w-full md:overflow-visible md:grid-cols-1';
    if (cardCount === 2) return 'md:p-0 md:grid md:w-full md:overflow-visible md:grid-cols-2';
    if (cardCount === 3) return 'md:p-0 md:grid md:w-full md:overflow-visible md:grid-cols-3';
    return 'mdlg:p-0 mdlg:grid mdlg:w-full mdlg:overflow-visible mdlg:grid-cols-4';
  }
  return 'md:p-0 md:grid md:w-full md:overflow-visible md:grid-cols-4';
}

/**
 * Decorates the CMS Informative Cards Rail block
 * @param {Element} block The informative cards rail block element
 */
export default function decorate(block) {
  // 1. Extract props BEFORE clearing the block
  const props = extractCmsInformativeCardsRailProps(block);

  // 2. Country/Language filtering
  if (!shouldShowByTargeting(props.targetCountries, props.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // 3. Apply Tailwind classes to the wrapper (parent of block)
  const wrapper = block.parentElement;
  if (wrapper && wrapper.classList.contains('cms-informative-cards-rail-wrapper')) {
    wrapper.classList.add(
      'flex',
      'overflow-x-auto',
      'mdlg:overflow-visible',
      'scrollbar-none',
      '[scrollbar-width:none]',
      '[-ms-overflow-style:none]',
      '[&::-webkit-scrollbar]:hidden',
    );
  }

  // 4. Validate props
  const validation = validateCmsInformativeCardsRailProps(props);
  if (!validation.isValid) {
    block.style.display = 'none';
    return;
  }

  // 5. Hide original children (preserve data-aue-* for Universal Editor sub-block editing)
  //    and render Preact INSIDE the block (compatible with editor-support.js re-decoration)
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });
  block.classList.add('w-full');

  const railContainer = document.createElement('div');
  railContainer.className = 'w-full';
  block.appendChild(railContainer);

  // 6. Render Preact component inside the block
  const RailComponent = () => html`
    <div
      class="self-stretch inline-flex justify-start items-start gap-4 overflow-hidden pt-[4px] pb-[4px] ${getDesktopGridColumns(props.cards?.length || 0, props.variant)}"
      data-variant=${props.variant}
    >
      ${props.cards.map((card, index) => {
    const hasCardLink = typeof card.buttonUrl === 'string'
      && card.buttonUrl.trim() !== ''
      && card.buttonUrl !== '#';

    const handleCardClick = hasCardLink ? () => {
      if (card.buttonUrl) {
        window.location.href = card.buttonUrl;
      }
    } : undefined;

    return html`
          <${InformativeCard}
            key=${index}
            variant='${props.variant}'
            title=${card.title}
            details=${card.details}
            image=${card.image}
            imageAlt=${card.imageAlt}
            loading=${props.loading}
            ActionType=${card.actionType}
            buttonText=${card.buttonText}
            buttonVariant=${card.buttonVariant}
            showChevron=${card.showChevron}
            onClick=${handleCardClick}
          />
        `;
  })}
    </div>
  `;

  render(html`<${RailComponent} />`, railContainer);
}
