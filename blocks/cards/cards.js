import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorates the cards block
 * @param {Element} block The cards block element
 */
export default function decorate(block) {
  // 1. Extract data BEFORE hiding children
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

  // 2. Hide original children to preserve data-aue-* for editor (Pattern B)
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  // 3. Render INSIDE the block (compatible with editor-support.js re-decoration)
  ul.className = 'cards-list';
  block.appendChild(ul);
}
