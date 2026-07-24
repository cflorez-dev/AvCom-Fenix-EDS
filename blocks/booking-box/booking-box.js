import htm from 'htm';
import { h, render } from '@dropins/tools/preact.js';
import { BookingBox } from '../../design-system/organisms/booking-box/booking-box.js';
import { preloadIcons } from '../../design-system/atoms/icon/icon.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { resolveLocale } from '../../scripts/utils/locale.js';
import { fetchCabinOptions, isBookingBoxCabinEnabled } from '../../scripts/services/cabin/cabin-options.service.js';

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

// Parent (positional) config fields authored as single-cell rows, in model order.
const CABIN_PARENT_FIELDS = ['cabinTabsEnabled'];

/**
 * Decorates the Booking Box Block
 * @param {Element} block The booking-box block element
 */
export default async function decorate(block) {
  // Warm the icon cache so the first step modal paints its field + header icons
  // synchronously (bugs #2 / #11). Deferred to browser-idle (with a timeout
  // fallback, and a setTimeout for Safari which lacks requestIdleCallback) so the
  // 7 SVG fetches don't compete with the LCP/critical path on mobile — the user
  // takes far longer than this to open a step, so the cache is still warm in time.
  // Best-effort: failures fall back to the per-icon fetch on mount.
  const warmBookingBoxIcons = () => preloadIcons(BOOKING_BOX_ICONS);
  if (typeof window !== 'undefined') {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(warmBookingBoxIcons, { timeout: 2000 });
    } else {
      setTimeout(warmBookingBoxIcons, 1200);
    }
  }

  const rows = [...block.children];
  const actionButtons = [];
  const cabinConfig = {};
  let parentIdx = 0;

  rows.forEach((row) => {
    const cells = [...row.children];

    if (cells.length >= 2) {
      const text = cells[0]?.textContent.trim();
      const link = cells[1]?.querySelector('a');
      const href = link ? link.href : (cells[1]?.textContent.trim() || '');

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
    } else if (cells.length === 1 && parentIdx < CABIN_PARENT_FIELDS.length) {
      const field = CABIN_PARENT_FIELDS[parentIdx];
      const raw = cells[0]?.textContent.trim() || '';
      cabinConfig[field] = field === 'cabinTabsEnabled' ? raw.toLowerCase() === 'true' : raw;
      parentIdx += 1;
    }
  });

  const locale = await resolveLocale();
  const language = locale.language || 'es';
  const [config, envConfig] = await Promise.all([
    fetchAEMData(language),
    fetchAEMData('environment'),
  ]);

  const i18Data = Object.fromEntries(
    config.data.map(({ Key, Text }) => [Key, Text]),
  );

  // Global kill-switch AND per-instance authoring. Global OFF (or key absent) => no
  // cabin tabs and no parametroCabinas call, regardless of authoring.
  const globalCabinEnabled = isBookingBoxCabinEnabled(envConfig?.data);
  const cabinTabsEnabled = globalCabinEnabled && cabinConfig.cabinTabsEnabled === true;
  const cabinOptions = cabinTabsEnabled ? await fetchCabinOptions(language) : [];

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
        cabinTabsEnabled=${cabinTabsEnabled}
        cabinOptions=${cabinOptions}
      />
    `,
    container,
  );
  block.appendChild(container);
}
