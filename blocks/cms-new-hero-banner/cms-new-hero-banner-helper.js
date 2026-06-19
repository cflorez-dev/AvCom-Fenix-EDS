/**
 * Helper module for cms-new-hero-banner block.
 * Implements positional parsing for container block pattern (parent properties + child items).
 * Aligns with the canonical AEM EDS pattern used by cms-informative-cards-rail.
 *
 * Container block DOM shape (per aem.live docs):
 *   - Each parent property → row with EXACTLY 1 cell (the value)
 *   - Each child item (cms-new-hero-banner-action-button) → row with 2+ cells (text + url)
 */

const PARENT_FIELDS = [
  'title',
  'titleLevel',
  'description',
  'imageDesktop',
  'imageTablet',
  'imageMobile',
  'imageAlt',
  'loading',
  'contentAlignment',
  'textColor',
  'showTextShadow',
  'textShadowOffsetX',
  'textShadowOffsetY',
  'textShadowBlur',
  'textShadowColor',
  'actionMode',
  'ctaText',
  'ctaUrl',
  'defaultTripType',
  'target-countries',
  'target-languages',
];

const RICH_TEXT_FIELDS = new Set(['title', 'description']);
const IMAGE_FIELDS = new Set(['imageDesktop', 'imageTablet', 'imageMobile']);
const URL_FIELDS = new Set(['ctaUrl']);
const BOOLEAN_FIELDS = new Set(['showTextShadow']);

/**
 * Extracts a typed value from a parent cell according to the field type.
 */
function extractCellValue(cell, fieldName) {
  if (!cell) return '';

  if (IMAGE_FIELDS.has(fieldName)) {
    const img = cell.querySelector('img');
    return img ? img.src : '';
  }

  if (RICH_TEXT_FIELDS.has(fieldName)) {
    return cell.innerHTML?.trim() || '';
  }

  if (URL_FIELDS.has(fieldName)) {
    const a = cell.querySelector('a');
    if (a) return a.getAttribute('href') || '';
    return cell.textContent?.trim() || '';
  }

  if (BOOLEAN_FIELDS.has(fieldName)) {
    return cell.textContent?.trim().toLowerCase() === 'true';
  }

  // Default plain text — handle <p> wrapping from wrapTextNodes
  const p = cell.querySelector('p');
  if (p) return p.textContent.trim();
  return cell.textContent.trim();
}

/**
 * Maps a 2-cell row to an action button object for BookingBox.
 * cells[0] = button text, cells[1] = anchor or text URL.
 */
function mapActionButtonRow(cells) {
  const text = cells[0]?.textContent?.trim() || '';
  const anchorEl = cells[1]?.querySelector('a');
  const url = anchorEl?.getAttribute('href') || cells[1]?.textContent?.trim() || '';
  if (!text || !url) return null;
  return {
    icon: '/icons/action/link.svg',
    text,
    label: text,
    href: url,
    variant: 'iconRight',
    target: anchorEl?.getAttribute('target') || '_blank',
  };
}

/**
 * Extracts all hero props from the block element.
 * Rows with 1 cell → parent properties (positional, in PARENT_FIELDS order).
 * Rows with 2+ cells → action button child items.
 */
export default function extractHeroProps(block) {
  const props = {};
  const actionButtons = [];
  let parentIdx = 0;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const button = mapActionButtonRow(cells);
      if (button) actionButtons.push(button);
    } else if (cells.length === 1) {
      if (parentIdx < PARENT_FIELDS.length) {
        const fieldName = PARENT_FIELDS[parentIdx];
        props[fieldName] = extractCellValue(cells[0], fieldName);
      }
      parentIdx += 1;
    }
  });

  return {
    title: props.title || '',
    titleLevel: props.titleLevel || 'h1',
    description: props.description || '',
    imageDesktop: props.imageDesktop || '',
    imageTablet: props.imageTablet || '',
    imageMobile: props.imageMobile || '',
    imageAlt: props.imageAlt || '',
    loading: props.loading || 'eager',
    contentAlignment: props.contentAlignment || 'left',
    textColor: props.textColor || 'light',
    showTextShadow: props.showTextShadow === true,
    textShadowOffsetX: props.textShadowOffsetX || '',
    textShadowOffsetY: props.textShadowOffsetY || '',
    textShadowBlur: props.textShadowBlur || '',
    textShadowColor: props.textShadowColor || '',
    actionMode: props.actionMode || 'none',
    ctaText: props.ctaText || '',
    ctaUrl: props.ctaUrl || '',
    defaultTripType: props.defaultTripType || 'round-trip',
    'target-countries': props['target-countries'] || '',
    'target-languages': props['target-languages'] || '',
    actionButtons,
  };
}
