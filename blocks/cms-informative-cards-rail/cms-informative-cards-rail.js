import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { InformativeCard } from '../../design-system/organisms/cards/informative-card/informative-card.js';
import { extractCmsInformativeCardsRailProps, validateCmsInformativeCardsRailProps } from './cms-informative-cards-rail-helper.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

/**
 * Get grid column classes based on card count for desktop
 * @param {number} cardCount - Total number of cards
 * @returns {string} Tailwind grid-cols classes for desktop
 */
function getDesktopGridColumns(cardCount, variant) {
  if (variant === 'horizontal') {
    if (cardCount === 1) return 'md:grid-cols-1';
    if (cardCount === 2) return 'md:grid-cols-2';
    return 'md:grid-cols-3';
  }
  if (variant === 'vertical') {
    if (cardCount === 1) return 'md:grid-cols-1';
    if (cardCount === 2) return 'md:grid-cols-2';
    if (cardCount === 3) return 'md:grid-cols-3';
    return 'md:grid-cols-4';
  }
  return 'md:grid-cols-4';
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
    const sectionContainer = block.closest('.section.cms-informative-cards-rail-container');
    if (sectionContainer) {
      sectionContainer.classList.add('!p-0');
    }
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
    const sectionContainer = block.closest('.section.cms-informative-cards-rail-container');
    if (sectionContainer) {
      sectionContainer.classList.add('!p-0');
    }
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
      class="self-stretch inline-flex justify-start items-start gap-4 overflow-hidden pt-[4px] pb-[4px] pl-[4px] pr-[4px] mdlg:p-0 mdlg:grid mdlg:w-full mdlg:overflow-visible ${getDesktopGridColumns(props.cards?.length || 0, props.variant)}"
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
            showChevron=${card.showChevron}
            onClick=${handleCardClick}
          />
        `;
  })}
    </div>
  `;

  render(html`<${RailComponent} />`, railContainer);
}
