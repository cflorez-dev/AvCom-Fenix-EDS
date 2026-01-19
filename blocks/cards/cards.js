import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorates the cards block
 * @param {Element} block The cards block element
 */
export default function decorate(block) {
  // Detect if we're in Universal Editor author environment
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    // In author mode: preserve original editable content
    block.classList.add('cards-author-mode');
    
    // Add visual indicator for author
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'cards-author-indicator';
    authorIndicator.textContent = '📝 Cards Block (Author Mode - Edit below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #ccc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);
    
    // Don't transform the block - keep it editable
    return;
  }

  // Production mode: transform block into cards
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  
  // Hide original block and insert transformed content as sibling
  block.style.display = 'none';
  block.parentNode.insertBefore(ul, block.nextSibling);
  ul.className = 'cards-list';
}
