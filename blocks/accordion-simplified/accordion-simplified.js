/* eslint-disable max-len */
import { h, render } from '@dropins/tools/preact.js';
import { useState, useRef, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';
import processRichTextContent from '../cms-rich-text/cms-rich-text-helper.js';

const html = htm.bind(h);

/**
 * Read parent config from leading single-cell rows (positional order).
 * Model field order: target-countries, target-languages, open-mode,
 *                    default-open, visibility-start-date, visibility-end-date
 *
 * @param {HTMLElement} block - The block element
 * @returns {Object} Configuration object
 */
function parseConfig(block) {
  const rows = Array.from(block.children);
  const configValues = [];

  for (let i = 0; i < rows.length; i += 1) {
    const cells = Array.from(rows[i].children);
    if (cells.length === 1) {
      configValues.push(cells[0]?.textContent?.trim() || '');
    } else {
      break; // Item rows start here
    }
  }

  return {
    targetCountries: configValues[0] || '',
    targetLanguages: configValues[1] || '',
    openMode: configValues[2] || 'multiple',
    defaultOpen: configValues[3] || 'none',
    visibilityStartDate: configValues[4] || '',
    visibilityEndDate: configValues[5] || '',
    itemSpacing: configValues[6] || 'default',
  };
}

/**
 * Parse accordion items from multi-cell rows.
 * Each accordion-simplified-item row: [label | defaultOpen | content (richtext)]
 *
 * @param {HTMLElement} block - The block element
 * @returns {Array<Object>} Array of item objects { label, defaultOpen, content }
 */
function parseItems(block) {
  const rows = Array.from(block.children);

  // Item rows have >= 2 cells (config rows have exactly 1 cell)
  const itemRows = rows.filter((row) => Array.from(row.children).length >= 2);

  return itemRows.map((row) => {
    const cells = Array.from(row.children);
    return {
      label: cells[0]?.textContent?.trim() || '',
      defaultOpen: cells[1]?.textContent?.trim() === 'true',
      // Keep a reference to the actual AEM DOM element to avoid
      // innerHTML serialisation / encoding issues with richtext content
      contentEl: cells[2] || null,
    };
  });
}

/**
 * Injects/updates the FAQPage JSON-LD script in head from accordion items.
 * All accordion-simplified blocks on the page share a single FAQPage schema
 * (one schema per type per URL); questions are deduped by name so
 * editor re-decoration never duplicates entries. Skipped on noindex pages.
 * @param {Array<Object>} items - Parsed accordion items ({ label, contentEl })
 */
function upsertFaqJsonLd(items) {
  const robots = document.head.querySelector('meta[name="robots"]')?.content || '';
  if (robots.toLowerCase().includes('noindex')) return;

  const entries = items
    .map((item) => ({
      question: (item.label || '').trim(),
      answer: (item.contentEl?.textContent || '').replace(/\s+/g, ' ').trim(),
    }))
    .filter((entry) => entry.question && entry.answer);
  if (entries.length === 0) return;

  const existing = document.head.querySelector('script[data-faq-json-ld="true"]');
  let mainEntity = [];
  if (existing) {
    try {
      mainEntity = JSON.parse(existing.textContent)?.mainEntity || [];
    } catch (e) {
      mainEntity = [];
    }
  }

  const seen = new Set(mainEntity.map((question) => question.name));
  entries.forEach(({ question, answer }) => {
    if (seen.has(question)) return;
    seen.add(question);
    mainEntity.push({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    });
  });

  const script = existing || document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-faq-json-ld', 'true');
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  });
  if (!existing) document.head.appendChild(script);
}

/**
 * Chevron SVG with open/close rotation transition.
 * Matches the Icon used in the design system Accordion component.
 */
const ChevronIcon = ({ isOpen }) => html`
  <span
    class=${`transition-transform duration-300 ease-in-out h-6 w-6 flex items-center justify-center shrink-0 text-[var(--text-normal-primary,#1b1b1b)] ${isOpen ? 'rotate-180' : 'rotate-0'}`}
    aria-hidden="true"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
      style="color:inherit;width:100%;height:100%"
    >
      <path d="M16.59 8.295L12 12.875L7.41 8.295L6 9.705L12 15.705L18 9.705L16.59 8.295Z" />
    </svg>
  </span>
`;

/**
 * Single accordion item — stateless, state managed by AccordionSimplifiedGroup.
 *
 * Uses CSS grid-template-rows animation (0fr ↔ 1fr) for smooth height transition
 * without needing scrollHeight measurement.
 *
 * @param {Object} props
 * @param {string}   props.label     - Accordion header label
 * @param {boolean}  props.isOpen    - Whether this item is open
 * @param {Function} props.onToggle  - Toggle callback
 * @param {string}   props.headerId  - Unique id for the header button
 * @param {string}   props.panelId   - Unique id for the panel region
 */
const AccordionItem = ({
  label,
  contentEl,
  isOpen,
  onToggle,
  headerId,
  panelId,
}) => {
  const panelInnerRef = useRef(null);
  const panelRef = useRef(null);
  const isFirstRender = useRef(true);

  // Mount the actual AEM DOM nodes once — avoids all innerHTML
  // serialisation / HTML-encoding issues with richtext content
  useEffect(() => {
    const el = panelInnerRef.current;
    if (!el || !contentEl) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    Array.from(contentEl.childNodes).forEach((node) => {
      el.appendChild(node.cloneNode(true));
    });
  }, [contentEl]);

  // Set initial panel state without animation on first render
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (!isOpen) {
      panel.setAttribute('hidden', '');
      panel.style.maxHeight = '0';
    } else {
      panel.style.maxHeight = 'none';
    }
  }, []);

  // maxHeight open/close animation — same pattern as accordion-group
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // Skip on first render (handled by mount effect above)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isOpen) {
      panel.removeAttribute('hidden');
      const content = panel.querySelector('.accordion-simplified-content');
      const contentHeight = content ? content.scrollHeight : panel.scrollHeight;
      panel.style.maxHeight = '0';
      requestAnimationFrame(() => {
        panel.style.maxHeight = `${contentHeight}px`;
        panel.addEventListener('transitionend', function handler() {
          if (panel.style.maxHeight !== '0px') panel.style.maxHeight = 'none';
          panel.removeEventListener('transitionend', handler);
        });
      });
    } else {
      const currentHeight = panel.scrollHeight;
      panel.style.maxHeight = `${currentHeight}px`;
      // eslint-disable-next-line no-unused-expressions
      panel.offsetHeight; // force reflow
      panel.style.maxHeight = '0';
      panel.addEventListener('transitionend', function handler() {
        if (panel.style.maxHeight === '0px') panel.setAttribute('hidden', '');
        panel.removeEventListener('transitionend', handler);
      });
    }
  }, [isOpen]);

  return html`
    <div
      class=${`w-full ${isOpen ? 'accordion-simplified-item--open' : ''}`}
      data-name="accordionSimplifiedItem"
    >
      <!-- Card inner wrapper — matches accordion-group-item-inner -->
      <div class="accordion-simplified-item-inner flex flex-col overflow-hidden bg-[var(--color-background-brand-primary-lighter,#fff)] rounded-[var(--border-radius-medium,12px)] border border-[var(--color-border-brand-secondary-disable)] w-full max-w-[var(--accordion-max-width,1248px)] transition-[border-color,box-shadow] duration-[var(--transition-fast,150ms)] ease-[var(--ease-in-out,ease-in-out)]">
        <!-- Header -->
        <h3 class="flex items-center !m-0 w-full">
          <button
            class="accordion-simplified-trigger flex items-center justify-between gap-3 w-full bg-transparent border-none rounded-[var(--border-radius-medium,12px)] cursor-pointer text-left"
            type="button"
            aria-expanded=${isOpen}
            aria-controls=${panelId}
            id=${headerId}
            onClick=${onToggle}
          >
            <span class="accordion-simplified-label flex-[1_0_0] !m-0 text-[color:var(--text-normal-primary,#1B1B1B)] font-[family-name:var(--family-red-hat-display,'Red_Hat_Display')] text-[18px] font-bold !leading-[24px] tracking-[var(--letter-spacing-normal,0)]">
              ${label}
            </span>
            <${ChevronIcon} isOpen=${isOpen} />
          </button>
        </h3>

        <!-- Panel: maxHeight animation, hidden when closed (display:none) -->
        <div
          ref=${panelRef}
          id=${panelId}
          role="region"
          aria-labelledby=${headerId}
          class="accordion-simplified-panel overflow-hidden"
        >
          <div
            ref=${panelInnerRef}
            class="accordion-simplified-content"
          />
        </div>
      </div>
    </div>
  `;
};

/**
 * AccordionSimplifiedGroup — owns open/close state for all items.
 *
 * Supports:
 * - openMode 'exclusive': at most one item open at a time
 * - openMode 'multiple': any number of items can be open simultaneously
 * - defaultOpen 'none' | 'first' | 'all': initial open state
 * - Per-item defaultOpen override from model field
 *
 * @param {Object}          props
 * @param {Array<Object>}   props.items       - Parsed item data
 * @param {'exclusive'|'multiple'} props.openMode
 * @param {'none'|'first'|'all'}   props.defaultOpen
 */
const AccordionSimplifiedGroup = ({
  items, openMode, defaultOpen, itemSpacing,
}) => {
  // Lazy initializer: compute initial Set once on first render
  const [openSet, setOpenSet] = useState(() => {
    const set = new Set();

    // Apply group-level defaultOpen
    if (defaultOpen === 'all') {
      items.forEach((_, i) => set.add(i));
    } else if (defaultOpen === 'first' && items.length > 0) {
      set.add(0);
    }

    // Apply per-item defaultOpen overrides
    items.forEach((item, i) => {
      if (item.defaultOpen) {
        // In exclusive mode only keep the last individual override
        if (openMode === 'exclusive') set.clear();
        set.add(i);
      }
    });

    return set;
  });

  const toggle = (index) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (openMode === 'exclusive') next.clear();
        next.add(index);
      }
      return next;
    });
  };

  const gapClass = itemSpacing === 'none' ? 'gap-0' : 'gap-3';

  return html`
    <div
      class=${`accordion-simplified-group flex flex-col ${gapClass} w-full ${itemSpacing === 'none' ? 'accordion-simplified-group--no-gap' : ''}`}
      data-name="accordionSimplifiedGroup"
    >
      ${items.map((item, i) => html`
        <${AccordionItem}
          key=${i}
          label=${item.label}
          contentEl=${item.contentEl}
          isOpen=${openSet.has(i)}
          onToggle=${() => toggle(i)}
          headerId=${`acc-simplified-header-${i}`}
          panelId=${`acc-simplified-panel-${i}`}
        />
      `)}
    </div>
  `;
};

/**
 * Decorates the Accordion Simplified block.
 *
 * Block DOM structure (from AEM EDS):
 *   Leading single-cell rows → parent config (target-countries, target-languages,
 *                                              open-mode, default-open,
 *                                              visibility-start-date, visibility-end-date)
 *   Multi-cell rows          → accordion-simplified-item children
 *                             (label | accordion-default-open | content richtext)
 *
 * @param {HTMLElement} block - The block element
 */
export default function decorate(block) {
  const config = parseConfig(block);

  // POS / market targeting
  if (!shouldShowByTargeting(config.targetCountries, config.targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // Date visibility window
  const now = new Date();

  if (config.visibilityStartDate) {
    const startDate = new Date(config.visibilityStartDate);
    if (!Number.isNaN(startDate.getTime()) && now < startDate) {
      hideBlockWithSection(block);
      return;
    }
  }

  if (config.visibilityEndDate) {
    const endDate = new Date(config.visibilityEndDate);
    if (!Number.isNaN(endDate.getTime()) && now > endDate) {
      hideBlockWithSection(block);
      return;
    }
  }

  // Decode AEM richtext: convert <code> tags containing escaped HTML
  // into actual DOM nodes before we read cell references
  processRichTextContent(block);

  const items = parseItems(block);

  if (items.length === 0) return;

  // FAQPage JSON-LD for SEO, generated from the visible Q&A content
  // (same head-injection pattern as blocks/breadcrumb) — VSTS 1281547
  upsertFaqJsonLd(items);

  // Hide original children to preserve data-aue-* for editor (Pattern B)
  Array.from(block.children).forEach((child) => {
    child.style.display = 'none';
  });

  // Render INSIDE the block (compatible with editor-support.js re-decoration)
  const container = document.createElement('div');
  container.className = 'accordion-simplified-content-wrapper';
  block.appendChild(container);

  render(
    html`
      <${AccordionSimplifiedGroup}
        items=${items}
        openMode=${config.openMode}
        defaultOpen=${config.defaultOpen}
        itemSpacing=${config.itemSpacing}
      />
    `,
    container,
  );
}
