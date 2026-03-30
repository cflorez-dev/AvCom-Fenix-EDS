import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { extractCmsPromotionalCardCarrouselProps, extractCarouselCards } from './cms-promotional-card-carrousel-helper.js';
import { PromotionalCardCarrousel } from '../../design-system/organisms/cards/promotional-card-carrousel/promotional-card-carrousel.js';
import { Carousel } from '../../design-system/molecules/carousel/carousel.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

// Breakpoint: 1248px (inclusive)
const DESKTOP_BREAKPOINT = 1248;

/**
 * Strip HTML tags and return plain text
 * @param {string} htmlString - HTML string
 * @returns {string} Plain text
 */
function stripHtmlTags(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString;
  return div.textContent || div.innerText || '';
}

/**
 * Render exactly 3 cards in grid layout (100% width)
 * Cards use flex-1 to distribute space equally
 * @param {Array} cards - Card data array (exactly 3)
 * @param {string} loadingMode - Image loading strategy ('lazy' or 'eager')
 * @returns {import('preact').VNode} Preact component
 */
function renderThreeCardsGrid(cards, loadingMode) {
  return html`
    <div class="flex gap-3 w-full">
      ${cards.map((cardData) => html`
        <${PromotionalCardCarrousel}
          variant=${cardData.variant}
          title=${cardData.title}
          description=${stripHtmlTags(cardData.description)}
          pictureElement=${cardData.pictureElement}
          imageAlt=${cardData.imageAlt}
          buttonText=${cardData.ctaText || ''}
          buttonURL=${cardData.ctaLink || ''}
          backgroundColor=${cardData.backgroundColor || ''}
          loading=${loadingMode}
        />
      `)}
    </div>
  `;
}

/**
 * Render 3 cards in carousel (mobile <1248px)
 * Cards maintain desktop size (w-96) inside carousel
 * Reduce itemsPerView to 1 to force navigation controls
 * @param {Array} cards - Card data array (exactly 3)
 * @param {string} loadingMode - Image loading strategy ('lazy' or 'eager')
 * @returns {import('preact').VNode} Preact component
 */
function renderThreeCardsCarousel(cards, loadingMode) {
  const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;

  const cardClassName = isDesktop
    ? 'w-[400px] min-w-[400px] max-w-[400px]'
    : 'w-[360px] min-w-[360px] max-w-[360px]';

  const cardElements = cards.map((cardData) => html`
    <${PromotionalCardCarrousel}
      variant=${cardData.variant}
      title=${cardData.title}
      description=${stripHtmlTags(cardData.description)}
      pictureElement=${cardData.pictureElement}
      imageAlt=${cardData.imageAlt}
      buttonText=${cardData.ctaText || ''}
      buttonURL=${cardData.ctaLink || ''}
      backgroundColor=${cardData.backgroundColor || ''}
      customClassName="${cardClassName} my-[16px] ml-[-0.2px]"
      loading=${loadingMode}
    />
  `);

  return html`
    <${Carousel}
      itemsPerView=${1}
      gap=${12}
      showNavigation=${true}
      navigationBreakpoint=${1025}
      showPagination=${true}
      autoPlay=${false}
      loop=${true}
      infiniteMobile=${true}
    >
      ${cardElements}
    </${Carousel}>
  `;
}

/**
 * Render 4+ cards in carousel (all viewports)
 * Desktop (≥1248px): Cards calc width to show exactly 3 initially
 * Mobile (<1248px): Cards with fixed size (w-96)
 * @param {Array} cards - Card data array (4+)
 * @param {string} loadingMode - Image loading strategy ('lazy' or 'eager')
 * @returns {import('preact').VNode} Preact component
 */
function renderMultiCardsCarousel(cards, loadingMode) {
  const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;

  // Desktop: calc((100% - gap*2) / 3) to show exactly 3 cards
  // Mobile: fixed width w-96
  const cardClassName = isDesktop
    ? 'w-[400px] min-w-[400px] max-w-[400px]'
    : 'w-[360px] min-w-[360px] max-w-[360px]';

  return html`
    <${Carousel}
      itemsPerView=${1}
      gap=${12}
      showNavigation=${true}
      navigationBreakpoint=${1025}
      showPagination=${true}
      autoPlay=${false}
      loop=${true}
      infiniteMobile=${true}

    >
      ${cards.map((cardData) => html`
        <${PromotionalCardCarrousel}
          variant=${cardData.variant}
          title=${cardData.title}
          description=${stripHtmlTags(cardData.description)}
          pictureElement=${cardData.pictureElement}
          imageAlt=${cardData.imageAlt}
          buttonText=${cardData.ctaText || ''}
          buttonURL=${cardData.ctaLink || ''}
          backgroundColor=${cardData.backgroundColor || ''}
          customClassName="${cardClassName} my-[16px] ml-[-0.2px]"
          loading=${loadingMode}
        />
      `)}
    </${Carousel}>
  `;
}

/**
 * Decorates the CMS Promotional Card Carrousel block
 * @param {Element} block The cms-promotional-card-carrousel block element
 */
export default function decorate(block) {
  // Extract configuration and cards using helper
  const props = extractCmsPromotionalCardCarrouselProps(block);

  // Parent-level targeting: hide entire block if targeting doesn't match
  if (!shouldShowByTargeting(props.targetCountries, props.targetLanguages)) {
    // Add p-0 class to parent section container
    const sectionContainer = block.closest('.section.cms-promotional-card-carrousel-container');
    if (sectionContainer) {
      sectionContainer.classList.add('!p-0');
    }
    hideBlockWithSection(block);
    return;
  }

  const cards = extractCarouselCards(block);
  const totalCards = cards.length;
  const loadingMode = props.loading === 'eager' ? 'eager' : 'lazy';

  if (totalCards === 0) {
    // Add p-0 class to parent section container
    const sectionContainer = block.closest('.section.cms-promotional-card-carrousel-container');
    if (sectionContainer) {
      sectionContainer.classList.add('!p-0');
    }
    // Hide the block if there are no cards
    block.style.display = 'none';
    return;
  }

  // Hide original children to preserve data-aue-* for editor (Pattern B)
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  // Render INSIDE the block (compatible with editor-support.js re-decoration)
  const container = document.createElement('div');
  container.className = 'cms-promotional-card-carrousel-content w-full pt-4 pb-8';
  container.dataset.loading = loadingMode;

  /**
   * Render logic based on cards count and viewport width
   * Rules:
   * 1. ALWAYS use carousel EXCEPT:
   *    - Exactly 3 cards AND Desktop (≥1248px) → Grid 100% width
   * 2. All other cases use carousel:
   *    - 3 cards + Mobile (<1248px) → Carousel
   *    - 4+ cards (any viewport) → Carousel
   *    - 1-2 cards (any viewport) → Carousel
   */
  const renderContent = () => {
    const viewportWidth = window.innerWidth;
    const isDesktop = viewportWidth >= DESKTOP_BREAKPOINT;

    // ONLY exception to carousel: 3 cards + Desktop
    if (totalCards === 3 && isDesktop) {
      render(renderThreeCardsGrid(cards, loadingMode), container);
    } else if (totalCards === 3) {
      // 3 cards on mobile
      render(renderThreeCardsCarousel(cards, loadingMode), container);
    } else if (totalCards >= 4) {
      // 4+ cards
      render(renderMultiCardsCarousel(cards, loadingMode), container);
    } else {
      // 1-2 cards (fallback carousel)
      render(renderThreeCardsCarousel(cards, loadingMode), container);
    }
  };

  // Initial render
  renderContent();

  // Re-render on resize (debounced)
  let resizeTimer;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderContent();
    }, 150);
  };

  window.addEventListener('resize', handleResize);

  block.appendChild(container);

  // Apply styles to the section container using Tailwind
  const sectionContainer = block.closest('.section.cms-promotional-card-carrousel-container');
  if (sectionContainer) {
    sectionContainer.classList.add('!p-0', 'w-full');
  }
}
