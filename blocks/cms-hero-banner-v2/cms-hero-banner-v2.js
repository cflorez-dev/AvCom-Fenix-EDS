import { h, render } from '@dropins/tools/preact.js';
import { useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { readBlockConfig, loadCSS } from '../../scripts/aem.js';
import { PromotionalCountdownCard, AbsoluteCountdown } from '../../design-system/molecules/promotional-countdown-card/promotional-countdown-card.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';
import { getStoredLanguage } from '../../scripts/services/header/language-country-selector.js';
import { sanitizeHTMLAsync, isSafeUrl } from '../../scripts/utils/sanitize.js';

const html = htm.bind(h);

let i18Cache = null;

// Load component CSS
loadCSS('/design-system/molecules/promotional-countdown-card/promotional-countdown-card.css');

/**
 * Gets current time in Colombia timezone (America/Bogota)
 * @returns {Date} Current date/time in Colombia
 */
function getColombiaTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
}

/**
 * Gets i18n label from cache
 * @param {string} key - i18n key
 * @returns {string} Translated text or empty string
 */
function getI18nLabel(key) {
  if (!i18Cache) return '';
  const labelData = i18Cache.find((item) => item.Key === key);
  return labelData?.Text || '';
}

/* =========================================================================
 * LCP image handling (the only real difference vs. cms-hero-banner v1)
 *
 * v1 destroyed the authored <picture> and re-applied the image as a CSS
 * background whose URL was set from JS (`--hero-*`). Because the URL only
 * existed after the deferred block JS ran, the browser's preload scanner
 * never saw it -> ~4s "load delay" on LCP, and it forced format=jpg,
 * discarding the authored WebP.
 *
 * v2 keeps the authored WebP <picture> as a real, eager LCP <img> and
 * injects a matching <link rel=preload> as early as possible. Same content
 * model (imageDesktop / imageTablet / imageMobile rows) — authors change
 * nothing.
 * ========================================================================= */

/**
 * Read the best WebP source URL authored inside a block row's <picture>.
 * Falls back to the row's <img> src (or readBlockConfig value) when no WebP
 * source is present. Returns '' when the row has no image.
 * @param {Element|undefined} row
 * @returns {string}
 */
function webpUrlFromRow(row) {
  if (!row) return '';
  const picture = row.querySelector('picture');
  if (picture) {
    const webpSource = [...picture.querySelectorAll('source')]
      .find((s) => (s.getAttribute('type') || '').includes('webp'));
    const srcset = webpSource?.getAttribute('srcset');
    if (srcset) return srcset.split(',')[0].trim().split(/\s+/)[0];
  }
  const img = row.querySelector('img');
  return img?.getAttribute('src') || '';
}

/**
 * Locate the block row whose label cell contains `label` (case-insensitive).
 * @param {Element[]} rows
 * @param {string} label
 * @returns {Element|undefined}
 */
function findRow(rows, label) {
  return rows.find((r) => (r.children[0]?.textContent || '').trim().toLowerCase().includes(label));
}

/**
 * Inject (or update) a high-priority preload for the LCP hero image so the
 * request starts before the block's own CSS/JS finish loading. A single
 * reusable link keeps this idempotent; an unused preload is harmless.
 * @param {string} imageUrl
 */
function preloadHeroImage(imageUrl) {
  if (!imageUrl) return;
  let link = document.head.querySelector('link[data-hero-v2-preload="true"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('data-hero-v2-preload', 'true');
    link.rel = 'preload';
    link.as = 'image';
    link.fetchPriority = 'high';
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== imageUrl) link.setAttribute('href', imageUrl);
}

export default async function decorate(block) {
  const rows = Array.from(block.children);

  // --- Resolve responsive hero images from the AUTHORED DOM (before any await
  //     and before we clear the block) and preload the current breakpoint ASAP.
  const desktopImg = webpUrlFromRow(findRow(rows, 'desktop'));
  const tabletImg = webpUrlFromRow(findRow(rows, 'tablet'));
  const mobileImg = webpUrlFromRow(findRow(rows, 'mobile'));

  // Fallback chain mirrors v1 so single-image authoring still works.
  const heroDesktop = desktopImg || tabletImg || mobileImg;
  const heroTablet = tabletImg || desktopImg || mobileImg;
  const heroMobile = mobileImg || tabletImg || desktopImg;

  const pickForViewport = () => {
    if (window.matchMedia('(min-width: 1248px)').matches) return heroDesktop;
    if (window.matchMedia('(min-width: 768px)').matches) return heroTablet;
    return heroMobile;
  };

  // Earliest possible discovery hint (still same-document, so it beats the
  // deferred image-swap logic).
  preloadHeroImage(pickForViewport());

  const config = readBlockConfig(block);

  const {
    title = '',
    description = '',
    showcountdown = false,
    countdowntitle = '',
    showpricetag = false,
    pricelabel = '',
    price = '',
    route = '',
    showbutton = false,
    ctatext = 'Reservar',
    ctaurl = '#',
    startdate = null,
    enddate = null,
  } = config;

  const targetcountries = config['target-countries'] || '';
  const targetlanguages = config['target-languages'] || '';

  // Load i18n cache
  if (!i18Cache) {
    const language = getStoredLanguage() || 'es';
    const i18Data = await fetchAEMData(`${language}`);
    i18Cache = i18Data?.data || [];
  }

  // Get counter labels from i18n
  const daysLabel = getI18nLabel('cms-hero-banner.counter.labels.days') || 'Días';
  const hoursLabel = getI18nLabel('cms-hero-banner.counter.labels.hours') || 'Horas';
  const minutesLabel = getI18nLabel('cms-hero-banner.counter.labels.minutes') || 'Min';
  const secondsLabel = getI18nLabel('cms-hero-banner.counter.labels.seconds') || 'Seg';

  // Country/Language filtering
  if (!shouldShowByTargeting(targetcountries, targetlanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // Check if should show based on start date
  const now = getColombiaTime();

  if (startdate) {
    const startDate = new Date(startdate);
    if (startDate > now) {
      const section = block.closest('.section');
      if (section) {
        section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
      }
      block.classList.add('hidden');
      return;
    }
  }

  // If countdown is enabled, check if end date has passed
  if ((showcountdown === 'true' || showcountdown === true) && enddate) {
    const endDate = new Date(enddate);
    if (endDate <= now) {
      const section = block.closest('.section');
      if (section) {
        section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
      }
      block.classList.add('hidden');
      return;
    }
  }

  // Clear block and setup with Tailwind classes (same layout as v1; only the
  // token name changes so v1 and v2 can coexist on the same site).
  block.innerHTML = '';
  block.className = 'cms-hero-banner-v2 h-[457px] min-[1248px]:h-[324px] p-4 min-[1248px]:p-6 rounded-3xl box-border overflow-hidden relative w-full text-[var(--text-normal-lighter)] flex justify-center items-end md:h-[457px]';

  // --- LCP background layer: a REAL responsive <picture> with an eager,
  //     high-priority <img>. The browser discovers and fetches this without
  //     waiting for JS to compute a CSS-var URL, and serves WebP.
  if (heroMobile || heroTablet || heroDesktop) {
    const picture = document.createElement('picture');
    picture.className = 'cms-hero-banner-v2__bg';

    if (heroDesktop) {
      const s = document.createElement('source');
      s.media = '(min-width: 1248px)';
      s.srcset = heroDesktop;
      s.type = 'image/webp';
      picture.appendChild(s);
    }
    if (heroTablet) {
      const s = document.createElement('source');
      s.media = '(min-width: 768px)';
      s.srcset = heroTablet;
      s.type = 'image/webp';
      picture.appendChild(s);
    }

    const img = document.createElement('img');
    img.src = heroMobile || heroTablet || heroDesktop;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.loading = 'eager';
    img.fetchPriority = 'high';
    img.decoding = 'async';
    picture.appendChild(img);

    block.appendChild(picture);
  }

  // Create wrapper component that handles auto-hide on countdown expiration
  const HeroBannerWrapper = ({ children }) => {
    useEffect(() => {
      if ((showcountdown === 'true' || showcountdown === true) && enddate) {
        const checkExpiration = () => {
          const currentTime = getColombiaTime();
          const endDate = new Date(enddate);

          if (endDate <= currentTime) {
            const section = block.closest('.section');
            if (section) {
              section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');
            }
            block.classList.add('hidden');
          }
        };

        // Check immediately
        checkExpiration();

        // Check every second
        const timer = setInterval(checkExpiration, 1000);

        return () => clearInterval(timer);
      }

      return () => {};
    }, []);

    return children;
  };

  // Create container for the Preact component
  const cardContainer = document.createElement('div');
  cardContainer.className = 'w-full max-w-full min-[1248px]:h-full relative z-10';

  // Sanitize the author-controlled rich-text values that PromotionalCountdownCard
  // renders via dangerouslySetInnerHTML (title, subtitle), and validate the CTA URL
  // scheme to block javascript:/data: XSS. The remaining props (price/route/labels/
  // buttonText) render as Preact text children and are auto-escaped.
  const safeTitle = await sanitizeHTMLAsync(title || '');
  const safeDescription = await sanitizeHTMLAsync(description || '');
  const safeCtaUrl = isSafeUrl(ctaurl) ? ctaurl : '#';

  // Render PromotionalCountdownCard component wrapped with auto-hide logic
  render(
    html`
      <${HeroBannerWrapper}>
        <${PromotionalCountdownCard}
          title=${safeTitle}
          subtitle=${safeDescription}
          countdownLabel=${countdowntitle || 'La oferta termina en'}
          endDateTime=${enddate || ''}
          showCountdown=${showcountdown === 'true' || showcountdown === true}
          priceLabel=${pricelabel || ''}
          price=${price || ''}
          routeLabel=${route || ''}
          showPrice=${showpricetag === 'true' || showpricetag === true}
          buttonText=${ctatext || 'Reservar'}
          buttonUrl=${safeCtaUrl}
          showButton=${showbutton === 'true' || showbutton === true}
          daysLabel=${daysLabel}
          hoursLabel=${hoursLabel}
          minutesLabel=${minutesLabel}
          secondsLabel=${secondsLabel}
        />
      </${HeroBannerWrapper}>
    `,
    cardContainer,
  );

  block.appendChild(cardContainer);

  // Keep the preload in sync with breakpoint changes (debounced), mirroring
  // v1's resize-driven image swap. The <picture> itself already art-directs.
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => preloadHeroImage(pickForViewport()), 150);
  });

  // Render absolute countdown for desktop (1248px+)
  if (showcountdown === 'true' || showcountdown === true) {
    const countdownContainer = document.createElement('div');
    countdownContainer.className = 'absolute-countdown-wrapper';

    render(
      html`
        <${AbsoluteCountdown}
          countdownLabel=${countdowntitle || 'La oferta termina en'}
          endDateTime=${enddate || ''}
          daysLabel=${daysLabel}
          hoursLabel=${hoursLabel}
          minutesLabel=${minutesLabel}
          secondsLabel=${secondsLabel}
        />
      `,
      countdownContainer,
    );

    block.appendChild(countdownContainer);
  }
}
