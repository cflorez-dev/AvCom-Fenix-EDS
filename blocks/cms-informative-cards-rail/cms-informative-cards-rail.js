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
    if (cardCount === 1) {
      return 'md:grid-cols-1';
    }
    if (cardCount === 2) {
      return 'md:grid-cols-2';
    }
    // 3 or more cards: use 3 columns, extras wrap to new rows
    return 'md:grid-cols-3';
  }
  // Vertical variant: always 4 columns on desktop
  return 'md:grid-cols-4';
}

/**
 * Decorates the CMS Informative Cards Rail block
 * @param {Element} block The informative cards rail block element
 */
export default function decorate(block) {
  // Detect if we're in Universal Editor author environment
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    // In author mode: preserve original editable content
    block.classList.add('cms-informative-cards-rail-author-mode');

    // Add visual indicator for author
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'cms-informative-cards-rail-author-indicator';
    authorIndicator.textContent = 'ℹ️ CMS Informative Cards Rail (Author Mode - Edit below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);

    // Don't transform the block - keep it editable
    return;
  }

  // Production mode: extract props and render with Preact
  const props = extractCmsInformativeCardsRailProps(block);

  // Country/Language filtering
  if (!shouldShowByTargeting(props.targetCountries, props.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // Apply Tailwind classes to the wrapper (parent of block)
  const wrapper = block.parentElement;
  if (wrapper && wrapper.classList.contains('cms-informative-cards-rail-wrapper')) {
    wrapper.classList.add(
      'flex',
      'overflow-x-auto',
      'mdlg:overflow-visible', // Desktop: remove scroll
      'scrollbar-none',
      '[scrollbar-width:none]', // Firefox
      '[-ms-overflow-style:none]', // IE/Edge
      '[&::-webkit-scrollbar]:hidden', // Chrome/Safari
    );
  }

  // Validate props in development
  if (typeof console !== 'undefined') {
    const validation = validateCmsInformativeCardsRailProps(props);
    if (!validation.isValid) {
      return;
    }
  }

  // Create container for the rail
  const railContainer = document.createElement('div');
  railContainer.className = 'w-full';

  // Render the rail component using Preact
  const RailComponent = () => html`
    <div
      class="self-stretch inline-flex justify-start items-start gap-4 overflow-hidden pt-[4px] pb-[4px] pl-[4px] pr-[4px] mdlg:p-0 mdlg:grid mdlg:w-full mdlg:overflow-visible ${getDesktopGridColumns(props.cards?.length || 0, props.variant)}"
      data-variant=${props.variant}
    >
      ${props.cards.map((card, index) => {
    const handleCardClick = () => {
      if (card.buttonUrl) {
        window.location.href = card.buttonUrl;
      }
    };

    return html`
          <${InformativeCard}
            key=${index}
            variant='${props.variant}'
            title=${card.title}
            details=${card.details}
            image=${card.image}
            imageAlt=${card.imageAlt}
            ActionType=${card.actionType}
            buttonText=${card.buttonText}
            showChevron=${card.showChevron}
            onClick=${handleCardClick}
          />
        `;
  })}
    </div>
  `;

  // Render component into container
  render(html`<${RailComponent} />`, railContainer);

  // Hide original block and insert transformed content as sibling
  block.style.display = 'none';
  block.parentNode.insertBefore(railContainer, block.nextSibling);
}
