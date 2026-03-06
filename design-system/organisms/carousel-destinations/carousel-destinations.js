import { h } from '@dropins/tools/preact.js';
import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Carousel } from '../../molecules/carousel/carousel.js';
import { Chip } from '../../atoms/chip/chip.js';
import { DestinationCard } from '../../atoms/destination-card/destination-card.js';
import { CarouselNavigationButton } from '../../atoms/carousel-navigation-button/carousel-navigation-button.js';

const html = htm.bind(h);

/**
 * CarouselDestinations - Carousel organism for displaying destination cards
 * Matches Figma spec: title header with count badge + navigation buttons,
 * horizontal scrolling carousel of DestinationCard items with right-edge gradient fade.
 *
 * ## Props
 * - `title`: `string` – Section title (e.g., "Destinos en Colombia").
 * - `totalCount`: `string` – Counter label for the pill badge (e.g., "24 ciudades").
 *   Hidden if empty.
 * - `destinations`: `Array<Object>` – Array of destination objects to render as cards.
 *   Each object: `{ destinationName, imageUrl, imageAlt?, complementaryText?, href?, onClick? }`.
 * - `gap`: `number` – Gap between cards in pixels (default: `16`).
 * - `loop`: `boolean` – Enable infinite loop scrolling (default: `true`).
 * - `itemsPerView`: `number` – Visible items at once on desktop (default: `5`).
 * - `showGradientFade`: `boolean` – Show right-edge gradient overlay (default: `true`).
 * - `customClassName`: `string` – Additional CSS classes for the root element.
 * - `...rest`: Other valid HTML attributes passed to the root element.
 *
 * ## Behavior
 * - **Header**: Displays title (H500 typography), count pill badge with shadow, and left/right
 *   navigation buttons aligned to the right.
 * - **Carousel**: Uses the Carousel molecule internally with navigation and pagination hidden.
 *   External navigation buttons in the header control scrolling programmatically.
 * - **Gradient fade**: A subtle gradient overlay on the right edge hints at more content.
 * - **Responsive**: On mobile/tablet, the carousel supports touch scrolling with snap alignment
 *   via the Carousel molecule's built-in behavior.
 *
 * @example
 * ```javascript
 * <${CarouselDestinations}
 *   title="Destinos en Colombia"
 *   totalCount="24 ciudades"
 *   destinations=${[
 *     { destinationName: 'Arauca', imageUrl: '/path/to/image.jpg' },
 *     { destinationName: 'Armenia', imageUrl: '/path/to/image.jpg', href: '/destinos/armenia' },
 *   ]}
 * />
 * ```
 */
export const CarouselDestinations = ({
  title = '',
  totalCount = '',
  destinations = [],
  gap = 16,
  loop = false,
  itemsPerView = 5,
  showGradientFade = true,
  customClassName = '',
  ...rest
}) => {
  const carouselWrapperRef = useRef(null);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [isCarousel, setIsCarousel] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Constants
  const CARD_WIDTH = 240;
  const GAP = 16;

  /**
   * Calculate if we need carousel based on screen width
   * Formula: total width needed = (numCards * cardWidth) + ((numCards - 1) * gap)
   */
  const calculateIsCarousel = (width, numDestinations) => {
    if (numDestinations === 0) return false;
    if (numDestinations>4) return true;
    const totalWidthNeeded = (numDestinations * CARD_WIDTH) + ((numDestinations - 1) * GAP + 64);
    return totalWidthNeeded > width;
  };

  /**
   * Listen to window resize events and update screen width
   */
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    // Set initial state on mount
    setIsCarousel(calculateIsCarousel(window.innerWidth, destinations.length));

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [destinations.length]);

  /**
   * Update isCarousel when screenWidth changes
   */
  useEffect(() => {
    setIsCarousel(calculateIsCarousel(screenWidth, destinations.length));
  }, [screenWidth]);

  /**
   * Finds the internal scroll container of the Carousel molecule
   * and calculates the item stride (width + gap) for programmatic scrolling.
   */
  const getScrollInfo = useCallback(() => {
    const container = carouselWrapperRef.current?.querySelector('.overflow-x-auto');
    if (!container) return null;

    const firstChild = container.children[0];
    if (!firstChild) return { container, stride: 256 };

    const itemWidth = firstChild.getBoundingClientRect().width;
    const computed = window.getComputedStyle(container);
    const gapValue = parseFloat(computed.columnGap || computed.gap || '0');
    const stride = itemWidth + (Number.isFinite(gapValue) ? gapValue : 0);

    return { container, stride };
  }, []);

  const updateNavigationState = useCallback(() => {
    if (!isCarousel || screenWidth < 768) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    if (loop) {
      setCanScrollLeft(true);
      setCanScrollRight(true);
      return;
    }

    const info = getScrollInfo();
    if (!info) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { container } = info;
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const epsilon = 1;

    setCanScrollLeft(container.scrollLeft > epsilon);
    setCanScrollRight(container.scrollLeft < maxScrollLeft - epsilon);
  }, [getScrollInfo, isCarousel, loop, screenWidth]);

  useEffect(() => {
    if (!isCarousel || screenWidth < 768) {
      updateNavigationState();
      return undefined;
    }

    const info = getScrollInfo();
    if (!info) {
      updateNavigationState();
      return undefined;
    }

    const { container } = info;
    const onScroll = () => updateNavigationState();

    const rafId = requestAnimationFrame(updateNavigationState);
    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateNavigationState);

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateNavigationState);
    };
  }, [
    getScrollInfo,
    isCarousel,
    screenWidth,
    destinations.length,
    updateNavigationState,
  ]);

  const handlePrevious = () => {
    if (!loop && !canScrollLeft) return;
    const info = getScrollInfo();
    if (!info) return;
    info.container.scrollBy({ left: -info.stride, behavior: 'smooth' });
    window.setTimeout(updateNavigationState, 320);
  };

  const handleNext = () => {
    if (!loop && !canScrollRight) return;
    const info = getScrollInfo();
    if (!info) return;
    info.container.scrollBy({ left: info.stride, behavior: 'smooth' });
    window.setTimeout(updateNavigationState, 320);
  };

  return html`
    <div
      data-name="carouselDestinations"
      class="flex flex-col gap-[var(--spacing-medium,16px)] w-full ${customClassName}"
      ...${rest}
    >
      <!-- Header: title + count badge + navigation -->
      <div class="max-w-[1248px] min-[1248px]:p-0 min-[480px]:px-[32px] px-[16px] self-center flex items-center gap-[var(--spacing-medium,16px)] w-full ${screenWidth < 768 ? 'justify-between' : ''}">
        <!-- Title -->
        <h2
          class="!text-text-normal-primary !text-xl !m-0"
        >
          ${title}
        </h2>

        <!-- Count badge -->
        ${totalCount ? html`
          <${Chip} variant="control">
            ${totalCount}
          </${Chip}>
        ` : ''}

        <!-- Navigation chevrons (right-aligned) - only show in carousel mode and desktop (>=768px) -->
        ${isCarousel && screenWidth >= 768 ? html`
          <div class="flex flex-1 items-center justify-end gap-[var(--spacing-x-small,8px)] min-w-0">
            <${CarouselNavigationButton}
              direction="left"
              onClick=${handlePrevious}
              disabled=${!loop && !canScrollLeft}
              absolute=${false}
              customClassName="!shadow-none"
            />
            <${CarouselNavigationButton}
              direction="right"
              onClick=${handleNext}
              disabled=${!loop && !canScrollRight}
              absolute=${false}
              customClassName="!shadow-none"
            />
          </div>
        ` : ''}
      </div>

      <!-- Carousel or Grid container -->
      <div ref=${carouselWrapperRef} class="relative w-[calc(100%-max(0px,(100vw-1248px)/2))] min-[1248px]:p-0 min-[480px]:pl-[32px] pl-[16px] ml-[max(0px,calc((100vw-1248px)/2))] flex">
        ${isCarousel ? html`
          <!-- Carousel View -->
          <${Carousel}
            itemsPerView=${itemsPerView}
            gap=${gap}
            showNavigation=${false}
            showPagination=${false}
            loop=${loop}
            infiniteMobile=${false}
            customScrollContainerClassName="pr-[16px] min-[480px]:pr-[32px] min-[1248px]:pr-0"
          >
            ${destinations.map((dest) => html`
              <${DestinationCard}
                key=${dest.destinationName}
                destinationName=${dest.destinationName}
                complementaryText=${dest.complementaryText}
                imageUrl=${dest.imageUrl}
                imageAlt=${dest.imageAlt}
                href=${dest.href}
                iataCityCode=${dest.iataCityCode}
                onClick=${dest.onClick}
              />
            `)}
          </${Carousel}>
        ` : html`
          <!-- Grid View -->
          <div class="flex flex-wrap gap-[16px]">
            ${destinations.map((dest) => html`
              <${DestinationCard}
                key=${dest.destinationName}
                destinationName=${dest.destinationName}
                complementaryText=${dest.complementaryText}
                imageUrl=${dest.imageUrl}
                imageAlt=${dest.imageAlt}
                href=${dest.href}
                onClick=${dest.onClick}
              />
            `)}
          </div>
        `}
      </div>
    </div>
  `;
};

export default CarouselDestinations;
