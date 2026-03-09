/* eslint-disable max-len */
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
  // Prevent iOS momentum scrolling from overshooting the loop boundary,
  // which would expose the empty gap beyond the duplicated card set.
  carouselWrapper.style.overscrollBehaviorX = 'none';
  carouselWrapper.setAttribute('role', 'list');
  carouselWrapper.setAttribute('aria-live', 'polite');

  // Duplicate cards for infinite loop (only once, not on viewport changes)
  const duplicatedCards = [...allCards, ...allCards];
  
  // Store original count for pagination calculation
  const originalCardsCount = allCards.length;

  // Render each card using LinkCard component
  duplicatedCards.forEach((cardData, index) => {
    const cardSlide = document.createElement('div');
    // Mobile (≤479px): 1 card = 100% width, snap-center to center single card
    // Tablet (480-767px): 2 cards = 50% width minus half gap, snap-start to align from left
    // Disable snap when autoplay is active
    const snapClasses = autoplay ? '' : 'snap-center snap-always max-[479px]:snap-center min-[480px]:snap-start';
    cardSlide.className = `carousel-slide flex-shrink-0 w-full min-[480px]:w-[calc(50%-8px)] ${snapClasses}`;
    cardSlide.setAttribute('data-card-index', index);
    cardSlide.setAttribute('data-original-index', index % originalCardsCount);
    cardSlide.setAttribute('role', 'listitem');
    cardSlide.setAttribute('aria-label', `Card ${(index % originalCardsCount) + 1} of ${originalCardsCount}`);

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
      columns: 1,
      rows: 1,
    };

    // Photographic cards (image-only, no title/description/CTA) render with h-full + absolute
    // inset-0 image inside a position:relative card. Without an explicit height on the slide
    // wrapper the entire h-full chain collapses to 0 and only the pagination dots are visible.
    // Adding a fixed height here gives the card a proper bounding box so the image fills it.
    const isPhotographicCard = !props.title && !props.description && !props.linkText;
    if (isPhotographicCard) {
      cardSlide.style.height = '328px'; // 326px image area + 2px borders
    }

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
  let isInitialized = false;
  let isDotNavigating = false;

  // Touch direction detection state
  // On real mobile devices vertical page-scroll fires touchstart/touchend on
  // the carousel element too. Without direction detection this causes autoplay
  // to pause → restart every time the user scrolls the page vertically.
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDirectionDetermined = false;
  let isHorizontalTouch = false;

  // IntersectionObserver state — tracks whether the carousel is currently
  // visible in the viewport. On iOS/Android, when the user scrolls the
  // carousel offscreen the browser may reset scrollLeft of overflow containers
  // to reclaim memory. Without guarding against this the setInterval would
  // continue running from scrollLeft=0, which looks like a "restart".
  let isInViewport = true;
  let viewportExitScrollLeft = 0; // saved position when carousel leaves viewport

  // Auto-scroll for smooth continuous movement
  // Defined here before event listeners need it
  const startAutoScroll = () => {
    // Don't start if autoplay is disabled, already running, not in viewport, or user is interacting
    if (!autoplay || autoScrollInterval || userPaused || isUserScrolling || !isInViewport) return;
    
    autoScrollInterval = setInterval(() => {
      if (!isUserScrolling && !userPaused && !document.hidden && isInViewport) {
        // Only increment scroll position - this is horizontal scroll, doesn't affect page
        carouselWrapper.scrollLeft += 1;
      }
    }, 30);
  };

  // Record touch start position — do NOT pause autoplay yet.
  // Direction is determined in touchmove once there is enough movement.
  carouselWrapper.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchDirectionDetermined = false;
    isHorizontalTouch = false;
  }, { passive: true });

  // Detect direction on first meaningful move and pause autoplay only for
  // horizontal swipes. Vertical touches (page scroll) are ignored so autoplay
  // keeps running undisturbed.
  carouselWrapper.addEventListener('touchmove', (e) => {
    if (touchDirectionDetermined) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);

    // Wait until there is enough movement to decide direction
    if (deltaX < 5 && deltaY < 5) return;

    touchDirectionDetermined = true;
    isHorizontalTouch = deltaX > deltaY;

    if (isHorizontalTouch) {
      // Horizontal swipe → pause autoplay
      isUserScrolling = true;
      userPaused = true;

      // NOTE: do NOT add snap classes here.
      // Adding snap on touchstart causes the browser to immediately snap/center
      // the current card before the user has moved (visible "centering" bug).
      // Snap is enabled on touchend instead, so cards snap cleanly after finger release.

      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
        pauseTimeout = null;
      }
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    }
    // Vertical touch → do nothing, autoplay continues uninterrupted
  }, { passive: true });

  carouselWrapper.addEventListener('touchend', () => {
    if (!isHorizontalTouch) {
      // Vertical page scroll — reset flags and leave autoplay untouched
      isUserScrolling = false;
      touchDirectionDetermined = false;
      isHorizontalTouch = false;
      return;
    }

    isUserScrolling = false;

    // Enable snap NOW (after finger release) so the card snaps into position
    // naturally as part of the browser's deceleration — not during the drag.
    if (autoplay) {
      carouselWrapper.style.scrollBehavior = 'smooth';
      carouselWrapper.classList.add('snap-x', 'snap-mandatory');
      carouselWrapper.querySelectorAll('.carousel-slide').forEach((slide) => {
        slide.classList.add('snap-center', 'snap-always');
      });
    }

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

  // Infinite loop scroll handler - seamless reset at boundaries.
  // Guarded: do NOT fire while the user's finger is on screen or while dot
  // navigation is animating. Triggering a position reset mid-drag causes a
  // visible jump because scrollBehavior is 'smooth' during user interaction.
  const handleInfiniteScroll = () => {
    if (isUserScrolling || isDotNavigating) return;
    const { scrollLeft } = carouselWrapper;
    const allSlides = Array.from(carouselWrapper.querySelectorAll('.carousel-slide'));
    
    // Use offsetLeft of first card in second set for accurate width calculation
    const firstCardSecondSet = allSlides[originalCardsCount];
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

  // Track last known viewport WIDTH to distinguish real orientation/layout
  // changes from the browser-chrome hide/show during vertical page scroll.
  // On mobile, scrolling the page causes the address bar to hide → viewport
  // HEIGHT changes but WIDTH stays the same. We must ignore those resize
  // events or the carousel scroll position is needlessly recalculated and
  // jumps, which looks like a "restart" to the user.
  let lastKnownWidth = window.innerWidth;

  // Handle viewport resize (orientation change) - only within mobile viewport
  const handleResize = () => {
    const currentWidth = window.innerWidth;

    // Only handle resize if we're still in mobile viewport
    if (currentWidth > 767) {
      lastKnownWidth = currentWidth;
      // We've switched to desktop, stop handling resize here
      // The main handler in initMobileViewHelper will take over
      return;
    }

    // Ignore resize events caused solely by viewport HEIGHT change
    // (browser chrome hide/show during vertical scroll). Only act when
    // the WIDTH changes (real orientation change or window resize).
    if (currentWidth === lastKnownWidth) return;
    lastKnownWidth = currentWidth;

    // Recalculate positions after resize
    const allSlides = Array.from(carouselWrapper.querySelectorAll('.carousel-slide'));
    const firstCardSecondSet = allSlides[originalCardsCount];
    const newTotalOriginalWidth = firstCardSecondSet ? firstCardSecondSet.offsetLeft : 0;
    
    // Get current scroll position and calculate which card we're viewing
    const currentScroll = carouselWrapper.scrollLeft;
    const slideWidth = allSlides[0]?.offsetWidth || 0;
    const gap = 16;
    const itemStride = slideWidth + gap;
    
    // Calculate current card index (modulo to get original card)
    const currentCardIndex = Math.round(currentScroll / itemStride);
    const originalCardIndex = currentCardIndex % originalCardsCount;
    
    // After resize, reposition to the same card in the second set
    // This maintains the infinite loop capability
    const targetSlide = allSlides[originalCardsCount + originalCardIndex];
    if (targetSlide && newTotalOriginalWidth > 0) {
      const originalBehavior = carouselWrapper.style.scrollBehavior;
      carouselWrapper.style.scrollBehavior = 'auto';
      carouselWrapper.scrollLeft = targetSlide.offsetLeft;
      
      requestAnimationFrame(() => {
        carouselWrapper.style.scrollBehavior = originalBehavior;
      });
    }
  };

  let resizeTimeout;
  const debouncedResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 150);
  };

  window.addEventListener('resize', debouncedResize);

  carouselContainer.appendChild(carouselWrapper);

  // Set initial scroll position to start of second set for true infinite loop
  // This allows scrolling in both directions
  setTimeout(() => {
    const allSlides = Array.from(carouselWrapper.querySelectorAll('.carousel-slide'));
    
    // Use the offsetLeft of the first card in the second set for accurate positioning
    // This accounts for actual DOM layout with gaps between (not after) elements
    const firstCardSecondSet = allSlides[originalCardsCount];
    const totalOriginalWidth = firstCardSecondSet ? firstCardSecondSet.offsetLeft : 0;

    // Temporarily disable smooth scroll for initial positioning
    const originalBehavior = carouselWrapper.style.scrollBehavior;
    carouselWrapper.style.scrollBehavior = 'auto';

    // Start at the beginning of the second set (after first duplication)
    carouselWrapper.scrollLeft = totalOriginalWidth;

    // Restore smooth scroll
    setTimeout(() => {
      carouselWrapper.style.scrollBehavior = originalBehavior;
      isInitialized = true;
      // Mark carousel as ready to show (fade in)
      carouselContainer.classList.add('ready');
    }, 50);
  }, 0);

  // Start auto-scroll after component is fully rendered and settled (only if autoplay is enabled)
  setTimeout(() => {
    if (autoplay && !userPaused && !isUserScrolling) {
      startAutoScroll();
    }
  }, 1500);

  // Add navigation dots using CarouselPaginationDots component (only if showArrows is enabled)
  if (showArrows && originalCardsCount > 1) {
    const dotsWrapper = document.createElement('div');
    dotsWrapper.className = 'carousel-dots flex justify-center mt-4';
    dotsWrapper.setAttribute('role', 'tablist');
    dotsWrapper.setAttribute('aria-label', 'Carousel navigation');

    // State management for dots
    const DotsController = () => {
      const [currentPage, setCurrentPage] = useState(0);
      const [totalPages, setTotalPages] = useState(Math.ceil(originalCardsCount / 1)); // Default 1 card per page mobile

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
          const calculatedTotalPages = Math.ceil(originalCardsCount / cardsPerPage);

          // Update total pages if viewport changed
          if (calculatedTotalPages !== totalPages) {
            setTotalPages(calculatedTotalPages);
          }

          // Calculate current page based on scroll position
          // Get the card index that's currently most visible
          const cardIndex = Math.round(scrollLeft / itemStride);
          const originalCardIndex = cardIndex % originalCardsCount;
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
    // Wait for initialization to complete
    if (!isInitialized) {
      setTimeout(() => {
        // Re-trigger click after initialization
        const dots = dotsWrapper.querySelectorAll('button');
        if (dots[pageIndex]) {
          dots[pageIndex].click();
        }
      }, 100);
      return;
    }

    const viewportWidth = window.innerWidth;
    const cardsPerPage = viewportWidth < 480 ? 1 : 2;
    const targetCardIndex = pageIndex * cardsPerPage;

    // Get all slides to find the exact position
    const allSlides = Array.from(carouselWrapper.querySelectorAll('.carousel-slide'));
    
    // Calculate which set we're in using real DOM position
    const currentScroll = carouselWrapper.scrollLeft;
    const firstCardSecondSet = allSlides[originalCardsCount];
    const totalOriginalWidth = firstCardSecondSet ? firstCardSecondSet.offsetLeft : 0;
    
    // Smart navigation: find the closest instance of the target card
    // We have two instances: one in first set (index targetCardIndex)
    // and one in second set (index originalCardsCount + targetCardIndex)
    const firstSetSlide = allSlides[targetCardIndex];
    const secondSetSlide = allSlides[originalCardsCount + targetCardIndex];
    
    // Calculate distance to each option
    const distanceToFirst = firstSetSlide ? Math.abs(currentScroll - firstSetSlide.offsetLeft) : Infinity;
    const distanceToSecond = secondSetSlide ? Math.abs(currentScroll - secondSetSlide.offsetLeft) : Infinity;
    
    // Choose the closest one
    let targetSlide;
    if (distanceToFirst < distanceToSecond) {
      targetSlide = firstSetSlide;
    } else {
      targetSlide = secondSetSlide;
    }

    if (!targetSlide) return;

    // Get exact position using offsetLeft
    const finalScrollPosition = targetSlide.offsetLeft;

    // Pause auto-scroll and disable infinite scroll reset during navigation
    isDotNavigating = true;
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

    // Resume after delay (short delay to allow smooth scroll to complete)
    pauseTimeout = setTimeout(() => {
      isDotNavigating = false;
      userPaused = false;
      if (autoplay && !document.hidden && !isUserScrolling) {
        startAutoScroll();
      }
    }, 800);
  }}
        />
      `;
    };

    render(html`<${DotsController} />`, dotsWrapper);
    carouselContainer.appendChild(dotsWrapper);
  }

  // IntersectionObserver — pause autoplay when carousel scrolls out of viewport
  // and restore/resume when it comes back in.
  // This prevents the browser from resetting scrollLeft while the carousel is
  // offscreen (a common iOS/Android optimization) from appearing as a restart.
  let viewportObserver = null;
  if (autoplay && typeof IntersectionObserver !== 'undefined') {
    viewportObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) {
          // Carousel left viewport → save position and stop autoplay
          isInViewport = false;
          viewportExitScrollLeft = carouselWrapper.scrollLeft;
          if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
          }
        } else {
          // Carousel re-entered viewport
          isInViewport = true;

          // Check if browser reset scrollLeft while offscreen (iOS memory optimisation).
          // scrollLeft will be 0 or very small when this happens. Restore to the
          // saved position so the user sees the same card, not a jump to the start.
          const slides = Array.from(carouselWrapper.querySelectorAll('.carousel-slide'));
          const firstCardSecondSet = slides[originalCardsCount];
          const totalOriginalWidth = firstCardSecondSet ? firstCardSecondSet.offsetLeft : 0;
          const wasReset = totalOriginalWidth > 0 && carouselWrapper.scrollLeft < totalOriginalWidth * 0.1;

          if (wasReset && viewportExitScrollLeft > 0) {
            // Restore the position silently (no animation)
            const savedBehavior = carouselWrapper.style.scrollBehavior;
            carouselWrapper.style.scrollBehavior = 'auto';
            // Clamp to valid range: keep relative position within second set
            const relativeOffset = viewportExitScrollLeft % (totalOriginalWidth || 1);
            carouselWrapper.scrollLeft = totalOriginalWidth + relativeOffset;
            requestAnimationFrame(() => {
              carouselWrapper.style.scrollBehavior = savedBehavior;
            });
          }

          // Resume autoplay if no user interaction is in progress
          if (!userPaused && !isUserScrolling && !document.hidden) {
            startAutoScroll();
          }
        }
      },
      // Trigger when at least 10% of the carousel is visible
      { threshold: 0.1 },
    );
    viewportObserver.observe(carouselContainer);
  }

  // Cleanup function
  const cleanup = () => {
    if (viewportObserver) {
      viewportObserver.disconnect();
      viewportObserver = null;
    }
    window.removeEventListener('resize', debouncedResize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    carouselWrapper.removeEventListener('scroll', handleInfiniteScroll);
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
    }
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
    }
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
  };

  // Store cleanup function on container for later access
  carouselContainer._cleanup = cleanup;

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

  // Keep original mosaic sections hidden in desktop to avoid duplicated content.
  mosaicSections.forEach((mosaicData) => {
    if (mosaicData.section) {
      mosaicData.section.style.display = 'none';
      mosaicData.section.classList.add('hidden');
    }

    if (mosaicData.block) {
      const renderedContent = mosaicData.block.nextElementSibling;
      if (renderedContent && renderedContent.classList.contains('cms-mosaic-cards-rendered')) {
        renderedContent.style.display = 'none';
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

  // Get cards from store
  const storeCards = getMosaicCards(groupId);

  // Create a copy of all cards to prevent mutations to the store
  let allCards = storeCards.map((card) => ({ ...card }));

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

  // Cleanup previous carousel BEFORE modifying DOM
  const existingCarousel = container.querySelector('.mosaic-v2-mobile-carousel');
  if (existingCarousel && existingCarousel._cleanup) {
    existingCarousel._cleanup();
  }

  // Clear and append to container (cleanup already done above)
  container.innerHTML = '';
  container.appendChild(carousel);
  container.style.display = 'block';
  container.classList.remove('hidden', '!p-0', '!m-0', '!h-0', '!overflow-hidden');
}

/**
 * Show stacked mobile/tablet view (one fold below another)
 * @param {Array} mosaicSections - Array of mosaic section data
 * @param {HTMLElement} container - Container element to render into
 */
function showMobileStackedView(mosaicSections, container) {
  // Hide original mosaic sections in stacked mode as well.
  // We render a controlled stacked layout inside mobileContainer to keep
  // spacing consistent with mobile carousel view.
  mosaicSections.forEach((mosaicData) => {
    if (mosaicData.section) {
      mosaicData.section.style.display = 'none';
      mosaicData.section.classList.add('hidden');
    }
    if (mosaicData.block) {
      mosaicData.block.style.display = 'none';
      const renderedContent = mosaicData.block.nextElementSibling;
      if (renderedContent && renderedContent.classList.contains('cms-mosaic-cards-rendered')) {
        renderedContent.style.display = 'none';
      }
    }
  });

  // Hide desktop carousel container
  const desktopContainer = document.querySelector('.mosaic-v2-container.section');
  if (desktopContainer) {
    desktopContainer.style.display = 'none';
    desktopContainer.classList.add('hidden', '!p-0', '!m-0', '!h-0', '!overflow-hidden');
  }

  // Build stacked content with mobile-like side padding and vertical spacing
  const stackedWrapper = document.createElement('div');
  stackedWrapper.className = 'mosaic-v2-mobile-stacked px-4 pb-4 flex flex-col gap-4';

  mosaicSections.forEach((mosaicData) => {
    if (mosaicData.block) {
      const renderedContent = mosaicData.block.nextElementSibling;
      if (renderedContent && renderedContent.classList.contains('cms-mosaic-cards-rendered')) {
        const clonedContent = renderedContent.cloneNode(true);
        clonedContent.style.display = '';
        clonedContent.classList.remove('hidden', '!p-0', '!m-0', '!h-0', '!overflow-hidden');
        stackedWrapper.appendChild(clonedContent);
      }
    }
  });

  container.innerHTML = '';
  container.appendChild(stackedWrapper);
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
  const {
    mosaicSections,
    groupId,
    container,
    autoplay = false,
    autoplaySpeed = 3000,
    showArrows = false,
    show = true,
  } = config;

  if (!mosaicSections || !groupId || !container) {
    // eslint-disable-next-line no-console
    console.error('MobileViewHelper: Missing required configuration', config);
    return { destroy: () => {} };
  }

  // Track current view state to avoid unnecessary re-renders
  let currentView = null; // 'mobile-carousel' | 'mobile-stacked' | 'desktop'

  // Initial render based on viewport
  async function handleResize() {
    const isMobile = isMobileViewport();
    const targetView = isMobile
      ? (show ? 'mobile-carousel' : 'mobile-stacked')
      : 'desktop';

    // Only switch views if we're changing between mobile and desktop
    if (currentView === targetView) {
      return; // Already in the correct view, do nothing
    }

    // eslint-disable-next-line no-console
    console.log(`[${groupId}] Switching from ${currentView} to ${targetView}`);
    currentView = targetView;

    if (targetView === 'mobile-carousel') {
      await showMobileView(mosaicSections, container, groupId, { autoplay, autoplaySpeed, showArrows });
    } else if (targetView === 'mobile-stacked') {
      showMobileStackedView(mosaicSections, container);
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
