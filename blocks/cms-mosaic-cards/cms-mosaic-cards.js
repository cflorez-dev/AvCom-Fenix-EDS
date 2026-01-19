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
  const { h, html, LinkCard } = deps;
  
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
        class="parent-cms-mosaic grid w-full gap-4 grid-cols-[repeat(3,minmax(0,1fr))] md:grid-cols-[repeat(3,minmax(0,1fr))] md:grid-rows-[auto_auto_auto] sm:min-h-[31.25rem] sm:grid-cols-2 sm:grid-rows-2 sm:max-h-none max-[480px]:inline-flex max-[480px]:flex-col max-[480px]:gap-0 max-[480px]:max-h-none" 
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
              image=${card.image}
              imageAlt=${card.imageAlt}
              title=${card.title}
              description=${card.description}
              linkText=${card.linkText}
              href=${card.href}
              linkAlt=${card.linkAlt}
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
 * - First rows contain parent fields (layout, loading)
 * - Then a container div holds all child items
 * @param {Element} block - The block element
 * @returns {Object} Parent configuration
 */
function parseParentConfig(block) {
  const config = {
    layout: 'featured-left-tall', // default
    loading: 'lazy', // default
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
    image: '',
    imageAlt: '',
    title: '',
    description: '',
    linkText: '',
    href: '',
    linkAlt: '',
  };

  // Cell 0: imageDesktop (picture/img)
  if (cells[0]) {
    const img = cells[0].querySelector('img');
    if (img) {
      cardData.image = img.src;
      cardData.imageAlt = img.alt || '';
    }
  }

  // Cell 2: title (current Universal Editor structure)
  if (cells[2]) {
    cardData.title = cells[2].textContent.trim();
  }

  // Cell 3: description (current Universal Editor structure)
  if (cells[3]) {
    cardData.description = cells[3].textContent.trim();
  }

  // Cell 4: ctaLabel (optional)
  if (cells[4]) {
    const ctaText = cells[4].textContent.trim();
    if (ctaText) {
      cardData.linkText = ctaText;
    }
  }

  // Cell 7: linkUrl (according to current Universal Editor structure)
  if (cells[7]) {
    const link = cells[7].querySelector('a');
    let linkUrl = link ? link.href : cells[7].textContent.trim();
    
    // Process linkUrl to ensure it's a valid URL
    if (linkUrl) {
      if (
        !linkUrl.startsWith('http://') &&
        !linkUrl.startsWith('https://') &&
        !linkUrl.startsWith('/') &&
        !linkUrl.startsWith('//')
      ) {
        linkUrl = `/${linkUrl}`;
      }
      cardData.href = linkUrl;
    }
  }

  // Cell 8: linkAlt
  if (cells[8]) {
    cardData.linkAlt = cells[8].textContent.trim();
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

    // After parent fields (row 0: layout, row 1: loading), 
    // find child item rows
    // Each link-card child will be a row with multiple cells (12+ cells for all link-card fields)
    for (let i = 2; i < allRows.length; i += 1) {
      const row = allRows[i];

      // Child items have multiple cells (12 cells for link-card)
      if (row.children.length > 1) {
        const cardData = parseCardDataFromItem(row);
        if (cardData.image || cardData.title) {
          childItems.push(cardData);
        }
      }
    }

    if (childItems.length === 0) {
      console.warn('No link-card children found in cms-mosaic-cards block');
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
          cards=${childItems} 
          template=${template}
        />
      `,
      container,
    );
  } catch (error) {
    console.error('Error loading cms-mosaic-cards dependencies:', error);
    block.innerHTML = `<div style="padding: 20px; background: #ffebee; border: 1px solid #f44336; border-radius: 4px;"><strong>❌ Error loading content</strong><br>${error.message}</div>`;
  }
}
