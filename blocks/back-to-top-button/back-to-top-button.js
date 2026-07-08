/**
 * Back to Top Button Block
 *
 * Floating button that appears after scrolling down and returns user to top of page.
 * Configurable via Universal Editor with threshold, icon, position, and aria label.
 *
 * AEM Block Structure:
 * | Threshold (px)    | 300                    |
 * | Bottom Position   | 24px                   |
 * | Right Position    | 24px                   |
 * | Icon              | [reference to SVG]     |
 * | Aria Label        | Back to top            |
 * | Enabled           | true                   |
 */

/**
 * Parse block configuration from AEM DOM structure
 * @param {Element} block - The block element
 * @returns {Object} Configuration object
 */
function parseConfig(block) {
  const rows = Array.from(block.children);
  const config = {
    threshold: 300,
    bottomPosition: '24px',
    rightPosition: '24px',
    icon: null,
    ariaLabel: 'Back to top',
    enabled: true,
  };

  rows.forEach((row, index) => {
    const cell = row.children[0];
    if (!cell) return;

    if (index === 0) {
      // Row 0: Threshold (scroll pixels before showing)
      const value = parseInt(cell.textContent.trim(), 10);
      if (!Number.isNaN(value)) {
        config.threshold = value;
      }
    } else if (index === 1) {
      // Row 1: Bottom position (e.g., "24px", "2rem")
      config.bottomPosition = cell.textContent.trim() || '24px';
    } else if (index === 2) {
      // Row 2: Right position (e.g., "24px", "2rem")
      config.rightPosition = cell.textContent.trim() || '24px';
    } else if (index === 3) {
      // Row 3: Icon (reference to SVG image)
      const img = cell.querySelector('img');
      if (img) {
        config.icon = img.src;
      }
    } else if (index === 4) {
      // Row 4: Aria label (accessibility)
      config.ariaLabel = cell.textContent.trim() || 'Back to top';
    } else if (index === 5) {
      // Row 5: Enabled flag
      const enabled = cell.textContent.trim().toLowerCase();
      config.enabled = enabled !== 'false';
    }
  });

  return config;
}

/**
 * Decorates the back-to-top-button block
 * @param {Element} block - The back-to-top-button block element
 */
export default async function decorate(block) {
  try {
    // Parse configuration from block
    const config = parseConfig(block);

    // Check if block is disabled
    if (!config.enabled) {
      block.remove();
      return;
    }

    // Load Preact component dynamically
    const [preactModule, htmModule, backToTopModule] = await Promise.all([
      import('@dropins/tools/preact.js'),
      import('htm'),
      import(`${window.hlx.codeBasePath}/design-system/atoms/back-to-top-button/back-to-top-button.js`),
    ]);

    const { h, render } = preactModule;
    const htm = htmModule.default;
    const html = htm.bind(h);
    const { BackToTopButton } = backToTopModule;

    // Clear block and render INSIDE (compatible with editor-support.js re-decoration)
    block.textContent = '';

    // Create container for Preact component
    const container = document.createElement('div');
    container.className = 'back-to-top-button-content';
    block.appendChild(container);

    // Prepare icon element if custom icon provided
    let iconElement = null;
    if (config.icon) {
      iconElement = html`
        <img
          src=${config.icon}
          alt=""
          class="w-[24px] h-[24px] max-sm:w-[20px] max-sm:h-[20px]"
          aria-hidden="true"
          decoding="async"
          loading="lazy"
        />
      `;
    }

    // Render Preact component. `position` is applied as inline style by the
    // atom, so the values authored here take precedence over any CSS/Tailwind.
    render(
      html`
        <${BackToTopButton}
          threshold=${config.threshold}
          position=${{ bottom: config.bottomPosition, right: config.rightPosition }}
          icon=${iconElement}
          ariaLabel=${config.ariaLabel}
        />
      `,
      container,
    );
  } catch (error) {
    block.innerHTML = `<div class="p-5 bg-red-50 border border-red-600 rounded"><strong class="font-bold">Error loading Back to Top button</strong><br>${error.message}</div>`;
  }
}
