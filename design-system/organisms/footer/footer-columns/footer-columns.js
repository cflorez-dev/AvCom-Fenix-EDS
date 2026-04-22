import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Accordion } from '../../../molecules/accordion/accordion.js';
import loadSVGIcon from '../../../../scripts/utils/svg.helper.js';
import { sanitizeSVG } from '../../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * FooterColumns - Component that renders the footer columns
 *
 * ## Props
 * - `columns`: Array of columns (maximum 5)
 * - `customClassName`: Additional CSS classes
 * - `...rest`: Other valid properties
 *
 * ## Responsive Behavior
 * - Desktop (> 1156px): Shows horizontal columns with titles and links
 * - Mobile (<= 1156px): Shows vertically stacked accordions
 */
export const FooterColumns = ({
  columns = [],
  customClassName = '',
  ...rest
}) => {
  // Limit to maximum 5 columns
  const displayColumns = columns.slice(0, 5);
  const [openInNewIcon, setOpenInNewIcon] = useState(null);

  // Load the open_in_new icon
  useEffect(() => {
    const loadIcon = async () => {
      try {
        const codeBasePath = window.hlx?.codeBasePath || '';
        const iconPath = `${codeBasePath}/icons/open_in_new.svg`;
        const iconSVG = await loadSVGIcon(iconPath);
        // Set SVG size to 16x16px
        iconSVG.setAttribute('width', '16');
        iconSVG.setAttribute('height', '16');
        setOpenInNewIcon(iconSVG);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading open_in_new icon:', error);
      }
    };
    loadIcon();
  }, []);

  // Render the icon as inline SVG
  const renderOpenInNewIcon = () => {
    if (!openInNewIcon) return null;
    return html`
      <span 
        dangerouslySetInnerHTML=${{ __html: sanitizeSVG(openInNewIcon.outerHTML) }}
        class="flex-shrink-0 footer-column-link-icon inline-flex w-4 h-4 text-[var(--text-normal-light)]"
        aria-hidden="true"
      />
    `;
  };

  // Render a link with icon
  const renderLink = (item) => {
    // If the URL starts with / it's internal, otherwise it's external
    const isExternal = item.url && !item.url.startsWith('/');

    return html`
      <a
        href=${item.url || '#'}
        target=${isExternal ? '_blank' : undefined}
        rel=${isExternal ? 'noopener noreferrer' : undefined}
        class="footer-column-link self-stretch h-[24px] inline-flex items-center gap-[8px] transition-colors duration-200 text-[var(--text-normal-light)] text-[16px] font-normal leading-[24px] break-words no-underline hover:underline"
      >
        <span class="footer-column-link-text">
          ${item.label}
        </span>
        ${isExternal ? renderOpenInNewIcon() : null}
      </a>
    `;
  };

  // Render column for desktop
  const renderDesktopColumn = (column) => html`
    <div class="footer-column-desktop flex flex-col gap-[24px]">
      <h4
        class="footer-column-title !m-0 w-full !text-[18px] !font-bold break-words text-[var(--text-normal-lighter)]"
      >
        ${column.title}
      </h4>
      <ul class="footer-column-list flex flex-col list-none p-0 !m-0 gap-[12px]">
        ${column.subItems.map((item) => html`
          <li class="footer-column-item">
            ${renderLink(item)}
          </li>
        `)}
      </ul>
    </div>
  `;

  // Render column for mobile (accordion)
  const renderMobileColumn = (column) => html`
    <${Accordion}
      title=${column.title}
      defaultOpen=${false}
      customClassName="footer-column-accordion w-full"
    >
      <ul class="footer-column-list-mobile flex flex-col list-none p-0 w-full !m-0 gap-3">
        ${column.subItems.map((item) => html`
          <li class="footer-column-item-mobile h-[48px] py-3">
            ${renderLink(item)}
          </li>
        `)}
      </ul>
    </${Accordion}>
  `;

  if (displayColumns.length === 0) {
    return null;
  }

  return html`
    <div
      class="footer-columns-container max-w-xl w-full flex justify-center ${customClassName}"
      ...${rest}
    >
      <!-- Desktop View: CSS Grid with 5 equal columns -->
      <!-- Visible only when width is greater than 1156px -->
      <div class="footer-columns-desktop max-w-xl w-full hidden min-[1157px]:flex justify-between gap-[1.5rem] ">
        ${displayColumns.map((column) => renderDesktopColumn(column))}
      </div>

      <!-- Mobile View: Stacked accordions -->
      <!-- Visible only when width is less than or equal to 1156px -->
      <div class="footer-columns-mobile flex flex-col min-[1157px]:hidden gap-[var(--gap-8)] w-full">
        ${displayColumns.map((column) => renderMobileColumn(column))}
      </div>
    </div>
  `;
};

export default FooterColumns;
