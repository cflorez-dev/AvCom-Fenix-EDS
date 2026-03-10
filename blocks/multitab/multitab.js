/* eslint-disable max-len */
/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { loadBlock } from '../../scripts/aem.js';
import { Icon } from '../../design-system/atoms/icon/icon.js';
import { shouldShowByTargeting, hideBlockWithSection, applySectionTargeting } from '../../scripts/utils/target-filter.js';

const html = htm.bind(h);

/**
 * Reads block configuration by position (Universal Editor saves values without labels)
 * Supports both old (6 rows) and new (9 rows) structure for backward compatibility
 *
 * Old structure (6 rows): group-id, default-tab, enable-from, enable-to, target-languages, size/show
 * New structure (9 rows): group-id, default-tab, enable-from, enable-to, target-countries, target-languages, size, show-chevrons, show
 *
 * @param {HTMLElement} block - The block element
 * @returns {Object} Configuration object
 */
function readMultitabConfig(block) {
  const rows = [...block.children];
  const rowCount = rows.length;
  const getValue = (rowIndex) => {
    const row = rows[rowIndex];
    if (!row) return '';
    const cell = row.querySelector('div > div, div > p');
    return cell?.textContent?.trim() || '';
  };

  // Detect old structure (6 rows or less) vs new structure (9 rows)
  const isOldStructure = rowCount <= 6;

  if (isOldStructure) {
    // Old structure: no target-countries field
    const row5Value = getValue(5);
    return {
      'group-id': getValue(0),
      'default-tab': getValue(1),
      'enable-from': getValue(2),
      'enable-to': getValue(3),
      'target-countries': '', // Not present in old blocks
      'target-languages': getValue(4),
      // Row 5 could be either size or show (if "true"/"false")
      size: (row5Value === 'true' || row5Value === 'false') ? 'large' : (row5Value || 'large'),
      'show-chevrons': false, // Not present in old blocks
      show: (row5Value === 'true' || row5Value === 'false') ? row5Value : 'true',
    };
  }

  // New structure: all fields present
  return {
    'group-id': getValue(0),
    'default-tab': getValue(1),
    'enable-from': getValue(2),
    'enable-to': getValue(3),
    'target-countries': getValue(4),
    'target-languages': getValue(5),
    size: getValue(6) || 'large',
    'show-chevrons': getValue(7) === 'true',
    show: getValue(8) || 'true',
  };
}

/**
 * MultiTab Block - Horizontal tab navigation for organizing content modularly
 * Supports icon in tab labels, scroll horizontal on mobile, keyboard navigation
 * Content accepts any cms-block (rich text, cards, tables, accordions, etc.)
 *
 * @param {HTMLElement} block - The multitab block element
 *
 * Metadata Configuration:
 * - group-id: Unique identifier for tab group
 * - default-tab: ID of tab to open by default
 * - enable-from: Start date (ISO format)
 * - enable-to: End date (ISO format)
 * - target-languages: Comma-separated language codes
 * - size: "large" | "small" - Tab height (80px | 64px)
 * - show-chevrons: "true" | "false" - Show navigation arrows
 * - show: "true" | "false" - Enable/disable block
 *
 * Section Metadata (multitab-item):
 * - multitab-group: Group ID (must match block group-id)
 * - multitab-label: Tab primary label text
 * - multitab-secondary-label: Tab secondary label (optional)
 * - multitab-icon: Icon path (optional, e.g., "action/check")
 * - multitab-icon-position: "before" | "after" (default: "before")
 * - multitab-default-open: "true" | "false" - Open by default
 */
export default async function decorate(block) {
  const config = readMultitabConfig(block);
  const groupId = config['group-id'] || `multitab-group-${Date.now()}`;
  const defaultTab = config['default-tab'] || null;
  const size = config.size || 'large';
  const showChevrons = config['show-chevrons'] === true;

  // Feature flags
  const enableFrom = config['enable-from'] ? new Date(config['enable-from']) : null;
  const enableTo = config['enable-to'] ? new Date(config['enable-to']) : null;
  const targetCountries = config['target-countries'] || '';
  const targetLanguages = config['target-languages'] || '';
  const show = config.show !== 'false';

  const now = new Date();

  // Detect author environment (Universal Editor)
  const isAuthorEnv = window.location.hostname.includes('author-')
    && window.location.pathname.startsWith('/content/');

  // In author mode: show configuration preview without transforming sections
  // This preserves the DOM structure so Universal Editor can keep editing references
  if (isAuthorEnv) {
    block.classList.add('multitab--author-mode');
    const preview = document.createElement('div');
    preview.className = 'multitab-author-preview bg-[var(--bg-informative-light)] border-l-[3px] border-[var(--border-accent-informative)] rounded-[var(--border-radius-small)]';
    preview.style.cssText = 'padding: 12px 16px;';
    preview.innerHTML = `
      <div class="font-semibold mb-2 text-[var(--text-link-informative-default)]">MultiTab Controller</div>
      <div class="text-xs leading-relaxed text-[var(--text-normal-secondary)]">
        <strong>Group ID:</strong> ${groupId}<br>
        <strong>Size:</strong> ${size}<br>
        <strong>Chevrons:</strong> ${showChevrons ? 'Yes' : 'No'}<br>
        <strong>Default Tab:</strong> ${defaultTab || 'First tab'}<br>
      </div>
      <div class="mt-2 pt-2 border-t border-[var(--border-stroke-default)] text-[11px] text-[var(--text-normal-tertiary)]">
        💡 Add Section blocks below with <strong>multitab-group="${groupId}"</strong> metadata.<br>
        Each section becomes a tab and can contain any CMS blocks.
      </div>
    `;
    block.innerHTML = '';
    block.appendChild(preview);
    return;
  }

  // Check feature flags
  if (!show) {
    hideBlockWithSection(block);
    return;
  }

  if (enableFrom && now < enableFrom) {
    hideBlockWithSection(block);
    return;
  }

  if (enableTo && now > enableTo) {
    hideBlockWithSection(block);
    return;
  }

  // Target countries and languages validation
  if (!shouldShowByTargeting(targetCountries, targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  // Find all sibling sections that belong to this group
  const section = block.closest('.section');
  if (!section) return;

  const parent = section.parentElement;
  if (!parent) return;

  const allSections = Array.from(parent.querySelectorAll('.section'));
  const blockIndex = allSections.indexOf(section);

  // Collect tab sections that match this group
  const tabSections = [];
  for (let i = blockIndex + 1; i < allSections.length; i += 1) {
    const tabSection = allSections[i];
    const sectionMetadata = tabSection.dataset;

    if (sectionMetadata.multitabGroup !== groupId) {
      break; // Stop when we hit a section that doesn't belong to this group
    }

    // Apply section-level targeting - skip sections that should be hidden
    // Section metadata is in dataset, convert to object for applySectionTargeting
    const sectionMeta = {
      'target-countries': sectionMetadata.targetCountries,
      'target-languages': sectionMetadata.targetLanguages,
    };

    const shouldShowSection = applySectionTargeting(tabSection, sectionMeta);
    if (!shouldShowSection) {
      // Section is hidden by targeting, skip adding it to tabs
      // eslint-disable-next-line no-continue
      continue;
    }

    const tabLabel = sectionMetadata.multitabLabel || `Tab ${tabSections.length + 1}`;
    const tabSecondaryLabel = sectionMetadata.multitabSecondaryLabel || null;
    let tabIcon = sectionMetadata.multitabIcon || null;

    // Clean up icon value: remove surrounding quotes and validate format
    if (tabIcon && typeof tabIcon === 'string') {
      // Remove surrounding quotes if present (e.g., "'action/check'" -> "action/check")
      tabIcon = tabIcon.replace(/^['"`]+|['"`]+$/g, '').trim();

      // Validate icon format: must contain "/" (e.g., "action/check", "navigation/chevron-left")
      if (tabIcon && !tabIcon.includes('/')) {
        tabIcon = null;
      }
    }

    const tabIconPosition = sectionMetadata.multitabIconPosition || 'before';
    const tabDefaultOpen = sectionMetadata.multitabDefaultOpen === 'true';
    const tabId = `tab-${groupId}-${tabSections.length}`;

    tabSections.push({
      section: tabSection,
      label: tabLabel,
      secondaryLabel: tabSecondaryLabel,
      icon: tabIcon,
      iconPosition: tabIconPosition,
      defaultOpen: tabDefaultOpen,
      id: tabId,
    });
  }

  if (tabSections.length === 0) {
    // Show a helpful message to content authors in Universal Editor
    // instead of only logging to the console when no matching sections are found.
    block.innerHTML = '';
    const message = document.createElement('div');
    message.textContent = `MultiTab: No sections found for group "${groupId}". Add one or more sections with matching "multitab-group" metadata after this block.`;
    block.appendChild(message);
    return;
  }

  // CRITICAL: Hide original block content (preserve for Universal Editor)
  block.style.display = 'none';

  // Remove spacing from original section container
  section.classList.add('!p-0', '!m-0', '!h-0', '!overflow-hidden');

  // Determine which tab should be active initially
  let activeTabIndex = 0;

  if (defaultTab) {
    const foundIndex = tabSections.findIndex((tab) => tab.id === defaultTab);
    if (foundIndex !== -1) {
      activeTabIndex = foundIndex;
    }
  } else {
    const foundDefaultOpen = tabSections.findIndex((tab) => tab.defaultOpen);
    if (foundDefaultOpen !== -1) {
      activeTabIndex = foundDefaultOpen;
    }
  }

  // Create multitab container (sibling to original block)
  const multitabContainer = document.createElement('div');
  multitabContainer.className = 'section multitab-container';
  multitabContainer.setAttribute('data-group-id', groupId);
  multitabContainer.setAttribute('data-section-status', 'loaded');

  // Create aria-live region for screen reader announcements
  const liveRegion = document.createElement('div');
  liveRegion.className = 'sr-only';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.setAttribute('role', 'status');
  multitabContainer.appendChild(liveRegion);

  // Create tab navigation wrapper
  const tabNavWrapper = document.createElement('div');
  tabNavWrapper.className = 'relative flex items-center';

  // Chevron before (left arrow)
  let chevronBefore = null;
  if (showChevrons) {
    chevronBefore = document.createElement('button');
    chevronBefore.setAttribute('type', 'button');
    chevronBefore.className = `
      hidden xl:flex items-center justify-center shrink-0 size-[24px]
      text-[var(--text-normal-primary)] hover:text-[var(--text-link-informative-default)]
      transition-colors duration-200 cursor-pointer 
      focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-stroke-focus,#1d9bf0)] focus-visible:rounded-[var(--x-tiny,2px)]
    `.trim().replace(/\s+/g, ' ');
    chevronBefore.setAttribute('aria-label', 'Scroll tabs left');
    chevronBefore.setAttribute('tabindex', '0');
    render(
      html`<${Icon} icon="navigation/chevron-left" customSize=${12} color="currentColor" />`,
      chevronBefore,
    );
    tabNavWrapper.appendChild(chevronBefore);
  }

  // Create tab navigation
  const tabNav = document.createElement('div');
  tabNav.className = 'flex overflow-x-auto scroll-smooth flex-1 max-[1023px]:p-0';
  tabNav.setAttribute('role', 'tablist');
  tabNav.setAttribute('aria-label', 'Content tabs');
  tabNav.setAttribute('aria-orientation', 'horizontal');
  tabNav.style.scrollbarWidth = 'none'; // Firefox
  tabNav.style.msOverflowStyle = 'none'; // IE/Edge
  tabNavWrapper.appendChild(tabNav);

  // Chevron after (right arrow)
  let chevronAfter = null;
  if (showChevrons) {
    chevronAfter = document.createElement('button');
    chevronAfter.setAttribute('type', 'button');
    chevronAfter.className = `
      hidden xl:flex items-center justify-center shrink-0 size-[24px]
      text-[var(--text-normal-primary)] hover:text-[var(--text-link-informative-default)]
      transition-colors duration-200 cursor-pointer 
      focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-stroke-focus,#1d9bf0)] focus-visible:rounded-[var(--x-tiny,2px)]
    `.trim().replace(/\s+/g, ' ');
    chevronAfter.setAttribute('aria-label', 'Scroll tabs right');
    chevronAfter.setAttribute('tabindex', '0');
    render(
      html`<${Icon} icon="navigation/chevron-right" customSize=${12} color="currentColor" />`,
      chevronAfter,
    );
    tabNavWrapper.appendChild(chevronAfter);
  }

  // Create tabs
  const tabButtons = [];
  tabSections.forEach((tabData, index) => {
    const isActive = index === activeTabIndex;

    // Size-specific dimensions (Figma specs)
    const tabHeight = size === 'large' ? 'h-[80px]' : 'h-[64px]';
    const tabPadding = 'px-6 md:px-8';
    const primaryFontSize = size === 'large' ? 'text-[18px]' : 'text-[16px]';
    const secondaryFontSize = 'text-[14px]';

    // Mobile width: active tab minimum 56% (≤480px)
    // Inactive tabs: no width restriction, content flows naturally
    const tabWidth = 'w-auto';

    const tabButton = document.createElement('button');
    tabButton.setAttribute('type', 'button');
    tabButton.className = `
      group flex flex-col ${tabHeight} ${tabPadding} gap-[var(--tiny,4px)]
      items-center justify-center shrink-0 relative isolate
      transition-all duration-200 cursor-pointer
      focus:outline-none focus-visible:outline-none
      ${tabWidth}
    `.trim().replace(/\s+/g, ' ');
    tabButton.style.pointerEvents = 'auto';

    // Add focus indicator styling
    tabButton.addEventListener('focus', (e) => {
      if (e.target.matches(':focus-visible')) {
        const existingFocusIndicator = e.target.querySelector('[data-name="focus-indicator"]');
        if (!existingFocusIndicator) {
          const focusIndicator = document.createElement('div');
          focusIndicator.className = 'absolute inset-0 border-2 border-[var(--border-stroke-focus,#1d9bf0)] pointer-events-none z-[3]';
          focusIndicator.setAttribute('data-name', 'focus-indicator');
          e.target.appendChild(focusIndicator);
        }

        // Change text styles to focused state (font-normal, secondary color)
        const contentContainer = e.target.querySelector('div');
        const labelSpan = contentContainer?.querySelector('span:not(.shrink-0)');
        if (labelSpan) {
          labelSpan.classList.remove('font-bold', 'text-[color:var(--text-normal-primary,#1B1B1B)]');
          labelSpan.classList.add('font-normal', 'text-[var(--text-normal-secondary)]');
        }

        // Hide green indicator when focused (make it transparent)
        const indicator = e.target.querySelector('[data-name="indicator"]');
        if (indicator) {
          indicator.classList.add('opacity-0');
        }
      }
    });

    tabButton.addEventListener('blur', (e) => {
      const focusIndicator = e.target.querySelector('[data-name="focus-indicator"]');
      if (focusIndicator) {
        focusIndicator.remove();
      }

      // Restore original text styles based on active state
      const isActiveTab = e.target.getAttribute('aria-selected') === 'true';
      const contentContainer = e.target.querySelector('div');
      const labelSpan = contentContainer?.querySelector('span:not(.shrink-0)');
      if (labelSpan && isActiveTab) {
        labelSpan.classList.remove('font-normal', 'text-[var(--text-normal-secondary)]');
        labelSpan.classList.add('font-bold', 'text-[color:var(--text-normal-primary,#1B1B1B)]');
      }

      // Restore green indicator when blur (make it visible again)
      const indicator = e.target.querySelector('[data-name="indicator"]');
      if (indicator) {
        indicator.classList.remove('opacity-0');
      }
    });

    tabButton.setAttribute('role', 'tab');
    tabButton.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tabButton.setAttribute('aria-controls', `panel-${tabData.id}`);
    tabButton.setAttribute('id', `btn-${tabData.id}`);
    tabButton.setAttribute('tabindex', isActive ? '0' : '-1');
    tabButton.setAttribute('aria-label', `${tabData.label}${tabData.secondaryLabel ? `: ${tabData.secondaryLabel}` : ''}`);

    // Content container with grid layout 3x3
    // Icon: column 1, spans all 3 rows (centered)
    // Primary label: columns 2-3, row 1
    // Secondary label: columns 2-3, row 2
    const contentContainer = document.createElement('div');

    // Grid layout: if icon exists, use 3 columns; otherwise use simple flex
    if (tabData.icon) {
      contentContainer.className = `
        grid grid-cols-[auto_1fr_1fr] grid-rows-[auto_auto_auto] gap-[4px] items-center justify-items-center relative w-full z-[5]
      `.trim().replace(/\s+/g, ' ');

      // Icon (column 1, spans all rows, aligned with primary label)
      const iconColor = isActive ? 'var(--text-normal-primary)' : 'var(--text-normal-secondary)';
      const iconWrapper = document.createElement('span');
      iconWrapper.className = 'flex items-center justify-center shrink-0 row-span-3 self-start relative top-[4px]';
      render(html`<${Icon} icon=${tabData.icon} size="s" color=${iconColor} />`, iconWrapper);
      contentContainer.appendChild(iconWrapper);

      // Primary label (columns 2-3)
      const labelSpan = document.createElement('span');
      labelSpan.className = `
        col-span-2 font-[var(--family-red-hat-display)] ${primaryFontSize} leading-[1.313rem] md:leading-[1.5rem] whitespace-nowrap tracking-[var(--letter-spacing-normal)]
        ${isActive ? 'font-bold text-[color:var(--text-normal-primary,#1B1B1B)]' : 'font-normal text-[var(--text-normal-secondary)] group-hover:text-[color:var(--text-normal-primary,#1B1B1B)] group-aria-[selected=false]:group-hover:text-[color:var(--text-normal-primary,#1B1B1B)]'}
        transition-colors duration-200
      `.trim().replace(/\s+/g, ' ');
      labelSpan.textContent = tabData.label;
      contentContainer.appendChild(labelSpan);

      // Secondary label (columns 2-3, row 2)
      if (tabData.secondaryLabel) {
        const secondarySpan = document.createElement('span');
        secondarySpan.className = `
          col-span-2 font-[var(--family-red-hat-display)] ${secondaryFontSize} font-normal leading-[1.5] whitespace-nowrap tracking-[var(--letter-spacing-normal)]
          text-[var(--text-normal-secondary)]
        `.trim().replace(/\s+/g, ' ');
        secondarySpan.textContent = tabData.secondaryLabel;
        contentContainer.appendChild(secondarySpan);
      }
    } else {
      // No icon: use flex column layout
      contentContainer.className = `
        flex flex-col gap-[2px] items-center justify-center relative w-full z-[5]
      `.trim().replace(/\s+/g, ' ');

      // Primary label
      const labelSpan = document.createElement('span');
      labelSpan.className = `
        font-[var(--family-red-hat-display)] ${primaryFontSize} leading-[1.313rem] md:leading-[1.5rem] whitespace-nowrap tracking-[var(--letter-spacing-normal)]
        ${isActive ? 'font-bold text-[color:var(--text-normal-primary,#1B1B1B)]' : 'font-normal text-[var(--text-normal-secondary)] group-hover:text-[color:var(--text-normal-primary,#1B1B1B)] group-aria-[selected=false]:group-hover:text-[color:var(--text-normal-primary,#1B1B1B)]'}
        transition-colors duration-200
      `.trim().replace(/\s+/g, ' ');
      labelSpan.textContent = tabData.label;
      contentContainer.appendChild(labelSpan);

      // Secondary label
      if (tabData.secondaryLabel) {
        const secondarySpan = document.createElement('span');
        secondarySpan.className = `
          font-[var(--family-red-hat-display)] ${secondaryFontSize} font-normal leading-[1.313rem] md:leading-[1.5rem] whitespace-nowrap tracking-[var(--letter-spacing-normal)]
          text-[var(--text-normal-secondary)]
        `.trim().replace(/\s+/g, ' ');
        secondarySpan.textContent = tabData.secondaryLabel;
        contentContainer.appendChild(secondarySpan);
      }
    }

    tabButton.appendChild(contentContainer);

    // Green indicator (active only)
    if (isActive) {
      const indicator = document.createElement('div');
      indicator.className = 'absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-accent-positive,#1ea93c)] z-[2] transition-opacity duration-200';
      indicator.setAttribute('data-name', 'indicator');
      tabButton.appendChild(indicator);
    }

    // Bottom border (all tabs)
    const border = document.createElement('div');
    border.className = 'absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]';
    border.setAttribute('data-name', 'border');
    tabButton.appendChild(border);

    // Hover indicator (bottom border on hover for inactive tabs)
    const hoverIndicator = document.createElement('div');
    hoverIndicator.className = 'absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-stroke-darker,#1b1b1b)] z-[2] opacity-0 group-aria-[selected=false]:group-hover:opacity-100 transition-opacity duration-200';
    hoverIndicator.setAttribute('data-name', 'hover-indicator');
    tabButton.appendChild(hoverIndicator);

    tabButtons.push(tabButton);
    tabNav.appendChild(tabButton);
  });

  // Create tab panels
  const tabPanels = [];
  const blocksToDecorate = [];

  tabSections.forEach((tabData, index) => {
    const isActive = index === activeTabIndex;

    const tabPanel = document.createElement('div');
    tabPanel.className = `multitab-panel mt-6 focus:outline-none focus-visible:outline-none animate-[fadeIn_0.3s_ease-in-out] ${isActive ? '' : 'hidden'}`;
    tabPanel.setAttribute('role', 'tabpanel');
    tabPanel.setAttribute('id', `panel-${tabData.id}`);
    tabPanel.setAttribute('aria-labelledby', `btn-${tabData.id}`);
    tabPanel.setAttribute('tabindex', '0');

    // MOVE (not clone) section content into panel - preserves decorated blocks
    // Similar approach to accordion-group
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'multitab-content';

    // Transfer grid-layout classes from the section to the contentWrapper so
    // the tab panel renders full-width while internal content respects the grid
    // preset configured via Section Metadata → Styles.
    const gridClasses = [...tabData.section.classList].filter((cls) => cls.startsWith('grid-'));
    gridClasses.forEach((cls) => {
      tabData.section.classList.remove(cls);
      contentWrapper.classList.add(cls);
    });

    // Move all children except section-metadata
    const childrenToMove = [...tabData.section.children].filter(
      (child) => !child.classList.contains('section-metadata'),
    );

    childrenToMove.forEach((child) => {
      contentWrapper.appendChild(child);

      // Track blocks that need decoration (status = initialized but not loaded)
      const blocks = child.querySelectorAll('.block[data-block-status="initialized"]');
      blocks.forEach((blk) => blocksToDecorate.push(blk));

      // Also check if child itself is a block wrapper
      const directBlock = child.querySelector('.block');
      if (directBlock && directBlock.dataset.blockStatus === 'initialized') {
        blocksToDecorate.push(directBlock);
      }
    });

    tabPanel.appendChild(contentWrapper);

    // Hide original section (now empty except section-metadata)
    tabData.section.style.display = 'none';
    tabData.section.classList.add('multitab-section-hidden');
    tabData.section.setAttribute('aria-hidden', 'true');

    tabPanels.push(tabPanel);
  });

  // Insert multitab container after original block's section
  section.insertAdjacentElement('afterend', multitabContainer);

  // Add tab navigation first, then panels
  multitabContainer.appendChild(tabNavWrapper);
  tabPanels.forEach((panel) => {
    multitabContainer.appendChild(panel);
  });

  // Decorate any blocks that weren't loaded yet
  const decorationPromises = blocksToDecorate
    .filter((blk) => blk.dataset.blockStatus === 'initialized')
    .map((blk) => loadBlock(blk));
  await Promise.all(decorationPromises);

  // Tab switching logic
  function switchTab(newIndex) {
    if (newIndex < 0 || newIndex >= tabSections.length) return;

    // Update buttons
    tabButtons.forEach((btn, i) => {
      const isActive = i === newIndex;
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');

      // Find primary label span (first span that is not icon wrapper)
      const contentContainer = btn.querySelector('div');
      const labelSpan = contentContainer?.querySelector('span:not(.shrink-0)');

      if (isActive) {
        // Active state
        if (labelSpan) {
          labelSpan.classList.remove('font-normal', 'text-[var(--text-normal-secondary)]', 'group-hover:text-[color:var(--text-normal-primary,#1B1B1B)]', 'group-aria-[selected=false]:group-hover:text-[color:var(--text-normal-primary,#1B1B1B)]');
          labelSpan.classList.add('font-bold', 'text-[color:var(--text-normal-primary,#1B1B1B)]');
        }

        // Update icon colors to primary if icons exist
        const iconSpans = btn.querySelectorAll('span[data-name="icon"]');
        iconSpans.forEach((iconSpan) => {
          const svgPaths = iconSpan.querySelectorAll('svg [fill]');
          svgPaths.forEach((path) => {
            path.setAttribute('fill', 'var(--text-normal-primary)');
          });
        });

        // Add green indicator if not present
        if (!btn.querySelector('[data-name="indicator"]')) {
          const indicator = document.createElement('div');
          indicator.className = 'absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-accent-positive,#1ea93c)] z-[2] transition-opacity duration-200';
          indicator.setAttribute('data-name', 'indicator');
          btn.appendChild(indicator);
        }
      } else {
        // Inactive state
        if (labelSpan) {
          labelSpan.classList.remove('font-bold', 'text-[color:var(--text-normal-primary,#1B1B1B)]');
          labelSpan.classList.add('font-normal', 'text-[var(--text-normal-secondary)]', 'group-hover:text-[color:var(--text-normal-primary,#1B1B1B)]', 'group-aria-[selected=false]:group-hover:text-[color:var(--text-normal-primary,#1B1B1B)]');
        }

        // Update icon colors to secondary if icons exist
        const iconSpans = btn.querySelectorAll('span[data-name="icon"]');
        iconSpans.forEach((iconSpan) => {
          const svgPaths = iconSpan.querySelectorAll('svg [fill]');
          svgPaths.forEach((path) => {
            path.setAttribute('fill', 'var(--text-normal-secondary)');
          });
        });

        // Remove green indicator if present
        const indicator = btn.querySelector('[data-name="indicator"]');
        if (indicator) {
          indicator.remove();
        }
      }
    });

    // Update panels
    tabPanels.forEach((panel, i) => {
      if (i === newIndex) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    // Announce tab change to screen readers
    const liveRegion = multitabContainer.querySelector('[role="status"]');
    if (liveRegion) {
      const tabLabel = tabSections[newIndex].label;
      const tabSecondary = tabSections[newIndex].secondaryLabel;
      liveRegion.textContent = `${tabLabel}${tabSecondary ? `: ${tabSecondary}` : ''} tab selected`;
    }

    // Auto-scroll active tab into view (mobile-first behavior)
    // Mobile (≤480px): Slider effect - immediate smooth scroll
    // Desktop: Center the active tab
    const isMobile = window.innerWidth <= 480;

    if (isMobile) {
      // Mobile: Position active tab at left 0 (hide previous tabs completely)
      const activeTab = tabButtons[newIndex];
      const scrollContainer = tabNav;

      // Use offsetLeft directly - this is the tab's position relative to the container
      // This ensures the left edge of the active tab aligns with scroll position 0
      const targetScroll = activeTab.offsetLeft;
      const startScroll = scrollContainer.scrollLeft;
      const distance = targetScroll - startScroll;
      const duration = 200; // 0.2 seconds
      const startTime = performance.now();

      // Linear easing for constant speed slider effect
      const easeLinear = (t) => t;

      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeLinear(progress);

        scrollContainer.scrollLeft = startScroll + (distance * easeProgress);

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      // Start animation immediately (synchronous)
      animateScroll(performance.now());
    } else {
      // Desktop: Center active tab within tabNav (without affecting page scroll)
      const activeTab = tabButtons[newIndex];
      const containerWidth = tabNav.offsetWidth;
      const tabLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;
      const targetScroll = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      tabNav.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }

    // Focus new tab button after animation starts
    tabButtons[newIndex].focus();
  }

  // Add click handlers
  tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      switchTab(index);
    });
  });

  // Keyboard navigation
  tabNav.addEventListener('keydown', (e) => {
    const currentIndex = tabButtons.findIndex((btn) => btn === document.activeElement);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabButtons.length - 1;
        break;
      default:
        return;
    }

    switchTab(newIndex);
  });

  // Chevron navigation handlers
  if (showChevrons && chevronBefore) {
    chevronBefore.addEventListener('click', () => {
      tabNav.scrollBy({ left: -200, behavior: 'smooth' });
    });
  }

  if (showChevrons && chevronAfter) {
    chevronAfter.addEventListener('click', () => {
      tabNav.scrollBy({ left: 200, behavior: 'smooth' });
    });
  }

  // Auto-scroll active tab into view on load
  // Use requestAnimationFrame to ensure scrolling happens after layout is complete
  const scrollActiveTabIntoView = () => {
    const activeTabButton = tabButtons[activeTabIndex];
    if (!activeTabButton) return;

    const isMobile = window.innerWidth <= 480;

    if (isMobile) {
      // Mobile: Position active tab at left edge
      const scrollOffset = activeTabButton.offsetLeft;
      tabNav.scrollTo({
        left: scrollOffset,
        behavior: 'smooth',
      });
    } else if (activeTabIndex > 0) {
      // Desktop: Center active tab within tabNav only if it's not the first tab
      // (avoids triggering unwanted page scroll on initial load)
      const containerWidth = tabNav.offsetWidth;
      const tabLeft = activeTabButton.offsetLeft;
      const tabWidth = activeTabButton.offsetWidth;
      const targetScroll = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      tabNav.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'instant',
      });
    }
  };

  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    // Double rAF ensures layout is fully settled before scrolling
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollActiveTabIntoView);
    });
  } else {
    scrollActiveTabIntoView();
  }

  // Re-calculate scroll position on window resize (mobile ↔ desktop)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      scrollActiveTabIntoView();
    }, 250);
  });
}
