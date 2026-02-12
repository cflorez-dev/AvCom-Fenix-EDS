import { h, render } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { LinkCard } from '../../design-system/organisms/cards/link-card/link-card.js';
import { getMosaicCards } from './mosaic-cards-v2.store.js';

const html = htm.bind(h);

/**
 * Detect if viewport is mobile (≤767px)
 * @returns {boolean} True if mobile viewport
 */
function isMobileViewport() {
  return window.innerWidth <= 767;
}

/**
 * Create carousel structure for mobile view
 * @param {Array} allCards - Array of all card data from all mosaics
 * @param {string} groupId - Carousel group identifier
 * @param {Object} config - Carousel configuration (autoplay, autoplaySpeed)
 * @returns {HTMLElement} Carousel container element
 */
async function createMobileCarousel(allCards, groupId, config = {}) {
  const { autoplay = false, autoplaySpeed = 3000, showArrows = false } = config;
  
  // Dynamically import CarouselPaginationDots
  const carouselModule = await import(
    `${window.hlx.codeBasePath}/design-system/molecules/carousel/carousel.js`
  );
  const CarouselPaginationDots = carouselModule.CarouselPaginationDots
    || carouselModule.default?.CarouselPaginationDots;

  // Create carousel container with ARIA
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'mosaic-v2-mobile-carousel pb-6 relative';
  carouselContainer.setAttribute('data-group-id', groupId);
  carouselContainer.setAttribute('role', 'region');
  carouselContainer.setAttribute('aria-label', 'Mosaic cards carousel');

  // Create carousel wrapper with horizontal scroll and touch support
  const carouselWrapper = document.createElement('div');
  // Disable snap when autoplay is active to allow smooth continuous scroll
  const snapClasses = autoplay ? '' : 'snap-x snap-mandatory';
  carouselWrapper.className = `carousel-wrapper overflow-x-auto ${snapClasses} scrollbar-hide flex gap-4 p-4 pb-0 scroll-pl-4 scroll-pr-4`;
  // Set scroll behavior based on autoplay: 'auto' for autoplay (no animation), 'smooth' for manual scroll
  carouselWrapper.style.scrollBehavior = autoplay ? 'auto' : 'smooth';
  carouselWrapper.setAttribute('role', 'list');
  carouselWrapper.setAttribute('aria-live', 'polite');

  // Duplicate cards for infinite loop (like carousel.js)
  const duplicatedCards = [...allCards, ...allCards];

  // Render each card using LinkCard component
  duplicatedCards.forEach((cardData, index) => {
    const cardSlide = document.createElement('div');
    // Mobile (≤479px): 1 card = 100% width, snap-center to center single card
    // Tablet (480-767px): 2 cards = 50% width minus half gap, snap-start to align from left
    // Disable snap when autoplay is active
    const snapClasses = autoplay ? '' : 'snap-center snap-always max-[479px]:snap-center min-[480px]:snap-start';
    cardSlide.className = `carousel-slide flex-shrink-0 w-full min-[480px]:w-[calc(50%-8px)] ${snapClasses}`;
    cardSlide.setAttribute('data-card-index', index);
    cardSlide.setAttribute('data-original-index', index % allCards.length);
    cardSlide.setAttribute('role', 'listitem');
    cardSlide.setAttribute('aria-label', `Card ${(index % allCards.length) + 1} of ${allCards.length}`);

    // Ensure all props have values - avoid undefined
    const props = {
      image: cardData.imageMobile || cardData.imageDesktop || '',
      imageAlt: cardData.imageMobileAlt || cardData.imageDesktopAlt || '',
      imageDesktop: cardData.imageDesktop || '',
      imageDesktopAlt: cardData.imageDesktopAlt || '',
      imageMobile: cardData.imageMobile || '',
      imageMobileAlt: cardData.imageMobileAlt || '',
      title: cardData.title || '',
      description: cardData.description || '',
      linkText: cardData.ctaLabel || '',
      href: cardData.linkUrl || '',
      linkAlt: cardData.linkAlt || '',
      linkOpensIn: cardData.linkOpensIn || '',
      ctaIconBefore: cardData.ctaIconBefore || '',
      ctaIconAfter: cardData.ctaIconAfter || '',
      clickBehavior: cardData.clickBehavior || '',
      supportIcon: cardData.supportIcon || '',
      badges: cardData.badges || [],
      columns: 1,
      rows: 1,
    };

    // Render LinkCard component
    const LinkCardComponent = html`
      <${LinkCard}
        image=${props.image}
        imageAlt=${props.imageAlt}
        imageDesktop=${props.imageDesktop}
        imageDesktopAlt=${props.imageDesktopAlt}
        imageMobile=${props.imageMobile}
        imageMobileAlt=${props.imageMobileAlt}
        title=${props.title}
        description=${props.description}
        linkText=${props.linkText}
        href=${props.href}
        linkAlt=${props.linkAlt}
        linkOpensIn=${props.linkOpensIn}
        ctaIconBefore=${props.ctaIconBefore}
        ctaIconAfter=${props.ctaIconAfter}
        clickBehavior=${props.clickBehavior}
        supportIcon=${props.supportIcon}
        badges=${props.badges}
        columns=${props.columns}
        rows=${props.rows}
      />
    `;

    render(LinkCardComponent, cardSlide);
    carouselWrapper.appendChild(cardSlide);
  });

  // Touch interaction state
  let isUserScrolling = false;
  let autoScrollInterval = null;
  let userPaused = false;
  let pauseTimeout = null;

  // Auto-scroll for smooth continuous movement
  // Defined here before event listeners need it
  const startAutoScroll = () => {
    // Don't start if autoplay is disabled, already running, or user is interacting
    if (!autoplay || autoScrollInterval || userPaused || isUserScrolling) return;
    
    let scrollCount = 0;
    autoScrollInterval = setInterval(() => {
      if (!isUserScrolling && !userPaused && !document.hidden) {
        // Only increment scroll position - this is horizontal scroll, doesn't affect page
        carouselWrapper.scrollLeft += 1;
      }
    }, 30);
  };

  // Pause on touch interaction
  carouselWrapper.addEventListener('touchstart', () => {
    isUserScrolling = true;
    userPaused = true;

    // Enable smooth scroll for manual interaction
    carouselWrapper.style.scrollBehavior = 'smooth';
    
    // Enable snap for manual interaction if autoplay was enabled
    if (autoplay) {
      carouselWrapper.classList.add('snap-x', 'snap-mandatory');
      // Also enable snap on cards
      carouselWrapper.querySelectorAll('.carousel-slide').forEach((slide) => {
        slide.classList.add('snap-center', 'snap-always');
      });
    }

    // Clear any existing pause timeout
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      pauseTimeout = null;
    }

    // Pause autoplay immediately
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }, { passive: true });

  carouselWrapper.addEventListener('touchend', () => {
    isUserScrolling = false;

    // Clear any existing pause timeout
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
    }

    // Resume after longer delay to prevent interference
    pauseTimeout = setTimeout(() => {
      userPaused = false;
      // Restore auto scroll behavior if autoplay is enabled
      if (autoplay) {
        carouselWrapper.style.scrollBehavior = 'auto';
        // Disable snap for autoplay
        carouselWrapper.classList.remove('snap-x', 'snap-mandatory');
        // Also disable snap on cards
        carouselWrapper.querySelectorAll('.carousel-slide').forEach((slide) => {
          slide.classList.remove('snap-center', 'snap-always');
        });
      }
      if (autoplay && !document.hidden) {
        startAutoScroll();
      }
    }, 3000);
  }, { passive: true });

  // Infinite loop scroll handler - seamless reset at boundaries
  const handleInfiniteScroll = () => {
    const { scrollLeft } = carouselWrapper;
    const allSlides = Array.from(carouselWrapper.querySelectorAll('.carousel-slide'));
    
    // Use offsetLeft of first card in second set for accurate width calculation
    const firstCardSecondSet = allSlides[allCards.length];
    const totalOriginalWidth = firstCardSecondSet ? firstCardSecondSet.offsetLeft : 0;
    
    if (!totalOriginalWidth) return;

    // We have [...allCards, ...allCards] so total content is 2x original
    // We start at totalOriginalWidth (beginning of second set)
    // When we scroll forward past ~1.7x, reset to equivalent position in first set
    // When we scroll backward below ~0.3x, reset to equivalent position in second set

    if (scrollLeft >= totalOriginalWidth * 1.7) {
      // Near end of second set, jump back to equivalent position in first set
      const originalBehavior = carouselWrapper.style.scrollBehavior;
      carouselWrapper.style.scrollBehavior = 'auto';
      carouselWrapper.scrollLeft = scrollLeft - totalOriginalWidth;
      // Restore smooth behavior after jump
      requestAnimationFrame(() => {
        carouselWrapper.style.scrollBehavior = originalBehavior;
      });
    } else if (scrollLeft <= totalOriginalWidth * 0.3) {
      // Near start of first set, jump forward to equivalent position in second set
      const originalBehavior = carouselWrapper.style.scrollBehavior;
      carouselWrapper.style.scrollBehavior = 'auto';
      carouselWrapper.scrollLeft = scrollLeft + totalOriginalWidth;
      // Restore smooth behavior after jump
      requestAnimationFrame(() => {
        carouselWrapper.style.scrollBehavior = originalBehavior;
      });
    }
  };

  carouselWrapper.addEventListener('scroll', handleInfiniteScroll, { passive: true });

  // Cleanup on visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
        pauseTimeout = null;
      }
    } else if (autoplay && !userPaused && !isUserScrolling) {
      startAutoScroll();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  carouselContainer.appendChild(carouselWrapper);

  // Set initial scroll position to start of second set for true infinite loop
  // This allows scrolling in both directions
  setTimeout(() => {
    const allSlides = Array.from(carouselWrapper.querySelectorAll('.carousel-slide'));
    
    // Use the offsetLeft of the first card in the second set for accurate positioning
    // This accounts for actual DOM layout with gaps between (not after) elements
    const firstCardSecondSet = allSlides[allCards.length];
    const totalOriginalWidth = firstCardSecondSet ? firstCardSecondSet.offsetLeft : 0;

    // Temporarily disable smooth scroll for initial positioning
    const originalBehavior = carouselWrapper.style.scrollBehavior;
    carouselWrapper.style.scrollBehavior = 'auto';

    // Start at the beginning of the second set (after first duplication)
    carouselWrapper.scrollLeft = totalOriginalWidth;

    // Restore smooth scroll
    setTimeout(() => {
      carouselWrapper.style.scrollBehavior = originalBehavior;
    }, 50);
  }, 0);

  // Start auto-scroll after component is fully rendered and settled (only if autoplay is enabled)
  setTimeout(() => {
    if (autoplay && !userPaused && !isUserScrolling) {
      startAutoScroll();
    }
  }, 1500);

  // Add navigation dots using CarouselPaginationDots component (only if showArrows is enabled)
  if (showArrows && allCards.length > 1) {
    const dotsWrapper = document.createElement('div');
    dotsWrapper.className = 'carousel-dots flex justify-center mt-4';
    dotsWrapper.setAttribute('role', 'tablist');
    dotsWrapper.setAttribute('aria-label', 'Carousel navigation');

    // State management for dots
    const DotsController = () => {
      const [currentPage, setCurrentPage] = useState(0);
      const [totalPages, setTotalPages] = useState(allCards.length);

      useEffect(() => {
        const updateDots = () => {
          const { scrollLeft } = carouselWrapper;
          const slideWidth = carouselWrapper.querySelector('.carousel-slide')?.offsetWidth || 0;
          const gap = 16;
          const viewportWidth = window.innerWidth;

          // Calculate item stride (width + gap)
          const itemStride = slideWidth + gap;

          // Calculate cards per page based on viewport
          const cardsPerPage = viewportWidth < 480 ? 1 : 2;
          const calculatedTotalPages = Math.ceil(allCards.length / cardsPerPage);

          // Update total pages if viewport changed
          if (calculatedTotalPages !== totalPages) {
            setTotalPages(calculatedTotalPages);
          }

          // Calculate current page based on scroll position
          // Get the card index that's currently most visible
          const cardIndex = Math.round(scrollLeft / itemStride);
          const originalCardIndex = cardIndex % allCards.length;
          const pageIndex = Math.floor(originalCardIndex / cardsPerPage);

          // Only update if page changed and is valid
          if (pageIndex !== currentPage && pageIndex >= 0 && pageIndex < calculatedTotalPages) {
            setCurrentPage(pageIndex);
          }
        };

        // Throttled scroll handler for smooth updates
        let scrollTimeout;
        let lastScrollLeft = -1;

        const handleScroll = () => {
          const currentScrollLeft = carouselWrapper.scrollLeft;

          // Only update if scroll position actually changed significantly
          if (Math.abs(currentScrollLeft - lastScrollLeft) > 5) {
            lastScrollLeft = currentScrollLeft;

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateDots, 50);
          }
        };

        // Update on resize
        const handleResize = () => {
          updateDots();
        };

        carouselWrapper.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        // Initial update
        updateDots();

        return () => {
          carouselWrapper.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', handleResize);
          clearTimeout(scrollTimeout);
        };
      }, [currentPage, totalPages]);

      return html`
        <${CarouselPaginationDots}
          totalPages=${totalPages}
          currentPage=${currentPage}
          onDotClick=${(pageIndex) => {
    const viewportWidth = window.innerWidth;
    const cardsPerPage = viewportWidth < 480 ? 1 : 2;
    const targetCardIndex = pageIndex * cardsPerPage;

    // Get all slides to find the exact position
    const allSlides = Array.from(carouselWrapper.querySelectorAll('.carousel-slide'));
    
    // Calculate which set we're in using real DOM position
    const currentScroll = carouselWrapper.scrollLeft;
    const firstCardSecondSet = allSlides[allCards.length];
    const totalOriginalWidth = firstCardSecondSet ? firstCardSecondSet.offsetLeft : 0;
    
    // Find target slide in the appropriate set
    let targetSlide;
    if (currentScroll < totalOriginalWidth) {
      // We're in the first set
      targetSlide = allSlides[targetCardIndex];
    } else {
      // We're in the second set
      targetSlide = allSlides[allCards.length + targetCardIndex];
    }

    if (!targetSlide) return;

    // Get exact position using offsetLeft
    const finalScrollPosition = targetSlide.offsetLeft;

    // Pause auto-scroll
    userPaused = true;
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      pauseTimeout = null;
    }

    // Scroll to exact position
    carouselWrapper.scrollTo({
      left: finalScrollPosition,
      behavior: 'smooth'
    });

    // Resume after delay
    pauseTimeout = setTimeout(() => {
      userPaused = false;
      if (autoplay && !document.hidden && !isUserScrolling) {
        startAutoScroll();
      }
    }, 2000);
  }}
        />
      `;
    };

    render(html`<${DotsController} />`, dotsWrapper);
    carouselContainer.appendChild(dotsWrapper);
  }

  return carouselContainer;
}

/**
 * Show desktop view with cms-mosaic-cards blocks
 * @param {Array} mosaicSections - Array of mosaic section data
 * @param {HTMLElement} container - Container element to render into
 */
function showDesktopView(mosaicSections, container) {
  // Clear mobile container completely
  container.innerHTML = '';
  container.style.display = 'none';
  container.classList.add('hidden', '!p-0', '!m-0', '!h-0', '!overflow-hidden');

  // Find and show the desktop mosaic-v2-container
  const desktopContainer = document.querySelector('.mosaic-v2-container.section');
  if (desktopContainer) {
    desktopContainer.style.display = '';
    desktopContainer.classList.remove('hidden', '!p-0', '!m-0', '!h-0', '!overflow-hidden');
  }

  // Show each mosaic section AND their rendered content
  mosaicSections.forEach((mosaicData) => {
    // Show the original section
    if (mosaicData.section) {
      mosaicData.section.style.display = '';
      mosaicData.section.classList.remove('hidden');
    }

    // Also show the cms-mosaic-cards rendered content
    if (mosaicData.block) {
      const renderedContent = mosaicData.block.nextElementSibling;
      if (renderedContent && renderedContent.classList.contains('cms-mosaic-cards-rendered')) {
        renderedContent.style.display = '';
      }
    }
  });
}

/**
 * Show mobile view with carousel
 * @param {Array} mosaicSections - Array of mosaic section data
 * @param {HTMLElement} container - Container element to render into
 * @param {string} groupId - Carousel group identifier
 * @param {Object} config - Carousel configuration (autoplay, autoplaySpeed)
 */
async function showMobileView(mosaicSections, container, groupId, config = {}) {
  // Hide the desktop mosaic-v2-container completely
  const desktopContainer = document.querySelector('.mosaic-v2-container.section');
  if (desktopContainer) {
    desktopContainer.style.display = 'none';
    desktopContainer.classList.add('hidden', '!p-0', '!m-0', '!h-0', '!overflow-hidden');
  }

  // Hide original mosaic sections AND their rendered content
  mosaicSections.forEach((mosaicData) => {
    if (mosaicData.section) {
      mosaicData.section.style.display = 'none';
      mosaicData.section.classList.add('hidden');
    }

    // Also hide the cms-mosaic-cards block and its rendered content
    if (mosaicData.block) {
      mosaicData.block.style.display = 'none';
      const renderedContent = mosaicData.block.nextElementSibling;
      if (renderedContent && renderedContent.classList.contains('cms-mosaic-cards-rendered')) {
        renderedContent.style.display = 'none';
      }
    }
  });

  // Get cards from store - make a deep copy to avoid mutations
  let allCards = getMosaicCards(groupId);

  // Create a deep copy of all cards to prevent mutations
  if (allCards.length > 0) {
    allCards = allCards.map((card) => ({ ...card }));
  }

  if (allCards.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(`MobileViewHelper: No cards found in store for group "${groupId}"`);
    // Fallback: collect from mosaicSections if available
    mosaicSections.forEach((mosaicData) => {
      if (mosaicData.cards && Array.isArray(mosaicData.cards)) {
        allCards.push(...mosaicData.cards.map((card) => ({ ...card })));
      }
    });
  }

  // eslint-disable-next-line no-console
  console.log(`MobileViewHelper: Creating carousel for "${groupId}" with ${allCards.length} cards`);

  // Create mobile carousel with autoplay config
  const carousel = await createMobileCarousel(allCards, groupId, config);

  // Clear and append to container
  container.innerHTML = '';
  container.appendChild(carousel);
  container.style.display = 'block';
  container.classList.remove('hidden', '!p-0', '!m-0', '!h-0', '!overflow-hidden');
}

/**
 * Initialize responsive view handler for mosaic cards v2
 * Switches between desktop (cms-mosaic-cards) and mobile (carousel) views
 *
 * @param {Object} config - Configuration object
 * @param {Array} config.mosaicSections - Array of mosaic section data with cards
 * @param {string} config.groupId - Group identifier for the mosaic carousel
 * @param {HTMLElement} config.container - Container element for mobile view
 * @returns {Object} Control object with destroy method
 */
export function initMobileViewHelper(config) {
  const { mosaicSections, groupId, container, autoplay = false, autoplaySpeed = 3000, showArrows = false } = config;

  if (!mosaicSections || !groupId || !container) {
    // eslint-disable-next-line no-console
    console.error('MobileViewHelper: Missing required configuration', config);
    return { destroy: () => {} };
  }

  // Initial render based on viewport
  async function handleResize() {
    if (isMobileViewport()) {
      await showMobileView(mosaicSections, container, groupId, { autoplay, autoplaySpeed, showArrows });
    } else {
      showDesktopView(mosaicSections, container);
    }
  }

  // Debounce resize handler
  let resizeTimeout;
  function debouncedResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      handleResize();
    }, 150);
  }

  // Initial setup (async)
  handleResize();

  // Listen to resize events
  window.addEventListener('resize', debouncedResize);

  // Return control object
  return {
    destroy: () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    },
    refresh: handleResize,
    isMobile: isMobileViewport,
  };
}

export default initMobileViewHelper;
