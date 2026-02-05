import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { extractCmsInformativeCardsCarouselProps, extractCarouselCards } from './cms-informative-cards-carousel-helper.js';
import { InformativePhotoCard } from '../../design-system/organisms/cards/informative-photo-card/informative-photo-card.js';
import { Carousel } from '../../design-system/molecules/carousel/carousel.js';
import { getStoredCountry, getStoredLanguage } from '../../scripts/services/header/language-country-selector.js';

const html = htm.bind(h);

// Breakpoint: 1248px (inclusive)
const DESKTOP_BREAKPOINT = 1248;

/**
 * Render cards in grid layout
 * Cards use fixed 300px width only when there are 4 or more cards
 * Otherwise, cards use flex-1 to distribute space equally
 * @param {Array} cards - Card data array (1-4 cards)
 * @param {string} loadingMode - Image loading strategy ('lazy' or 'eager')
 * @returns {import('preact').VNode} Preact component
 */
function renderCardsGrid(cards, loadingMode) {
  const totalCards = cards.length;
  // Only force 300px width when there are 4 or more cards
  const cardClassName = totalCards >= 4
    ? 'w-[300px] min-w-[300px] max-w-[300px]'
    : 'flex-1';
  const containerClass = totalCards >= 4
    ? 'flex flex-wrap gap-4 w-full'
    : 'flex gap-4 w-full';

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
      customScrollContainerClassName="gap-4 min-[480px]:px-[32px]"
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
  const itemContainerClassName = 'w-[300px]';
  const scrollContainerClassName = 'gap-4 min-[480px]:px-[32px]';
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
  // If target fields are configured, check if user's cookie matches
  // Empty fields = show to all users
  const { targetCountries, targetLanguages } = props;

  if (targetCountries) {
    const allowedCountries = targetCountries.split(',').map((c) => c.trim().toLowerCase());
    const userCountry = (getStoredCountry() || '').toLowerCase();
    if (!allowedCountries.includes(userCountry)) {
      block.style.display = 'none';
      return;
    }
  }

  if (targetLanguages) {
    const allowedLanguages = targetLanguages.split(',').map((l) => l.trim().toLowerCase());
    const userLanguage = (getStoredLanguage() || '').toLowerCase();
    if (!allowedLanguages.includes(userLanguage)) {
      block.style.display = 'none';
      return;
    }
  }

  if (totalCards === 0) {
    return;
  }

  // Create container
  const container = document.createElement('div');
  container.className = 'w-full pt-6 pb-8';
  container.dataset.loading = loadingMode;

  /**
   * Render logic based on cards count and viewport width
   * Rules:
   * 1. Desktop (≥1248px):
   *    - ≤4 cards → Grid 100% width
   *    - 5+ cards → Carousel
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
