import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { extractTipsCardsProps, extractTipsCards } from './tips-cards-helper.js';
import TipsCards from '../../design-system/organisms/tips-cards/tips-cards.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

/**
 * Decorates the Tips Cards block
 * This is a container block that holds tips-card-item child elements.
 * @param {Element} block The tips-cards block element
 */
export default function decorate(block) {
  // Extract configuration and cards using helper
  const config = extractTipsCardsProps(block);

  // Parent-level targeting: hide entire block if targeting doesn't match
  if (!shouldShowByTargeting(config.targetCountries, config.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  const cards = extractTipsCards(block);
  const loadingMode = config.loading || 'lazy';

  // Hide original children to preserve data-aue-* for editor (Pattern B)
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  // Render INSIDE the block (compatible with editor-support.js re-decoration)
  const container = document.createElement('div');
  container.className = 'tips-cards-content';
  render(
    html`
      <${TipsCards}
        cards=${cards}
        loading=${loadingMode}
        size="large"
      />
    `,
    container,
  );
  block.appendChild(container);
}
