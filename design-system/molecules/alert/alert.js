import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';
import { processContentHTML } from '../../helpers/process-content-html.js';

const html = htm.bind(h);

/**
 * Alert - Base flexible atom for notifications and alerts
 * Prepared for multiple placements and contexts
 *
 * @param {Object} props - Component properties
 * @param {'informative'|'promotional'|'caution'|'warning'|'success'|'error'|'neutral'}
 *   [props.variant='informative'] Alert visual variant (warning maps to caution)
 * @param {string} [props.contentHTML=''] - Rich text HTML content
 * @param {string} [props.icon='auto'] - Icon name or 'auto' for variant default, 'none' to hide
 * @param {boolean} [props.dismissible=true] - Show dismiss button
 * @param {Function} [props.onDismiss] - Callback when dismissed
 * @param {string} [props.dismissIconHTML=''] - Custom HTML for dismiss icon (overrides default Icon)
 * @param {string} [props.dismissButtonClassName=''] - Custom classes for dismiss button
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {boolean} [props.showIcon=true] - Show/hide icon
 * @param {boolean} [props.marqueeMode=true] - Enable marquee scrolling when content overflows,
 *   false for text wrapping
 * @param {string} [props.heightMode='marquee'] - Height mode to prevent content from collapsing
 * @param {boolean} [props.shouldMarquee] - External control for marquee state
 *   (optional, overrides internal calculation)
 * @param {Object} [props.contentRef] - External ref for content container (optional)
 * @param {boolean} [props.fullWidth=false] - Enable full-width container with inner max-width
 * @param {'self'|'blank'} [props.linkTarget='self'] - Target for links (same tab or new tab)
 * @param {boolean} [props.preserveRawHTML=false] - If true, renders HTML without processing
 *   (preserves all original attributes, classes, and structure from AEM author).
 *   Set to true to preserve raw HTML or false (default) to apply Tailwind classes and link processing.
 * @param {Object} [props.rest] - Additional props spread to container
 * @returns {import('preact').VNode} Alert component
 */

export const Alert = ({
  title,
  marqueeMode = true,
  heightMode = 'marquee',
  isRounded = false,
  variant = 'informative',
  customIcon,
  customIconColor,
  contentHTML = '',
  icon = 'auto',
  dismissible = true,
  onDismiss,
  dismissIconHTML = '',
  dismissButtonClassName = '',
  customClassName = '',
  showIcon = true,
  shouldMarquee: externalShouldMarquee,
  contentRef: externalContentRef,
  fullWidth = false,
  linkTarget = 'self',
  preserveRawHTML = false,
  ...rest
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [internalShouldMarquee, setInternalShouldMarquee] = useState(false);
  const internalContentRef = useRef(null);
  const contentRef = externalContentRef || internalContentRef;

  const shouldMarquee = externalShouldMarquee !== undefined
    ? externalShouldMarquee
    : internalShouldMarquee;

  const heightModes = {
    marquee: {
      mobile: 'max-h-auto',
      desktop: 'md:max-h-auto',
    },
  };

  // Get height classes based on heightMode
  const getHeightClasses = () => {
    const mode = heightModes[heightMode];
    if (!mode) return '';
    return `${mode.mobile} ${mode.desktop}`;
  };

  const heightClasses = getHeightClasses();

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss && typeof onDismiss === 'function') {
      onDismiss();
    }
  };

  // Map 'warning' variant to 'caution' for compatibility
  const normalizedVariant = variant === 'warning' ? 'caution' : variant;

  // Determine ARIA role and aria-live based on variant urgency
  // Error variants are critical and should interrupt screen readers
  // Other variants are informational and should be less intrusive
  const getAriaAttributes = (variantType) => {
    const mappedVariant = variantType === 'warning' ? 'caution' : variantType;

    if (mappedVariant === 'error') {
      return {
        role: 'alert',
        ariaLive: 'assertive',
      };
    }

    // Informative, promotional, success, neutral, caution use status role
    return {
      role: 'status',
      ariaLive: 'polite',
    };
  };

  const ariaAttributes = getAriaAttributes(normalizedVariant);

  // Detect overflow when marqueeMode is enabled
  // (only if shouldMarquee is not externally controlled)
  useEffect(() => {
    // Skip internal calculation if external shouldMarquee is provided
    if (externalShouldMarquee !== undefined || !marqueeMode || !contentRef.current) {
      if (externalShouldMarquee === undefined && !marqueeMode) {
        setInternalShouldMarquee(false);
      }
      return undefined;
    }

    const checkOverflow = () => {
      if (!contentRef.current) return;

      // Create a temporary element to measure content width without wrapping
      const tempDiv = document.createElement('div');
      tempDiv.className = 'absolute invisible whitespace-nowrap w-auto';
      tempDiv.innerHTML = contentHTML;
      document.body.appendChild(tempDiv);

      const contentWidth = tempDiv.scrollWidth;
      const containerWidth = contentRef.current.clientWidth;

      document.body.removeChild(tempDiv);

      setInternalShouldMarquee(contentWidth > containerWidth);
    };

    // Check immediately if content is already rendered
    if (contentRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(checkOverflow);
      });
    }

    // Use ResizeObserver to detect size changes (more efficient than window resize)
    let resizeObserver;
    if (contentRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        checkOverflow();
      });
      resizeObserver.observe(contentRef.current);
    }

    // Fallback to window resize if ResizeObserver is not available
    if (!window.ResizeObserver) {
      window.addEventListener('resize', checkOverflow);
    }

    const cleanup = () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (!window.ResizeObserver) {
        window.removeEventListener('resize', checkOverflow);
      }
    };

    return cleanup;
  }, [contentHTML, marqueeMode, externalShouldMarquee]);

  if (!isVisible) {
    return null;
  }

  const variantClasses = {
    informative: {
      bg: 'bg-alert-informative-bg',
      text: 'text-alert-informative-text',
      border: 'border-alert-informative-border',
      iconBg: null,
      iconFg: null,
    },
    promotional: {
      bg: 'bg-alert-promotional-bg',
      text: 'text-alert-promotional-text',
      border: 'border-alert-promotional-border',
      iconBg: null,
      iconFg: null,
    },
    caution: {
      bg: 'bg-alert-caution-bg',
      text: 'text-alert-caution-text',
      border: 'border-alert-caution-border',
      iconBg: null,
      iconFg: null,
    },
    success: {
      bg: 'bg-alert-success-bg',
      text: 'text-alert-success-text',
      border: 'border-alert-success-border',
      iconBg: 'bg-alert-success-icon-bg',
      iconFg: 'text-alert-success-icon-fg',
    },
    error: {
      bg: 'bg-alert-error-bg',
      text: 'text-alert-error-text',
      border: 'border-alert-error-border',
      iconBg: 'bg-alert-error-icon-bg',
      iconFg: 'text-alert-error-icon-fg',
    },
    neutral: {
      bg: 'bg-alert-neutral-bg',
      text: 'text-alert-neutral-text',
      border: 'border-alert-neutral-border',
      iconBg: null,
      iconFg: null,
    },
  };

  const currentVariantClasses = variantClasses[normalizedVariant] || variantClasses.informative;

  const outerContainerClasses = fullWidth
    ? `w-full ${currentVariantClasses.bg} ${currentVariantClasses.text} ${currentVariantClasses.border} ${isRounded ? 'rounded-xl' : 'rounded-none'}`
    : '';

  // Inner container classes
  const fullWidthClasses = fullWidth
    ? marqueeMode ? 'py-4 px-6 w-full ' : 'py-4 px-4 w-full border-none'
      + 'text-[var(--paragraph-p200-size,1.4rem)] '
      + 'font-[var(--paragraph-p200-weight,400)] '
      + 'leading-[var(--line-height-150,1.5)]'
    : 'px-4 py-4 border-none';
  
  // Add outline for success and error variants (doesn't affect box size)
  const getOutlineClasses = () => {
    if (normalizedVariant === 'success') {
      return 'outline outline-[1px] outline-[var(--color-alert-success-border)]';
    }
    if (normalizedVariant === 'error') {
      return 'outline outline-[1px] outline-[var(--color-alert-error-border)]';
    }
    return '';
  };

  const containerClasses = `
    flex 
    w-full
    box-border
    items-center
    justify-center
    gap-[12px]
    rounded-[var(--border-radius-medium)]
    ${fullWidthClasses}
    font-sans
    ${!fullWidth ? 'text-sm' : ''}
    ${!fullWidth ? 'font-normal' : ''}
    ${!fullWidth ? 'leading-auto' : ''}
    ${!fullWidth ? 'border' : ''}
    ${getOutlineClasses()}
    ${heightClasses ? `${heightClasses} overflow-y-auto` : ''}
    ${!fullWidth ? `${currentVariantClasses.bg} ${currentVariantClasses.text} ${currentVariantClasses.border}` : ''}
    ${customClassName}
  `.trim().replace(/\s+/g, ' ');

  // Icon alignment: center for marquee mode, top-aligned for wrap mode
  const iconContainerClasses = `
    shrink-0
    flex
    ${marqueeMode ? 'items-center' : 'items-start'}
    justify-center
  `.trim().replace(/\s+/g, ' ');

  const contentClasses = marqueeMode && shouldMarquee
    ? 'flex-1 min-w-0 overflow-hidden relative leading-6 element-alert'
    : 'flex-1 min-w-0 break-words whitespace-normal element-alert';

  const getDefaultIcon = (variantType) => {
    // Map 'warning' to 'caution' for icon selection
    const mappedVariant = variantType === 'warning' ? 'caution' : variantType;
    const iconMap = {
      informative: {
        icon: 'alert/info',
        color: 'currentColor',
      },
      promotional: {
        icon: 'action/alarm',
        color: 'currentColor',
      },
      caution: {
        icon: 'alert/Error',
        color: 'currentColor',
      },
      success: {
        icon: 'alert/check_circle',
        color: 'var(--color-alert-success-border)',
      },
      error: {
        icon: 'alert/Error',
        color: 'var(--color-alert-error-icon-bg)',
      },
      neutral: {
        icon: 'alert/info',
        color: 'currentColor',
      },
    };
    return iconMap[mappedVariant] || iconMap.informative;
  };

  let iconData;
  if (icon === 'auto') {
    iconData = getDefaultIcon(normalizedVariant);
  } else if (typeof icon === 'string') {
    // User passed a string icon name (full path like 'alert/info')
    iconData = {
      icon,
      color: 'currentColor',
    };
  } else if (typeof icon === 'object' && icon.icon) {
    // User passed an object with icon and optionally color
    iconData = {
      icon: icon.icon,
      color: icon.color || 'currentColor',
    };
  } else {
    // Fallback
    iconData = getDefaultIcon(normalizedVariant);
  }

  const containerWithAnimation = marqueeMode && shouldMarquee
    ? `${containerClasses}${marqueeMode && shouldMarquee ? ' group' : ''}`
    : `${containerClasses}${marqueeMode && shouldMarquee ? ' group' : ''}`;

  const marqueeAnimationClass = marqueeMode && shouldMarquee
    ? 'inline-flex items-start align-top whitespace-nowrap [animation:var(--animate-alert-marquee)] group-hover:[animation-play-state:paused]'
    : 'inline-flex whitespace-nowrap';

  // Process HTML to add text-sm class to <p> elements and font-bold to <strong> elements
  // Also process links to add appropriate rel attributes for SEO
  // If preserveRawHTML is true, use original HTML without processing
  const processedContentHTML = preserveRawHTML
    ? contentHTML
    : processContentHTML(contentHTML, normalizedVariant, {
      pClassName: 'text-sm leading-[21px]',
      strongClassName: 'font-bold',
      processRelAttributes: true,
      linkButtonOptions: {
        size: fullWidth ? 'compact' : 'default',
        customClassName: normalizedVariant === 'informative' ? '!text-text-link-informative-active' : '',
        linkTarget,
      },
    });

  const innerContent = html`
    <aside
      class="${containerWithAnimation}"
      role="${ariaAttributes.role}"
      aria-live="${ariaAttributes.ariaLive}"
      data-variant="${normalizedVariant}"
      data-name="alert"
      ...${fullWidth ? {} : rest}
    >
    <div class="max-w-[var(--max-width-content,1248px)] flex flex-row !items-start w-full  mx-auto ${marqueeMode ? 'gap-[12px]' : 'gap-2'} px-0 md:px-0 !m-0 ${marqueeMode ? 'items-center' : 'items-start'}">
        ${showIcon && iconData.icon && iconData.icon !== 'none' && html`
          <div class="${iconContainerClasses}${currentVariantClasses.iconBg ? ' rounded-full w-5 h-5 flex items-center justify-items-start' : ''}" aria-hidden="true">
            <${Icon} icon=${customIcon || iconData.icon} size="m" color=${customIconColor || iconData.color} />
          </div>
        `}
        <div ref=${contentRef} class="${contentClasses}">
          ${marqueeMode && shouldMarquee ? html`
            <div class="${marqueeAnimationClass}">
              <span class="inline-block ml-[var(--spacing-x-large)]" dangerouslySetInnerHTML=${{ __html: processedContentHTML }} />
              <span class="inline-block ml-[var(--spacing-x-large)]" dangerouslySetInnerHTML=${{ __html: processedContentHTML }} />
              <span class="inline-block ml-[var(--spacing-x-large)]" dangerouslySetInnerHTML=${{ __html: processedContentHTML }} />
              <span class="inline-block ml-[var(--spacing-x-large)]" dangerouslySetInnerHTML=${{ __html: processedContentHTML }} />
            </div>
          ` : html`
            <div dangerouslySetInnerHTML=${{ __html: processedContentHTML }} />
          `}
        </div>
        ${dismissible && html`
          <${Button} 
            onClick=${handleDismiss} 
            variant="transparent" 
            size="xxs" 
            iconOnly=${true}
            customClassName="hover:!bg-alert-dismiss-hover active:!bg-alert-dismiss-active ${dismissButtonClassName || 'h-[20px] w-[20px]'}"
          >
            ${dismissIconHTML ? html`<span dangerouslySetInnerHTML=${{ __html: dismissIconHTML }} />` : html`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12.6663 4.27398L11.7263 3.33398L7.99967 7.06065L4.27301 3.33398L3.33301 4.27398L7.05967 8.00065L3.33301 11.7273L4.27301 12.6673L7.99967 8.94065L11.7263 12.6673L12.6663 11.7273L8.93967 8.00065L12.6663 4.27398Z" fill="currentColor"/>
              </svg>
            `}
          </${Button}>
        `}
      </div>
    </aside>
  `;

  if (fullWidth) {
    return html`
      <aside
        class="${outerContainerClasses}"
        role="${ariaAttributes.role}"
        aria-live="${ariaAttributes.ariaLive}"
        data-variant="${normalizedVariant}"
        data-name="alert"
        ...${rest}
      >
          ${innerContent}
      </aside>
    `;
  }

  return html`
    ${innerContent}
  `;
};

export default Alert;
