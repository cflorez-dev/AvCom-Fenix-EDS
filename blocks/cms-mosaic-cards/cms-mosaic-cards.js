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
 * @param {number} totalCards - Total number of cards
 * @returns {string} Tailwind classes applied to the card wrapper
 */

import { getMosaicStore } from '../mosaic-cards-v2/mosaic-cards-v2.store.js';
import { shouldShowByTargeting, hideBlockWithSection, filterItemsByTargeting } from '../../scripts/utils/target-filter.js';
import { applyLinkButtonStylesToLinks } from '../../scripts/utils/link-card-richtext.js';

function getCardClasses(template, cardIndex, totalCards) {
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

  // Tablet classes (480-767px)
  // Special case for 3 cards: the third card spans full width on row 2
  const tabletPosition = totalCards === 3
    ? [
      'sm:col-start-1 sm:row-start-1', // Card 1: top-left
      'sm:col-start-2 sm:row-start-1', // Card 2: top-right
      'sm:col-span-2 sm:col-start-1 sm:row-start-2', // Card 3: full-width bottom
    ]
    : [
      'sm:col-start-1 sm:row-start-1', // Card 1: top-left
      'sm:col-start-2 sm:row-start-1', // Card 2: top-right
      'sm:col-start-1 sm:row-start-2', // Card 3: bottom-left
      'sm:col-start-2 sm:row-start-2', // Card 4: bottom-right
    ];
  const tabletClasses = tabletPosition[cardIndex] || '';

  return `${desktopClasses} ${tabletClasses}`;
}

/**
 * Maximum cards supported by each template.
 * Templates 1-4 support 4 cards, templates 5-7 support 3 cards.
 *
 * @param {string} template - Template variant
 * @returns {number} Max cards allowed for the selected template
 */
function getTemplateMaxCards(template) {
  const maxByTemplate = {
    'template-1': 4,
    'template-2': 4,
    'template-3': 4,
    'template-4': 4,
    'template-5': 3,
    'template-6': 3,
    'template-7': 3,
  };

  return maxByTemplate[template] || 4;
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

  return ({ cards = [], template = 'template-1', loading = 'lazy' }) => {
    if (!cards || cards.length === 0) {
      return html`
        <div class="p-6 text-center text-[var(--text-normal-secondary)]">
          No link-card children found in cms-mosaic-cards block.
        </div>
      `;
    }
    const loadingMode = loading === 'eager' ? 'eager' : 'lazy';

    return html`
      <div 
        class="parent-cms-mosaic grid w-full gap-4 grid-cols-[repeat(3,minmax(0,1fr))] md:grid-cols-[repeat(3,minmax(0,1fr))] md:grid-rows-[repeat(3,minmax(0,1fr))] sm:min-h-[31.25rem] sm:grid-cols-2 sm:grid-rows-2 sm:max-h-none max-[480px]:inline-flex max-[480px]:flex-col max-[480px]:gap-0 max-[480px]:max-h-none pt-[5px]" 
        data-name="cmsMosaicCards"
        data-template=${template}
      >
        <div class="md:contents sm:contents max-[480px]:flex max-[480px]:flex-col max-[480px]:gap-4 max-[480px]:items-start max-[480px]:w-full">
          ${cards.map((card, index) => {
    const cardClasses = getCardClasses(template, index, cards.length);
    const { columns, rows } = getCardDimensions(cardClasses);

    const isPhotographicCard = !card.title && !card.description && !card.ctaLabel;
    const mobileHeightClass = isPhotographicCard ? 'max-[480px]:h-[326px]' : '';

    return html`
          <div 
            key=${index} 
            class=${`child-cms-mosaic flex flex-col justify-center items-start self-stretch justify-self-stretch ${cardClasses} max-[768px]:min-h-[326px] max-[480px]:w-full max-[480px]:shrink-0 ${mobileHeightClass}`}
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
              loading=${loadingMode}
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
    linkUrl: '',
    linkAlt: '',
    linkOpensIn: 'sameTab',
    ctaIconBefore: 'none',
    ctaIconAfter: 'none',
    clickBehavior: 'fullCard',
    targetCountries: '',
    targetLanguages: '',
  };

  // Detect format by exact cell count. Three formats are supported:
  // - 12 cells: legacy CSV migration (no supportIcon, no linkAlt)
  // - 13 cells: current Universal Editor format (no supportIcon, with linkAlt)
  // - 14 cells: legacy Universal Editor format (with supportIcon, with linkAlt)
  // The supportIcon field was removed from component-models.json (commit 87884fe4),
  // so any new content created via UE has 13 cells. Older content may still have 14.
  const hasSupportIcon = cells.length >= 14;
  const hasLinkAlt = cells.length >= 13;

  let cellIndex = 0;

  // Helper: extract image from a cell, handling both <img> and <a> (migration format)
  function extractImage(cell) {
    const img = cell.querySelector('img');
    if (img) return { src: img.src, alt: img.alt || '' };
    const link = cell.querySelector('a');
    if (link && link.href) return { src: link.href, alt: link.textContent.trim() };
    return null;
  }

  // Cell 0: imageDesktop
  if (cells[cellIndex]) {
    const imgData = extractImage(cells[cellIndex]);
    if (imgData) {
      cardData.imageDesktop = imgData.src;
      cardData.imageDesktopAlt = imgData.alt;
    }
    cellIndex += 1;
  }

  // Cell 1: imageMobile
  if (cells[cellIndex]) {
    const imgData = extractImage(cells[cellIndex]);
    if (imgData) {
      cardData.imageMobile = imgData.src;
      cardData.imageMobileAlt = imgData.alt;
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
  if (hasSupportIcon && cells[cellIndex]) {
    cardData.supportIcon = cells[cellIndex].textContent.trim();
    cellIndex += 1;
  }

  // Cell N: linkUrl
  if (cells[cellIndex]) {
    const link = cells[cellIndex].querySelector('a');
    let linkUrl = link ? link.href : cells[cellIndex].textContent.trim();
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

  // Cell N+1: linkAlt (only in UE formats — migration skips this)
  if (hasLinkAlt && cells[cellIndex]) {
    cardData.linkAlt = cells[cellIndex].textContent.trim();
    cellIndex += 1;
  }

  // Cell N+2: linkOpensIn
  if (cells[cellIndex]) {
    const opensIn = cells[cellIndex].textContent.trim();
    if (opensIn === 'sameTab' || opensIn === 'newTab') {
      cardData.linkOpensIn = opensIn;
    }
    cellIndex += 1;
  }

  // Cell N+3: ctaIconBefore
  if (cells[cellIndex]) {
    const iconBefore = cells[cellIndex].textContent.trim();
    if (iconBefore) {
      cardData.ctaIconBefore = iconBefore;
    }
    cellIndex += 1;
  }

  // Cell N+4: ctaIconAfter
  if (cells[cellIndex]) {
    const iconAfter = cells[cellIndex].textContent.trim();
    if (iconAfter) {
      cardData.ctaIconAfter = iconAfter;
    }
    cellIndex += 1;
  }

  // Cell N+5: clickBehavior
  if (cells[cellIndex]) {
    const behavior = cells[cellIndex].textContent.trim();
    if (behavior === 'ctaOnly' || behavior === 'fullCard') {
      cardData.clickBehavior = behavior;
    }
    cellIndex += 1;
  }

  // Cell N+6: target-countries
  if (cells[cellIndex]) {
    cardData.targetCountries = cells[cellIndex].textContent.trim();
    cellIndex += 1;
  }

  // Cell N+7: target-languages
  if (cells[cellIndex]) {
    cardData.targetLanguages = cells[cellIndex].textContent.trim();
  }

  return cardData;
}

/**
 * Decorates the CMS Mosaic Cards block
 * @param {Element} block The mosaic cards block element
 */
export default async function decorate(block) {
  try {
    const section = block.closest('.section');
    const sectionId = section?.dataset?.mosaicV2Group || '';
    const noDisplaySection = document.querySelector('.no-section-display');

    if (sectionId && noDisplaySection && noDisplaySection?.dataset?.mosaicV2Group === sectionId) {
      hideBlockWithSection(block);
      return;
    }

    const config = parseParentConfig(block);

    // Country and language filtering (PARENT level)
    if (!shouldShowByTargeting(config.targetCountries, config.targetLanguages)) {
      hideBlockWithSection(block);
      return;
    }
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
    const maxTemplateCards = getTemplateMaxCards(template);

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

    // Fallback: discover sibling link-card blocks in the same section (migration format)
    if (childItems.length === 0) {
      const parentSection = block.closest('.section');
      if (parentSection) {
        const siblingCards = parentSection.querySelectorAll('.link-card');
        siblingCards.forEach((card) => {
          const rows = [...card.querySelectorAll(':scope > div > div')];
          if (rows.length === 0) return;
          const val = (idx) => rows[idx]?.textContent?.trim() || '';
          // Preserve HTML for richtext fields (description) so bold/lists/links render.
          // Mutates rows[idx] in place to inject LinkButton styles on <a> tags before
          // serializing innerHTML, so the rendered description matches cms-rich-text.
          const valHtml = (idx) => {
            const row = rows[idx];
            if (!row) return '';
            applyLinkButtonStylesToLinks(row);
            return row.innerHTML?.trim() || '';
          };
          const imgAt = (idx) => {
            if (!rows[idx]) return { src: '', alt: '' };
            const img = rows[idx].querySelector('img');
            if (img) return { src: img.src, alt: img.alt || '' };
            const a = rows[idx].querySelector('a');
            if (a && a.href) return { src: a.href, alt: a.textContent.trim() };
            const pic = rows[idx].querySelector('picture');
            if (pic) {
              const pImg = pic.querySelector('img');
              if (pImg) return { src: pImg.src, alt: pImg.alt || '' };
            }
            return { src: val(idx), alt: '' };
          };

          const desktop = imgAt(0);
          const mobile = imgAt(2);
          const cardData = {
            imageDesktop: desktop.src,
            imageDesktopAlt: val(1) || desktop.alt,
            imageMobile: mobile.src,
            imageMobileAlt: val(3) || mobile.alt,
            title: val(4),
            description: valHtml(5),
            ctaLabel: val(6),
            supportIcon: '',
            linkUrl: val(7),
            linkAlt: val(8),
            linkOpensIn: val(9) || 'sameTab',
            ctaIconBefore: val(10) || 'none',
            ctaIconAfter: val(11) || 'none',
            clickBehavior: val(12) || 'fullCard',
            targetCountries: val(13) || '',
            targetLanguages: val(14) || '',
          };

          if (cardData.imageDesktop || cardData.title) {
            childItems.push(cardData);
            card.style.display = 'none';
          }
        });
      }
    }

    // Filter cards by targeting
    const filteredItems = filterItemsByTargeting(childItems);
    const visibleItems = filteredItems.slice(0, maxTemplateCards);

    if (visibleItems.length === 0) {
      hideBlockWithSection(block);
      return;
    }

    if (filteredItems.length > visibleItems.length) {
      // Extra cards beyond template's max are silently ignored.
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
          cards=${visibleItems} 
          template=${template}
          loading=${config.loading}
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
        const cardsWithElements = visibleItems.map((card, index) => {
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
    block.innerHTML = `<div style="padding: 20px; background: #ffebee; border: 1px solid #f44336; border-radius: 4px;"><strong>❌ Error loading content</strong><br>${error.message}</div>`;
  }
}
