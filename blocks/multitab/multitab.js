import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { loadBlock } from '../../scripts/aem.js';
import { Icon } from '../../design-system/atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * Reads block configuration by position (Universal Editor saves values without labels)
 * Row order: group-id, default-tab, enable-from, enable-to, target-languages, show
 * @param {HTMLElement} block - The block element
 * @returns {Object} Configuration object
 */
function readMultitabConfig(block) {
  const rows = [...block.children];
  const getValue = (rowIndex) => {
    const row = rows[rowIndex];
    if (!row) return '';
    const cell = row.querySelector('div > div, div > p');
    return cell?.textContent?.trim() || '';
  };

  return {
    'group-id': getValue(0),
    'default-tab': getValue(1),
    'enable-from': getValue(2),
    'enable-to': getValue(3),
    'target-languages': getValue(4),
    size: getValue(5) || 'large',
    'show-chevrons': getValue(6) === 'true',
    show: getValue(7) || 'true',
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
  const targetLanguages = config['target-languages']
    ? config['target-languages'].split(',').map((lang) => lang.trim().toLowerCase())
    : [];
  const show = config.show !== 'false';

  const now = new Date();
  const currentLang = document.documentElement.lang?.toLowerCase() || 'en';

  // Check feature flags
  if (!show) {
    block.style.display = 'none';
    return;
  }

  if (enableFrom && now < enableFrom) {
    block.style.display = 'none';
    return;
  }

  if (enableTo && now > enableTo) {
    block.style.display = 'none';
    return;
  }

  if (targetLanguages.length > 0 && !targetLanguages.includes(currentLang)) {
    block.style.display = 'none';
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

    const tabLabel = sectionMetadata.multitabLabel || `Tab ${tabSections.length + 1}`;
    const tabSecondaryLabel = sectionMetadata.multitabSecondaryLabel || null;
    const tabIcon = sectionMetadata.multitabIcon || null;
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

  // Create tab navigation wrapper
  const tabNavWrapper = document.createElement('div');
  tabNavWrapper.className = 'relative flex items-center';

  // Chevron before (left arrow)
  let chevronBefore = null;
  if (showChevrons) {
    chevronBefore = document.createElement('button');
    chevronBefore.className = `
      flex items-center justify-center shrink-0 size-[36px]
      text-[var(--text-normal-primary)] hover:text-[var(--text-link-informative-default)]
      transition-colors duration-200
    `.trim().replace(/\s+/g, ' ');
    chevronBefore.setAttribute('aria-label', 'Scroll tabs left');
    chevronBefore.innerHTML = '<svg class="size-[16px]" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
    tabNavWrapper.appendChild(chevronBefore);
  }

  // Create tab navigation
  const tabNav = document.createElement('div');
  tabNav.className = 'flex overflow-x-auto scroll-smooth flex-1';
  tabNav.setAttribute('role', 'tablist');
  tabNav.setAttribute('aria-label', 'Content tabs');
  tabNav.style.scrollbarWidth = 'none'; // Firefox
  tabNav.style.msOverflowStyle = 'none'; // IE/Edge
  tabNavWrapper.appendChild(tabNav);

  // Chevron after (right arrow)
  let chevronAfter = null;
  if (showChevrons) {
    chevronAfter = document.createElement('button');
    chevronAfter.className = `
      flex items-center justify-center shrink-0 size-[36px]
      text-[var(--text-normal-primary)] hover:text-[var(--text-link-informative-default)]
      transition-colors duration-200
    `.trim().replace(/\s+/g, ' ');
    chevronAfter.setAttribute('aria-label', 'Scroll tabs right');
    chevronAfter.innerHTML = '<svg class="size-[16px]" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';
    tabNavWrapper.appendChild(chevronAfter);
  }

  // Create tabs
  const tabButtons = [];
  tabSections.forEach((tabData, index) => {
    const isActive = index === activeTabIndex;

    // Size-specific dimensions (Figma specs)
    const tabHeight = size === 'large' ? 'h-[80px]' : 'h-[64px]';
    const tabPadding = size === 'large' ? 'px-[var(--x-x-large,32px)]' : 'px-[var(--x-large,24px)]';
    const primaryFontSize = size === 'large' ? 'text-[18px]' : 'text-[16px]';
    const secondaryFontSize = 'text-[14px]';

    const tabButton = document.createElement('button');
    tabButton.className = `
      flex flex-col ${tabHeight} ${tabPadding} gap-[var(--tiny,4px)]
      items-center justify-center shrink-0 relative isolate
      transition-all duration-200 cursor-pointer
    `.trim().replace(/\s+/g, ' ');
    tabButton.style.pointerEvents = 'auto';

    tabButton.setAttribute('role', 'tab');
    tabButton.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tabButton.setAttribute('aria-controls', `panel-${tabData.id}`);
    tabButton.setAttribute('id', `btn-${tabData.id}`);
    tabButton.setAttribute('tabindex', isActive ? '0' : '-1');

    // Title container (supports primary + secondary text layout)
    const titleContainer = document.createElement('div');
    titleContainer.className = `
      flex gap-[4px] items-center justify-center relative w-full z-[5]
    `.trim().replace(/\s+/g, ' ');

    // Icon before label
    if (tabData.icon && tabData.iconPosition === 'before') {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'flex items-center justify-center size-[16px] shrink-0';
      iconSpan.setAttribute('data-name', 'icon');
      const iconColor = isActive ? 'var(--text-normal-primary)' : 'var(--text-normal-secondary)';
      render(html`<${Icon} icon=${tabData.icon} customSize=${16} color=${iconColor} />`, iconSpan);
      titleContainer.appendChild(iconSpan);
    }

    // Primary label
    const labelSpan = document.createElement('span');
    labelSpan.className = `
      ${primaryFontSize} leading-normal overflow-hidden text-ellipsis
      ${isActive ? 'font-bold text-[var(--text-normal-primary)]' : 'font-normal text-[var(--text-normal-secondary)]'}
    `.trim().replace(/\s+/g, ' ');
    labelSpan.textContent = tabData.label;
    titleContainer.appendChild(labelSpan);

    // Icon after label
    if (tabData.icon && tabData.iconPosition === 'after') {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'flex items-center justify-center size-[16px] shrink-0';
      iconSpan.setAttribute('data-name', 'icon');
      const iconColor = isActive ? 'var(--text-normal-primary)' : 'var(--text-normal-secondary)';
      render(html`<${Icon} icon=${tabData.icon} customSize=${16} color=${iconColor} />`, iconSpan);
      titleContainer.appendChild(iconSpan);
    }

    tabButton.appendChild(titleContainer);

    // Secondary label (optional)
    if (tabData.secondaryLabel) {
      const secondarySpan = document.createElement('span');
      secondarySpan.className = `
        ${secondaryFontSize} font-normal leading-[1.5] overflow-hidden text-ellipsis
        text-[var(--text-normal-secondary)] z-[4]
      `.trim().replace(/\s+/g, ' ');
      secondarySpan.textContent = tabData.secondaryLabel;
      tabButton.appendChild(secondarySpan);
    }

    // Green indicator (active only)
    if (isActive) {
      const indicator = document.createElement('div');
      indicator.className = 'absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-accent-positive,#1ea93c)] z-[2]';
      indicator.setAttribute('data-name', 'indicator');
      tabButton.appendChild(indicator);
    }

    // Bottom border (all tabs)
    const border = document.createElement('div');
    border.className = 'absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border-stroke-default,#d9d9d9)] z-[1]';
    border.setAttribute('data-name', 'border');
    tabButton.appendChild(border);

    // Store event handlers on button for later removal/re-attachment
    tabButton._multitabHoverEnterHandler = (event) => {
      const target = event.currentTarget;
      if (target.getAttribute('aria-selected') !== 'true') {
        const existingHoverIndicator = target.querySelector('[data-name="hover-indicator"]');
        if (!existingHoverIndicator) {
          const hoverIndicator = document.createElement('div');
          hoverIndicator.className = 'absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-stroke-darker,#1b1b1b)] z-[2]';
          hoverIndicator.setAttribute('data-name', 'hover-indicator');
          target.appendChild(hoverIndicator);
        }
      }
    };

    tabButton._multitabHoverLeaveHandler = (event) => {
      const target = event.currentTarget;
      const hoverIndicator = target.querySelector('[data-name="hover-indicator"]');
      if (hoverIndicator) {
        hoverIndicator.remove();
      }
    };

    // Attach hover listeners for inactive tabs
    if (!isActive) {
      tabButton.addEventListener('mouseenter', tabButton._multitabHoverEnterHandler);
      tabButton.addEventListener('mouseleave', tabButton._multitabHoverLeaveHandler);
    }

    tabButtons.push(tabButton);
    tabNav.appendChild(tabButton);
  });

  // Create tab panels
  const tabPanels = [];
  const blocksToDecorate = [];

  tabSections.forEach((tabData, index) => {
    const isActive = index === activeTabIndex;

    const tabPanel = document.createElement('div');
    tabPanel.className = `multitab-panel ${isActive ? '' : 'hidden'}`;
    tabPanel.setAttribute('role', 'tabpanel');
    tabPanel.setAttribute('id', `panel-${tabData.id}`);
    tabPanel.setAttribute('aria-labelledby', `btn-${tabData.id}`);
    tabPanel.setAttribute('tabindex', '0');

    // MOVE (not clone) section content into panel - preserves decorated blocks
    // Similar approach to accordion-group
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'multitab-content';

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

      // Find primary label span (inside titleContainer)
      const titleContainer = btn.querySelector('div[class*="gap-[4px]"]');
      const labelSpan = titleContainer?.querySelector('span:not([data-name="icon"])');
      
      if (isActive) {
        // Active state
        if (labelSpan) {
          labelSpan.classList.remove('font-normal', 'text-[var(--text-normal-secondary)]');
          labelSpan.classList.add('font-bold', 'text-[var(--text-normal-primary)]');
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
          indicator.className = 'absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--border-accent-positive,#1ea93c)] z-[2]';
          indicator.setAttribute('data-name', 'indicator');
          btn.appendChild(indicator);
        }
      } else {
        // Inactive state
        if (labelSpan) {
          labelSpan.classList.remove('font-bold', 'text-[var(--text-normal-primary)]');
          labelSpan.classList.add('font-normal', 'text-[var(--text-normal-secondary)]');
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

        // Re-attach hover listeners for newly inactive tabs
        // Remove old listeners if they exist
        if (btn._multitabHoverEnterHandler) {
          btn.removeEventListener('mouseenter', btn._multitabHoverEnterHandler);
          btn.removeEventListener('mouseleave', btn._multitabHoverLeaveHandler);
        }

        // Re-attach hover listeners using stored handlers
        btn.addEventListener('mouseenter', btn._multitabHoverEnterHandler);
        btn.addEventListener('mouseleave', btn._multitabHoverLeaveHandler);
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

    // Auto-scroll active tab into view (smooth)
    tabButtons[newIndex].scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });

    // Focus new tab button
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
    activeTabButton.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    // Double rAF ensures layout is fully settled before scrolling
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollActiveTabIntoView);
    });
  } else {
    scrollActiveTabIntoView();
  }
}
