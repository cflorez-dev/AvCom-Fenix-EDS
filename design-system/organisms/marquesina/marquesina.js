import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Alert } from '../../molecules/alert/alert.js';

const html = htm.bind(h);

/**
 * Marquesina - Sticky header alert organism with auto-marquee for overflow content
 * Uses the Alert atom as base and adds sticky positioning and marquee behavior
 *
 * @param {Object} props - Component properties
 * @param {'informative'|'warning'|'success'|'promotional'} [props.variant='informative']
 *   Alert visual variant
 * @param {string} [props.contentHTML=''] - Rich text HTML content
 * @param {string} [props.icon='auto'] - Icon name or 'auto' for variant default
 * @param {boolean} [props.dismissible=true] - Show dismiss button
 * @param {'session'|'permanent'|'none'} [props.dismissStrategy='session'] - How to persist dismiss state
 * @param {string} [props.alertId=''] - Unique ID for dismiss tracking
 * @param {boolean} [props.isSticky=true] - Enable sticky positioning
 * @param {'auto'|'always'|'never'} [props.marqueeMode='auto']
 *   Marquee scroll behavior
 * @param {number} [props.marqueeSpeed=50] - Marquee speed in pixels/second
 * @param {Function} [props.onDismiss] - Callback when dismissed
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @returns {import('preact').VNode} Marquesina component
 */
const Marquesina = (props) => {
  const {
    variant = 'informative',
    contentHTML = '',
    icon = 'auto',
    dismissible = true,
    dismissStrategy = 'permanent',
    alertId = '',
    isSticky = true,
    marqueeMode = 'auto',
    marqueeSpeed = 50,
    onDismiss,
    customClassName = '',
  } = props;

  const [isVisible, setIsVisible] = useState(true);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (dismissible && alertId && dismissStrategy !== 'none') {
      const dismissed = checkDismissed(alertId, dismissStrategy);
      if (dismissed) {
        setIsVisible(false);
      }
    }
  }, [dismissible, alertId, dismissStrategy]);

  useEffect(() => {
    if (marqueeMode === 'always') {
      setShouldMarquee(true);
      return;
    }
    if (marqueeMode === 'never') {
      setShouldMarquee(false);
      return;
    }
    // marqueeMode === 'auto'
    const checkOverflow = () => {
      const content = contentRef.current;
      if (!content) return;
      const tempDiv = document.createElement('div');
      tempDiv.className = 'absolute invisible whitespace-nowrap w-auto';
      tempDiv.innerHTML = contentHTML;
      document.body.appendChild(tempDiv);

      const contentWidth = tempDiv.scrollWidth;
      const containerWidth = content.clientWidth;

      document.body.removeChild(tempDiv);

      const isOverflowing = contentWidth > containerWidth;
      setShouldMarquee(isOverflowing);
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

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (!window.ResizeObserver) {
        window.removeEventListener('resize', checkOverflow);
      }
    };
  }, [contentHTML, marqueeMode]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (alertId && dismissStrategy !== 'none') {
      saveDismissed(alertId, dismissStrategy);
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  const marquesinaClasses = [
    'marquesina',
    isSticky ? 'sticky top-0 z-[500] md:z-[1000]' : '',
    customClassName,
  ].filter(Boolean).join(' ');

  return html`
    <div
      class=${marquesinaClasses}
      data-name="marquesina"
      data-alert-id=${alertId}
    >
      <${Alert}
        variant=${variant}
        icon=${icon}
        dismissible=${dismissible}
        onDismiss=${handleDismiss}
        contentHTML=${contentHTML}
        shouldMarquee=${shouldMarquee}
        marqueeSpeed=${marqueeSpeed}
        contentRef=${contentRef}
        fullWidth=${true}
        marqueeMode=${true}
      />
    </div>
  `;
};

// Export as named and default
export { Marquesina };
export default Marquesina;

// Helper functions
function checkDismissed(alertId, strategy) {
  try {
    const storage = strategy === 'permanent' ? localStorage : sessionStorage;
    return storage.getItem(`marquesina-dismissed-${alertId}`) === 'true';
  } catch (e) {
    console.warn('Storage not available:', e);
    return false;
  }
}

function saveDismissed(alertId, strategy) {
  try {
    const storage = strategy === 'permanent' ? localStorage : sessionStorage;
    storage.setItem(`marquesina-dismissed-${alertId}`, 'true');
  } catch (e) {
    console.warn('Storage not available:', e);
  }
}
