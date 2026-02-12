import htm from 'htm';
import { h, render } from '@dropins/tools/preact.js';
import { BookingBox } from '../../design-system/organisms/booking-box/booking-box.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { resolveLocale } from '../../scripts/utils/locale.js';

const html = htm.bind(h);

/**
 * Decorates the Booking Box Block
 * @param {Element} block The booking-box block element
 */
export default async function decorate(block) {
  const container = document.createElement('div');

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

  block.style.display = 'none';

  block.parentNode.insertBefore(container, block.nextSibling);
}
