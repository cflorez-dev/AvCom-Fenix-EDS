import { getLinkButtonStyles } from '../atoms/link-button/link-button.js';

/**
 * Valid color variants supported by LinkButton
 */
const VALID_COLOR_VARIANTS = ['informative', 'promotional', 'caution'];

/**
 * Validate that a value is a safe CSS color (hex 3-8 digits or rgb/rgba).
 * Strict whitelist regex with anchors to prevent CSS injection
 * (e.g. "red; background: url(javascript:...)" is rejected).
 * @param {string} value
 * @returns {boolean}
 */
const isSafeColor = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s,.%]+\))$/.test(value.trim());
};

/**
 * Check if a URL is internal (same origin) or external
 * @param {string} url - The URL to check
 * @returns {boolean} True if internal, false if external
 */
const isInternalLink = (url) => {
  if (!url) return false;

  // Handle relative URLs (internal)
  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
    return true;
  }

  // Handle protocol-relative URLs
  if (url.startsWith('//')) {
    return false; // Consider protocol-relative as external
  }

  // Check if URL is on the same origin
  try {
    // In browser environment
    if (typeof window !== 'undefined' && window.location) {
      const linkUrl = new URL(url, window.location.origin);
      return linkUrl.origin === window.location.origin;
    }
    // In server/SSR environment, check domain
    // For Avianca, we can check if it contains avianca.com domains
    const aviancaDomains = ['avianca.com', 'avianca.co', 'avianca.com.co'];
    const urlLower = url.toLowerCase();
    return aviancaDomains.some((domain) => urlLower.includes(domain));
  } catch (e) {
    // If URL parsing fails, assume external
    return false;
  }
};

/**
 * Determine rel attribute for a link based on variant and link type
 * @param {string} variant - Alert variant
 * @param {boolean} isInternal - Whether the link is internal
 * @param {string} existingRel - Existing rel attribute value (if any)
 * @returns {string|null} The rel attribute value or null if no rel needed
 */
const getRelAttribute = (variant, isInternal, existingRel = '') => {
  // If rel already exists and includes nofollow/sponsored, preserve it
  const hasRel = existingRel
    && (existingRel.includes('nofollow') || existingRel.includes('sponsored'));
  if (hasRel) {
    return existingRel;
  }

  // Promotional alerts: external links should have nofollow or sponsored
  if (variant === 'promotional') {
    if (!isInternal) {
      // External promotional links: use sponsored (preferred) or nofollow
      const baseRel = existingRel ? `${existingRel} `.replace(/\s+$/, '') : '';
      return `${baseRel}sponsored`.trim() || 'sponsored';
    }
    // Internal promotional links: dofollow (no rel attribute needed)
    return existingRel || null;
  }

  // Informative, success, neutral: internal links are dofollow, external can be nofollow
  const isInformativeType = variant === 'informative'
    || variant === 'success'
    || variant === 'neutral';
  if (isInformativeType) {
    if (!isInternal) {
      // External informative links: can use nofollow to prevent diluting SEO
      const baseRel = existingRel ? `${existingRel} `.replace(/\s+$/, '') : '';
      return `${baseRel}nofollow`.trim() || 'nofollow';
    }
    // Internal links: dofollow (no rel attribute needed)
    return existingRel || null;
  }

  // Error and caution: typically internal links (support pages, help), dofollow
  // External links in error/caution contexts might be to external help resources
  if (variant === 'error' || variant === 'caution') {
    if (!isInternal) {
      // External error/caution links: typically to help resources, can be nofollow
      const baseRel = existingRel ? `${existingRel} `.replace(/\s+$/, '') : '';
      return `${baseRel}nofollow`.trim() || 'nofollow';
    }
    // Internal links: dofollow (no rel attribute needed)
    return existingRel || null;
  }

  // Default: preserve existing rel or return null
  return existingRel || null;
};

/**
 * Get valid color variant from variant string
 * @param {string} variant - Variant string to validate
 * @returns {string} Valid color variant or 'informative' as default
 */
const getValidColorVariant = (variant) => {
  if (VALID_COLOR_VARIANTS.includes(variant)) {
    return variant;
  }
  return 'informative';
};

/**
 * Helper function to add classes to a specific HTML tag
 * @param {string} htmlString - The HTML string to process
 * @param {string} tagName - The tag name to process (e.g., 'p', 'strong')
 * @param {string|string[]} classNames - The class name(s) to add
 * @returns {string} Processed HTML string
 */
const addClassToTag = (htmlString, tagName, classNames) => {
  // Normalize classNames to array
  const classesArray = Array.isArray(classNames) ? classNames : [classNames];
  const classesToAdd = classesArray.filter(Boolean).join(' ');

  if (!classesToAdd) return htmlString;

  const tagRegex = new RegExp(`<${tagName}(\\s+[^>]*)?>`, 'gi');
  return htmlString.replace(
    tagRegex,
    (match, attributes = '') => {
      // Check if class attribute already exists
      const classMatch = attributes.match(/class=["']([^"']*)["']/i);

      if (classMatch) {
        // Class attribute exists, merge classes
        const existingClasses = classMatch[1];
        const existingClassesArray = existingClasses.split(/\s+/);
        const newClassesArray = classesToAdd.split(/\s+/);
        // Merge and remove duplicates
        const mergedClasses = [...new Set([...existingClassesArray, ...newClassesArray])]
          .filter(Boolean)
          .join(' ');
        return match.replace(
          /class=["']([^"']*)["']/i,
          `class="${mergedClasses}"`,
        );
      }
      // No class attribute, add one with classes
      return `<${tagName} class="${classesToAdd}"${attributes}>`;
    },
  );
};

/**
 * Process <a> tags to apply LinkButton styles and rel attributes
 * @param {string} htmlString - The HTML string to process
 * @param {Object} [linkButtonOptions] - LinkButton style options
 * @param {string} [linkButtonOptions.variant='link'] - Link variant
 * @param {string} [linkButtonOptions.size='default'] - Link size
 * @param {string} [linkButtonOptions.colorVariant='informative'] - Color variant
 * @param {boolean} [linkButtonOptions.iconOnly=false] - Icon-only mode
 * @param {boolean} [linkButtonOptions.disabled=false] - Disabled state
 * @param {string} [linkButtonOptions.customClassName=''] - Additional CSS classes
 * @param {boolean} [linkButtonOptions.underline=false] - Opt-in underline for `variant='link'`.
 *   Defaults to `false` (links inside cards / CTAs render without underline). Set to `true`
 *   when this helper is used in rich-text contexts where underline is expected.
 * @param {string} [linkButtonOptions.alertVariant] - Alert variant for rel processing
 * @param {boolean} [linkButtonOptions.processRelAttributes=false] - Process rel attributes
 * @param {'self'|'blank'} [linkButtonOptions.linkTarget='self'] - Target for links
 * @returns {string} Processed HTML string
 */
const processLinkTags = (htmlString, linkButtonOptions = {}) => {
  // NOTE: when linkButtonOptions.customLinkColor is passed, getLinkButtonStyles returns
  // { className, style }. We only need className here for class processing — the style
  // is applied as inline style="color: <hex>" in the final <a> tag below.
  const linkButtonResult = getLinkButtonStyles({
    variant: linkButtonOptions.variant || 'link',
    size: linkButtonOptions.size || 'default',
    colorVariant: linkButtonOptions.colorVariant || 'informative',
    iconOnly: linkButtonOptions.iconOnly || false,
    disabled: linkButtonOptions.disabled || false,
    underline: linkButtonOptions.underline || false,
    customClassName: linkButtonOptions.customClassName || '',
    customColor: linkButtonOptions.customLinkColor || null,
  });

  const linkButtonClasses = typeof linkButtonResult === 'string'
    ? linkButtonResult
    : linkButtonResult.className;

  // Defense in depth: validate customLinkColor even if upstream callers should have
  const rawCustomLinkColor = linkButtonOptions.customLinkColor || null;
  const customLinkColor = rawCustomLinkColor && isSafeColor(rawCustomLinkColor)
    ? rawCustomLinkColor
    : null;

  // Replace border-border-stroke-focus with border-text-normal-primary
  const processedLinkButtonClasses = linkButtonClasses
    .replace('focus-visible:after:border-border-stroke-focus', 'focus-visible:after:border-text-normal-primary')
    .replace(/hover:text-text-link-\w+-active/g, '')
    .replace(/active:text-text-link-\w+-active/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  // Process <a> tags including their content to handle <u> tags inside
  const linkRegex = /<a(\s+[^>]*)?>([\s\S]*?)<\/a>/gi;
  return htmlString.replace(
    linkRegex,
    (match, attributes = '', content = '') => {
      let processedAttributes = attributes;
      let processedContent = content;

      // No need to process <u> or <strong> tags inside links anymore
      // The hover:font-bold class on the <a> tag already handles the bold effect for all content

      // Process rel attributes if enabled
      const shouldProcessRel = linkButtonOptions.processRelAttributes
        && linkButtonOptions.alertVariant;
      if (shouldProcessRel) {
        // Extract href and existing rel
        const hrefMatch = attributes.match(/href=["']([^"']*)["']/i);
        const relMatch = attributes.match(/rel=["']([^"']*)["']/i);

        if (hrefMatch) {
          const href = hrefMatch[1];
          const existingRel = relMatch ? relMatch[1] : '';
          const isInternal = isInternalLink(href);
          const newRel = getRelAttribute(
            linkButtonOptions.alertVariant,
            isInternal,
            existingRel,
          );

          if (newRel) {
            // Update or add rel attribute
            if (relMatch) {
              processedAttributes = processedAttributes.replace(
                /rel=["']([^"']*)["']/i,
                `rel="${newRel}"`,
              );
            } else {
              processedAttributes = `${processedAttributes} rel="${newRel}"`;
            }
          } else if (relMatch && !newRel) {
            // Remove rel if it should be dofollow (internal key links)
            processedAttributes = processedAttributes.replace(
              /\s*rel=["'][^"']*["']/i,
              '',
            );
          }
        }
      }

      // Process linkTarget option - add target="_blank" and security attributes
      if (linkButtonOptions.linkTarget === 'blank') {
        // Add target="_blank" if not already present
        if (!processedAttributes.match(/\btarget\s*=/i)) {
          processedAttributes = `${processedAttributes} target="_blank"`;
        }

        // Add noopener noreferrer for security when opening in new tab
        const currentRelMatch = processedAttributes.match(/rel=["']([^"']*)["']/i);
        if (currentRelMatch) {
          const currentRel = currentRelMatch[1];
          const relParts = currentRel.split(/\s+/).filter(Boolean);
          if (!relParts.includes('noopener')) {
            relParts.push('noopener');
          }
          if (!relParts.includes('noreferrer')) {
            relParts.push('noreferrer');
          }
          processedAttributes = processedAttributes.replace(
            /rel=["'][^"']*["']/i,
            `rel="${relParts.join(' ')}"`,
          );
        } else {
          processedAttributes = `${processedAttributes} rel="noopener noreferrer"`;
        }
      }

      // Build inline style attribute if customLinkColor is provided
      const inlineStyle = customLinkColor
        ? ` style="color: ${customLinkColor}"`
        : '';

      // Check if class attribute already exists
      const classMatch = processedAttributes.match(/class=["']([^"']*)["']/i);
      if (classMatch) {
        // Class attribute exists, merge with LinkButton classes
        const existingClasses = classMatch[1];
        // Split classes to avoid duplicates
        const existingClassesArray = existingClasses.split(/\s+/);
        const linkButtonClassesArray = processedLinkButtonClasses.split(/\s+/);
        // Add hover, active, focus, and focus-visible font-bold states
        // Override focus border inset to 0px (right at the edge, not outside or too inside)
        const mergedClasses = [...new Set([...existingClassesArray, 'p-[2px]', 'group/link', 'hover:font-bold', 'active:font-bold', 'focus:font-bold', 'focus-visible:font-bold', 'focus-visible:after:!inset-[0px]', ...linkButtonClassesArray])]
          .filter(Boolean)
          .join(' ');
        // Strip any existing style attribute from processedAttributes if customLinkColor came (we'll add ours)
        let attrsForReturn = processedAttributes;
        if (customLinkColor) {
          attrsForReturn = attrsForReturn.replace(/\s*style=["'][^"']*["']/i, '');
        }
        return `<a${attrsForReturn.replace(
          /class=["']([^"']*)["']/i,
          `class="${mergedClasses}"`,
        )}${inlineStyle}>${processedContent}</a>`;
      }
      // No class attribute, add LinkButton classes with padding
      // Add hover, active, focus, and focus-visible font-bold states
      // Override focus border inset to 0px (right at the edge, not outside or too inside)
      return `<a class="p-[2px] group/link hover:font-bold active:font-bold focus:font-bold focus-visible:font-bold focus-visible:after:!inset-[0px] ${processedLinkButtonClasses}"${processedAttributes}${inlineStyle}>${processedContent}</a>`;
    },
  );
};

/**
 * Process HTML content to add Tailwind classes to specific elements
 *
 * @param {string} htmlString - The HTML string to process
 * @param {string} variant - Alert variant
 * @param {Object} options - Processing options
 * @param {string} [options.pClassName='text-sm'] - Class name to add to <p> elements
 * @param {string} [options.strongClassName='font-bold'] - Class name to add to <strong>
 * @param {Object} [options.linkButtonOptions] - Options to apply LinkButton styles
 * @param {string} [options.linkButtonOptions.variant='link'] - LinkButton variant
 * @param {string} [options.linkButtonOptions.size='default'] - LinkButton size
 * @param {string} [options.linkButtonOptions.colorVariant='informative'] - Color variant
 * @param {boolean} [options.linkButtonOptions.iconOnly=false] - Icon-only mode
 * @param {boolean} [options.linkButtonOptions.disabled=false] - Disabled state
 * @param {string} [options.linkButtonOptions.customClassName=''] - Additional CSS classes
 * @param {boolean} [options.processRelAttributes=false] - Process rel attributes for SEO
 * @returns {string} Processed HTML string
 */
export const processContentHTML = (htmlString, variant, options = {}) => {
  const {
    pClassName = 'text-sm',
    strongClassName = 'font-bold',
    linkButtonOptions,
    processRelAttributes = false,
    customLinkColor = null,
  } = options;

  if (!htmlString) return '';

  let processedHTML = htmlString;

  // Process <p> tags - add className with zero vertical padding
  processedHTML = addClassToTag(processedHTML, 'p', [pClassName, 'pt-0', 'pb-0', '!m-0']);

  // Process <strong> tags
  processedHTML = addClassToTag(processedHTML, 'strong', strongClassName);

  // Process heading tags (h1-h6) - remove margins with !important
  const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  headingTags.forEach((tag) => {
    processedHTML = addClassToTag(processedHTML, tag, '!m-0');
  });

  // Process <ul> tags - add list-disc class for disc style and padding-left
  processedHTML = addClassToTag(processedHTML, 'ul', ['list-disc', 'pl-5']);

  // Process <ol> tags - add list-decimal class for decimal numbering and padding-left
  processedHTML = addClassToTag(processedHTML, 'ol', ['list-decimal', 'pl-5']);

  // Process <a> tags with LinkButton styles
  // If linkButtonOptions is provided, use those settings
  // Otherwise, use default LinkButton styles
  // Use variant as colorVariant if it's one of the supported variants
  // (informative, promotional, caution), otherwise default to 'informative'
  // If linkButtonOptions.colorVariant is explicitly set, it takes precedence
  let colorVariant = 'informative';
  if (linkButtonOptions?.colorVariant) {
    colorVariant = linkButtonOptions.colorVariant;
  } else if (variant) {
    colorVariant = getValidColorVariant(variant);
  }

  const finalLinkButtonOptions = {
    variant: 'link',
    size: 'default',
    ...linkButtonOptions,
    colorVariant,
    alertVariant: variant,
    processRelAttributes,
    customLinkColor: options.customLinkColor || linkButtonOptions?.customLinkColor || null,
  };

  processedHTML = processLinkTags(processedHTML, finalLinkButtonOptions);

  return processedHTML;
};

export default processContentHTML;
