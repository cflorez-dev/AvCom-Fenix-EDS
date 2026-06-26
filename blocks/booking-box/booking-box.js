import htm from 'htm';
import { h, render } from '@dropins/tools/preact.js';
import { BookingBox } from '../../design-system/organisms/booking-box/booking-box.js';
import { preloadIcons } from '../../design-system/atoms/icon/icon.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { resolveLocale } from '../../scripts/utils/locale.js';

const html = htm.bind(h);

// Icons rendered across the booking-box step flow (field + modal-header icons).
// Warming the module cache here means the first time the user opens a step
// modal the icons paint synchronously instead of flashing an empty placeholder
// while each SVG is fetched (bugs #2 / #11).
const BOOKING_BOX_ICONS = [
  'action/plane',
  'action/plane-landing',
  'action/calendar',
  'action/addpeople',
  'navigation/expand-more',
  'navigation/arrow-back',
  'navigation/close',
];

/**
 * Decorates the Booking Box Block
 * @param {Element} block The booking-box block element
 */
export default async function decorate(block) {
  // Warm the icon cache as early as possible so the first step modal paints its
  // field + header icons synchronously (bugs #2 / #11). Fires concurrently with
  // the AEM data fetches below; best-effort, failures fall back to per-icon fetch.
  preloadIcons(BOOKING_BOX_ICONS);

  const rows = [...block.children];
  const actionButtons = [];

  rows.forEach((row) => {
    const cells = [...row.children];

    const textCell = cells[0];
    const text = textCell?.textContent.trim();

    const hrefCell = cells[1];
    let href = '';

    if (hrefCell) {
      const link = hrefCell.querySelector('a');
      if (link) {
        href = link.href;
      } else {
        href = hrefCell.textContent.trim();
      }
    }

    if (text) {
      actionButtons.push({
        icon: '/icons/action/link.svg',
        text,
        label: text,
        href,
        variant: 'iconRight',
        target: '_blank',
      });
    }
  });

  const locale = await resolveLocale();
  const language = locale.language || 'es';
  const config = await fetchAEMData(language);

  const i18Data = Object.fromEntries(
    config.data.map(({ Key, Text }) => [Key, Text]),
  );

  // Hide original children to preserve data-aue-* for editor (Pattern B)
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  // Render INSIDE the block (compatible with editor-support.js re-decoration)
  const container = document.createElement('div');
  container.className = 'booking-box-content';
  render(
    html`
      <${BookingBox}
        actionButtons=${actionButtons}
        defaultTripType="round-trip"
        i18n=${i18Data}
      />
    `,
    container,
  );
  block.appendChild(container);
}
