import { h, render } from '@dropins/tools/preact.js';
import htm from 'htm';
import { readBlockConfig } from '../../scripts/aem.js';
import { Button } from '../../design-system/atoms/button/button.js';
import { LinkButton } from '../../design-system/atoms/link-button/link-button.js';
import { Icon } from '../../design-system/atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * Maps block HTML data to a structured object
 * Expected structure: divs containing field values in order:
 * - text, variant, icon, iconPosition, linkType, href, target, tooltip, title, customAttributes
 *
 * @param {Element} block The cms-button block element
 * @returns {Object} Mapped data object with button configuration
 */
function mapBlockData(block) {
  const divs = Array.from(block.querySelectorAll(':scope > div'));

  // Helper function to extract text content from nested div > div > p structure
  const extractValue = (div) => {
    if (!div) return '';

    // Check if there's a link (for href field)
    const link = div.querySelector('a');
    if (link) {
      return link.href || link.textContent.trim();
    }

    // Check for nested div > p structure
    const innerDiv = div.querySelector(':scope > div');
    if (innerDiv) {
      const paragraph = innerDiv.querySelector('p');
      if (paragraph) {
        return paragraph.textContent.trim();
      }
      return innerDiv.textContent.trim();
    }

    return div.textContent.trim();
  };

  // Helper function to parse customAttributes from text format
  // Handles formats like: "aria-label":"buy now" "data-tracking":"cta-buy"
  // or proper JSON: {"aria-label":"buy now","data-tracking":"cta-buy"}
  const parseCustomAttributes = (value) => {
    if (!value || value.trim() === '') return '';

    const trimmed = value.trim();

    // Try to parse as JSON first
    if (trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // If JSON parsing fails, try to convert string format to JSON
      }
    }

    // Handle string format: "key":"value" "key2":"value2"
    try {
      // Replace space-separated key-value pairs with commas
      const jsonString = trimmed.replace(/"\s+"/g, '","').replace(/:\s*"/g, ':"');
      // Wrap in braces if not already wrapped
      const wrapped = jsonString.startsWith('{') ? jsonString : `{${jsonString}}`;
      return JSON.parse(wrapped);
    } catch (e) {
      // If all parsing fails, return as string
      // eslint-disable-next-line no-console
      console.warn('cms-button: Could not parse customAttributes, returning as string', e);
      return trimmed;
    }
  };

  // Map data based on div order according to model fields
  // Order: text, variant, icon, iconPosition, linkType, href, target, tooltip,
  // title, customAttributes
  // Note: Some blocks may have additional fields (like "size") that we skip
  let index = 0;

  const mappedData = {
    text: '',
    variant: '',
    icon: '',
    iconPosition: '',
    linkType: '',
    href: '',
    target: '',
    tooltip: '',
    title: '',
    customAttributes: '',
  };

  // Extract text (index 0)
  if (divs[index]) {
    mappedData.text = extractValue(divs[index]);
    index += 1;
  }

  // Extract variant (index 1)
  if (divs[index]) {
    mappedData.variant = extractValue(divs[index]);
    index += 1;
  }

  // Extract icon (index 2) - simple text field
  if (divs[index]) {
    const iconValue = extractValue(divs[index]);
    // Store the icon name as-is (empty string if not provided)
    mappedData.icon = iconValue;
    index += 1;
  }

  // Extract iconPosition (index 3 or 4)
  if (divs[index]) {
    mappedData.iconPosition = extractValue(divs[index]);
    index += 1;
  }

  // Extract linkType (index 4 or 5)
  if (divs[index]) {
    mappedData.linkType = extractValue(divs[index]);
    index += 1;
  }

  // Extract href (index 5 or 6) - special handling for links
  if (divs[index]) {
    const hrefDiv = divs[index];
    const link = hrefDiv.querySelector('a');
    if (link) {
      mappedData.href = link.href || link.getAttribute('href') || link.textContent.trim();
    } else {
      mappedData.href = extractValue(hrefDiv);
    }
    index += 1;
  }

  // Extract target (index 6 or 7)
  if (divs[index]) {
    mappedData.target = extractValue(divs[index]);
    index += 1;
  }

  // Extract tooltip (index 7 or 8)
  if (divs[index]) {
    mappedData.tooltip = extractValue(divs[index]);
    index += 1;
  }

  // Extract title (index 8 or 9)
  if (divs[index]) {
    mappedData.title = extractValue(divs[index]);
    index += 1;
  }

  // Extract customAttributes (index 9 or 10) - needs special parsing
  if (divs[index]) {
    const customAttrsValue = extractValue(divs[index]);
    mappedData.customAttributes = parseCustomAttributes(customAttrsValue);
  }

  return mappedData;
}

// Export mapBlockData for external use if needed
export { mapBlockData };

/**
 * Decorates the CMS Button block
 * Renders configurable buttons using design system components
 * Supports primary/secondary/tertiary variants, icons, tooltips, and multiple link types
 *
 * @param {Element} block The cms-button block element
 */
export default function decorate(block) {
  // 1. Detect Author Mode (Universal Editor)
  const isAuthorEnv = window.xwalk?.isAuthorEnv;

  if (isAuthorEnv) {
    // Preserve editable content for Universal Editor
    block.classList.add('cms-button-author-mode');

    // Add visual indicator for the author
    const authorIndicator = document.createElement('div');
    authorIndicator.textContent = '🔘 CMS Button (Author Mode - Edit below)';
    authorIndicator.style.cssText = 'background: #f0f0f0; padding: 8px; border: 1px dashed #0066cc; margin-bottom: 8px; font-size: 12px; color: #666;';
    block.insertBefore(authorIndicator, block.firstChild);

    // Exit without transforming - keep content editable
    return;
  }

  // 2. Production Mode: Map block data
  const mappedData = mapBlockData(block);
  // Fallback to readBlockConfig if available
  const config = readBlockConfig(block);

  // Extract configuration with default values, prioritizing mappedData
  const text = mappedData.text || config.text || '';
  const variant = mappedData.variant || config.variant || 'primary';
  // Icon is now a simple text field - use value as-is (empty string = no icon)
  const icon = mappedData.icon || config.icon || '';
  const iconPosition = mappedData.iconPosition || config.iconPosition || 'prefix';
  const linkType = mappedData.linkType || config.linkType || 'internal';
  const href = mappedData.href || config.href || '';
  const target = (mappedData.target && mappedData.target.trim()) || (config.target && config.target.trim()) || '_self';
  const tooltip = mappedData.tooltip || config.tooltip || '';
  const title = mappedData.title || config.title || '';

  // Parse custom attributes
  let customAttrs = {};
  const customAttributesValue = mappedData.customAttributes || config.customAttributes || '';

  if (customAttributesValue) {
    if (typeof customAttributesValue === 'object') {
      // Already parsed as object
      customAttrs = customAttributesValue;
    } else if (typeof customAttributesValue === 'string' && customAttributesValue.trim()) {
      try {
        customAttrs = JSON.parse(customAttributesValue);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('cms-button: Error parsing customAttributes JSON', error);
      }
    }
  }

  // 3. Create main container
  const container = document.createElement('div');
  container.className = 'cms-button-container';

  // 4. Determine if it's Button or LinkButton
  const isTertiary = variant === 'tertiary';

  // Helper function to extract hash/ID from a URL
  // Handles full URLs with hash, hash only, or ID only
  const extractAnchorId = (url) => {
    if (!url) return '';
    if (url.includes('#')) {
      // If URL contains a hash, extract only the hash part
      const hashIndex = url.indexOf('#');
      return url.substring(hashIndex);
    }
    if (url.startsWith('#')) {
      // If it already starts with #, use it directly
      return url;
    }
    // If it's just an ID without hash, add the #
    return `#${url}`;
  };

  // 5. Build component props
  // Button accepts: "xxs" | "xs" | "sm" | "md" | "lg" | "icon"
  // LinkButton accepts: "compact" | "default" | "medium" | "large" | "huge"
  // Detect icon-only mode (has icon but no text)
  const hasIcon = icon && icon.trim() !== '';
  const hasText = text && text.trim() !== '';
  const isIconOnly = hasIcon && !hasText;

  const buttonProps = {
    variant: isTertiary ? 'link' : variant, // tertiary uses LinkButton variant="link"
    size: isTertiary ? 'medium' : 'md', // LinkButton uses "medium", Button uses "md"
    customClassName: isIconOnly ? 'cms-button-element' : 'cms-button-element w-full', // No w-full for icon-only
    title: title || text, // Fallback to text if no title
    iconOnly: isIconOnly, // Enable icon-only mode when no text present
    ...customAttrs, // Spread custom attributes (aria-*, data-*, etc)
  };

  // Navigation function that respects linkType and target
  const handleNavigation = (e, url, linkTypeValue, targetValue) => {
    // Prevent default behavior to have full control
    e.preventDefault();

    if (linkTypeValue === 'anchor') {
      // Anchor: smooth scroll to element
      // Extract hash from URL using helper function
      const anchorId = extractAnchorId(url);

      const targetElement = document.querySelector(anchorId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL without reloading page (optional, to maintain hash in URL)
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', anchorId);
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn(`cms-button: Element with ID not found: ${anchorId}`);
      }
    } else if (linkTypeValue === 'external' || linkTypeValue === 'internal') {
      // If it's LinkButton with normal href, let browser handle navigation
      if (isTertiary && href && linkTypeValue !== 'anchor') {
        return; // LinkButton already handles navigation with href for normal links
      }
      // Determine target based on linkType and model target
      let finalTarget = targetValue;

      // If no target specified, use default values according to linkType
      if (!finalTarget || finalTarget === '') {
        finalTarget = linkTypeValue === 'external' ? '_blank' : '_self';
      }

      // Navigate according to target
      if (finalTarget === '_blank') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    } else if (linkTypeValue === 'modal') {
      // Modal: add data attribute to identify modal
      // eslint-disable-next-line no-console
      console.log(`Open modal: ${url}`);
      // Modal logic can be implemented here
    } else if (linkTypeValue === 'action') {
      // Action: custom handler
      // eslint-disable-next-line no-console
      console.log(`Execute action: ${url}`);
    }
  };

  // Add href and onClick if exists
  if (href) {
    if (linkType === 'anchor') {
      // Anchor: extract hash from URL using helper function
      const anchorHref = extractAnchorId(href);

      // For anchors, always use onClick to control smooth scroll
      // for both Button and LinkButton
      buttonProps.href = anchorHref; // Keep href for accessibility and SEO
      buttonProps.onClick = (e) => handleNavigation(e, anchorHref, linkType, target);
    } else if (linkType === 'external' || linkType === 'internal') {
      // Determine target based on linkType and model target
      let finalTarget = target;
      if (!finalTarget || finalTarget === '') {
        finalTarget = linkType === 'external' ? '_blank' : '_self';
      }

      if (isTertiary) {
        // LinkButton: use href and target directly
        buttonProps.href = href;
        buttonProps.target = finalTarget;
        // Add rel="noopener noreferrer" for security on external links
        if (finalTarget === '_blank') {
          buttonProps.rel = 'noopener noreferrer';
        }
      } else {
        // Button: use onClick for navigation
        buttonProps.onClick = (e) => handleNavigation(e, href, linkType, finalTarget);
      }
    } else if (linkType === 'modal') {
      // Modal: add data attribute to identify modal
      buttonProps['data-modal-id'] = href;
      buttonProps.onClick = (e) => handleNavigation(e, href, linkType, target);
    } else if (linkType === 'action') {
      // Action: custom handler (can be extended)
      buttonProps['data-action'] = href;
      buttonProps.onClick = (e) => handleNavigation(e, href, linkType, target);
    }
  }

  // Add tooltip if exists
  if (tooltip) {
    buttonProps['data-tooltip'] = tooltip;
    buttonProps['aria-label'] = buttonProps['aria-label'] || tooltip;
  }

  // 6. Build children (text + icon)
  const renderChildren = () => {
    if (!hasIcon) {
      // Text only
      return text;
    }

    // Icon only mode - render with avi-button__icon
    if (isIconOnly) {
      return html`
        <span class="max-h-[1.25rem]">
          <${Icon} icon=${icon} />
        </span>
      `;
    }

    // For tertiary (LinkButton), use Tailwind classes that respond to group
    // For primary/secondary, use color prop directly
    const getIconProps = () => {
      if (isTertiary) {
        // LinkButton: use currentColor so CSS classes control the color
        // Classes respond to hover/active of parent group
        return {
          color: 'currentColor',
          customClassName: 'text-text-link-informative-default group-hover/cms-button:text-text-link-informative-active group-active/cms-button:text-text-link-informative-active',
        };
      }
      // Button: use color prop as before
      if (variant === 'primary') {
        return { color: 'var(--color-text-brand-primary)' };
      }
      if (variant === 'secondary') {
        return { color: 'var(--color-text-normal-primary)' };
      }
      return { color: 'var(--color-text-link-informative-default)' };
    };

    // With icon and text
    const iconProps = getIconProps();
    const iconElement = html`
      <${Icon} icon=${icon} size="m" ...${iconProps} />
    `;

    if (iconPosition === 'suffix') {
      // Text + Icon
      return html`
        <span>${text}</span>
        ${iconElement}
      `;
    }

    // Icon + Text (prefix)
    return html`
      ${iconElement}
      <span>${text}</span>
    `;
  };

  // 7. Render component according to variant
  const ButtonComponent = isTertiary ? LinkButton : Button;

  render(
    html`
    <div class="cms-button-container w-full my-2">
      <${ButtonComponent} ...${buttonProps} customClassName="group/cms-button ">
        <div class="flex items-center justify-center gap-[12px]">
          ${renderChildren()}
        </div>
      </${ButtonComponent}>
    </div>
    `,
    container,
  );

  // 8. Block metadata
  container.dataset.variant = variant;
  container.dataset.linkType = linkType;

  // 9. Hide & Render Sibling Pattern:
  // Hide original block (DO NOT delete - preserve for Universal Editor)
  block.style.display = 'none';

  // Insert transformed content as sibling element
  block.parentNode.insertBefore(container, block.nextSibling);
}
