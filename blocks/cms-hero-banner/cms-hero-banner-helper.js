import { isSafeUrl } from '../../scripts/utils/sanitize.js';

/**
 * Extracts props from a CMS Hero Banner block.
 * Each row is mapped to a specific property name.
 *
 * @param {Element} block - The CMS Hero Banner block element
 * @returns {Object} props - Mapped properties object
 */
export function extractCmsHeroBannerProps(block) {
  if (!block) return {};

  const rows = [...block.children];
  const props = {};

  // Property name mapping based on row order
  const propNames = [
    'title',
    'description',
    'imagedesktop',
    'imagemobile',
    'showpricetag',
    'pricelabel',
    'price',
    'route',
    'showbutton',
    'ctatext',
    'ctaurl',
    'showcountdown',
    'countdowntitle',
    'startdate',
    'enddate',
  ];

  rows.forEach((row, index) => {
    const cell = row.querySelector('div');
    const propName = propNames[index] || `prop${index + 1}`;

    // Empty cell — check both text and child elements (pictures have no textContent)
    if (!cell || (!cell.textContent?.trim() && cell.childElementCount === 0)) {
      props[propName] = null;
      return;
    }

    // Case: <p> text — use textContent (safe) instead of innerHTML
    const p = cell.querySelector('p');
    if (p) {
      props[propName] = p.textContent?.trim() || null;
      return;
    }

    // Case: <picture> — validate image URL
    const picture = cell.querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      props[propName] = img?.src && isSafeUrl(img.src) ? img.src : null;
      return;
    }

    // Case: link — validate href
    const link = cell.querySelector('a');
    if (link) {
      const href = link.getAttribute('href') || '#';
      props[propName] = {
        type: 'link',
        text: link.textContent?.trim() || '',
        href: isSafeUrl(href) ? href : '#',
      };
      return;
    }

    // Default fallback: cell text
    const fallback = cell.textContent?.trim();
    props[propName] = fallback || null;
  });

  return props;
}

/**
 * Validates CMS Hero Banner props
 * @param {Object} props - Props object to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateCmsHeroBannerProps(props) {
  const errors = [];

  if (!props || typeof props !== 'object') {
    return { isValid: false, errors: ['Props object is invalid'] };
  }

  // Validate countdown configuration
  if ((props.showcountdown === 'true' || props.showcountdown === true) && !props.enddate) {
    errors.push('enddate is required when showcountdown is enabled');
  }

  // Validate price configuration
  if ((props.showpricetag === 'true' || props.showpricetag === true)) {
    if (!props.price) {
      errors.push('price is required when showpricetag is enabled');
    }
  }

  // Validate button configuration
  if ((props.showbutton === 'true' || props.showbutton === true)) {
    if (!props.ctatext) {
      errors.push('ctatext is required when showbutton is enabled');
    }
  }

  // Validate images
  if (!props.imagedesktop) {
    errors.push('imagedesktop is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
