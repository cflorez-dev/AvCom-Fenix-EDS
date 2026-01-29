import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

/**
 * Decorates the Carousel block
 * @param {Element} block The carousel block element
 */
export default function decorate(block) {
  // Detect if we're in Universal Editor author environment
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    // In author mode: preserve original editable content
    block.classList.add('carousel-author-mode');

    // Add visual indicator for author
    const authorIndicator = document.createElement('div');
    authorIndicator.className = 'carousel-author-indicator';
    authorIndicator.textContent = '🎠 Carousel (Author Mode - Edit below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);

    // Don't transform the block - keep it editable
    return;
  }

  // Production mode: transform block into carousel
  const config = readBlockConfig(block);
  const loadingMode = config.loading || 'lazy'; // 'lazy' or 'eager'
  const speed = config.speed || 'normal'; // 'slow', 'normal', 'fast'
  const direction = config.direction || 'left'; // 'left', 'right'

  // Create carousel container
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'carousel-container';

  // Create scrolling content wrapper
  const scrollingContent = document.createElement('div');
  scrollingContent.className = 'carousel-content';
  scrollingContent.setAttribute('data-speed', speed);
  scrollingContent.setAttribute('data-direction', direction);

  // Process rows - each row becomes an item in the carousel
  const rows = [...block.children];

  rows.forEach((row) => {
    const item = document.createElement('div');
    item.className = 'carousel-item';

    // Process cells in row
    const cells = [...row.children];
    cells.forEach((cell) => {
      // Check for images
      const picture = cell.querySelector('picture');
      const img = cell.querySelector('img');
      if (picture || img) {
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'carousel-item-image';

        if (img) {
          const optimizedPicture = createOptimizedPicture(
            img.src,
            img.alt || '',
            loadingMode === 'eager',
            [{ width: '400' }],
          );
          imageWrapper.appendChild(optimizedPicture);
        } else if (picture) {
          imageWrapper.appendChild(picture.cloneNode(true));
        }

        item.appendChild(imageWrapper);
      }

      // Check for text content
      const textContent = cell.cloneNode(true);
      if (!textContent.querySelector('img') && !textContent.querySelector('picture')) {
        const heading = textContent.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
          heading.className = 'carousel-item-title';
        }

        const paragraphs = textContent.querySelectorAll('p');
        paragraphs.forEach((p) => {
          if (!p.querySelector('a')) {
            p.className = 'carousel-item-text';
          }
        });

        const links = textContent.querySelectorAll('a');
        links.forEach((link) => {
          if (!link.querySelector('img')) {
            link.className = 'carousel-item-link';
          }
        });

        if (textContent.children.length > 0 || textContent.textContent.trim()) {
          const contentWrapper = document.createElement('div');
          contentWrapper.className = 'carousel-item-content';
          contentWrapper.appendChild(textContent);
          item.appendChild(contentWrapper);
        }
      }
    });

    if (item.children.length > 0) {
      scrollingContent.appendChild(item);
    }
  });

  // Duplicate content for seamless loop
  if (scrollingContent.children.length > 0) {
    const duplicate = scrollingContent.cloneNode(true);
    duplicate.className = 'carousel-content carousel-content-duplicate';
    scrollingContent.appendChild(...duplicate.children);
  }

  carouselContainer.appendChild(scrollingContent);

  // Add loading mode as data attribute
  if (loadingMode) {
    carouselContainer.dataset.loadingMode = loadingMode;
  }

  // Set loading attribute on images based on mode
  if (loadingMode === 'eager') {
    carouselContainer.querySelectorAll('img').forEach((img) => {
      img.setAttribute('loading', 'eager');
    });
  }

  // Hide original block and insert transformed content as sibling
  block.style.display = 'none';
  block.parentNode.insertBefore(carouselContainer, block.nextSibling);
}
