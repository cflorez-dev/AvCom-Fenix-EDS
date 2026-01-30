import { h } from '@dropins/tools/preact.js';
import { useState, useRef, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { CarouselNavigationButton } from '../../atoms/carousel-navigation-button/carousel-navigation-button.js';

const html = htm.bind(h);

/**
 * CarouselPaginationDots - Pagination indicators for carousel
 * Matches Figma design specs (16x8px selected, 8x8px unselected)
 * @param {Object} props - Component properties
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.currentPage - Current active page (0-indexed)
 * @param {Function} [props.onDotClick] - Callback for dot click
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @returns {import('preact').VNode} CarouselPaginationDots component
 */
const CarouselPaginationDots = ({
  totalPages,
  currentPage,
  onDotClick,
  customClassName = '',
}) => {
  const dots = Array.from({ length: totalPages }, (_, index) => {
    const isSelected = index === currentPage;
    const dotSizeClasses = isSelected
      ? 'w-[16px] h-[8px]'
      : 'w-[8px] h-[8px]';

    const dotClasses = `
      ${dotSizeClasses}
      relative
      shrink-0
      transition-all
      duration-300
      ease-in-out
      ${onDotClick ? 'cursor-pointer' : ''}
    `;

    const paginationClasses = `
      absolute inset-0
      rounded-[4px]
      border border-solid
      transition-all
      duration-300
      ease-in-out
    `;

    const paginationStyles = isSelected
      ? {
        backgroundColor: '#1b1b1b',
        borderColor: '#1b1b1b',
      }
      : {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: '#1b1b1b',
      };

    return html`
      <button
        key=${index}
        type="button"
        class=${dotClasses}
        onClick=${onDotClick ? () => onDotClick(index) : null}
        aria-label=${`Page ${index + 1}`}
        aria-current=${isSelected}
        data-selected="${isSelected}"
      >
        <div
          class=${paginationClasses}
          style=${paginationStyles}
        />
      </button>
    `;
  });

  return html`
    <div
      class="inline-flex justify-start items-start gap-[4px] ${customClassName}"
      data-name="carouselPaginationDots"
      data-pages="${totalPages}"
      role="tablist"
    >
      ${dots}
    </div>
  `;
};

/**
 * Carousel - Responsive carousel component for displaying cards
 * Supports InformativePhotoCard and PromotionalCardCarrousel components
 *
 * @param {Object} props - Component properties
 * @param {import('preact').ComponentChildren} props.children - Card components to display
 * @param {number} [props.itemsPerView=3] - Number of items visible at once (desktop)
 * @param {number} [props.gap=12] - Gap between items in pixels
 * @param {boolean} [props.showNavigation=true] - Show navigation buttons
 * @param {number|false} [props.navigationBreakpoint=false] - Minimum width (px) to show
 *   navigation buttons. Set to false to always show (if showNavigation=true), or number to
 *   hide below that width
 * @param {boolean} [props.showPagination=true] - Show pagination dots
 * @param {boolean} [props.loop=true] - Enable infinite loop
 * @param {boolean} [props.infiniteMobile=false] - Enable infinite mobile mode (removes outer
 *   container padding, adds scroll container padding)
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @returns {import('preact').VNode} Carousel component
 */
export const Carousel = ({
  children,
  itemsPerView = 3,
  gap = 12,
  showNavigation = true,
  navigationBreakpoint = false,
  showPagination = true,
  loop = true,
  infiniteMobile = false,
  customClassName = '',
  ...rest
}) => {
  const scrollContainerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const itemStrideRef = useRef(0);
  const [itemStride, setItemStride] = useState(0);
  const isScrollingProgrammatically = useRef(false);
  const scrollDebounceTimer = useRef(null);
  const isInitialized = useRef(false);

  // Convert children to array
  const items = Array.isArray(children) ? children : [children].filter(Boolean);
  const totalItems = items.length;
  const normalizedItemsPerView = Math.max(1, itemsPerView);
  const maxStartIndex = loop
    ? Math.max(0, totalItems - 1)
    : Math.max(0, totalItems - normalizedItemsPerView);

  let totalPages = 0;
  if (totalItems > 0) {
    totalPages = loop ? totalItems : maxStartIndex + 1;
  }

  const loopCopies = loop ? 3 : 1;
  const itemsToRender = Array.from({ length: loopCopies }, (_, loopIndex) => (
    items.map((item, itemIndex) => html`
      <div key=${`carousel-item-${loopIndex}-${itemIndex}`} class="shrink-0">
        ${item}
      </div>
    `)
  )).flat();

  // Detect mobile and tablet viewports
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 769);
      setIsTablet(width < 1024 && width >= 769);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);

    return () => {
      window.removeEventListener('resize', checkViewport);
    };
  }, []);

  // Check if navigation should be shown based on breakpoint
  const [showNavigationBasedOnWidth, setShowNavigationBasedOnWidth] = useState(true);

  useEffect(() => {
    const checkNavigationVisibility = () => {
      if (navigationBreakpoint === false) {
        setShowNavigationBasedOnWidth(true);
      } else {
        setShowNavigationBasedOnWidth(window.innerWidth >= navigationBreakpoint);
      }
    };

    checkNavigationVisibility();
    window.addEventListener('resize', checkNavigationVisibility);

    return () => {
      window.removeEventListener('resize', checkNavigationVisibility);
    };
  }, [navigationBreakpoint]);

  /**
   * Measure item stride (width + gap)
   */
  const updateItemStride = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const firstChild = container.children[0];
    if (!firstChild) return;
    const itemWidth = firstChild.getBoundingClientRect().width;
    const computed = window.getComputedStyle(container);
    const gapValue = parseFloat(computed.columnGap || computed.gap || '0');
    const stride = itemWidth + (Number.isFinite(gapValue) ? gapValue : 0);

    if (stride > 0 && Math.abs(stride - itemStrideRef.current) > 1) {
      itemStrideRef.current = stride;
      setItemStride(stride);
    }
  };

  useEffect(() => {
    updateItemStride();
    if (!scrollContainerRef.current) return undefined;

    const container = scrollContainerRef.current;
    let resizeObserver;

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateItemStride();
      });
      resizeObserver.observe(container);
      if (container.children[0]) {
        resizeObserver.observe(container.children[0]);
      }
    } else {
      window.addEventListener('resize', updateItemStride);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateItemStride);
      }
    };
  }, [totalItems, gap, itemsPerView]);

  /**
   * Initialize scroll position for loop mode
   */
  useEffect(() => {
    if (!scrollContainerRef.current || !itemStride || totalItems === 0 || !loop) return;
    if (isInitialized.current) return;

    const container = scrollContainerRef.current;
    const totalLoopWidth = itemStride * totalItems;

    // Set initial position instantly without animation
    isScrollingProgrammatically.current = true;
    container.scrollLeft = totalLoopWidth;
    isInitialized.current = true;

    // Reset flag after a small delay
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 50);
  }, [itemStride, totalItems, loop]);

  /**
   * Get current scroll index based on scroll position
   */
  const getCurrentScrollIndex = () => {
    if (!scrollContainerRef.current || !itemStrideRef.current || totalItems === 0) return 0;

    const container = scrollContainerRef.current;
    const totalLoopWidth = itemStrideRef.current * totalItems;

    if (loop) {
      // Calculate position relative to middle copy
      const scrollOffset = container.scrollLeft - totalLoopWidth;
      const normalized = ((scrollOffset % totalLoopWidth) + totalLoopWidth) % totalLoopWidth;
      // Use threshold-based snapping instead of simple rounding
      const rawIndex = normalized / itemStrideRef.current;
      const threshold = 0.4; // Snap when 40% into next item
      let calculatedIndex = Math.floor(rawIndex + threshold);
      calculatedIndex = ((calculatedIndex % totalItems) + totalItems) % totalItems;
      return calculatedIndex;
    }

    const rawIndex = container.scrollLeft / itemStrideRef.current;
    const calculatedIndex = Math.floor(rawIndex + 0.4);
    return Math.max(0, Math.min(maxStartIndex, calculatedIndex));
  };

  /**
   * Scroll to specific item index within the loop
   * Always navigates forward (to the right) in loop mode for dots
   */
  const scrollToIndex = (itemIndex, instant = false) => {
    if (!scrollContainerRef.current || !itemStrideRef.current || totalItems === 0) return;

    const container = scrollContainerRef.current;
    const totalLoopWidth = itemStrideRef.current * totalItems;
    const targetIndex = loop
      ? ((itemIndex % totalItems) + totalItems) % totalItems
      : Math.max(0, Math.min(maxStartIndex, itemIndex));

    isScrollingProgrammatically.current = true;

    let scrollAmount;
    if (loop) {
      // Calculate forward distance for always-right navigation
      const forwardDistance = ((targetIndex - currentIndex) + totalItems) % totalItems;

      // Move forward from current scroll position
      scrollAmount = container.scrollLeft + (forwardDistance * itemStrideRef.current);

      // Ensure we stay within bounds of middle copy
      const minScroll = totalLoopWidth * 0.5;
      const maxScroll = totalLoopWidth * 1.5;

      if (scrollAmount < minScroll) {
        scrollAmount += totalLoopWidth;
      } else if (scrollAmount >= maxScroll) {
        scrollAmount -= totalLoopWidth;
      }
    } else {
      scrollAmount = targetIndex * itemStrideRef.current;
    }

    container.scrollTo({
      left: scrollAmount,
      behavior: instant ? 'auto' : 'smooth',
    });

    // Reset flag after animation completes
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, instant ? 50 : 500);
  };

  /**
   * Navigate to previous item
   */
  const handlePrevious = () => {
    if (!scrollContainerRef.current || !itemStrideRef.current || totalItems === 0) return;

    isScrollingProgrammatically.current = true;
    const container = scrollContainerRef.current;
    container.scrollTo({
      left: container.scrollLeft - itemStrideRef.current,
      behavior: 'smooth',
    });

    setTimeout(() => {
      isScrollingProgrammatically.current = false;
      // Force index update after animation
      const newIndex = getCurrentScrollIndex();
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }, 200);
  };

  /**
   * Navigate to next item
   */
  const handleNext = () => {
    if (!scrollContainerRef.current || !itemStrideRef.current || totalItems === 0) return;

    isScrollingProgrammatically.current = true;
    const container = scrollContainerRef.current;
    container.scrollTo({
      left: container.scrollLeft + itemStrideRef.current,
      behavior: 'smooth',
    });

    setTimeout(() => {
      isScrollingProgrammatically.current = false;
      // Force index update after animation
      const newIndex = getCurrentScrollIndex();
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }, 200);
  };

  /**
   * Handle scroll event to update current index and manage loop boundaries
   */
  const handleScroll = () => {
    if (!scrollContainerRef.current || !itemStrideRef.current || totalItems === 0) return;

    // Clear existing debounce timer
    if (scrollDebounceTimer.current) {
      clearTimeout(scrollDebounceTimer.current);
    }

    // Debounce scroll updates
    scrollDebounceTimer.current = setTimeout(() => {
      // Skip only if we're in the middle of a programmatic scroll
      if (isScrollingProgrammatically.current) return;

      const container = scrollContainerRef.current;
      if (!container || !itemStrideRef.current) return;

      const totalLoopWidth = itemStrideRef.current * totalItems;

      if (loop) {
        const minScroll = totalLoopWidth * 0.5;
        const maxScroll = totalLoopWidth * 1.5;

        // Reposition if we've scrolled outside middle copy bounds
        if (container.scrollLeft <= minScroll || container.scrollLeft >= maxScroll) {
          isScrollingProgrammatically.current = true;

          // Calculate which item we're currently on
          const currentScrollIndex = getCurrentScrollIndex();

          // Snap to middle copy instantly
          const newScrollLeft = totalLoopWidth + (currentScrollIndex * itemStrideRef.current);
          container.scrollLeft = newScrollLeft;

          setTimeout(() => {
            isScrollingProgrammatically.current = false;
          }, 50);
        }
      }

      // Update current index
      const newIndex = getCurrentScrollIndex();
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }, 100); // Increased debounce to 100ms for smoother updates
  };

  // Client logic: Desktop shows navigation/dots only if totalItems > itemsPerView
  // Mobile always shows dots, scroll horizontal
  // navigationBreakpoint controls when navigation arrows are visible
  const shouldShowNavigation = showNavigation
    && showNavigationBasedOnWidth
    && totalItems > itemsPerView;
  const shouldShowPagination = isMobile
    ? (showPagination && totalPages > 1)
    : (showPagination && totalItems > itemsPerView && totalPages > 1);

  // Infinite mobile mode: adjust padding for mobile and tablet
  // Container padding only applies when showNavigation is true (to make space for arrows)
  let containerPadding = showNavigation ? 'px-3' : 'px-0';
  let scrollPadding = '';

  if (infiniteMobile) {
    if (isMobile) {
      containerPadding = 'px-0';
      scrollPadding = 'px-4';
    } else if (isTablet) {
      containerPadding = 'px-0';
      scrollPadding = 'px-8';
    }
  }

  return html`
    <div
      class="${`w-full inline-flex flex-col justify-start items-center gap-0 ${customClassName}`}"
      data-name="carousel"
      ...${rest}
    >
      <div class="self-stretch ${containerPadding} relative bg-transparent inline-flex justify-start items-center">
        <div
          ref=${scrollContainerRef}
          class="flex-1 flex justify-start items-center overflow-x-auto gap-3 scrollbar-hide ${scrollPadding}"
          onScroll=${handleScroll}
        >
          ${itemsToRender}
        </div>

        ${shouldShowNavigation ? html`
          <${CarouselNavigationButton}
            direction="left"
            onClick=${handlePrevious}
            disabled=${!loop && currentIndex === 0}
          />
          <${CarouselNavigationButton}
            direction="right"
            onClick=${handleNext}
            disabled=${!loop && currentIndex === totalPages - 1}
          />
        ` : ''}
      </div>

      ${shouldShowPagination ? html`
        <${CarouselPaginationDots}
          totalPages=${totalPages}
          currentPage=${currentIndex}
          onDotClick=${(pageIndex) => {
    if (pageIndex === currentIndex) return;
    // Update index immediately for visual feedback
    setCurrentIndex(pageIndex);
    scrollToIndex(pageIndex);
  }}
        />
      ` : ''}
    </div>
  `;
};

export default Carousel;
