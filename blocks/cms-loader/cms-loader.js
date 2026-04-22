/**
 * Decorates the CMS Loader block
 * @param {Element} block The cms-loader block element
 */
export default function decorate(block) {
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    block.classList.add('cms-loader-author-mode');
    const authorIndicator = document.createElement('div');
    authorIndicator.textContent = '⏳ CMS Loader (Author Mode - Edit below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);
    return;
  }

  const rows = [...block.children];

  rows.forEach((row, index) => {
    if (index === 0) {
      row.classList.add('cms-loader-image-wrapper');
    }

    if (index === 1) {
      row.classList.add('cms-loader-text-wrapper');
    }
  });
}
