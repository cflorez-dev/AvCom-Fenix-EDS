/* eslint-disable max-len */
import htm from 'htm';
import { h, render } from '@dropins/tools/preact.js';
import { getStoredCountry, getStoredLanguage } from '../../scripts/services/header/language-country-selector.js';
import { loadBlock } from '../../scripts/aem.js';
import { registerMosaicGroup, getMosaicStore } from './mosaic-cards-v2.store.js';
import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';
import { applyLinkButtonStylesToLinks } from '../../scripts/utils/link-card-richtext.js';

const html = htm.bind(h);
let mobileViewHelperModulePromise;

/**
 * Lazy-load mobile helper to avoid paying its parse/execute cost during initial load.
 * @returns {Promise<{ initMobileViewHelper: Function }>}
 */
function loadMobileViewHelperModule() {
  if (!mobileViewHelperModulePromise) {
    mobileViewHelperModulePromise = import('./mosaic-cards-v2-mobile-view.helper.js');
  }
  return mobileViewHelperModulePromise;
}

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
      section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden', 'no-section-display');
    }
    block.innerHTML = '';
    return;
  }

  // Target languages validation
  if (targetLanguages.length > 0 && currentLang && !targetLanguages.includes(currentLang)) {
    const section = block.closest('.section');
    if (section) {
      section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden', 'no-section-display');
    }
    block.innerHTML = '';
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

    const blockRows = [...mosaicBlock.children];
    const getBlockRowValue = (rowIndex) => {
      const row = blockRows[rowIndex];
      if (!row || row.children.length !== 1) return '';
      return row.children[0].textContent.trim();
    };

    // Read targeting config from cms-mosaic-cards block rows
    // Row 2: target-countries, Row 3: target-languages
    const sectionTargetCountries = getBlockRowValue(2);
    const sectionTargetLanguages = getBlockRowValue(3);

    if (!shouldShowByTargeting(sectionTargetCountries, sectionTargetLanguages)) {
      mosaicSection.setAttribute('aria-hidden', 'true');
      // eslint-disable-next-line no-continue
      continue;
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
    if (mosaicData.block && mosaicData.block.dataset.blockStatus !== 'loaded') {
      blocksToDecorate.push(mosaicData.block);
    }
  });

  if (blocksToDecorate.length > 0) {
    const decorationPromises = blocksToDecorate.map((blk) => loadBlock(blk));
    await Promise.all(decorationPromises);
  }

  // Wait for cms-mosaic-cards-rendered siblings to appear (handles race with parallel decoration)
  const waitForRendered = (blk, maxWait = 3000) => new Promise((resolve) => {
    const check = () => {
      const sib = blk.nextElementSibling;
      if (sib && sib.classList.contains('cms-mosaic-cards-rendered')) return resolve(sib);
      return null;
    };
    if (check()) return;
    const interval = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      if (check() || elapsed >= maxWait) {
        clearInterval(timer);
        resolve(null);
      }
    }, interval);
  });

  const pendingBlocks = mosaicSections.filter(
    (m) => m.block && !m.block.nextElementSibling?.classList.contains('cms-mosaic-cards-rendered'),
  );
  if (pendingBlocks.length > 0) {
    await Promise.all(pendingBlocks.map((m) => waitForRendered(m.block)));
  }

  // Create carousel container
  // Hidden in mobile (<768px), visible in desktop (≥768px)
  // Mobile view is handled by mosaic-cards-v2-mobile-view.helper.js
  // The has-nav-padding class signals CSS to inset content via a clip wrapper.
  // It's added whenever there are transitions/marquee (autoplay or arrows) so
  // cards never bleed past the visible edges, regardless of nav button presence.
  const needsClipWrapper = showArrows || autoplay;
  const carouselContainer = document.createElement('div');
  const containerClasses = ['mosaic-v2-container', 'section', 'hidden', 'md:block'];
  if (enableCarouselMode) containerClasses.push('is-carousel');
  if (autoplay) containerClasses.push('is-autoplay');
  if (needsClipWrapper) containerClasses.push('has-nav-padding');
  carouselContainer.className = containerClasses.join(' ');
  carouselContainer.setAttribute('data-group-id', groupId);
  carouselContainer.setAttribute('data-section-status', 'loaded');

  // Carousel track or vertical stack
  const carouselTrack = document.createElement('div');

  if (enableCarouselMode) {
    // Horizontal carousel mode with marquee effect + gap between phases
    carouselTrack.className = 'mosaic-v2-track flex gap-4 xl:gap-0';
  } else {
    // Single mosaic: adjust to container width (no carousel)
    carouselTrack.className = 'mosaic-v2-track w-full';
  }

  // For infinite loop: prepend a clone of the LAST slide + append all slides again.
  // Structure: [C(pre-clone), A, B, C, A(post-clone), B(post-clone), C(post-clone)]
  // This allows smooth CSS-transition animation in BOTH directions:
  //   next wrap: animate to A(post-clone) then silent snap to A
  //   prev wrap: animate to C(pre-clone) then silent snap to C
  const sectionsToRender = enableCarouselMode
    ? [
        mosaicSections[mosaicSections.length - 1], // pre-clone of last slide
        ...mosaicSections,                          // originals
        ...mosaicSections,                          // post-clones
      ]
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
            linkUrl: '',
            linkAlt: '',
            linkOpensIn: 'sameTab',
            ctaIconBefore: 'none',
            ctaIconAfter: 'none',
            clickBehavior: 'fullCard',
          };

          let cellIndex = 0;

          // Cell 0: imageDesktop
          // AEM fusiona imageDesktopAlt en esta celda: el alt queda embebido en <picture><img alt="">
          // Fallback: external URLs may be rendered as <a href="url"> links instead of <img>.
          if (cells[cellIndex]) {
            const img = cells[cellIndex].querySelector('img');
            if (img) {
              cardData.imageDesktop = img.src;
              cardData.imageDesktopAlt = img.alt || '';
            } else {
              const link = cells[cellIndex].querySelector('a[href]');
              if (link && /\.(jpe?g|png|gif|webp|svg|avif)/i.test(link.href)) {
                cardData.imageDesktop = link.href;
                cardData.imageDesktopAlt = link.title || link.textContent.trim() || '';
              }
            }
            cellIndex += 1;
          }

          // Cell 1: imageMobile (OPCIONAL)
          if (cells[cellIndex]) {
            const mobileImg = cells[cellIndex].querySelector('img');
            if (mobileImg) {
              cardData.imageMobile = mobileImg.src;
              cardData.imageMobileAlt = mobileImg.alt || '';
            } else {
              const link = cells[cellIndex].querySelector('a[href]');
              if (link && /\.(jpe?g|png|gif|webp|svg|avif)/i.test(link.href)) {
                cardData.imageMobile = link.href;
                cardData.imageMobileAlt = link.title || link.textContent.trim() || '';
              }
            }
            cellIndex += 1;
          }

          // Cell 2: title
          if (cells[cellIndex]) {
            cardData.title = cells[cellIndex].textContent.trim();
            cellIndex += 1;
          }

          // Cell 3: description (richtext — preserve HTML markup so bold/lists/links render)
          if (cells[cellIndex]) {
            // Decorate <a> tags with LinkButton (informative) styles before extracting innerHTML
            applyLinkButtonStylesToLinks(cells[cellIndex]);
            cardData.description = cells[cellIndex].innerHTML.trim();
            cellIndex += 1;
          }

          // Cell 4: ctaLabel
          if (cells[cellIndex]) {
            cardData.ctaLabel = cells[cellIndex].textContent.trim();
            cellIndex += 1;
          }

          // Cell 5: supportIcon (only in legacy UE format — current UE removed this field)
          // 13 cells = current format (no supportIcon), 14+ cells = legacy format (with supportIcon)
          const hasSupportIcon = cells.length >= 14;
          if (hasSupportIcon && cells[cellIndex]) {
            cardData.supportIcon = cells[cellIndex].textContent.trim();
            cellIndex += 1;
          }

          // Cell 5/6: linkUrl (index depends on whether supportIcon was present)
          if (cells[cellIndex]) {
            const link = cells[cellIndex].querySelector('a');
            let linkUrl = link ? link.href : cells[cellIndex].textContent.trim();
            if (linkUrl && !linkUrl.startsWith('http://') && !linkUrl.startsWith('https://') && !linkUrl.startsWith('/') && !linkUrl.startsWith('//')) {
              linkUrl = `/${linkUrl}`;
            }
            cardData.linkUrl = linkUrl;
            cellIndex += 1;
          }

          // linkAlt
          if (cells[cellIndex]) {
            cardData.linkAlt = cells[cellIndex].textContent.trim();
            cellIndex += 1;
          }

          // linkOpensIn
          if (cells[cellIndex]) {
            const opensIn = cells[cellIndex].textContent.trim();
            if (opensIn === 'sameTab' || opensIn === 'newTab') {
              cardData.linkOpensIn = opensIn;
            }
            cellIndex += 1;
          }

          // ctaIconBefore
          if (cells[cellIndex]) {
            const iconBefore = cells[cellIndex].textContent.trim();
            if (iconBefore) {
              cardData.ctaIconBefore = iconBefore;
            }
            cellIndex += 1;
          }

          // ctaIconAfter
          if (cells[cellIndex]) {
            const iconAfter = cells[cellIndex].textContent.trim();
            if (iconAfter) {
              cardData.ctaIconAfter = iconAfter;
            }
            cellIndex += 1;
          }

          // clickBehavior
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

  // Register all cards data in the store (only if we extracted cards).
  // When cards live in sibling link-card blocks, cms-mosaic-cards.js extracts
  // and registers them — skip here to avoid a 0-card registration that blocks
  // the later real registration.
  const store = getMosaicStore();
  if (allCardsData.length > 0 && !store.hasGroup(groupId)) {
    registerMosaicGroup(groupId, allCardsData, {
      autoplay,
      autoplaySpeed,
      loop,
      showArrows,
      totalMosaics: mosaicSections.length,
    });
  }

  // Wait for async SVG icons to load inside rendered content before cloning DOM.
  // SvgIcon (Preact) fetches SVGs via useEffect — cloneNode(true) would miss
  // icons that haven't loaded yet because the clone is a static snapshot.
  const waitForSvgIcons = (renderedEl, cards, maxWait = 2000) => new Promise((resolve) => {
    let expectedCount = 0;
    cards.forEach((card) => {
      if (card.ctaIconBefore && card.ctaIconBefore !== 'none') expectedCount += 1;
      if (card.ctaIconAfter && card.ctaIconAfter !== 'none') expectedCount += 1;
    });
    if (expectedCount === 0) { resolve(); return; }

    const check = () => renderedEl.querySelectorAll('[data-name="linkButton"] svg').length >= expectedCount;
    if (check()) { resolve(); return; }

    const observer = new MutationObserver(() => {
      if (check()) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(renderedEl, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(); }, maxWait);
  });

  const iconWaitPromises = [];
  mosaicSections.forEach((mosaicData) => {
    const renderedContent = renderedContentMap.get(mosaicData.id);
    if (renderedContent && mosaicData.cards && mosaicData.cards.length > 0) {
      iconWaitPromises.push(waitForSvgIcons(renderedContent, mosaicData.cards));
    }
  });
  if (iconWaitPromises.length > 0) {
    await Promise.all(iconWaitPromises);
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

    // With pre-clone structure: [pre-clone(0), originals(1..N), post-clones(N+1..2N)]
    const isPreClone = enableCarouselMode && index === 0;
    const isOriginal = enableCarouselMode
      ? index >= 1 && index <= mosaicSections.length
      : true;
    slide.setAttribute('data-slide-index', index);
    slide.setAttribute('data-slide-id', mosaicData.id);
    slide.setAttribute('data-original', isOriginal ? 'true' : 'false');
    if (isPreClone) slide.setAttribute('data-clone-position', 'pre');
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

  // When the carousel has transitions (arrows or autoplay marquee), wrap the
  // track in a clip-wrapper so the visible marquee area is inset and cards
  // don't bleed past the container edges. Arrows remain on the outer
  // container, unaffected by the wrapper's clipping.
  if (needsClipWrapper) {
    const clipWrapper = document.createElement('div');
    clipWrapper.className = 'mosaic-v2-clip';
    clipWrapper.appendChild(carouselTrack);
    carouselContainer.appendChild(clipWrapper);
  } else {
    carouselContainer.appendChild(carouselTrack);
  }

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
            customClassName="mosaic-v2-nav-left md:left-[10px] lg:left-[16px] !shadow-none hover:!shadow-none active:!shadow-none focus-visible:!shadow-none"
          />
          <${CarouselNavigationButton}
            direction="right"
            onClick=${() => nextButton.click()}
            absolute=${true}
            customClassName="mosaic-v2-nav-right md:right-[10px] lg:right-[16px] !shadow-none hover:!shadow-none active:!shadow-none focus-visible:!shadow-none"
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

  let mobileHelperInitialized = false;
  let mobileObserver = null;
  let mobileInitTimeoutId = null;

  async function initializeMobileHelper() {
    if (mobileHelperInitialized) return;
    mobileHelperInitialized = true;

    if (mobileObserver) {
      mobileObserver.disconnect();
      mobileObserver = null;
    }
    if (mobileInitTimeoutId) {
      clearTimeout(mobileInitTimeoutId);
      mobileInitTimeoutId = null;
    }
    window.removeEventListener('resize', handleMobileResize);

    const { initMobileViewHelper } = await loadMobileViewHelperModule();
    initMobileViewHelper({
      mosaicSections,
      groupId,
      container: mobileContainer,
      autoplay,
      autoplaySpeed,
      showArrows,
      show,
    });
  }

  function handleMobileResize() {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      initializeMobileHelper();
    }
  }

  // Initialize immediately on mobile/tablet to preserve current behavior.
  // On desktop, lazy-init near viewport to reduce startup JS work.
  if (window.matchMedia('(max-width: 1023px)').matches) {
    initializeMobileHelper();
  } else if ('IntersectionObserver' in window) {
    mobileObserver = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry?.isIntersecting) {
        initializeMobileHelper();
      }
    }, {
      root: null,
      rootMargin: '350px 0px',
      threshold: 0,
    });
    mobileObserver.observe(carouselContainer);
    window.addEventListener('resize', handleMobileResize, { passive: true });

    // Safety net: initialize eventually to support long sessions and late viewport switches.
    mobileInitTimeoutId = setTimeout(() => {
      initializeMobileHelper();
    }, 8000);
  } else {
    window.addEventListener('resize', handleMobileResize, { passive: true });
    mobileInitTimeoutId = setTimeout(() => {
      initializeMobileHelper();
    }, 1500);
  }

  // Animation control (works for both autoplay and manual navigation)
  if (enableCarouselMode) {
    let animationId;
    let position = 0;         // Will be corrected to skip pre-clone after DOM is ready
    let originalStartPosition = 0; // Position of first original slide (after pre-clone)
    // True loop period = offsetLeft(post_clone_0) - offsetLeft(original_0).
    // Measured from the DOM to avoid the off-by-one-gap error in formula-based approaches.
    // Reset: position += loopPeriod  (modular arithmetic — works from any starting position).
    let loopPeriod = 0;
    let isPaused = !autoplay; // Start paused if autoplay is off
    let manualControl = false; // Track if user is manually controlling
    const originalSlidesCount = mosaicSections.length;

    // Store state per carousel using groupId (not global)
    if (!window.mosaicCarouselStates) {
      window.mosaicCarouselStates = {};
    }
    window.mosaicCarouselStates[groupId] = {
      position: 0,
      isPaused: !autoplay,
      manualControl: false,
    };

    const getTrackGap = () => {
      const styles = window.getComputedStyle(carouselTrack);
      const columnGap = parseFloat(styles.columnGap);
      if (Number.isFinite(columnGap)) return columnGap;
      const gap = parseFloat(styles.gap);
      if (Number.isFinite(gap)) return gap;
      return 0;
    };
    const getOriginalSlideOffsets = () => Array.from(
      carouselTrack.querySelectorAll('.mosaic-v2-slide[data-original="true"]'),
    ).map((slide) => slide.offsetLeft);
    const getCurrentSlideIndex = () => {
      const currentPosition = Math.abs(window.mosaicCarouselStates[groupId].position || 0);
      const offsets = getOriginalSlideOffsets();
      if (!offsets.length) return 0;
      let nearestIndex = 0;
      let minDistance = Math.abs(currentPosition - offsets[0]);
      offsets.forEach((offset, index) => {
        const distance = Math.abs(currentPosition - offset);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = index;
        }
      });
      return nearestIndex;
    };
    // Derive slide transition duration from autoplaySpeed (bounded 300ms–800ms)
    // Used only for arrow-click navigation on desktop (≥768px)
    const transitionDuration = Math.max(300, Math.min(autoplaySpeed / 4, 800));

    // Guard flags to prevent race conditions with rapid arrow clicks
    let isWrapping = false;      // true while animateWrap CSS transition is in flight
    let resumeTimeoutId = null;  // tracks pending resume timeout (cancelable)
    let clearTransitionFn = null; // current transitionend cleanup fn (to remove before new one)
    // When loop=false: pixel offset of the last original slide (stop boundary for autoplay).
    // Measured DOM in the init setTimeout below; also resolved lazily inside animate().
    let lastSlideOffset = 0;
    // Position (absolute value) at which to proactively hide the right arrow (loop=false).
    // Set to 80% into the last fold so the user can't click "next" in a bad state.
    // Computed once alongside lastSlideOffset.
    let arrowHideThreshold = 0;

    // No-op default; real implementation assigned inside if(showArrows) below.
    // Allows the setTimeout init block to call it before showArrows block executes.
    let updateArrowVisibility = () => {};

    const goToSlide = (slideIndex, animated = false) => {
      const offsets = getOriginalSlideOffsets();
      const targetOffset = offsets[slideIndex] ?? 0;
      const newPosition = -targetOffset;

      // Remove any stale transitionend listener before starting a new transition
      if (clearTransitionFn) {
        carouselTrack.removeEventListener('transitionend', clearTransitionFn);
        clearTransitionFn = null;
      }

      if (animated && window.innerWidth >= 768) {
        carouselTrack.style.transition = `transform ${transitionDuration}ms ease-in-out`;
      } else {
        carouselTrack.style.transition = 'none';
      }

      carouselTrack.style.transform = `translateX(${newPosition}px)`;
      window.mosaicCarouselStates[groupId].position = newPosition;
      position = newPosition;

      // Clean up transition property after animation ends
      clearTransitionFn = () => {
        carouselTrack.style.transition = '';
        carouselTrack.removeEventListener('transitionend', clearTransitionFn);
        clearTransitionFn = null;
      };
      carouselTrack.addEventListener('transitionend', clearTransitionFn);
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

        if (loop) {
          // Seamless infinite loop using modular-arithmetic period reset.
          // Fires when the track has scrolled exactly one period past originalStartPosition,
          // i.e. when post_clone_0 is fully aligned with where original_0 was.
          // Using position += loopPeriod (not = originalStartPosition) so the reset
          // is always correct regardless of which slide the user last navigated to.
          if (loopPeriod > 0 && position <= originalStartPosition - loopPeriod) {
            position += loopPeriod;
          }
          carouselTrack.style.transform = `translateX(${position}px)`;
          window.mosaicCarouselStates[groupId].position = position;
        } else {
          // loop=false: resolve boundary lazily if init setTimeout fired before layout.
          if (lastSlideOffset === 0) {
            const offsets = getOriginalSlideOffsets();
            lastSlideOffset = offsets[offsets.length - 1] ?? 0;
          }
          if (lastSlideOffset > 0 && position <= -lastSlideOffset) {
            // Clamp to last slide and permanently stop autoplay.
            // Prevents the carousel from drifting into clone territory and
            // appearing "frozen" (empty space) or looping back to the start.
            position = -lastSlideOffset;
            carouselTrack.style.transform = `translateX(${position}px)`;
            window.mosaicCarouselStates[groupId].position = position;
            window.mosaicCarouselStates[groupId].isPaused = true;
            window.mosaicCarouselStates[groupId].manualControl = false;
            updateArrowVisibility(originalSlidesCount - 1);
            animationId = requestAnimationFrame(animate);
            return;
          }
          carouselTrack.style.transform = `translateX(${position}px)`;
          window.mosaicCarouselStates[groupId].position = position;
        }
      } else if (manualControl) {
        // Use position from manual control
        position = window.mosaicCarouselStates[groupId].position;
      }

      // Always evaluate arrow-hide threshold — runs every frame regardless of pause/autoplay
      // state. This hides the right arrow as soon as 80% of the last fold is visible so the
      // user never sees a "dead" arrow that blocks clicks without giving feedback.
      if (!loop && arrowHideThreshold > 0 && Math.abs(position) >= arrowHideThreshold) {
        updateArrowVisibility(originalSlidesCount - 1);
      }

      animationId = requestAnimationFrame(animate);
    };

    // Start animation loop after DOM is ready.
    // Step 1: correct initial position to skip the pre-clone and show original_0.
    // Step 2: measure the true loop period from DOM positions (post_clone_0 - original_0).
    setTimeout(() => {
      const allSlideEls = Array.from(carouselTrack.querySelectorAll('.mosaic-v2-slide'));
      // original slides start at index 1 (pre-clone is index 0)
      const firstOriginalSlide = allSlideEls[1];
      // first post-clone is at index 1 + originalSlidesCount
      const firstPostClone = allSlideEls[1 + originalSlidesCount];
      if (firstOriginalSlide) {
        originalStartPosition = -firstOriginalSlide.offsetLeft;
        position = originalStartPosition;
        carouselTrack.style.transition = 'none';
        carouselTrack.style.transform = `translateX(${position}px)`;
        window.mosaicCarouselStates[groupId].position = position;
      }
      if (firstOriginalSlide && firstPostClone) {
        // Period = exact pixel distance between the two identical visual positions.
        // This naturally includes all gaps, so no formula rounding error.
        loopPeriod = firstPostClone.offsetLeft - firstOriginalSlide.offsetLeft;
      }
      // When loop=false, measure the stop boundary and the arrow-hide threshold.
      if (!loop) {
        const lastOriginalSlide = allSlideEls[originalSlidesCount]; // 1-based: last original = index N
        lastSlideOffset = lastOriginalSlide ? lastOriginalSlide.offsetLeft : 0;
        // arrowHideThreshold: absolute-value of position at which the right arrow should
        // disappear — 80% into the last fold so the user never sees a dead arrow.
        // Requires at least 2 original slides to compute a meaningful slide width.
        if (originalSlidesCount >= 2) {
          const secondToLast = allSlideEls[originalSlidesCount - 1]; // index N-1 (1-based)
          if (secondToLast && lastOriginalSlide) {
            const slideWidth = lastOriginalSlide.offsetLeft - secondToLast.offsetLeft;
            arrowHideThreshold = secondToLast.offsetLeft + slideWidth * 0.80;
          }
        }
      }
      animate();
      // Initial arrow state (always starts at slide 0)
      updateArrowVisibility(0);
    }, 100);

    // Re-align to the nearest fold after viewport changes (prevents partial slides).
    let resizeTimeout;
    const handleResize = () => {
      if (window.innerWidth < 768) return;
      const targetIndex = getCurrentSlideIndex();
      goToSlide(targetIndex);
    };
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 120);
    };
    window.addEventListener('resize', debouncedResize);

    // Arrow click handlers (navigate by LinkCard width)
    if (showArrows) {
      const prevButton = carouselContainer.querySelector('.mosaic-v2-prev');
      const nextButton = carouselContainer.querySelector('.mosaic-v2-next');

      // Show/hide nav arrow buttons at the edges when loop is disabled.
      // Uses visibility+opacity so arrow space is preserved (no layout shift).
      updateArrowVisibility = (index) => {
        if (loop) return;
        const navLeft = carouselContainer.querySelector('.mosaic-v2-nav-left');
        const navRight = carouselContainer.querySelector('.mosaic-v2-nav-right');
        if (navLeft) navLeft.classList.toggle('is-nav-disabled', index === 0);
        if (navRight) navRight.classList.toggle('is-nav-disabled', index === originalSlidesCount - 1);
      };

      // Helper: resume autoplay after user interaction.
      // Cancels any pending resume before scheduling a new one (rapid clicks safe).
      // Waits autoplaySpeed * 2 so the user has enough time to read the slide they chose,
      // but at minimum transitionDuration + 100 so no ongoing CSS animation is interrupted.
      const resumeAfterInteraction = () => {
        if (!autoplay) return;
        // Cancel any previous pending resume to avoid premature state reset
        if (resumeTimeoutId) {
          clearTimeout(resumeTimeoutId);
          resumeTimeoutId = null;
        }
        const resumeDelay = Math.max(transitionDuration + 100, autoplaySpeed * 2);
        resumeTimeoutId = setTimeout(() => {
          resumeTimeoutId = null;
          // When loop=false, do NOT resume autoplay if already at the last slide.
          // This prevents autoplay from re-engaging and scrolling into clone territory
          // after the user navigates to the end with the arrow buttons.
          if (!loop && getCurrentSlideIndex() === originalSlidesCount - 1) return;
          // Only resume if no wrap animation is still in flight
          if (!isWrapping) {
            carouselTrack.style.transition = '';
            window.mosaicCarouselStates[groupId].isPaused = false;
            window.mosaicCarouselStates[groupId].manualControl = false;
          }
        }, resumeDelay);
      };

      // Helper: animate wrap by sliding to a clone, then silently snapping to real slide.
      // direction 'prev': animate to pre-clone (C_pre), snap to original C
      // direction 'next': animate to post-clone of first (A'), snap to original A
      // Guard: if already wrapping, ignore the call (prevents re-entrant wrap stacking).
      const animateWrap = (direction) => {
        if (isWrapping) return;
        isWrapping = true;

        const state = window.mosaicCarouselStates[groupId];
        const allSlideEls = Array.from(carouselTrack.querySelectorAll('.mosaic-v2-slide'));

        let cloneEl;
        let snapIndex;
        if (direction === 'prev') {
          // Animate backward to pre-clone (index 0 in allSlideEls)
          cloneEl = allSlideEls[0];
          snapIndex = originalSlidesCount - 1; // snap to original last slide after
        } else {
          // Animate forward to post-clone of first original (index 1 + N = N+1 in allSlideEls)
          cloneEl = allSlideEls[1 + originalSlidesCount];
          snapIndex = 0; // snap to original first slide after
        }

        if (!cloneEl || window.innerWidth < 768) {
          // Fallback: instant jump (mobile or clone missing)
          isWrapping = false;
          goToSlide(snapIndex);
          resumeAfterInteraction();
          return;
        }

        // Cancel stale clearTransitionFn before setting our own below
        if (clearTransitionFn) {
          carouselTrack.removeEventListener('transitionend', clearTransitionFn);
          clearTransitionFn = null;
        }

        carouselTrack.style.transition = `transform ${transitionDuration}ms ease-in-out`;
        const targetPos = -cloneEl.offsetLeft;
        carouselTrack.style.transform = `translateX(${targetPos}px)`;
        position = targetPos;
        state.position = targetPos;

        const onEnd = () => {
          carouselTrack.removeEventListener('transitionend', onEnd);
          isWrapping = false;
          // Silent snap to corresponding original slide
          carouselTrack.style.transition = 'none';
          const offsets = getOriginalSlideOffsets();
          position = -offsets[snapIndex];
          state.position = position;
          carouselTrack.style.transform = `translateX(${position}px)`;
          resumeAfterInteraction();
        };
        carouselTrack.addEventListener('transitionend', onEnd);
      };

      if (prevButton) {
        prevButton.addEventListener('click', () => {
          if (isWrapping) return; // Block clicks during wrap transition
          const state = window.mosaicCarouselStates[groupId];
          const currentIndex = getCurrentSlideIndex();

          if (currentIndex > 0) {
            // Normal prev: smooth animated slide
            // Set state ONLY when we're actually acting (prevents no-op freeze).
            state.isPaused = true;
            state.manualControl = true;
            goToSlide(currentIndex - 1, true);
            updateArrowVisibility(currentIndex - 1);
            resumeAfterInteraction();
          } else if (loop) {
            // Wrap prev (first → last): animate to pre-clone then snap to last original
            state.isPaused = true;
            state.manualControl = true;
            animateWrap('prev');
          }
          // else: no loop, already at first — do nothing.
          // IMPORTANT: do NOT touch state here; leaving manualControl=true with
          // no resumeAfterInteraction() call would freeze the carousel permanently.
        });
      }

      if (nextButton) {
        nextButton.addEventListener('click', () => {
          if (isWrapping) return; // Block clicks during wrap transition
          // Block click if we're already past the arrow-hide threshold (70% into last fold).
          // This keeps the visual hide and the functional disable perfectly in sync.
          if (!loop && arrowHideThreshold > 0 && Math.abs(position) >= arrowHideThreshold) return;
          const state = window.mosaicCarouselStates[groupId];

          // Use floor-based index (slide we're scrolling FROM), not nearest-based.
          // getCurrentSlideIndex() uses nearest offset, which flips to the last slide
          // at the midpoint (~50%) — before the arrow disappears at 70%. This causes
          // the click to do nothing when visually the button is still active.
          const offsets = getOriginalSlideOffsets();
          const absPos = Math.abs(position);
          let currentIndex = 0;
          for (let i = offsets.length - 1; i >= 0; i -= 1) {
            if (absPos >= offsets[i] - 1) { // -1 to handle float rounding
              currentIndex = i;
              break;
            }
          }

          if (currentIndex < originalSlidesCount - 1) {
            // Normal next: smooth animated slide
            // Set state ONLY when we're actually acting (prevents no-op freeze).
            state.isPaused = true;
            state.manualControl = true;
            goToSlide(currentIndex + 1, true);
            updateArrowVisibility(currentIndex + 1);
            resumeAfterInteraction();
          } else if (loop) {
            // Wrap next (last → first): animate to post-clone of first then snap to first original
            state.isPaused = true;
            state.manualControl = true;
            animateWrap('next');
          }
          // else: no loop, already at last — do nothing.
          // IMPORTANT: do NOT touch state here; leaving manualControl=true with
          // no resumeAfterInteraction() call would freeze the carousel permanently.
        });
      }
    }

    // Cleanup
    window.addEventListener('beforeunload', () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
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
