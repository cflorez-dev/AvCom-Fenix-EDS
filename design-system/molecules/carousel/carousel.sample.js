import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Carousel } from './carousel.js';
import { PromotionalCardCarrousel } from '../../organisms/cards/promotional-card-carrousel/promotional-card-carrousel.js';
import { InformativePhotoCard } from '../../organisms/cards/informative-photo-card/informative-photo-card.js';

const html = htm.bind(h);

/**
 * Sample data for promotional cards
 */
const promotionalCardsData = [
  {
    variant: 'light',
    title: 'Join\nlifemiles',
    description: 'Get low mileage always and save more.',
    image: 'https://placehold.co/180x174/380980/white?text=LifeMiles',
    imageAlt: 'LifeMiles',
    buttonText: 'Join now',
    buttonURL: '#',
    backgroundColor: '#380980',
  },
  {
    variant: 'dark',
    title: 'Your credit card',
    description: 'with up to 20,000 welcome miles',
    image: 'https://placehold.co/180x174/E4DFD5/1B1B1B?text=Card',
    imageAlt: 'Credit card',
    buttonText: 'Apply now',
    buttonURL: '#',
    backgroundColor: '#E4DFD5',
  },
  {
    variant: 'light',
    title: 'More miles per dollar',
    description: 'flying with any of our rates',
    image: 'https://placehold.co/180x174/4BA5C6/white?text=Miles',
    imageAlt: 'More miles',
    buttonText: 'Learn more',
    buttonURL: '#',
    backgroundColor: '#4BA5C6',
  },
  {
    variant: 'light',
    title: 'Fly in style',
    description: 'Enjoy our best rates',
    image: 'https://placehold.co/180x174/6B46C1/white?text=Style',
    imageAlt: 'Fly in style',
    buttonText: 'Book now',
    buttonURL: '#',
    backgroundColor: '#6B46C1',
  },
];

/**
 * Sample data for informative cards
 */
const informativeCardsData = [
  {
    title: 'Amazing destinations',
    details: 'Discover the best destinations for your next vacation with Avianca.',
    image: 'https://placehold.co/288x176/1B1B1B/white?text=Destinations',
    imageAlt: 'Amazing destinations',
    buttonText: 'Explore destinations',
    buttonURL: '#',
  },
  {
    title: 'Special offers',
    details: 'Take advantage of our exclusive promotions and travel more for less.',
    image: 'https://placehold.co/288x176/E63946/white?text=Offers',
    imageAlt: 'Special offers',
    buttonText: 'View offers',
    buttonURL: '#',
  },
  {
    title: 'Travel with family',
    details: 'Special benefits for you to travel with those you love most.',
    image: 'https://placehold.co/288x176/2A9D8F/white?text=Family',
    imageAlt: 'Travel with family',
    buttonText: 'More information',
    buttonURL: '#',
  },
  {
    title: 'Online check-in',
    details: 'Save time and check-in from the comfort of your home.',
    image: 'https://placehold.co/288x176/F77F00/white?text=Check-in',
    imageAlt: 'Online check-in',
    buttonText: 'Check-in now',
    buttonURL: '#',
  },
];

/**
 * CarouselSample component for showcasing carousel component variations
 * @returns {import('preact').VNode} Sample showcase
 */
export const CarouselSample = () => html`
  <div class="flex flex-col gap-[var(--spacing-x-large)] max-w-[120rem] mx-auto p-6">
    <div>
      <h1 class="text-[var(--heading-h500-size)] font-[var(--heading-h500-weight)] mb-[var(--spacing-small)]">
        Carousel Component
      </h1>
      <p class="text-[var(--paragraph-p300-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
        Responsive carousel component for displaying cards with navigation and pagination.
      </p>
    </div>

    <!-- Sample 1: Promotional Cards (3 items visible) -->
    <section class="flex flex-col gap-[var(--spacing-large)]">
      <div>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
          Promotional Cards (3 items visible)
        </h2>
        <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
          Carousel with promotional cards, showing 3 cards at a time with navigation and pagination
        </p>
      </div>
      <${Carousel}
        itemsPerView=${3}
        gap=${12}
        showNavigation=${true}
        showPagination=${true}
      >
        ${promotionalCardsData.map((card) => html`
          <${PromotionalCardCarrousel}
            variant=${card.variant}
            title=${card.title}
            description=${card.description}
            image=${card.image}
            imageAlt=${card.imageAlt}
            buttonText=${card.buttonText}
            buttonURL=${card.buttonURL}
            backgroundColor=${card.backgroundColor}
          />
        `)}
      </${Carousel}>
    </section>

    <!-- Sample 2: Informative Cards -->
    <section class="flex flex-col gap-[var(--spacing-large)]">
      <div>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
          Informative Cards
        </h2>
        <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
          Carousel with vertical informative cards, ideal for content with featured images
        </p>
      </div>
      <${Carousel}
        itemsPerView=${3}
        gap=${12}
        showNavigation=${true}
        showPagination=${true}
      >
        ${informativeCardsData.map((card) => html`
          <${InformativePhotoCard}
            title=${card.title}
            details=${card.details}
            image=${card.image}
            imageAlt=${card.imageAlt}
            buttonText=${card.buttonText}
            buttonURL=${card.buttonURL}
          />
        `)}
      </${Carousel}>
    </section>

    <!-- Sample 3: Auto-play (stops at end) -->
    <section class="flex flex-col gap-[var(--spacing-large)]">
      <div>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
          Auto-play (Stops at End)
        </h2>
        <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
          Carousel with auto-play every 4 seconds that stops when reaching the last slide
        </p>
      </div>
      <${Carousel}
        itemsPerView=${3}
        gap=${12}
        showNavigation=${true}
        showPagination=${true}
        autoPlay=${true}
        autoPlayInterval=${4000}
        loop=${false}
      >
        ${promotionalCardsData.map((card) => html`
          <${PromotionalCardCarrousel}
            variant=${card.variant}
            title=${card.title}
            description=${card.description}
            image=${card.image}
            imageAlt=${card.imageAlt}
            buttonText=${card.buttonText}
            buttonURL=${card.buttonURL}
            backgroundColor=${card.backgroundColor}
          />
        `)}
      </${Carousel}>
    </section>

    <!-- Sample 4: Auto-play with Infinite Loop -->
    <section class="flex flex-col gap-[var(--spacing-large)]">
      <div>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
          Auto-play with Infinite Loop
        </h2>
        <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
          Carousel with auto-play every 3 seconds and infinite loop enabled (cycles continuously, restarts from beginning)
        </p>
      </div>
      <${Carousel}
        itemsPerView=${3}
        gap=${12}
        showNavigation=${true}
        showPagination=${true}
        autoPlay=${true}
        autoPlayInterval=${3000}
        loop=${true}
      >
        ${promotionalCardsData.map((card) => html`
          <${PromotionalCardCarrousel}
            variant=${card.variant}
            title=${card.title}
            description=${card.description}
            image=${card.image}
            imageAlt=${card.imageAlt}
            buttonText=${card.buttonText}
            buttonURL=${card.buttonURL}
            backgroundColor=${card.backgroundColor}
          />
        `)}
      </${Carousel}>
    </section>

    <!-- Sample 5: Manual Navigation with Infinite Loop -->
    <section class="flex flex-col gap-[var(--spacing-large)]">
      <div>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
          Manual Navigation with Infinite Loop
        </h2>
        <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
          Carousel without auto-play but with infinite loop enabled (manual navigation cycles continuously)
        </p>
      </div>
      <${Carousel}
        itemsPerView=${3}
        gap=${12}
        showNavigation=${true}
        showPagination=${true}
        autoPlay=${false}
        loop=${true}
      >
        ${promotionalCardsData.map((card) => html`
          <${PromotionalCardCarrousel}
            variant=${card.variant}
            title=${card.title}
            description=${card.description}
            image=${card.image}
            imageAlt=${card.imageAlt}
            buttonText=${card.buttonText}
            buttonURL=${card.buttonURL}
            backgroundColor=${card.backgroundColor}
          />
        `)}
      </${Carousel}>
    </section>

    <!-- Sample 6: 2 items per view -->
    <section class="flex flex-col gap-[var(--spacing-large)]">
      <div>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
          2 Items Per View
        </h2>
        <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
          Carousel showing 2 cards at a time, useful for more spacious layouts
        </p>
      </div>
      <${Carousel}
        itemsPerView=${2}
        gap=${16}
        showNavigation=${true}
        showPagination=${true}
      >
        ${informativeCardsData.map((card) => html`
          <${InformativePhotoCard}
            title=${card.title}
            details=${card.details}
            image=${card.image}
            imageAlt=${card.imageAlt}
            buttonText=${card.buttonText}
            buttonURL=${card.buttonURL}
          />
        `)}
      </${Carousel}>
    </section>

    <!-- Sample 7: Without pagination -->
    <section class="flex flex-col gap-[var(--spacing-large)]">
      <div>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
          Without Pagination
        </h2>
        <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
          Carousel without pagination indicators, only navigation buttons
        </p>
      </div>
      <${Carousel}
        itemsPerView=${3}
        gap=${12}
        showNavigation=${true}
        showPagination=${false}
      >
        ${promotionalCardsData.map((card) => html`
          <${PromotionalCardCarrousel}
            variant=${card.variant}
            title=${card.title}
            description=${card.description}
            image=${card.image}
            imageAlt=${card.imageAlt}
            buttonText=${card.buttonText}
            buttonURL=${card.buttonURL}
            backgroundColor=${card.backgroundColor}
          />
        `)}
      </${Carousel}>
    </section>

    <!-- Sample 8: Minimal (no controls) -->
    <section class="flex flex-col gap-[var(--spacing-large)]">
      <div>
        <h2 class="text-[var(--heading-h400-size)] font-[var(--heading-h400-weight)] mb-[var(--spacing-small)]">
          Minimal (No Controls)
        </h2>
        <p class="text-[var(--paragraph-p200-size)] text-[var(--text-normal-secondary)] mb-[var(--spacing-medium)]">
          Minimalist carousel without navigation controls or pagination, manual scroll only
        </p>
      </div>
      <${Carousel}
        itemsPerView=${3}
        gap=${12}
        showNavigation=${false}
        showPagination=${false}
      >
        ${promotionalCardsData.slice(0, 3).map((card) => html`
          <${PromotionalCardCarrousel}
            variant=${card.variant}
            title=${card.title}
            description=${card.description}
            image=${card.image}
            imageAlt=${card.imageAlt}
            buttonText=${card.buttonText}
            buttonURL=${card.buttonURL}
            backgroundColor=${card.backgroundColor}
          />
        `)}
      </${Carousel}>
    </section>
  </div>
`;

export default CarouselSample;
