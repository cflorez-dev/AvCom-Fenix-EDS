import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { ContactPromoBlock } from '../../design-system/organisms/contact-promo-block/contact-promo-block.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';
import { sanitizeHTMLAsync } from '../../scripts/utils/sanitize.js';
import { moveInstrumentation } from '../../scripts/utils/instrumentation.js';

const html = htm.bind(h);

// Parent fields order (must match models/_component-models.json "contact-promo-block").
// NOTE: rightImageAlt does NOT generate its own row — AEM bakes it into the <img alt>
// of the rightImage row. So the actual row layout is 14, not 15:
// 0: leftTitle (richtext)
// 1: rightImage (reference; alt is read from <img alt>)
// 2: rightTitle (richtext)
// 3: rightDescription (richtext)
// 4: appStoreImage (reference)
// 5: appStoreAlt (text)
// 6: appStoreUrl (aem-content)
// 7: googlePlayImage (reference)
// 8: googlePlayAlt (text)
// 9: googlePlayUrl (aem-content)
// 10: target-countries (multiselect)
// 11: target-languages (multiselect)
// 12: appStoreRel (text) — NEW, at end for backward compat
// 13: googlePlayRel (text) — NEW, at end for backward compat
const PARENT_FIELD_COUNT = 14;

function getImgSrc(cell) {
  const picture = cell?.querySelector('picture img');
  if (picture) return picture.src;
  const img = cell?.querySelector('img');
  return img?.src || '';
}

function getImgAlt(cell) {
  const img = cell?.querySelector('img');
  return img?.getAttribute('alt') || '';
}

function getAnchorHref(cell) {
  const a = cell?.querySelector('a');
  return a?.getAttribute('href') || cell?.textContent?.trim() || '';
}

function extractContactPromoBlockProps(block) {
  const rows = Array.from(block.children);
  const props = {
    leftTitle: '',
    rightImage: '',
    rightImageAlt: '',
    rightTitle: '',
    rightDescription: '',
    appStoreImage: '',
    appStoreAlt: '',
    appStoreUrl: '',
    appStoreRel: '',
    googlePlayImage: '',
    googlePlayAlt: '',
    googlePlayUrl: '',
    googlePlayRel: '',
    targetCountries: '',
    targetLanguages: '',
    items: [],
    socials: [],
    // Original DOM refs preserved so we can move data-aue-* instrumentation
    // from hidden authoring nodes to the rendered Preact nodes.
    refs: {
      parentCells: [],
      parentRows: [],
      itemRows: [],
      socialRows: [],
    },
  };

  // Parent fields = leading single-cell rows (one row per field, positional).
  const parentCells = [];
  const parentRows = [];
  let childStartIndex = 0;
  for (let i = 0; i < rows.length && i < PARENT_FIELD_COUNT; i += 1) {
    const cells = Array.from(rows[i].children);
    if (cells.length === 1) {
      parentCells.push(cells[0]);
      parentRows.push(rows[i]);
      childStartIndex = i + 1;
    } else {
      break;
    }
  }
  props.refs.parentCells = parentCells;
  props.refs.parentRows = parentRows;

  props.leftTitle = parentCells[0]?.innerHTML || '';
  props.rightImage = getImgSrc(parentCells[1]);
  props.rightImageAlt = getImgAlt(parentCells[1]);
  props.rightTitle = parentCells[2]?.innerHTML || '';
  props.rightDescription = parentCells[3]?.innerHTML || '';
  props.appStoreImage = getImgSrc(parentCells[4]);
  props.appStoreAlt = parentCells[5]?.textContent?.trim() || '';
  props.appStoreUrl = getAnchorHref(parentCells[6]);
  props.googlePlayImage = getImgSrc(parentCells[7]);
  props.googlePlayAlt = parentCells[8]?.textContent?.trim() || '';
  props.googlePlayUrl = getAnchorHref(parentCells[9]);
  props.targetCountries = parentCells[10]?.textContent?.trim() || '';
  props.targetLanguages = parentCells[11]?.textContent?.trim() || '';
  // New fields at end (positions 12-13) — may not exist in old content
  props.appStoreRel = parentCells[12]?.textContent?.trim() || '';
  props.googlePlayRel = parentCells[13]?.textContent?.trim() || '';

  // Child rows after parent: distinguish by cell count.
  // Item model order: label | url | targeting-c | targeting-l | icon
  //   Old items (no icon): 2 cells or 4 cells (with targeting)
  //   New items (with icon): 3 cells or 5 cells (with targeting)
  // Social model order: image | url | ariaLabel | targeting-c | targeting-l | rel
  //   Old socials (no rel): 3 cells or 5 cells (with targeting)
  //   New socials (with rel): 4 cells or 6 cells (with targeting)
  //
  // Disambiguation for 3/5-cell rows (new items vs old socials):
  //   - Items: cell[0] is text (label). No <img> in cell[0].
  //   - Socials: cell[0] has <img> (icon image reference).
  for (let i = childStartIndex; i < rows.length; i += 1) {
    const cells = Array.from(rows[i].children);
    const cellCount = cells.length;
    const firstCellHasImg = !!getImgSrc(cells[0]);

    if (cellCount === 6) {
      // New social: image | url | ariaLabel | targeting-c | targeting-l | rel
      const image = getImgSrc(cells[0]);
      const imageAlt = getImgAlt(cells[0]);
      const url = getAnchorHref(cells[1]) || cells[1]?.textContent?.trim() || '';
      const ariaLabel = cells[2]?.textContent?.trim() || '';
      const socialTargetCountries = cells[3]?.textContent?.trim() || '';
      const socialTargetLanguages = cells[4]?.textContent?.trim() || '';
      const rel = cells[5]?.textContent?.trim() || '';
      if (image && shouldShowByTargeting(socialTargetCountries, socialTargetLanguages)) {
        props.socials.push({
          image, imageAlt, url, ariaLabel, rel,
        });
        props.refs.socialRows.push(rows[i]);
      }
    } else if (cellCount === 5 && firstCellHasImg) {
      // Old social with targeting: image | url | ariaLabel | targeting-c | targeting-l
      const image = getImgSrc(cells[0]);
      const imageAlt = getImgAlt(cells[0]);
      const url = getAnchorHref(cells[1]) || cells[1]?.textContent?.trim() || '';
      const ariaLabel = cells[2]?.textContent?.trim() || '';
      const socialTargetCountries = cells[3]?.textContent?.trim() || '';
      const socialTargetLanguages = cells[4]?.textContent?.trim() || '';
      if (image && shouldShowByTargeting(socialTargetCountries, socialTargetLanguages)) {
        props.socials.push({
          image, imageAlt, url, ariaLabel, rel: '',
        });
        props.refs.socialRows.push(rows[i]);
      }
    } else if (cellCount === 5 && !firstCellHasImg) {
      // New item with targeting+icon: label | url | targeting-c | targeting-l | icon
      const label = cells[0]?.textContent?.trim() || '';
      const url = getAnchorHref(cells[1]);
      const itemTargetCountries = cells[2]?.textContent?.trim() || '';
      const itemTargetLanguages = cells[3]?.textContent?.trim() || '';
      const icon = getImgSrc(cells[4]);
      const iconAlt = getImgAlt(cells[4]);
      if (label && shouldShowByTargeting(itemTargetCountries, itemTargetLanguages)) {
        props.items.push({
          icon, iconAlt, label, url,
        });
        props.refs.itemRows.push(rows[i]);
      }
    } else if (cellCount === 4 && firstCellHasImg) {
      // New social without targeting: image | url | ariaLabel | rel
      const image = getImgSrc(cells[0]);
      const imageAlt = getImgAlt(cells[0]);
      const url = getAnchorHref(cells[1]) || cells[1]?.textContent?.trim() || '';
      const ariaLabel = cells[2]?.textContent?.trim() || '';
      const rel = cells[3]?.textContent?.trim() || '';
      if (image) {
        props.socials.push({
          image, imageAlt, url, ariaLabel, rel,
        });
        props.refs.socialRows.push(rows[i]);
      }
    } else if (cellCount === 4 && !firstCellHasImg) {
      // Old item with targeting: label | url | targeting-c | targeting-l
      const label = cells[0]?.textContent?.trim() || '';
      const url = getAnchorHref(cells[1]);
      const itemTargetCountries = cells[2]?.textContent?.trim() || '';
      const itemTargetLanguages = cells[3]?.textContent?.trim() || '';
      if (label && shouldShowByTargeting(itemTargetCountries, itemTargetLanguages)) {
        props.items.push({
          icon: '', iconAlt: '', label, url,
        });
        props.refs.itemRows.push(rows[i]);
      }
    } else if (cellCount === 3 && firstCellHasImg) {
      // Old social without targeting: image | url | ariaLabel
      const image = getImgSrc(cells[0]);
      const imageAlt = getImgAlt(cells[0]);
      const url = getAnchorHref(cells[1]) || cells[1]?.textContent?.trim() || '';
      const ariaLabel = cells[2]?.textContent?.trim() || '';
      if (image) {
        props.socials.push({
          image, imageAlt, url, ariaLabel, rel: '',
        });
        props.refs.socialRows.push(rows[i]);
      }
    } else if (cellCount === 3 && !firstCellHasImg) {
      // New item without targeting: label | url | icon
      const label = cells[0]?.textContent?.trim() || '';
      const url = getAnchorHref(cells[1]);
      const icon = getImgSrc(cells[2]);
      const iconAlt = getImgAlt(cells[2]);
      if (label) {
        props.items.push({
          icon, iconAlt, label, url,
        });
        props.refs.itemRows.push(rows[i]);
      }
    } else if (cellCount === 2) {
      // Old item without targeting: label | url
      const label = cells[0]?.textContent?.trim() || '';
      const url = getAnchorHref(cells[1]);
      if (label) {
        props.items.push({
          icon: '', iconAlt: '', label, url,
        });
        props.refs.itemRows.push(rows[i]);
      }
    }
  }

  return props;
}

/**
 * Decorates the Contact Promo Block block.
 * @param {Element} block
 */
export default async function decorate(block) {
  const props = extractContactPromoBlockProps(block);

  // Market targeting (parent-level): hide entire block + section if not in market.
  if (!shouldShowByTargeting(props.targetCountries, props.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // Sanitize richtext fields before injecting into the DOM via dangerouslySetInnerHTML.
  const [safeTitle, safeDescription] = await Promise.all([
    sanitizeHTMLAsync(props.rightTitle),
    sanitizeHTMLAsync(props.rightDescription),
  ]);

  // Hide original DOM children to preserve data-aue-* references for Universal Editor.
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  const container = document.createElement('div');
  container.className = 'contact-promo-block-content';
  render(
    html`
      <${ContactPromoBlock}
        leftTitle=${props.leftTitle}
        rightTitle=${safeTitle}
        rightDescription=${safeDescription}
        rightImage=${props.rightImage}
        rightImageAlt=${props.rightImageAlt}
        appStoreImage=${props.appStoreImage}
        appStoreAlt=${props.appStoreAlt}
        appStoreUrl=${props.appStoreUrl}
        appStoreRel=${props.appStoreRel}
        googlePlayImage=${props.googlePlayImage}
        googlePlayAlt=${props.googlePlayAlt}
        googlePlayUrl=${props.googlePlayUrl}
        googlePlayRel=${props.googlePlayRel}
        items=${props.items}
        socials=${props.socials}
      />
    `,
    container,
  );
  block.appendChild(container);

  // Universal Editor: move data-aue-* instrumentation from the hidden author
  // cells/rows to the visible rendered nodes so authors can click directly on
  // each field in the canvas to open its property in the side panel.
  const {
    parentCells, parentRows, itemRows, socialRows,
  } = props.refs;

  // Parent-field cells -> rendered nodes by index.
  // Index map matches PARENT_FIELD_COUNT order in extractContactPromoBlockProps.
  const contactTitle = container.querySelector('#cpb-contact-title');
  const rightImageEl = container.querySelector('.cpb-app-image');
  const rightTitleEl = container.querySelector('#cpb-app-title');
  const rightDescEl = container.querySelector('.cpb-app-desc');
  const badgeList = container.querySelectorAll('.cpb-badge');
  const appStoreBadge = badgeList[0] || null;
  const googlePlayBadge = badgeList[1] || null;
  const appStoreImg = appStoreBadge?.querySelector('img') || null;
  const googlePlayImg = googlePlayBadge?.querySelector('img') || null;

  const parentTargets = [
    contactTitle, // 0 leftTitle
    rightImageEl, // 1 rightImage
    rightTitleEl, // 2 rightTitle
    rightDescEl, // 3 rightDescription
    appStoreImg, // 4 appStoreImage
    appStoreImg, // 5 appStoreAlt (no separate UI -> attach to image)
    appStoreBadge, // 6 appStoreUrl
    googlePlayImg, // 7 googlePlayImage
    googlePlayImg, // 8 googlePlayAlt
    googlePlayBadge, // 9 googlePlayUrl
    null, // 10 target-countries (no rendered target)
    null, // 11 target-languages (no rendered target)
    appStoreBadge, // 12 appStoreRel (attach to badge link)
    googlePlayBadge, // 13 googlePlayRel (attach to badge link)
  ];
  parentTargets.forEach((target, i) => {
    if (target && parentCells[i]) {
      moveInstrumentation(parentCells[i], target);
      // Also move attributes from the row wrapper (data-aue-resource lives there
      // for some fields). Safe no-op if not present.
      if (parentRows[i]) moveInstrumentation(parentRows[i], target);
    }
  });

  // Richtext fields: their data-richtext-* / data-aue-* attributes live INSIDE
  // the cell (on <p>, <ul>, etc.), not on the cell wrapper. moveInstrumentation
  // alone can't see them. We promote the inner richtext metadata onto the
  // rendered wrapper itself (so it IS the editable richtext component) AND
  // move the original child nodes so AEM's `decorateRichtext` can group them
  // if it runs later.
  const moveRichtextContent = (cell, target) => {
    if (!cell || !target) return;
    // 1) Promote data-richtext-* from any inner element to data-aue-* on the
    //    rendered wrapper. Covers the case where AEM groups multiple siblings
    //    (e.g. <p> + <ul>) — those grouped wrappers have the prop set on a
    //    <div>, which the editor's :not(div) selector skips otherwise.
    const innerWithProp = cell.querySelector('[data-richtext-prop], [data-aue-prop]');
    if (innerWithProp) {
      const prop = innerWithProp.getAttribute('data-richtext-prop')
        || innerWithProp.getAttribute('data-aue-prop');
      const resource = innerWithProp.getAttribute('data-richtext-resource')
        || innerWithProp.getAttribute('data-aue-resource');
      if (prop) target.setAttribute('data-aue-prop', prop);
      if (resource) target.setAttribute('data-aue-resource', resource);
      target.setAttribute('data-aue-type', 'richtext');
      target.setAttribute('data-aue-behavior', 'component');
      const label = innerWithProp.getAttribute('data-aue-label');
      if (label) target.setAttribute('data-aue-label', label);
    }
    // 2) Move the original DOM nodes into the target so any subsequent
    //    decorateRichtext pass keeps working as expected.
    if (cell.childNodes.length) target.replaceChildren(...cell.childNodes);
  };
  moveRichtextContent(parentCells[0], contactTitle); // leftTitle
  moveRichtextContent(parentCells[2], rightTitleEl); // rightTitle
  moveRichtextContent(parentCells[3], rightDescEl); // rightDescription

  // Child rows -> rendered <li> nodes.
  const renderedItems = container.querySelectorAll('section[aria-labelledby="cpb-contact-title"] ul[role="list"]:not([aria-label]) > li');
  itemRows.forEach((row, i) => {
    if (renderedItems[i]) moveInstrumentation(row, renderedItems[i]);
  });

  const renderedSocials = container.querySelectorAll('section[aria-labelledby="cpb-contact-title"] ul[aria-label="Redes sociales"] > li');
  socialRows.forEach((row, i) => {
    if (renderedSocials[i]) moveInstrumentation(row, renderedSocials[i]);
  });
}
