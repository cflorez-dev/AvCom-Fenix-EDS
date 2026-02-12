/**
 * Return Tailwind utility classes for a card based on the chosen template.
 *
 * Layout mapping:
 * - Desktop (>= 768px): 3x3 grid with template-specific placements
 * - Tablet (480-767px): 2x2 grid with equal proportions
 * - Mobile (<480px): stacked vertical layout
 *
 * @param {string} template - Template variant (template-1 to template-7)
 * @param {number} cardIndex - Card index (0-based)
 * @returns {string} Tailwind classes applied to the card wrapper
 */

import { getMosaicStore } from '../mosaic-cards-v2/mosaic-cards-v2.store.js';
import { shouldShowByTargeting, hideBlockWithSection, filterItemsByTargeting } from '../../scripts/utils/target-filter.js';

function getCardClasses(template, cardIndex) {
  // Desktop classes (≥768px) - grid 3x3
  const templates = {
    'template-1': [
      'md:row-span-3 md:col-start-1 md:row-start-1', // Card 1: tall left
      'md:col-span-2 md:col-start-2 md:row-start-1', // Card 2: horizontal top-right
      'md:row-span-2 md:col-start-2 md:row-start-2', // Card 3: vertical middle-center
      'md:row-span-2 md:col-start-3 md:row-start-2', // Card 4: vertical middle-right
    ],
    'template-2': [
      'md:col-span-2 md:col-start-1 md:row-start-1', // Card 1: horizontal top-left
      'md:row-span-3 md:col-start-3 md:row-start-1', // Card 2: tall right
      'md:row-span-2 md:col-start-1 md:row-start-2', // Card 3: vertical bottom-left
      'md:row-span-2 md:col-start-2 md:row-start-2', // Card 4: vertical bottom-center
    ],
    'template-3': [
      'md:row-span-3 md:col-start-1 md:row-start-1', // Card 1: tall left
      'md:col-span-2 md:col-start-2 md:row-start-1', // Card 2: horizontal top-right
      'md:col-span-2 md:col-start-2 md:row-start-2', // Card 3: horizontal middle-right
      'md:col-span-2 md:col-start-2 md:row-start-3', // Card 4: horizontal bottom-right
    ],
    'template-4': [
      'md:col-span-2 md:col-start-1 md:row-start-1', // Card 1: horizontal top-left
      'md:col-span-2 md:col-start-1 md:row-start-2', // Card 2: horizontal middle-left
      'md:col-span-2 md:col-start-1 md:row-start-3', // Card 3: horizontal bottom-left
      'md:row-span-3 md:col-start-3 md:row-start-1', // Card 4: tall right
    ],
    'template-5': [
      'md:row-span-3 md:col-start-1 md:row-start-1', // Card 1: tall
      'md:row-span-3 md:col-start-2 md:row-start-1', // Card 2: tall
      'md:row-span-3 md:col-start-3 md:row-start-1', // Card 3: tall
    ],
    'template-6': [
      'md:col-span-2 md:row-span-2 md:col-start-1 md:row-start-1', // Card 1: square top-left
      'md:col-span-2 md:col-start-1 md:row-start-3', // Card 2: horizontal bottom-left
      'md:row-span-3 md:col-start-3 md:row-start-1', // Card 3: tall right
    ],
    'template-7': [
      'md:row-span-3 md:col-start-1 md:row-start-1', // Card 1: tall left
      'md:col-span-2 md:row-span-2 md:col-start-2 md:row-start-1', // Card 2: square top-right
      'md:col-span-2 md:col-start-2 md:row-start-3', // Card 3: horizontal bottom-right
    ],
  };

  const desktopClasses = templates[template]?.[cardIndex] || '';

  // Tablet classes (480-767px): 2x2 grid, equal proportions
  const tabletPosition = [
    'sm:col-start-1 sm:row-start-1', // Card 1: top-left
    'sm:col-start-2 sm:row-start-1', // Card 2: top-right
    'sm:col-start-1 sm:row-start-2', // Card 3: bottom-left
    'sm:col-start-2 sm:row-start-2', // Card 4: bottom-right
  ];
  const tabletClasses = tabletPosition[cardIndex] || '';

  return `${desktopClasses} ${tabletClasses}`;
}

/**
 * Determine LinkCard columns and rows based on grid classes
 * @param {string} gridClasses - Tailwind grid classes
 * @returns {Object} columns and rows for LinkCard
 */
function getCardDimensions(gridClasses) {
  const hasColSpan2 = gridClasses.includes('col-span-2');
  const hasRowSpan2 = gridClasses.includes('row-span-2');
  const hasRowSpan3 = gridClasses.includes('row-span-3');

  // Horizontal: 2 columns, 1 row
  if (hasColSpan2 && !hasRowSpan2 && !hasRowSpan3) {
    return { columns: 2, rows: 1 };
  }

  // Square: 2 columns, 2 rows
  if (hasColSpan2 && hasRowSpan2) {
    return { columns: 2, rows: 2 };
  }

  // Vertical tall: 1 column, 3 rows
  if (hasRowSpan3) {
    return { columns: 1, rows: 3 };
  }

  // Vertical medium: 1 column, 2 rows
  if (hasRowSpan2) {
    return { columns: 1, rows: 2 };
  }

  // Default: 1 column, 1 row
  return { columns: 1, rows: 1 };
}

/**
 * CMS Mosaic Cards Component - Renders LinkCard organisms in different template layouts
 * @param {Object} props - Component props
 * @param {Array} props.cards - Array of card data objects
 * @param {string} props.template - Template variant (template-1 to template-7)
 * @param {Object} deps - Dependencies (h, html, LinkCard)
 * @returns {Object} Preact component
 */
function createCMSMosaicCards(deps) {
  const { html, LinkCard } = deps;

  return ({ cards = [], template = 'template-1' }) => {
    if (!cards || cards.length === 0) {
      return html`
        <div class="p-6 text-center text-[var(--text-normal-secondary)]">
          No link-card children found in cms-mosaic-cards block.
        </div>
      `;
    }

    return html`
      <div 
        class="parent-cms-mosaic grid w-full gap-4 grid-cols-[repeat(3,minmax(0,1fr))] md:grid-cols-[repeat(3,minmax(0,1fr))] md:grid-rows-[auto_auto_auto] sm:min-h-[31.25rem] sm:grid-cols-2 sm:grid-rows-2 sm:max-h-none max-[480px]:inline-flex max-[480px]:flex-col max-[480px]:gap-0 max-[480px]:max-h-none pt-[5px]" 
        data-name="cmsMosaicCards"
        data-template=${template}
      >
        <div class="md:contents sm:contents max-[480px]:flex max-[480px]:flex-col max-[480px]:gap-3 max-[480px]:items-start max-[480px]:w-full">
          ${cards.map((card, index) => {
    const cardClasses = getCardClasses(template, index);
    const { columns, rows } = getCardDimensions(cardClasses);

    return html`
          <div 
            key=${index} 
            class=${`child-cms-mosaic flex flex-col justify-center items-start self-stretch justify-self-stretch ${cardClasses} sm:col-span-1 sm:row-span-1 max-[768px]:min-h-[326px] max-[480px]:w-full max-[480px]:shrink-0`}
            data-card=${index + 1}
          >
            <${LinkCard}
              image=${card.imageMobile || card.imageDesktop}
              imageAlt=${card.imageMobileAlt || card.imageDesktopAlt}
              imageDesktop=${card.imageDesktop}
              imageDesktopAlt=${card.imageDesktopAlt}
              imageMobile=${card.imageMobile}
              imageMobileAlt=${card.imageMobileAlt}
              title=${card.title}
              description=${card.description}
              linkText=${card.ctaLabel}
              href=${card.linkUrl}
              linkAlt=${card.linkAlt}
              linkOpensIn=${card.linkOpensIn}
              ctaIconBefore=${card.ctaIconBefore}
              ctaIconAfter=${card.ctaIconAfter}
              clickBehavior=${card.clickBehavior}
              supportIcon=${card.supportIcon}
              badges=${card.badges}
              columns=${columns}
              rows=${rows}
            />
          </div>
        `;
  })}
        </div>
      </div>
    `;
  };
}

/**
 * Parse parent config from AEM block structure
 * With Universal Editor parent-child pattern:
 * - Row 0: layout
 * - Row 1: loading
 * - Row 2: target-countries
 * - Row 3: target-languages
 * - Then a container div holds all child items
 * @param {Element} block - The block element
 * @returns {Object} Parent configuration
 */
function parseParentConfig(block) {
  const config = {
    layout: 'featured-left-tall', // default
    loading: 'lazy', // default
    targetCountries: '',
    targetLanguages: '',
  };

  const rows = [...block.children];

  // Row 0: layout field (single-cell row)
  if (rows[0] && rows[0].children.length === 1) {
    const layoutValue = rows[0].children[0].textContent.trim();
    if (layoutValue) {
      config.layout = layoutValue;
    }
  }

  // Row 1: loading field (single-cell row)
  if (rows[1] && rows[1].children.length === 1) {
    const loadingValue = rows[1].children[0].textContent.trim();
    if (loadingValue) {
      config.loading = loadingValue;
    }
  }

  // Row 2: target-countries field (comma-separated)
  if (rows[2] && rows[2].children.length === 1) {
    const countriesValue = rows[2].children[0].textContent.trim();
    if (countriesValue) {
      config.targetCountries = countriesValue;
    }
  }

  // Row 3: target-languages field (comma-separated)
  if (rows[3] && rows[3].children.length === 1) {
    const languagesValue = rows[3].children[0].textContent.trim();
    if (languagesValue) {
      config.targetLanguages = languagesValue;
    }
  }

  return config;
}

/**
 * Parse card data from a link-card child item
 * Universal Editor creates child items as divs with multiple cells
 * @param {Element} item - Child item element (div row)
 * @returns {Object} Card data object
 */
function parseCardDataFromItem(item) {
  const cells = [...item.children];

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

  // Cell 0: imageDesktop (picture/img)
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

  // Cell 2: imageMobile (picture/img) - OPTIONAL
  // Check if this cell has an image, if not, skip it
  if (cells[cellIndex] && cells[cellIndex].querySelector('img')) {
    cardData.imageMobile = cells[cellIndex].querySelector('img').src;
    cellIndex += 1;

    // Cell 3: imageMobileAlt - only if imageMobile exists
    if (cells[cellIndex]) {
      cardData.imageMobileAlt = cells[cellIndex].textContent.trim();
      cellIndex += 1;
    }
  }

  // Now continue with text fields
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

  // Cell N+4: badges (comma-separated)
  if (cells[cellIndex]) {
    const badgesText = cells[cellIndex].textContent.trim();
    if (badgesText) {
      cardData.badges = badgesText.split(',').map((b) => b.trim()).filter(Boolean);
    }
    cellIndex += 1;
  }

  // Cell N+5: linkUrl (has button-container or link)
  if (cells[cellIndex]) {
    const link = cells[cellIndex].querySelector('a');
    let linkUrl = link ? link.href : cells[cellIndex].textContent.trim();

    // Process linkUrl to ensure it's a valid URL
    if (linkUrl) {
      if (
        !linkUrl.startsWith('http://')
        && !linkUrl.startsWith('https://')
        && !linkUrl.startsWith('/')
        && !linkUrl.startsWith('//')
      ) {
        linkUrl = `/${linkUrl}`;
      }
      cardData.linkUrl = linkUrl;
    }
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
    cellIndex += 1;
  }

  // Cell N+11: target-countries (multiselect, comma-separated)
  if (cells[cellIndex]) {
    cardData['target-countries'] = cells[cellIndex].textContent.trim();
    cellIndex += 1;
  }

  // Cell N+12: target-languages (multiselect, comma-separated)
  if (cells[cellIndex]) {
    cardData['target-languages'] = cells[cellIndex].textContent.trim();
  }

  return cardData;
}

/**
 * Decorates the CMS Mosaic Cards block
 * @param {Element} block The mosaic cards block element
 */
export default async function decorate(block) {
  try {
    // Load dependencies dynamically using importmap aliases and codeBasePath
    const [preactModule, htmModule, linkCardModule] = await Promise.all([
      import('@dropins/tools/preact.js'),
      import('htm'),
      import(`${window.hlx.codeBasePath}/design-system/organisms/cards/link-card/link-card.js`),
    ]);

    const { h, render } = preactModule;
    const htm = htmModule.default;
    const html = htm.bind(h);
    const { LinkCard } = linkCardModule;

    // Create component with dependencies
    const CMSMosaicCards = createCMSMosaicCards({ h, html, LinkCard });

    const allRows = [...block.children];

    // Parse parent config from block (first rows)
    const config = parseParentConfig(block);

    // Country and language filtering (PARENT level)
    if (!shouldShowByTargeting(config.targetCountries, config.targetLanguages)) {
      hideBlockWithSection(block);
      return;
    }

    // Map layout values to template numbers
    const layoutToTemplate = {
      'featured-left-tall': 'template-1',
      'horizontal-tall-right': 'template-2',
      'tall-left-horizontal': 'template-3',
      'horizontal-stack-tall-right': 'template-4',
      'three-vertical': 'template-5',
      'square-horizontal-tall': 'template-6',
      'tall-square-horizontal': 'template-7',
    };

    const template = layoutToTemplate[config.layout] || 'template-1';

    const childItems = [];

    // Find child item rows dynamically
    // Parent fields have 1 cell, child items have 15 cells
    // This handles cases where not all parent fields are configured
    for (let i = 0; i < allRows.length; i += 1) {
      const row = allRows[i];

      // Child items have multiple cells (17 cells for link-card with targeting)
      // Parent fields have only 1 cell
      if (row.children.length > 1) {
        const cardData = parseCardDataFromItem(row);
        if (cardData.imageDesktop || cardData.title) {
          childItems.push(cardData);
        }
      }
    }

    // Filter cards by targeting
    const filteredItems = filterItemsByTargeting(childItems);

    if (filteredItems.length === 0) {
      console.warn('No link-card children found after filtering in cms-mosaic-cards block');
      hideBlockWithSection(block);
      return;
    }

    // Hide original block content but keep it in DOM for Universal Editor
    block.style.display = 'none';

    // Create container for Preact component as sibling
    const container = document.createElement('div');
    container.className = 'cms-mosaic-cards-rendered';
    block.parentNode.insertBefore(container, block.nextSibling);

    // Render Preact component
    render(
      html`
        <${CMSMosaicCards} 
          cards=${filteredItems} 
          template=${template}
        />
      `,
      container,
    );

    // Register cards in store if this mosaic is part of a mosaic-cards-v2 group
    setTimeout(() => {
      // Check if this block is inside a mosaic-cards-v2 container
      const section = block.closest('.section');
      const groupId = section?.dataset?.mosaicV2Group;
      
      if (groupId) {
        // This mosaic is part of a mosaic-cards-v2 group
        const store = getMosaicStore();
        
        // Get existing group data or create new one
        const existingGroup = store.getGroup(groupId) || { cards: [], metadata: {} };
        
        // Transform childItems to store format with DOM elements
        const cardsWithElements = childItems.map((card, index) => {
          // Find the corresponding DOM element
          const cardElement = container.querySelector(`[data-card="${index + 1}"]`);
          
          return {
            index: existingGroup.cards.length + index,
            element: cardElement,
            title: card.title,
            description: card.description,
            link: card.linkUrl ? {
              href: card.linkUrl,
              text: card.ctaLabel,
              alt: card.linkAlt,
              opensIn: card.linkOpensIn,
            } : null,
            image: card.imageDesktop ? {
              src: card.imageDesktop,
              alt: card.imageDesktopAlt,
              mobile: card.imageMobile,
              mobileAlt: card.imageMobileAlt,
            } : null,
            badges: card.badges,
            supportIcon: card.supportIcon,
            clickBehavior: card.clickBehavior,
            ctaIconBefore: card.ctaIconBefore,
            ctaIconAfter: card.ctaIconAfter,
          };
        });
        
        // Merge with existing cards (for multiple mosaics in same group)
        const allCards = [...existingGroup.cards, ...cardsWithElements];
        
        // Register or update group
        store.registerGroup(groupId, {
          cards: allCards,
          metadata: {
            ...existingGroup.metadata,
            template,
            layout: config.layout,
            loading: config.loading,
            targetCountries: config.targetCountries,
            targetLanguages: config.targetLanguages,
            totalMosaics: (existingGroup.metadata.totalMosaics || 0) + 1,
          },
        });
      }
    }, 100);
  } catch (error) {
    console.error('Error loading cms-mosaic-cards dependencies:', error);
    block.innerHTML = `<div style="padding: 20px; background: #ffebee; border: 1px solid #f44336; border-radius: 4px;"><strong>❌ Error loading content</strong><br>${error.message}</div>`;
  }
}
