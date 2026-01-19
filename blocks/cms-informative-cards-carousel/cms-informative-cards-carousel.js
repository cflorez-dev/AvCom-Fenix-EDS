import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { extractCmsInformativeCardsCarouselProps, extractCarouselCards } from './cms-informative-cards-carousel-helper.js';
import { InformativePhotoCard } from '../../design-system/organisms/cards/informative-photo-card/informative-photo-card.js';
import { Carousel } from '../../design-system/molecules/carousel/carousel.js';

const html = htm.bind(h);

// Breakpoint: 1248px (inclusive)
const DESKTOP_BREAKPOINT = 1248;

/**
 * Strip HTML tags and return plain text
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
function stripHtmlTags(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Render cards in grid layout (100% width)
 * Cards use flex-1 to distribute space equally
 * @param {Array} cards - Card data array (1-4 cards)
 * @param {string} loadingMode - Image loading strategy ('lazy' or 'eager')
 * @returns {import('preact').VNode} Preact component
 */
function renderCardsGrid(cards, loadingMode) {
  return html`
    <div class="flex gap-3 w-full">
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
          customClassName="flex-1"
          loading=${loadingMode}
        />
      `)}
    </div>
  `;
}

/**
 * Render cards in carousel (mobile <1248px with 1-4 cards)
 * Cards maintain desktop size inside carousel
 * Reduce itemsPerView to 1 to force navigation controls
 * @param {Array} cards - Card data array (1-4 cards)
 * @param {string} loadingMode - Image loading strategy ('lazy' or 'eager')
 * @returns {import('preact').VNode} Preact component
 */
function renderFourCardsCarousel(cards, loadingMode) {
  const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;

  const cardClassName = isDesktop
    ? 'w-[400px] min-w-[400px] max-w-[400px]' 
    : 'w-[360px] min-w-[360px] max-w-[360px]';
  
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
      customClassName="${cardClassName} my-[16px] ml-[-0.2px]"
      loading=${loadingMode}
    />
  `);
    
  return html`
    <${Carousel}
      itemsPerView=${1}
      gap=${12}
      showNavigation=${false}
      navigationBreakpoint=${1025}
      showPagination=${true}
      autoPlay=${false}
      loop=${false}
      infiniteMobile=${true}
    >
      ${cardElements}
    </${Carousel}>
  `;
}

/**
 * Render 5+ cards in carousel (all viewports)
 * Desktop (≥1248px): Shows 4 cards at once, remaining cards hidden
 * Mobile (<1248px): Shows 1 card at once
 * @param {Array} cards - Card data array (5+)
 * @param {string} loadingMode - Image loading strategy ('lazy' or 'eager')
 * @returns {import('preact').VNode} Preact component
 */
function renderMultiCardsCarousel(cards, loadingMode) {
  const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
  
  // Desktop: fixed width to show 4 cards at once
  // Mobile: fixed width to show 1 card at once
  // Calculate: (100% - (3 gaps of 12px)) / 4 = calc((100% - 36px) / 4)
  const cardClassName = isDesktop
    ? 'w-[calc((100%-36px)/4)] min-w-[calc((100%-36px)/4)] max-w-[calc((100%-36px)/4)]' 
    : 'w-[360px] min-w-[360px] max-w-[360px]';
  
  return html`
    <${Carousel}
      itemsPerView=${1}
      gap=${12}
      showNavigation=${false}
      navigationBreakpoint=${1025}
      showPagination=${true}
      autoPlay=${false}
      loop=${true}
      infiniteMobile=${true}
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
          customClassName="${cardClassName} my-[16px] ml-[-0.2px]"
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
  console.log('[CMS Informative Cards Carousel] Decorating block...', block);
  // Extract configuration and cards using helper
  const props = extractCmsInformativeCardsCarouselProps(block);
  const cards = extractCarouselCards(block);
  const totalCards = cards.length;
  const loadingMode = props.loading || 'lazy';

  if (totalCards === 0) {
    console.warn('[CMS Informative Cards Carousel] No valid cards found.');
    return;
  }

  // Create container
  const container = document.createElement('div');
  container.className = 'w-full py-6';
  container.dataset.loading = loadingMode;

  /**
   * Render logic based on cards count and viewport width
   * 
   * Rules:
   * 1. Desktop (≥1248px):
   *    - ≤4 cards → Grid 100% width
   *    - 5+ cards → Carousel
   * 
   * 2. Mobile (<1248px):
   *    - Any card count → Carousel
   */
  const renderContent = () => {
    const viewportWidth = window.innerWidth;
    const isDesktop = viewportWidth >= DESKTOP_BREAKPOINT;
    
    if (isDesktop) {
      // Desktop: grid if ≤4 cards, carousel if 5+
      if (totalCards <= 4) {
        render(renderCardsGrid(cards, loadingMode), container);
      } else {
        // 5+ cards
        render(renderMultiCardsCarousel(cards, loadingMode), container);
      }
    } else {
      // Mobile: always carousel
      if (totalCards >= 5) {
        render(renderMultiCardsCarousel(cards, loadingMode), container);
      } else {
        // 1-4 cards
        render(renderFourCardsCarousel(cards, loadingMode), container);
      }
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

  // Hide & Render Sibling Pattern
  block.style.display = 'none';
  block.parentNode.insertBefore(container, block.nextSibling);

  // Apply styles to the section container using Tailwind
  const sectionContainer = block.closest('.section.cms-informative-cards-carousel-container');
  if (sectionContainer) {
    sectionContainer.classList.add('!p-0', '!m-0', 'w-full', 'justify-self-center');
  }
}
