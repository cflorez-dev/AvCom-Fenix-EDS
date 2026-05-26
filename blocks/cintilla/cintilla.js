import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { Cintilla } from '../../design-system/organisms/cintilla/cintilla.js';
import { shouldShowByTargetingLegacy } from '../../scripts/utils/target-filter.js';
import { sanitizeHTMLAsync } from '../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * Evaluates targeting rules for the cintilla.
 * @param {Object} config - Block configuration
 * @returns {boolean} - Whether the cintilla should be shown
 */
function shouldShowCintilla(config) {
  return shouldShowByTargetingLegacy(config);
}

/**
 * Decorates the Cintilla block.
 * Async because we sanitize the CMS RichText with sanitizeHTMLAsync
 * (DOMPurify) before passing it to the Preact organism.
 * @param {Element} block The cintilla block element
 */
export default async function decorate(block) {
  const isAuthorEnv = window.location.hostname.includes('author-')
    && window.location.pathname.startsWith('/content/');

  const config = readBlockConfig(block);

  const rows = [...block.children];

  let contentHTML = '';
  let bgColor = '';
  let textColor = '';
  let linkColor = '';
  let linkTarget = 'self';

  // Parse rows when no key:value config (positional rows)
  if (Object.keys(config).length === 0 && rows.length > 0) {
    if (rows[0]?.children[0]) {
      contentHTML = rows[0].children[0].innerHTML;
    }
    if (rows[1]?.children[0]?.textContent?.trim()) {
      bgColor = rows[1].children[0].textContent.trim();
    }
    if (rows[2]?.children[0]?.textContent?.trim()) {
      textColor = rows[2].children[0].textContent.trim();
    }
    if (rows[3]?.children[0]?.textContent?.trim()) {
      linkColor = rows[3].children[0].textContent.trim();
    }
    if (rows[4]?.children[0]?.textContent?.trim()) {
      const targetText = rows[4].children[0].textContent.trim().toLowerCase();
      if (['self', 'blank'].includes(targetText)) {
        linkTarget = targetText;
      }
    }

    // Read targeting rows (5, 6)
    if (rows[5]?.children[0]?.textContent?.trim()) {
      config.targetCountries = rows[5].children[0].textContent.trim();
    }
    if (rows[6]?.children[0]?.textContent?.trim()) {
      config.targetLanguages = rows[6].children[0].textContent.trim();
    }
  } else {
    // Read from key:value config
    const contentRow = rows.find((row) => {
      const key = row.children[0]?.textContent?.trim().toLowerCase();
      return key === 'content';
    });

    if (contentRow && contentRow.children[1]) {
      contentHTML = contentRow.children[1].innerHTML;
    }

    bgColor = config.bgcolor || config['bg color'] || '';
    textColor = config.textcolor || config['text color'] || '';
    linkColor = config.linkcolor || config['link color'] || '';
    linkTarget = config.linktarget || config['link target'] || 'self';
  }

  // Normalize targeting fields (support both new and legacy names)
  config.targetCountries = config.targetCountries
    || config['target-countries']
    || config.targetcountries
    || config['target countries']
    || '';
  config.targetLanguages = config.targetLanguages
    || config['target-languages']
    || config.targetlanguages
    || config['target languages']
    || '';
  // shouldShowByTargetingLegacy expects targetMarkets/targetLanguages — alias
  config.targetMarkets = config.targetCountries;

  if (!shouldShowCintilla(config)) {
    block.remove();
    return;
  }

  // Sanitize CMS RichText with DOMPurify before passing to organism.
  // This prevents XSS via author-controlled <script>, onclick, onerror, etc.
  // sanitizeHTMLAsync ensures DOMPurify is loaded; safe to await.
  // Whitelist: standard HTML tags + <a>, <p>, <strong>, <em>, <u>, <ul>, <ol>, <li>, <br>.
  // No scripts, no event handlers, no <iframe>/<object>/<embed>.
  const sanitizedContent = await sanitizeHTMLAsync(contentHTML, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['p', 'a', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'br', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
  });

  // Replace block with rendered Cintilla
  if (isAuthorEnv) {
    block.textContent = '';
    const previewContainer = document.createElement('div');
    previewContainer.className = 'cintilla-content';
    block.appendChild(previewContainer);
    render(
      html`
        <${Cintilla}
          contentHTML=${sanitizedContent}
          bgColor=${bgColor || undefined}
          textColor=${textColor || undefined}
          linkColor=${linkColor || undefined}
          linkTarget=${linkTarget}
          customClassName="cintilla-block"
        />
      `,
      previewContainer,
    );
    return;
  }

  // Production mode: replace block contents with rendered Cintilla
  block.textContent = '';
  render(
    html`
      <${Cintilla}
        contentHTML=${sanitizedContent}
        bgColor=${bgColor || undefined}
        textColor=${textColor || undefined}
        linkColor=${linkColor || undefined}
        linkTarget=${linkTarget}
        customClassName="cintilla-block"
      />
    `,
    block,
  );
}
