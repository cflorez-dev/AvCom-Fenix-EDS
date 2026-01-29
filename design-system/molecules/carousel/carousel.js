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

    // ========== DOT CLASSES (Tailwind) ==========
    const dotSizeClasses = isSelected
      ? 'w-[16px] h-[8px]'
      : 'w-[8px] h-[8px]';

    const dotClasses = `${dotSizeClasses} relative shrink-0 ${onDotClick ? 'cursor-pointer' : ''}`;

    // ========== PAGINATION INNER STYLES (Inline) ==========
    const paginationClasses = 'absolute inset-0 rounded-[4px] border border-solid';

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
        aria-label="${('Page ' + (index + 1))}"
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
      class="${`inline-flex justify-start items-start gap-[4px] ${customClassName}`}"
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
 * @param {number|false} [props.navigationBreakpoint=false] - Minimum width (px) to show navigation buttons. Set to false to always show (if showNavigation=true), or number to hide below that width
 * @param {boolean} [props.showPagination=true] - Show pagination dots
 * @param {boolean} [props.autoPlay=true] - Enable auto-play
 * @param {number} [props.autoPlayInterval=3000] - Auto-play interval in ms
 * @param {boolean} [props.loop=true] - Enable infinite loop
 * @param {boolean} [props.infiniteMobile=false] - Enable infinite mobile mode (removes outer container padding, adds scroll container padding)
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
  autoPlay = true,
  autoPlayInterval = 3000,
  loop = true,
  infiniteMobile = false,
  customClassName = '',
  ...rest
}) => {
  const scrollContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const autoPlayTimerRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Convert children to array
  const items = Array.isArray(children) ? children : [children].filter(Boolean);
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerView);

  // No duplication - render items as-is
  const itemsToRender = items;

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
   * Update scroll button states
   */
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  /**
   * Scroll to specific page
   */
  const scrollToPage = (pageIndex, instant = false) => {
    if (!scrollContainerRef.current) return;

    isProgrammaticScrollRef.current = true;
    const container = scrollContainerRef.current;
    const itemWidth = container.scrollWidth / totalItems;
    const scrollAmount = pageIndex * itemsPerView * itemWidth;

    container.scrollTo({
      left: scrollAmount,
      behavior: instant ? 'instant' : 'smooth',
    });

    setCurrentPage(pageIndex);
    
    // Reset flag after scroll animation completes
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, instant ? 0 : 500);
  };

  /**
   * Handle infinite loop wrap-around (simplified without duplication)
   */
  const handleInfiniteLoop = () => {
    if (!loop || !scrollContainerRef.current) return;
    
    // Simply reset to first/last page when reaching the end
    // This creates a jump but no duplicated content
    if (currentPage >= totalPages) {
      setTimeout(() => {
        scrollToPage(0, true);
      }, 300);
    } else if (currentPage < 0) {
      setTimeout(() => {
        scrollToPage(totalPages - 1, true);
      }, 300);
    }
  };

  /**
   * Navigate to previous page
   */
  const handlePrevious = () => {
    const prevPage = currentPage === 0 
      ? (loop ? totalPages - 1 : 0)
      : currentPage - 1;
    
    scrollToPage(prevPage);
  };

  /**
   * Navigate to next page
   */
  const handleNext = () => {
    const nextPage = currentPage === totalPages - 1
      ? (loop ? 0 : totalPages - 1)
      : currentPage + 1;
    
    scrollToPage(nextPage);
  };

  /**
   * Handle scroll event to update current page
   */
  const handleScroll = () => {
    if (!scrollContainerRef.current || isProgrammaticScrollRef.current) return;

    const container = scrollContainerRef.current;
    const itemWidth = container.scrollWidth / totalItems;
    const scrollPosition = container.scrollLeft;
    const calculatedPage = Math.round(scrollPosition / (itemsPerView * itemWidth));
    
    // Clamp to valid range
    const clampedPage = Math.max(0, Math.min(totalPages - 1, calculatedPage));
    
    setCurrentPage(clampedPage);
    updateScrollButtons();
  };

  /**
   * Auto-play functionality with infinite loop
   */
  const startAutoPlay = () => {
    if (!autoPlay || autoPlayTimerRef.current) return;

    autoPlayTimerRef.current = setInterval(() => {
      if (isTransitioningRef.current) return;
      
      setCurrentPage((prevPage) => {
        const nextPage = prevPage === totalPages - 1
          ? (loop ? 0 : prevPage)
          : prevPage + 1;

        // Scroll to next page
        if (scrollContainerRef.current) {
          isProgrammaticScrollRef.current = true;
          const container = scrollContainerRef.current;
          const itemWidth = container.scrollWidth / totalItems;
          const scrollAmount = nextPage * itemsPerView * itemWidth;

          container.scrollTo({
            left: scrollAmount,
            behavior: 'smooth',
          });
          
          setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 500);
        }

        return nextPage;
      });
    }, autoPlayInterval);
  };

  const stopAutoPlay = () => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [autoPlay, autoPlayInterval]);

  /**
   * Initialize carousel at correct position
   */
  useEffect(() => {
    updateScrollButtons();
  }, [totalItems, itemsPerView]);

  /**
   * Pause auto-play on hover
   */
  const handleMouseEnter = () => {
    stopAutoPlay();
  };

  const handleMouseLeave = () => {
    startAutoPlay();
  };

  // Client logic: Desktop shows navigation/dots only if totalItems > itemsPerView
  // Mobile always shows dots, scroll horizontal
  // navigationBreakpoint controls when navigation arrows are visible
  const shouldShowNavigation = showNavigation && showNavigationBasedOnWidth && totalItems > itemsPerView;
  const shouldShowPagination = isMobile ? (showPagination && totalPages > 1) : (showPagination && totalItems > itemsPerView && totalPages > 1);

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

  console.log('Carousel Render:', { isMobile, isTablet, infiniteMobile, containerPadding, scrollPadding });

  return html`
    <div
      class="${`w-full inline-flex flex-col justify-start items-center gap-0 ${customClassName}`}"
      data-name="carousel"
      onMouseEnter=${autoPlay ? handleMouseEnter : null}
      onMouseLeave=${autoPlay ? handleMouseLeave : null}
      ...${rest}
    >
      <div class="self-stretch ${containerPadding} relative bg-transparent inline-flex justify-start items-center">
        <div
          ref=${scrollContainerRef}
          class="flex-1 flex justify-start items-center overflow-x-auto scroll-smooth gap-3 scrollbar-hide ${scrollPadding}"
          onScroll=${handleScroll}
          style=${{
            gap: `${gap}px`,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          ${itemsToRender}
        </div>

        ${shouldShowNavigation ? html`
          <${CarouselNavigationButton}
            direction="left"
            onClick=${handlePrevious}
            disabled=${!loop && currentPage === 0}
          />
          <${CarouselNavigationButton}
            direction="right"
            onClick=${handleNext}
            disabled=${!loop && currentPage === totalPages - 1}
          />
        ` : ''}
      </div>

      ${shouldShowPagination ? html`
        <${CarouselPaginationDots}
          totalPages=${totalPages}
          currentPage=${currentPage}
          onDotClick=${(pageIndex) => scrollToPage(pageIndex)}
        />
      ` : ''}
    </div>
  `;
};

export default Carousel;
