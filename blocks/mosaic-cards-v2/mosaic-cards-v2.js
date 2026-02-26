/* eslint-disable max-len */
import htm from 'htm';
import { h, render } from '@dropins/tools/preact.js';
import { getStoredCountry, getStoredLanguage } from '../../scripts/services/header/language-country-selector.js';
import { loadBlock } from '../../scripts/aem.js';
import { registerMosaicGroup, getMosaicStore } from './mosaic-cards-v2.store.js';
import { initMobileViewHelper } from './mosaic-cards-v2-mobile-view.helper.js';

const html = htm.bind(h);

/**
 * Read mosaic-cards-v2 configuration from block (similar to multitab)
 * Row structure:
 * 0: group-id
 * 1: autoplay
 * 2: autoplay-speed
 * 3: loop
 * 4: show-arrows
 * 5: enable-from
 * 6: enable-to
 * 7: target-countries
 * 8: target-languages
 * 9: show
 *
 * @param {HTMLElement} block - The block element
 * @returns {Object} Configuration object
 */
function readCarouselConfig(block) {
  const rows = [...block.children];
  const getValue = (rowIndex) => {
    const row = rows[rowIndex];
    if (!row) return '';
    const cell = row.querySelector('div > div, div > p');
    return cell?.textContent?.trim() || '';
  };

  return {
    'group-id': getValue(0) || `mosaic-carousel-${Date.now()}`,
    autoplay: getValue(1) === 'true',
    'autoplay-speed': parseInt(getValue(2), 10) || 3000,
    loop: getValue(3) !== 'false', // default true
    'show-arrows': getValue(4) === 'true',
    'enable-from': getValue(5),
    'enable-to': getValue(6),
    'target-countries': getValue(7),
    'target-languages': getValue(8),
    show: getValue(9) || 'true',
  };
}

/**
 * Mosaic Cards V2 Controller
 * Pattern similar to multitab: controller block + section metadata binding
 * Displays multiple mosaic phases in a continuous horizontal carousel/swipe
 *
 * @param {HTMLElement} block - The mosaic-cards-v2 controller block
 */
export default async function decorate(block) {
  const config = readCarouselConfig(block);
  const groupId = config['group-id'];
  const { autoplay } = config;
  const autoplaySpeed = config['autoplay-speed'];
  const { loop } = config;
  const showArrows = config['show-arrows'];

  // Feature flags
  const enableFrom = config['enable-from'] ? new Date(config['enable-from']) : null;
  const enableTo = config['enable-to'] ? new Date(config['enable-to']) : null;
  const targetCountries = config['target-countries']
    ? config['target-countries'].split(',').map((country) => country.trim().toLowerCase())
    : [];
  const targetLanguages = config['target-languages']
    ? config['target-languages'].split(',').map((lang) => lang.trim().toLowerCase())
    : [];
  const show = config.show !== 'false';

  const now = new Date();
  const currentCountry = getStoredCountry()?.toLowerCase() || '';
  const currentLang = getStoredLanguage()?.toLowerCase() || document.documentElement.lang?.toLowerCase() || 'en';

  // Detect author environment (Universal Editor)
  const isAuthorEnv = window.location.hostname.includes('author-')
    && window.location.pathname.startsWith('/content/');

  // Author mode preview
  if (isAuthorEnv) {
    block.classList.add('mosaic-cards-v2--author-mode');
    const preview = document.createElement('div');
    preview.className = 'bg-[var(--bg-informative-light)] border-l-[3px] border-[var(--border-accent-informative)] rounded-[var(--border-radius-small)] p-4';
    preview.innerHTML = `
      <div class="font-semibold mb-2 text-[var(--text-link-informative-default)]">🎨 Mosaic Cards V2 Controller</div>
      <div class="text-xs leading-relaxed text-[var(--text-normal-secondary)]">
        <strong>Group ID:</strong> ${groupId}<br>
        <strong>Autoplay:</strong> ${autoplay ? `Yes (${autoplaySpeed}ms)` : 'No'}<br>
        <strong>Loop:</strong> ${loop ? 'Yes' : 'No'}<br>
        <strong>Arrows:</strong> ${showArrows ? 'Yes' : 'No'}<br>
      </div>
      <div class="mt-2 pt-2 border-t border-[var(--border-stroke-default)] text-[11px] text-[var(--text-normal-tertiary)]">
        💡 Add Section blocks with <strong>mosaic-v2-group="${groupId}"</strong> metadata.<br>
        Each section should contain a <strong>cms-mosaic-cards</strong> block.
      </div>
    `;
    block.innerHTML = '';
    block.appendChild(preview);
    return;
  }

  // `show` controls mobile/tablet behavior in helper:
  // true => mobile/tablet carousel
  // false => mobile/tablet stacked view
  // Desktop is always carousel.

  if (enableFrom && now < enableFrom) {
    const section = block.closest('.section');
    if (section) {
      section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
    }
    block.style.display = 'none';
    return;
  }

  if (enableTo && now > enableTo) {
    const section = block.closest('.section');
    if (section) {
      section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
    }
    block.style.display = 'none';
    return;
  }

  // Target countries validation
  if (targetCountries.length > 0 && currentCountry && !targetCountries.includes(currentCountry)) {
    const section = block.closest('.section');
    if (section) {
      section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
    }
    block.style.display = 'none';
    return;
  }

  // Target languages validation
  if (targetLanguages.length > 0 && currentLang && !targetLanguages.includes(currentLang)) {
    const section = block.closest('.section');
    if (section) {
      section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
    }
    block.style.display = 'none';
    return;
  }

  // Find sibling sections with matching group-id
  const section = block.closest('.section');
  if (!section) return;

  const parent = section.parentElement;
  if (!parent) return;

  const allSections = Array.from(parent.querySelectorAll('.section'));
  const blockIndex = allSections.indexOf(section);

  // Collect mosaic sections that match this group
  const mosaicSections = [];
  for (let i = blockIndex + 1; i < allSections.length; i += 1) {
    const mosaicSection = allSections[i];
    const sectionMetadata = mosaicSection.dataset;

    if (sectionMetadata.mosaicV2Group !== groupId) {
      break; // Stop when section doesn't belong to this group
    }

    const mosaicLabel = sectionMetadata.mosaicLabel || `Mosaic ${mosaicSections.length + 1}`;
    const mosaicBlock = mosaicSection.querySelector('.cms-mosaic-cards');

    // CRITICAL: Validate that section contains a cms-mosaic-cards block
    if (!mosaicBlock) {
      // eslint-disable-next-line no-console
      console.warn(`Mosaic Cards V2: Section with mosaic-v2-group="${groupId}" at index ${i} does not contain a cms-mosaic-cards block. Skipping this section.`);
      // eslint-disable-next-line no-continue
      continue; // Skip this section, don't add it to carousel
    }

    const mosaicId = `mosaic-${groupId}-${mosaicSections.length}`;

    mosaicSections.push({
      section: mosaicSection,
      label: mosaicLabel,
      block: mosaicBlock,
      id: mosaicId,
    });
  }

  if (mosaicSections.length === 0) {
    const message = document.createElement('div');
    message.className = 'p-6 text-center text-[var(--text-normal-secondary)]';
    message.textContent = `Mosaic Cards V2: No valid sections found for group "${groupId}". Add sections with matching "mosaic-v2-group" metadata that contain cms-mosaic-cards blocks.`;
    block.innerHTML = '';
    block.appendChild(message);
    return;
  }

  // AUTO-DETECT carousel mode:
  // 1 section = no carousel (adjust to container width)
  // 2+ sections = enable carousel with infinite loop
  const enableCarouselMode = mosaicSections.length >= 2;

  // Hide original controller block (with config rows) - must be invisible to user
  block.style.display = 'none';
  block.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
  section.style.display = 'none';
  section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
  section.setAttribute('aria-hidden', 'true');

  // CRITICAL: Decorate blocks FIRST before moving content
  const blocksToDecorate = [];
  mosaicSections.forEach((mosaicData) => {
    if (mosaicData.block && mosaicData.block.dataset.blockStatus === 'initialized') {
      blocksToDecorate.push(mosaicData.block);
    }
  });

  if (blocksToDecorate.length > 0) {
    const decorationPromises = blocksToDecorate.map((blk) => loadBlock(blk));
    await Promise.all(decorationPromises);
  }

  // Create carousel container
  // Hidden in mobile (<768px), visible in desktop (≥768px)
  // Mobile view is handled by mosaic-cards-v2-mobile-view.helper.js
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'mosaic-v2-container section hidden md:block';
  carouselContainer.setAttribute('data-group-id', groupId);
  carouselContainer.setAttribute('data-section-status', 'loaded');

  // Carousel track or vertical stack
  const carouselTrack = document.createElement('div');

  if (enableCarouselMode) {
    // Horizontal carousel mode with marquee effect + gap between phases
    carouselTrack.className = 'mosaic-v2-track flex gap-4';
  } else {
    // Single mosaic: adjust to container width (no carousel)
    carouselTrack.className = 'mosaic-v2-track w-full';
  }

  // For infinite loop: duplicate mosaicSections array so we process each mosaic twice
  const sectionsToRender = enableCarouselMode
    ? [...mosaicSections, ...mosaicSections] // Double the sections for seamless loop
    : mosaicSections;

  // Store references to rendered content BEFORE moving them
  // AND extract card data directly from the original block structure
  const renderedContentMap = new Map();
  const allCardsData = [];

  mosaicSections.forEach((mosaicData) => {
    if (mosaicData.block) {
      // Find the rendered mosaic content (created by cms-mosaic-cards.js as nextSibling)
      const renderedContent = mosaicData.block.nextElementSibling;
      if (renderedContent && renderedContent.classList.contains('cms-mosaic-cards-rendered')) {
        renderedContentMap.set(mosaicData.id, renderedContent);
      }

      // Extract card data from ORIGINAL block structure (before Preact rendering)
      // This ensures we get all the data including images
      const mosaicCards = [];
      const allRows = [...mosaicData.block.children];

      // Skip first 4 rows (parent config: layout, loading, target-countries, target-languages)
      const childRows = allRows.slice(4);

      childRows.forEach((row) => {
        // Child items have multiple cells (15 cells for link-card)
        // Parent fields have only 1 cell
        if (row.children.length > 1) {
          const cells = [...row.children];
          const cardData = {
            imageDesktop: '',
            imageDesktopAlt: '',
            imageMobile: '',
            imageMobileAlt: '',
            title: '',
            description: '',
            ctaLabel: '',
            supportIcon: '',
            badges: [],
            linkUrl: '',
            linkAlt: '',
            linkOpensIn: 'sameTab',
            ctaIconBefore: 'none',
            ctaIconAfter: 'none',
            clickBehavior: 'fullCard',
          };

          let cellIndex = 0;

          // Cell 0: imageDesktop
          if (cells[cellIndex]) {
            const img = cells[cellIndex].querySelector('img');
            if (img) {
              cardData.imageDesktop = img.src;
            }
            cellIndex += 1;
          }

          // Cell 1: imageDesktopAlt
          if (cells[cellIndex]) {
            cardData.imageDesktopAlt = cells[cellIndex].textContent.trim();
            cellIndex += 1;
          }

          // Cell 2: imageMobile (OPTIONAL)
          if (cells[cellIndex] && cells[cellIndex].querySelector('img')) {
            cardData.imageMobile = cells[cellIndex].querySelector('img').src;
            cellIndex += 1;

            // Cell 3: imageMobileAlt
            if (cells[cellIndex]) {
              cardData.imageMobileAlt = cells[cellIndex].textContent.trim();
              cellIndex += 1;
            }
          }

          // Cell N: title
          if (cells[cellIndex]) {
            cardData.title = cells[cellIndex].textContent.trim();
            cellIndex += 1;
          }

          // Cell N+1: description
          if (cells[cellIndex]) {
            cardData.description = cells[cellIndex].textContent.trim();
            cellIndex += 1;
          }

          // Cell N+2: ctaLabel
          if (cells[cellIndex]) {
            cardData.ctaLabel = cells[cellIndex].textContent.trim();
            cellIndex += 1;
          }

          // Cell N+3: supportIcon
          if (cells[cellIndex]) {
            cardData.supportIcon = cells[cellIndex].textContent.trim();
            cellIndex += 1;
          }

          // Cell N+4: badges
          if (cells[cellIndex]) {
            const badgesText = cells[cellIndex].textContent.trim();
            if (badgesText) {
              cardData.badges = badgesText.split(',').map((b) => b.trim()).filter(Boolean);
            }
            cellIndex += 1;
          }

          // Cell N+5: linkUrl
          if (cells[cellIndex]) {
            const link = cells[cellIndex].querySelector('a');
            let linkUrl = link ? link.href : cells[cellIndex].textContent.trim();
            if (linkUrl && !linkUrl.startsWith('http://') && !linkUrl.startsWith('https://') && !linkUrl.startsWith('/') && !linkUrl.startsWith('//')) {
              linkUrl = `/${linkUrl}`;
            }
            cardData.linkUrl = linkUrl;
            cellIndex += 1;
          }

          // Cell N+6: linkAlt
          if (cells[cellIndex]) {
            cardData.linkAlt = cells[cellIndex].textContent.trim();
            cellIndex += 1;
          }

          // Cell N+7: linkOpensIn
          if (cells[cellIndex]) {
            const opensIn = cells[cellIndex].textContent.trim();
            if (opensIn === 'sameTab' || opensIn === 'newTab') {
              cardData.linkOpensIn = opensIn;
            }
            cellIndex += 1;
          }

          // Cell N+8: ctaIconBefore
          if (cells[cellIndex]) {
            const iconBefore = cells[cellIndex].textContent.trim();
            if (iconBefore) {
              cardData.ctaIconBefore = iconBefore;
            }
            cellIndex += 1;
          }

          // Cell N+9: ctaIconAfter
          if (cells[cellIndex]) {
            const iconAfter = cells[cellIndex].textContent.trim();
            if (iconAfter) {
              cardData.ctaIconAfter = iconAfter;
            }
            cellIndex += 1;
          }

          // Cell N+10: clickBehavior
          if (cells[cellIndex]) {
            const behavior = cells[cellIndex].textContent.trim();
            if (behavior === 'ctaOnly' || behavior === 'fullCard') {
              cardData.clickBehavior = behavior;
            }
          }

          if (cardData.imageDesktop || cardData.title) {
            mosaicCards.push(cardData);
            allCardsData.push(cardData);
          }
        }
      });

      // Store cards for this mosaic
      mosaicData.cards = mosaicCards;
    }
  });

  // Register all cards data in the store
  // Check if already registered to prevent duplicates on re-decoration
  const store = getMosaicStore();
  if (!store.hasGroup(groupId)) {
    registerMosaicGroup(groupId, allCardsData, {
      autoplay,
      autoplaySpeed,
      loop,
      showArrows,
      totalMosaics: mosaicSections.length,
    });
  }

  // Add each mosaic section as a slide or single item
  const slides = [];
  sectionsToRender.forEach((mosaicData, index) => {
    const slide = document.createElement('div');

    if (enableCarouselMode) {
      // Carousel mode: full-width slides with padding for proper content display
      // Using container width (not w-screen) to respect page padding/margins
      slide.className = 'mosaic-v2-slide w-full shrink-0';
    } else {
      // Single mosaic: adjust to container width
      slide.className = 'mosaic-v2-slide w-full';
    }

    const isOriginal = index < mosaicSections.length;
    slide.setAttribute('data-slide-index', index);
    slide.setAttribute('data-slide-id', mosaicData.id);
    slide.setAttribute('data-original', isOriginal ? 'true' : 'false');
    slide.setAttribute('aria-label', mosaicData.label);

    // Get rendered content from our stored map
    const renderedContent = renderedContentMap.get(mosaicData.id);

    if (renderedContent) {
      // Always clone into the desktop carousel.
      // This preserves original rendered content for mobile/tablet stacked mode.
      const clonedContent = renderedContent.cloneNode(true);
      slide.appendChild(clonedContent);

      // Hide the original cms-mosaic-cards block structure
      if (mosaicData.block) {
        mosaicData.block.style.display = 'none';
      }
    } else {
      // Fallback: if rendered content not found, show warning
      // eslint-disable-next-line no-console
      console.warn(`Mosaic V2: No rendered content found for ${mosaicData.id}`);
      slide.innerHTML = '<div class="p-8 text-center text-gray-500">Content not rendered</div>';
    }

    // Hide original section (only once, for original sections)
    if (isOriginal) {
      mosaicData.section.style.display = 'none';
      mosaicData.section.classList.add('mosaic-section-hidden', '!p-0', '!m-0', '!h-0', '!overflow-hidden');
      mosaicData.section.setAttribute('aria-hidden', 'true');
    }

    slides.push(slide);
    carouselTrack.appendChild(slide);
  });

  carouselContainer.appendChild(carouselTrack);

  // Navigation and pagination (only in carousel mode for desktop ≥768px)
  if (enableCarouselMode) {
    // Load design system components dynamically
    const [{ CarouselNavigationButton }] = await Promise.all([
      import(`${window.hlx.codeBasePath}/design-system/atoms/carousel-navigation-button/carousel-navigation-button.js`),
    ]);

    // Create hidden button elements for actual navigation logic
    const prevButton = document.createElement('button');
    prevButton.className = 'mosaic-v2-prev hidden';
    prevButton.setAttribute('aria-label', 'Previous mosaic');
    prevButton.setAttribute('type', 'button');

    const nextButton = document.createElement('button');
    nextButton.className = 'mosaic-v2-next hidden';
    nextButton.setAttribute('aria-label', 'Next mosaic');
    nextButton.setAttribute('type', 'button');

    carouselContainer.appendChild(prevButton);
    carouselContainer.appendChild(nextButton);

    // Create navigation wrapper with Preact (shows on >= 768px only)
    if (showArrows) {
      const navWrapper = document.createElement('div');
      navWrapper.className = 'mosaic-v2-navigation hidden md:block';
      carouselContainer.appendChild(navWrapper);

      render(
        html`
          <${CarouselNavigationButton}
            direction="left"
            onClick=${() => prevButton.click()}
            absolute=${true}
            customClassName="mosaic-v2-nav-left"
          />
          <${CarouselNavigationButton}
            direction="right"
            onClick=${() => nextButton.click()}
            absolute=${true}
            customClassName="mosaic-v2-nav-right"
          />
        `,
        navWrapper,
      );
    }
  }

  // Initialize mobile view helper for responsive behavior
  const mobileContainer = document.createElement('div');
  mobileContainer.className = 'mosaic-v2-mobile-container';
  mobileContainer.style.display = 'none';
  section.insertAdjacentElement('afterend', mobileContainer);

  initMobileViewHelper({
    mosaicSections,
    groupId,
    container: mobileContainer,
    autoplay,
    autoplaySpeed,
    showArrows,
    show,
  });

  // Animation control (works for both autoplay and manual navigation)
  if (enableCarouselMode) {
    let animationId;
    let position = 0;
    let isPaused = !autoplay; // Start paused if autoplay is off
    let manualControl = false; // Track if user is manually controlling

    // Store state per carousel using groupId (not global)
    if (!window.mosaicCarouselStates) {
      window.mosaicCarouselStates = {};
    }
    window.mosaicCarouselStates[groupId] = {
      position: 0,
      isPaused: !autoplay,
      manualControl: false,
    };

    // Convert autoplay-speed (ms) to scroll speed (pixels per frame)
    // Only used when autoplay is on
    const scrollSpeed = autoplay ? 1000 / autoplaySpeed : 0;

    const animate = () => {
      // Sync with carousel-specific state
      isPaused = window.mosaicCarouselStates[groupId].isPaused;
      manualControl = window.mosaicCarouselStates[groupId].manualControl;

      // Transform-based animation for all viewports (mobile, tablet, desktop)
      // Only auto-scroll if autoplay is on and not manually controlled
      if (!isPaused && !manualControl && autoplay) {
        position -= scrollSpeed;

        // Calculate total width including gaps
        const slideWidth = carouselContainer.offsetWidth;
        const isMobile = window.innerWidth < 768;
        const gapWidth = isMobile ? 0 : 16; // No gap in mobile, gap-4 in desktop
        // Total width is now HALF of all slides (since we duplicated)
        const originalSlidesCount = mosaicSections.length;
        const totalOriginalWidth = (slideWidth * originalSlidesCount) + (gapWidth * (originalSlidesCount - 1));

        // Seamless infinite loop: reset position when reaching end of FIRST set of slides
        // This happens before the user sees the duplicate slides
        if (Math.abs(position) >= totalOriginalWidth) {
          position = 0; // Reset to start (second set of slides continues seamlessly)
        }

        carouselTrack.style.transform = `translateX(${position}px)`;
        window.mosaicCarouselStates[groupId].position = position;
      } else if (manualControl) {
        // Use position from manual control
        position = window.mosaicCarouselStates[groupId].position;
      }

      animationId = requestAnimationFrame(animate);
    };

    // Start animation loop after DOM is ready
    setTimeout(() => {
      animate();
    }, 100);

    // Arrow click handlers (navigate by LinkCard width)
    if (showArrows) {
      const prevButton = carouselContainer.querySelector('.mosaic-v2-prev');
      const nextButton = carouselContainer.querySelector('.mosaic-v2-next');

      if (prevButton) {
        prevButton.addEventListener('click', () => {
          // Pause animation and enable manual control (only for THIS carousel)
          window.mosaicCarouselStates[groupId].isPaused = true;
          window.mosaicCarouselStates[groupId].manualControl = true;

          // Get all cards and calculate total width of original cards only
          const allCards = carouselTrack.querySelectorAll('.child-cms-mosaic');
          if (!allCards || allCards.length === 0) return;

          // Calculate total width of original LinkCards (first half)
          const halfCards = allCards.length / 2;
          let totalOriginalCardsWidth = 0;
          for (let i = 0; i < halfCards; i += 1) {
            totalOriginalCardsWidth += allCards[i].offsetWidth + 16; // gap-4
          }

          // Use stored position from state, defaulting to 0 if undefined
          const currentPosition = window.mosaicCarouselStates[groupId].position ?? 0;
          const currentScroll = Math.abs(currentPosition);

          // Get viewport width directly from container (already includes padding via CSS)
          const viewportWidth = carouselContainer.offsetWidth;

          // Calculate safe zone for wrap: ensure full layout visible
          const safetyMargin = 100;
          const safeEndPosition = totalOriginalCardsWidth - viewportWidth - safetyMargin;

          let newPosition;

          // Check if we're at the beginning (wrap to end)
          if (currentScroll <= 10) {
            // Find the last card that fits completely in viewport when going backwards
            // We need to find the rightmost card position that still shows a complete layout
            let bestPosition = 0;
            let cumulativeOffset = 0;

            for (let i = 0; i < halfCards; i += 1) {
              const card = allCards[i];
              const cardWidth = card.offsetWidth;
              const gapWidth = 16; // gap-4
              
              // Check if scrolling to this position would show content beyond our safe zone
              if (cumulativeOffset + viewportWidth <= totalOriginalCardsWidth) {
                bestPosition = cumulativeOffset;
              }
              
              cumulativeOffset += cardWidth + gapWidth;
            }

            newPosition = -bestPosition;
          } else {
            // Find previous card by going backwards
            let targetPosition = 0;
            let previousCardPosition = 0;
            let cumulativeOffset = 0;

            for (let i = 0; i < allCards.length; i += 1) {
              const card = allCards[i];
              const cardWidth = card.offsetWidth;
              const gapWidth = 16; // gap-4

              // Store the position of cards we've passed
              if (cumulativeOffset < currentScroll - 10) {
                previousCardPosition = cumulativeOffset;
              } else {
                // Found the current card, use the previous position
                targetPosition = previousCardPosition;
                break;
              }

              cumulativeOffset += cardWidth + gapWidth;
            }

            newPosition = -targetPosition;
          }

          // Update both the visual position and the state
          carouselTrack.style.transform = `translateX(${newPosition}px)`;
          window.mosaicCarouselStates[groupId].position = newPosition;
          position = newPosition; // Sync local variable with new position

          // Resume animation after delay if autoplay is on (only for THIS carousel)
          if (autoplay) {
            setTimeout(() => {
              window.mosaicCarouselStates[groupId].isPaused = false;
              window.mosaicCarouselStates[groupId].manualControl = false;
            }, 2000);
          }
        });
      }

      if (nextButton) {
        nextButton.addEventListener('click', () => {
          // Pause animation and enable manual control (only for THIS carousel)
          window.mosaicCarouselStates[groupId].isPaused = true;
          window.mosaicCarouselStates[groupId].manualControl = true;

          // Get all cards and calculate total width of original cards only
          const allCards = carouselTrack.querySelectorAll('.child-cms-mosaic');
          if (!allCards || allCards.length === 0) return;

          // Calculate total width of original LinkCards (first half)
          const halfCards = allCards.length / 2;
          let totalOriginalCardsWidth = 0;
          for (let i = 0; i < halfCards; i += 1) {
            totalOriginalCardsWidth += allCards[i].offsetWidth + 16; // gap-4
          }

          const currentPosition = window.mosaicCarouselStates[groupId].position || 0;
          const currentScroll = Math.abs(currentPosition);

          // Get viewport width directly from container (already includes padding via CSS)
          const viewportWidth = carouselContainer.offsetWidth;

          // Calculate safe zone: need at least viewport width remaining to show full layout
          const safetyMargin = 100;
          const safeZoneThreshold = totalOriginalCardsWidth - viewportWidth - safetyMargin;

          // Find next card and check if it would show duplicate content
          let targetPosition = 0;
          let cumulativeOffset = 0;
          let foundNext = false;

          for (let i = 0; i < allCards.length; i += 1) {
            const card = allCards[i];
            const cardWidth = card.offsetWidth;
            const gapWidth = 16; // gap-4

            // If this card starts after current scroll, navigate to it
            if (cumulativeOffset > currentScroll + 10) {
              targetPosition = cumulativeOffset;
              foundNext = true;

              // Check if target position would go beyond safe zone
              // Reset to beginning to maintain full grid visible
              if (targetPosition >= safeZoneThreshold) {
                position = 0;
                foundNext = false;
              }
              break;
            }

            cumulativeOffset += cardWidth + gapWidth;
          }

          if (foundNext) {
            position = -targetPosition;
          }

          carouselTrack.style.transform = `translateX(${position}px)`;
          window.mosaicCarouselStates[groupId].position = position;

          // Resume animation after delay if autoplay is on (only for THIS carousel)
          if (autoplay) {
            setTimeout(() => {
              window.mosaicCarouselStates[groupId].isPaused = false;
              window.mosaicCarouselStates[groupId].manualControl = false;
            }, 2000);
          }
        });
      }
    }

    // Cleanup
    window.addEventListener('beforeunload', () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    });
  }

  // Insert carousel after original section
  section.insertAdjacentElement('afterend', carouselContainer);

  // Mark carousel as ready after DOM manipulation is complete
  // This triggers the fade-in effect from CSS
  requestAnimationFrame(() => {
    setTimeout(() => {
      carouselContainer.classList.add('ready');
    }, 100);
  });
}
