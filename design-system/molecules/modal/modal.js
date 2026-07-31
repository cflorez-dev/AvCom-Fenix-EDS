import { h } from '@dropins/tools/preact.js';
import { useEffect, useRef, useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';
import { sanitizeSpreadProps } from '../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

const ACTION_FX = `
  transition-all duration-150 ease-out
  hover:scale-[1.02] active:scale-[0.98] active:translate-y-px
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2
  disabled:opacity-60 disabled:pointer-events-none
  `.trim().replace(/\s+/g, ' ');

const enhanceInteractiveElements = (rootEl) => {
  if (!rootEl) return;

  const nodes = rootEl.querySelectorAll(
    'button, [role="button"], a, input[type="submit"], input[type="button"]'
  );

  const tokens = ACTION_FX.split(' ');
  nodes.forEach((el) => {
    if (el.closest('[data-modal-close="true"]')) return; // don't touch the close button
    if (el.getAttribute('data-no-modal-fx') === 'true') return; // opt-out
    tokens.forEach((t) => el.classList.add(t));
  });
};

export const Modal = ({
  isOpen,
  onClose,
  variant = 'center',
  size = 'md',
  showCloseButton = true,
  clickOutsideToClose = true,
  escapeToClose = true,
  customClassName = '',
  contentClassName = '',
  closeButtonClassName = '',
  closeIconSlot = null,
  role = 'dialog',
  children,
  ...rest
}) => {
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const transitionEndHandlerRef = useRef(null);
  const isClosingRef = useRef(false);

  const [shouldRender, setShouldRender] = useState(!!isOpen);
  const [entered, setEntered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    isClosingRef.current = isClosing;
  }, [isClosing]);

  useEffect(() => {
    const cleanup = () => {
      if (contentRef.current && transitionEndHandlerRef.current) {
        contentRef.current.removeEventListener('transitionend', transitionEndHandlerRef.current);
        transitionEndHandlerRef.current = null;
      }
    };

    if (isOpen) {
      cleanup();
      setShouldRender(true);
      setIsClosing(false);
      setEntered(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return cleanup;
    }

    if (shouldRender) {
      setIsClosing(true);
      setEntered(false);
      requestAnimationFrame(() => {
        if (contentRef.current) {
          cleanup();

          transitionEndHandlerRef.current = (e) => {
            if (
              e.target === contentRef.current
              && isClosingRef.current
              && (e.propertyName === 'opacity' || e.propertyName === 'transform' || !e.propertyName)
            ) {
              cleanup();
              setShouldRender(false);
              setIsClosing(false);
            }
          };
          contentRef.current.addEventListener('transitionend', transitionEndHandlerRef.current);
        }
      });
    }
    return cleanup;
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender || !escapeToClose || isClosing) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [shouldRender, escapeToClose, isClosing, onClose]);

  useEffect(() => {
    const { documentElement: rootEl, body } = document;
    // Lock the page behind the modal. The document scrolls via <html> (styles.css
    // sets `overflow-x: clip` on it, which breaks the body→viewport overflow
    // propagation), so `overflow:hidden` on <body> alone leaves the page
    // scrollable behind the fixed overlay. Lock <html> too.
    //
    // No manual scrollbar-width padding here: `html` already carries
    // `scrollbar-gutter: stable` (styles.css) sitewide, which reserves the
    // scrollbar's column at all times, lock or not. Adding a second,
    // JS-computed `padding-right` on top of that reservation double-counts
    // it — the content area shrinks by an extra scrollbar-width while locked,
    // then snaps back 12px the instant it's cleared on unlock. Verified with
    // `document.body.clientWidth` across lock/unlock with no padding: it's
    // identical (1022px) in both states; `scrollbar-gutter: stable` alone is
    // sufficient. 1299705.
    const unlock = () => {
      rootEl.classList.remove('overflow-hidden');
      body.classList.remove('overflow-hidden');
    };
    if (shouldRender) {
      rootEl.classList.add('overflow-hidden');
      body.classList.add('overflow-hidden');
    } else {
      unlock();
    }
    return unlock;
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender || !entered) return;
    requestAnimationFrame(() => enhanceInteractiveElements(contentRef.current));
  }, [shouldRender, entered, children]);

  const handleOverlayClick = (e) => {
    if (clickOutsideToClose && e.target === modalRef.current && !isClosing) {
      onClose?.();
    }
  };

  const handleCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isClosing) onClose?.();
  };

  if (!shouldRender) return null;

  const overlayClasses = `
    fixed inset-0 z-[9999]
    bg-[var(--modal-overlay-bg)]
    transition-opacity duration-200 ease-out
    motion-reduce:transition-none
    ${entered ? 'opacity-100' : 'opacity-0'}
    ${variant === 'center'
      ? 'flex items-center justify-center p-[var(--spacing-medium)] overflow-auto'
      : 'flex items-stretch overflow-hidden'}
    ${variant === 'left' ? 'justify-start' : ''}
    ${variant === 'right' ? 'justify-end' : ''}
    ${customClassName}
  `.trim().replace(/\s+/g, ' ');

  const getContentClasses = () => {
    const base = `
      relative flex flex-col overflow-auto
      shadow-[var(--shadow-medium)]
      bg-[var(--bg-brand-primary-lighter)]
      transform-gpu will-change-transform
      transition-all duration-250 ease-out
      motion-reduce:transition-none
      ${isClosing ? 'pointer-events-none' : 'pointer-events-auto'}
    `.trim().replace(/\s+/g, ' ');
    let enterState = '';
    let exitState = '';
    if (variant === 'center') {
      enterState = 'opacity-100 translate-y-0 scale-100';
      exitState = 'opacity-0 translate-y-6 scale-95';
    } else if (variant === 'left') {
      enterState = 'opacity-100 translate-x-0';
      exitState = 'opacity-0 -translate-x-full';
    } else {
      enterState = 'opacity-100 translate-x-0';
      exitState = 'opacity-0 translate-x-full';
    }
    if (variant === 'center') {
      const sizeClasses = {
        sm: 'w-[90%] max-w-[400px] max-h-[90vh]',
        md: 'w-[90%] max-w-[600px] max-h-[90vh]',
        lg: 'w-[90%] max-w-[900px] max-h-[90vh]',
        full: 'w-full max-w-full h-full max-h-full',
      };
      return `${base} rounded-[var(--border-radius-large)] ${sizeClasses[size]} ${entered ? enterState : exitState} ${contentClassName}`;
    }
    const sideSizeClasses = {
      sm: 'w-[280px] sm:w-[320px] max-w-[85vw]',
      md: 'w-[320px] sm:w-[480px] max-w-[90vw]',
      lg: 'w-[360px] sm:w-[640px] max-w-[95vw]',
      full: 'w-full',
    };
    const radius = variant === 'left' ? 'rounded-r-xl sm:rounded-r-[var(--border-radius-large)]'
      : 'rounded-l-xl sm:rounded-l-[var(--border-radius-large)]';

    return `${base} ${sideSizeClasses[size]} h-full max-h-full ${radius} ${entered ? enterState : exitState} ${contentClassName}`;
  };
  const contentClasses = getContentClasses();
  const closeButtonContainer = `
    absolute top-[0] right-[0]
    px-[var(--spacing-medium)] py-[var(--spacing-medium)]
    ${closeButtonClassName}
  `;
  // No own overflow-auto here: the card (`base`, above) already carries
  // `overflow-auto` as the real safety net for pathological content. A second,
  // independent overflow-auto on this exact-fit wrapper is redundant AND
  // fragile — its `scrollHeight` vs `clientHeight` sit exactly equal at rest
  // (the card auto-grows to match), so any Chromium sub-pixel flex-layout
  // rounding difference from a style recalc (e.g. a button's `:active`
  // pseudo-class matching) can tip it by ~1px and flash a scrollbar. 1299705:
  // reproduced by holding mousedown on the primary button — verified with
  // `wrapper.scrollHeight`/`clientHeight` (276 vs 276 at rest, 277 vs 276
  // while `:active`, with the button's own transform confirmed `none` via
  // getComputedStyle, ruling out `active:translate-y-px`/`scale` as the
  // cause). The card's own overflow-auto has ~90vh of headroom, so it isn't
  // exposed to this same razor's-edge rounding.
  const childrenContainerClasses = 'flex-1';

  return html`
    <div
      ref=${modalRef}
      class=${overlayClasses}
      data-name="modal"
      onClick=${handleOverlayClick}
      role=${role}
      aria-modal="true"
      aria-labelledby="modal-title"
      ...${sanitizeSpreadProps(rest)}
    >
      <div
        ref=${contentRef}
        class=${contentClasses}
        onClick=${(e) => e.stopPropagation()}
      >
        ${showCloseButton && html`
          <div class=${closeButtonContainer}>
            <${Button} onClick=${handleCloseClick} variant="transparent" size="xxs" iconOnly=${true}>
              ${closeIconSlot || html`<${Icon} icon="navigation/close" size="xs" />`}
            </${Button}>
          </div>
        `}
        <div class=${childrenContainerClasses}>
          ${children}
        </div>
      </div>
    </div>
  `;
};

export default Modal;
