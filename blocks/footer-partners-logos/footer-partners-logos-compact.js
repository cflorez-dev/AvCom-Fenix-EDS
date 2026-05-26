import { shouldShowByTargeting } from '../../scripts/utils/target-filter.js';
import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { resolveLocale } from '../../scripts/utils/locale.js';
import { isSafeUrl } from '../../scripts/utils/sanitize.js';
import { setFooterCompactMode } from '../../scripts/utils/event-constants.js';
// eslint-disable-next-line import/no-cycle
import {
  mapFooterPartnersLogosData,
  renderFooterPartnersLogos,
} from './footer-partners-logos.js';

const FOOTER_BOTTOM_WRAPPER_SELECTOR = 'footer .footer-bottom-wrapper';

/**
 * Number of "parent" rows the new footer-partners-logos model adds before the
 * logo items: compact, starAllianceImage, starAllianceUrl, starAllianceAlt,
 * copyrightText, target-countries, target-languages.
 */
export const COMPACT_PARENT_ROW_COUNT = 7;

/** Reads the text content of a row's first column (positional model). */
function getCellText(block, index) {
  const cell = block?.children?.[index];
  if (!cell) return '';
  return cell.querySelector('p')?.textContent?.trim()
    || cell.children[0]?.textContent?.trim()
    || cell.textContent?.trim()
    || '';
}

/** Reads the first <img> src from a row's first column. */
function getCellImage(block, index) {
  const cell = block?.children?.[index];
  if (!cell) return '';
  const img = cell.querySelector('img');
  return img?.src || img?.getAttribute('src') || '';
}

/** Reads the first <a> href from a row's first column. */
function getCellLink(block, index) {
  const cell = block?.children?.[index];
  if (!cell) return '';
  const a = cell.querySelector('a');
  return a?.href || a?.getAttribute('href') || '';
}

/**
 * Escapes HTML to prevent XSS when interpolating CMS-authored text into innerHTML.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Detects if the block is configured in compact mode by reading the first row.
 * AEM EDS serves this block in positional format (1 column per row), so we
 * read row 0 directly instead of using readBlockConfig (which expects 2-col
 * key|value rows).
 *
 * @param {Element} block
 * @returns {boolean}
 */
export function isCompactMode(block) {
  if (!block) return false;
  return getCellText(block, 0).toLowerCase() === 'true';
}

/**
 * Extracts compact-mode config from the block's parent rows (positional model).
 *
 * Row layout (matches _component-models.json):
 *   0 = compact (boolean as text)
 *   1 = starAllianceImage (picture)
 *   2 = starAllianceUrl (anchor)
 *   3 = starAllianceAlt (text)
 *   4 = copyrightText (text)
 *   5 = target-countries (text)
 *   6 = target-languages (text)
 *
 * @param {Element} block
 * @returns {{
 *   starAllianceImage: string,
 *   starAllianceUrl: string,
 *   starAllianceAlt: string,
 *   copyrightText: string,
 *   targetCountries: string,
 *   targetLanguages: string,
 * }}
 */
export function extractCompactConfig(block) {
  return {
    starAllianceImage: getCellImage(block, 1),
    starAllianceUrl: getCellLink(block, 2),
    starAllianceAlt: getCellText(block, 3) || 'A Star Alliance Member',
    copyrightText: getCellText(block, 4),
    targetCountries: getCellText(block, 5),
    targetLanguages: getCellText(block, 6),
  };
}

/**
 * Resolves the copyright string (i18n + year replacement).
 *
 * @param {string} language
 * @param {string} override - optional copyrightText from author
 * @returns {Promise<string>}
 */
async function resolveCopyright(language, override) {
  const configData = await fetchAEMData(language);
  const i18Data = Object.fromEntries(
    configData.data.map(({ Key, Text }) => [Key, Text]),
  );
  const tpl = override || i18Data['footer.bottom.copyrights'] || 'Copyright © Avianca [XXXX]';
  const year = new Date().getFullYear().toString();
  return tpl.replace(/\{year\}/g, year).replace('[XXXX]', year);
}

/**
 * Renders the compact bar (2 DOMs: mobile + desktop).
 * @param {Object} cfg
 * @param {Array} logos - already sliced to 5
 * @param {string} copyrightI18n
 * @returns {HTMLElement}
 */
function renderCompactBar(cfg, logos, copyrightI18n) {
  const container = document.createElement('div');
  container.className = 'footer-compact-bar';

  const safeAlt = escapeHtml(cfg.starAllianceAlt);
  const safeUrl = isSafeUrl(cfg.starAllianceUrl) ? cfg.starAllianceUrl : '';
  const safeCopyright = escapeHtml(copyrightI18n);
  const safeImg = escapeHtml(cfg.starAllianceImage);

  let starHTML = '';
  if (cfg.starAllianceImage) {
    if (safeUrl) {
      starHTML = `<a href="${escapeHtml(safeUrl)}" class="footer-compact-star-alliance-link" aria-label="${safeAlt}"><img src="${safeImg}" alt="${safeAlt}" class="footer-compact-star-alliance-img" /></a>`;
    } else {
      starHTML = `<img src="${safeImg}" alt="${safeAlt}" class="footer-compact-star-alliance-img" />`;
    }
  }

  container.innerHTML = `
    <div class="footer-compact-bar-desktop">
      <div class="footer-compact-left">
        <p class="footer-compact-copyright">${safeCopyright}</p>
        ${cfg.starAllianceImage ? '<span class="footer-compact-divider"></span>' : ''}
        ${starHTML}
      </div>
      <div class="footer-compact-right" data-logos-slot="desktop"></div>
    </div>
    <div class="footer-compact-bar-mobile">
      <div class="footer-compact-mobile-logos" data-logos-slot="mobile"></div>
      ${cfg.starAllianceImage ? `<div class="footer-compact-mobile-star">${starHTML}</div>` : ''}
      <p class="footer-compact-copyright">${safeCopyright}</p>
    </div>
  `;

  // Inject logos as DOM nodes (renderFooterPartnersLogos returns DocumentFragment)
  const desktopSlot = container.querySelector('[data-logos-slot="desktop"]');
  const mobileSlot = container.querySelector('[data-logos-slot="mobile"]');
  if (desktopSlot) desktopSlot.appendChild(renderFooterPartnersLogos(logos));
  if (mobileSlot) mobileSlot.appendChild(renderFooterPartnersLogos(logos));

  return container;
}

/**
 * Decorates the block in compact mode.
 * Side effects:
 *   - Calls setFooterCompactMode(true) so footer-bottom + footer-columns react.
 *   - Renders compact bar inside .footer-bottom-wrapper (claims any prior render).
 *   - Hides the original block element.
 * Targeting failure → reverts (setFooterCompactMode(false)) so footer-bottom shows normal.
 *
 * @param {Element} block
 * @returns {Promise<void>}
 */
export async function decorateCompact(block) {
  const cfg = extractCompactConfig(block);

  // Targeting (block-level)
  if (!shouldShowByTargeting(cfg.targetCountries, cfg.targetLanguages)) {
    setFooterCompactMode(false); // explicitly tell footer-bottom: legacy mode after all
    block.style.display = 'none';
    return;
  }

  // Mark compact ASAP so footer-bottom/footer-columns react if they decorate later
  setFooterCompactMode(true);

  // Resolve i18n copyright
  const locale = await resolveLocale();
  const language = locale.language || 'es';
  let copyrightI18n;
  try {
    copyrightI18n = await resolveCopyright(language, cfg.copyrightText);
  } catch (e) {
    const year = new Date().getFullYear().toString();
    copyrightI18n = cfg.copyrightText || `Copyright © Avianca ${year}`;
  }

  // Map logos. The new model adds 5 parent fields + 2 targeting rows = 7 rows
  // to skip BEFORE the logo items.
  const allItems = [...block.children].slice(COMPACT_PARENT_ROW_COUNT);
  const fakeBlock = { children: allItems };
  // mapFooterPartnersLogosData expects a block with .children — duck-type it.
  const logos = mapFooterPartnersLogosData(fakeBlock).slice(0, 5);

  // Render compact bar
  const compactBar = renderCompactBar(cfg, logos, copyrightI18n);

  // Inject into .footer-bottom-wrapper with polling (claim mode: wipe prior content)
  const inject = () => {
    const wrapper = document.querySelector(FOOTER_BOTTOM_WRAPPER_SELECTOR);
    if (!wrapper) return false;
    wrapper.innerHTML = '';
    wrapper.classList.remove('hidden');
    wrapper.appendChild(compactBar);
    return true;
  };
  if (!inject()) {
    const retry = setInterval(() => { if (inject()) clearInterval(retry); }, 100);
    setTimeout(() => clearInterval(retry), 5000);
  }

  block.style.display = 'none';
}
