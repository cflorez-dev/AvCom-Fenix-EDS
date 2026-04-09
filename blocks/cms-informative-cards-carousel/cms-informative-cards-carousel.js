import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { extractCmsInformativeCardsCarouselProps, extractCarouselCards } from './cms-informative-cards-carousel-helper.js';
import { InformativePhotoCard } from '../../design-system/organisms/cards/informative-photo-card/informative-photo-card.js';
import { Carousel } from '../../design-system/molecules/carousel/carousel.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

// Breakpoint: 1248px (inclusive)
const DESKTOP_BREAKPOINT = 1248;

/**
 * Render cards in a stretchy rail layout.
 * - 1-3 cards: stretch via `flex-1` to fill the container width, but never shrink below
 *   `min-w-[300px]`. When the viewport is too narrow to fit all cards at min-width, the
 *   container becomes horizontally scrollable (`overflow-x-auto`).
 * - 4+ cards: fixed 300px width per card and the rail is always scrollable on overflow.
 * @param {Array} cards - Card data array
 * @param {string} loadingMode - Image loading strategy ('lazy' or 'eager')
 * @returns {import('preact').VNode} Preact component
 */
function renderCardsGrid(cards, loadingMode) {
  const totalCards = cards.length;
  const cardClassName = totalCards >= 4
    ? 'w-[300px] min-w-[300px] max-w-[300px]'
    : 'flex-1 min-w-[300px]';
  // Both branches share `overflow-x-auto` so the rail scrolls horizontally on narrow
  // viewports where the cards would otherwise overflow the container.
  // `min-[480px]:px-[32px]` preserves the horizontal padding from the previous
  // carousel layout (pixel-perfect spec); on viewports <480px we drop the padding
  // to maximize horizontal space for the cards on very small phones.
  const containerClass = totalCards >= 4
    ? 'flex gap-4 w-full overflow-x-auto scrollbar-hide min-[480px]:px-[32px]'
    : 'flex gap-4 w-full overflow-x-auto scrollbar-hide min-[480px]:px-[32px]';

  return html`
    <div class="${containerClass}">
      ${cards.map((cardData) => html`
        <${InformativePhotoCard}
          title=${cardData.title}
          details=${cardData.details}
          image=${cardData.image}
          imageAlt=${cardData.imageAlt}
          buttonText=${cardData.ctaText || ''}
          buttonURL=${cardData.ctaLink || ''}
          ctaTargetBlank=${cardData.ctaTargetBlank || false}
          ctaRel=${cardData.ctaRel || 'dofollow'}
          customClassName="${cardClassName}"
          loading=${loadingMode}
        />
      `)}
    </div>
  `;
}

/**
 * Render cards in carousel (mobile <1248px with 1-4 cards)
 * Cards maintain 300px fixed width inside carousel
 * Reduce itemsPerView to 1 to force navigation controls
 * @param {Array} cards - Card data array (1-4 cards)
 * @param {string} loadingMode - Image loading strategy ('lazy' or 'eager')
 * @returns {import('preact').VNode} Preact component
 */
function renderFourCardsCarousel(cards, loadingMode) {
  const cardClassName = 'w-[300px] min-w-[300px] max-w-[300px]';
  const cardElements = cards.map((cardData) => html`
    <${InformativePhotoCard}
      title=${cardData.title}
      details=${cardData.details}
      image=${cardData.image}
      imageAlt=${cardData.imageAlt}
      buttonText=${cardData.ctaText || ''}
      buttonURL=${cardData.ctaLink || ''}
      ctaTargetBlank=${cardData.ctaTargetBlank || false}
      ctaRel=${cardData.ctaRel || 'dofollow'}
      customClassName="${cardClassName} my-[16px]"
      loading=${loadingMode}
    />
  `);

  return html`
    <${Carousel}
      itemsPerView=${1}
      gap=${16}
      showNavigation=${false}
      navigationBreakpoint=${1025}
      showPagination=${true}
      autoPlay=${false}
      loop=${false}
      infiniteMobile=${true}
      paginateByGroup=${true}
      customScrollContainerClassName="gap-4 min-[480px]:px-[32px] !items-stretch"
      itemContainerClassName="flex"
    >
      ${cardElements}
    </${Carousel}>
  `;
}

/**
 * Render 5+ cards in carousel (all viewports)
 * All cards have fixed 300px width in carousel mode
 * Desktop (≥1248px): Shows 4 cards at once, remaining cards hidden
 * Mobile (<1248px): Shows 1 card at once
 * @param {Array} cards - Card data array (5+)
 * @param {string} loadingMode - Image loading strategy ('lazy' or 'eager')
 * @returns {import('preact').VNode} Preact component
 */
function renderMultiCardsCarousel(cards, loadingMode) {
  const cardClassName = 'w-[300px] min-w-[300px] max-w-[300px]';
  const itemContainerClassName = 'w-[300px] flex';
  const scrollContainerClassName = 'gap-4 min-[480px]:px-[32px] !items-stretch';
  return html`
    <${Carousel}
      itemsPerView=${1}
      gap=${16}
      showNavigation=${false}
      navigationBreakpoint=${1025}
      showPagination=${true}
      autoPlay=${false}
      loop=${false}
      infiniteMobile=${true}
      paginateByGroup=${true}
      itemContainerClassName="${itemContainerClassName}"
      customScrollContainerClassName="${scrollContainerClassName}"
    >
      ${cards.map((cardData) => html`
        <${InformativePhotoCard}
          title=${cardData.title}
          details=${cardData.details}
          image=${cardData.image}
          imageAlt=${cardData.imageAlt}
          buttonText=${cardData.ctaText || ''}
          buttonURL=${cardData.ctaLink || ''}
          ctaTargetBlank=${cardData.ctaTargetBlank || false}
          ctaRel=${cardData.ctaRel || 'dofollow'}
          customClassName="${cardClassName} mb-[16px] ml-[2px]"
          loading=${loadingMode}
        />
      `)}
    </${Carousel}>
  `;
}

/**
 * Decorates the CMS Informative Cards Carousel block
 * @param {Element} block The cms-informative-cards-carousel block element
 */
export default function decorate(block) {
  // Extract configuration and cards using helper
  const props = extractCmsInformativeCardsCarouselProps(block);
  const cards = extractCarouselCards(block);
  const totalCards = cards.length;
  const loadingMode = props.loading || 'lazy';

  // Country/Language filtering
  if (!shouldShowByTargeting(props.targetCountries, props.targetLanguages)) {
    // Add p-0 class to parent section container
    const sectionContainer = block.closest('.section.cms-informative-cards-carousel-container');
    if (sectionContainer) {
      sectionContainer.classList.add('!p-0');
    }
    hideBlockWithSection(block);
    return;
  }

  if (totalCards === 0) {
    // Add p-0 class to parent section container
    const sectionContainer = block.closest('.section.cms-informative-cards-carousel-container');
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
  container.className = 'cms-informative-cards-carousel-content w-full';
  container.dataset.loading = loadingMode;

  /**
   * Render logic based on cards count.
   * Rules:
   * - 1-4 cards → Stretchy rail (renderCardsGrid). Cards fill the container width via
   *   `flex-1 min-w-[300px]` and the container scrolls horizontally when the viewport
   *   is too narrow to fit all cards at minimum width. Same behavior at every viewport.
   * - 5+ cards → Carousel with pagination dots (renderMultiCardsCarousel), since the
   *   navigation UX is needed when there are many items.
   */
  const renderContent = () => {
    if (totalCards >= 5) {
      render(renderMultiCardsCarousel(cards, loadingMode), container);
    } else {
      render(renderCardsGrid(cards, loadingMode), container);
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
  const sectionContainer = block.closest('.section.cms-informative-cards-carousel-container');
  if (sectionContainer) {
    sectionContainer.classList.add('!p-0', '!m-0', 'w-full', 'justify-self-center');
  }
}
