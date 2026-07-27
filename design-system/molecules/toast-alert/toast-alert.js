import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

// Fade in/out (right → left) transition duration, per Figma motion spec.
const TRANSITION_MS = 300;

/**
 * ToastAlert - Floating notification component (Figma: "toastAlert")
 *
 * A temporary, non-intrusive notification that briefly informs the user about
 * the result of an action without interrupting their flow. It appears and
 * disappears automatically (fade in/out, right → left, 300ms), floats above
 * the interface (recommended position: top-right of the viewport, 24px
 * offset) and self-dismisses after a defined duration (4–6s recommended).
 *
 * This is intentionally a separate component from the `Alert` molecule:
 * `Alert` is a controlled, persistent, full-width banner rendered inline in
 * the page flow and owned by its parent; `ToastAlert` is an uncontrolled,
 * transient, self-timed overlay with its own enter/exit animation and fixed
 * viewport positioning. Sharing one component would force unrelated timing/
 * animation/positioning concerns into `Alert`'s API and increase the risk of
 * regressions for its many existing consumers (Marquesina, banners, etc.).
 *
 * @param {Object} props - Component properties
 * @param {'success'|'informative'|'caution'|'error'} [props.variant='success'] - Visual variant
 * @param {string} [props.title=''] - Bold title text (required content of the toast)
 * @param {string} [props.description=''] - Optional secondary text rendered below the title
 * @param {boolean} [props.dismissible=true] - Show the dismiss (close) button
 * @param {Function} [props.onDismiss] - Callback invoked when the toast is dismissed
 *   (either by the user or automatically after `duration`)
 * @param {string} [props.dismissButtonAriaLabel=''] - Accessible label for the dismiss button
 * @param {boolean} [props.showIcon=true] - Show/hide the leading status icon
 * @param {string} [props.customIcon] - Override the default icon for the variant
 * @param {string} [props.customIconColor] - Override the default icon color for the variant
 * @param {boolean} [props.isFloating=false] - Position the toast fixed at the top-right of the
 *   viewport with a 24px offset, matching the "Ubicación" spec
 * @param {boolean} [props.autoDismiss=true] - Automatically dismiss the toast after `duration`
 * @param {number} [props.duration=5000] - Time on screen in ms before auto-dismissing
 *   (recommended range: 4000–6000ms)
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @param {Object} [props.rest] - Additional props spread to the container
 * @returns {import('preact').VNode} ToastAlert component
 */
export const ToastAlert = ({
  variant = 'success',
  title = '',
  description = '',
  dismissible = true,
  onDismiss,
  dismissButtonAriaLabel = '',
  showIcon = true,
  customIcon,
  customIconColor,
  isFloating = false,
  autoDismiss = true,
  duration = 5000,
  customClassName = '',
  ...rest
}) => {
  // isVisible: mounted/unmounted. isEntered: drives the fade-in/out transition
  // (starts false so the initial render is the "off-screen right" state, then
  // flips to true on the next tick to trigger the CSS transition).
  const [isVisible, setIsVisible] = useState(true);
  const [isEntered, setIsEntered] = useState(false);
  const dismissTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  const resolvedDismissButtonAriaLabel = dismissButtonAriaLabel
    || ((typeof document !== 'undefined' && document.documentElement.lang?.toLowerCase().startsWith('es'))
      ? 'Cerrar notificación'
      : 'Dismiss notification');

  const handleDismiss = () => {
    // Trigger the fade-out (right → left) transition, then unmount after it completes.
    setIsEntered(false);
    exitTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      if (onDismiss && typeof onDismiss === 'function') {
        onDismiss();
      }
    }, TRANSITION_MS);
  };

  useEffect(() => {
    // Fade in on mount.
    const enterFrame = requestAnimationFrame(() => setIsEntered(true));

    if (autoDismiss) {
      dismissTimerRef.current = setTimeout(handleDismiss, duration);
    }

    return () => {
      cancelAnimationFrame(enterFrame);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  // Variant → outline color + default icon (Figma data-type / data-appearance)
  const variantConfig = {
    success: {
      outlineColor: 'var(--color-toast-alert-positive,#1EA93C)',
      icon: 'alert/check_circle',
      iconColor: 'var(--color-toast-alert-positive,#1EA93C)',
      role: 'status',
      ariaLive: 'polite',
    },
    informative: {
      outlineColor: 'var(--color-toast-alert-informative,#177F8C)',
      icon: 'alert/info',
      iconColor: 'var(--color-toast-alert-informative,#177F8C)',
      role: 'status',
      ariaLive: 'polite',
    },
    caution: {
      outlineColor: 'var(--color-toast-alert-warning,#EF5B06)',
      icon: 'alert/Error',
      iconColor: 'var(--color-toast-alert-warning,#EF5B06)',
      role: 'status',
      ariaLive: 'polite',
    },
    error: {
      outlineColor: 'var(--color-toast-alert-error-border,#FF1C46)',
      icon: 'alert/Error',
      iconColor: 'var(--color-toast-alert-error-icon,#C20000)',
      role: 'alert',
      ariaLive: 'assertive',
    },
  };

  const config = variantConfig[variant] || variantConfig.success;

  // Recommended position: top-right of the viewport, 24px offset, floating
  // above the interface without blocking interaction with other elements.
  const floatingClasses = isFloating
    ? 'fixed top-6 right-6 z-[1000] w-fit max-w-[calc(100%-48px)]'
    : '';

  // Fade in/out (right → left), 300ms — driven by `isEntered`.
  // NOTE: keep the "duration-300" class literal (not interpolated) so Tailwind's
  // static scanner can generate it; TRANSITION_MS is the single source of truth
  // for the matching setTimeout delay above.
  const transitionClasses = 'transition-[opacity,transform] duration-300 ease-out';
  const motionClasses = isEntered
    ? 'opacity-100 translate-x-0'
    : 'opacity-0 translate-x-4';

  const containerClasses = `
    inline-flex flex-row items-start gap-2 min-w-[200px] max-w-[1248px]
    p-4 bg-white rounded-lg
    shadow-[0px_2px_20px_2px_rgba(73,73,73,0.25)]
    outline outline-2 outline-offset-[-2px]
    ${transitionClasses} ${motionClasses}
    ${floatingClasses}
    ${customClassName}
  `.trim().replace(/\s+/g, ' ');

  return html`
    <div
      class="${containerClasses}"
      style=${{ outlineColor: config.outlineColor }}
      role="${config.role}"
      aria-live="${config.ariaLive}"
      data-name="toast-alert"
      data-type="${variant}"
      ...${rest}
    >
      ${showIcon && html`
        <div class="shrink-0 flex items-center justify-center w-5 h-5" aria-hidden="true">
          <${Icon} icon=${customIcon || config.icon} size="m" color=${customIconColor || config.iconColor} />
        </div>
      `}
      <div class="flex-1 min-w-0 flex flex-col items-start gap-1">
        <span class="self-stretch text-[14px] leading-[19px] font-bold text-[var(--text-normal-primary,#1B1B1B)] break-words">
          ${title}
        </span>
        ${description && html`
          <span class="self-stretch text-[14px] leading-[19px] font-normal text-[var(--text-normal-secondary,#5A5A5A)] break-words">
            ${description}
          </span>
        `}
      </div>
      ${dismissible && html`
        <${Button}
          onClick=${handleDismiss}
          variant="transparent"
          size="xxs"
          iconOnly=${true}
          aria-label=${resolvedDismissButtonAriaLabel}
          customClassName="!h-6 !w-6 !min-h-6 !min-w-6 !p-0 !gap-0 !rounded-full shrink-0 flex items-center justify-center hover:!bg-[var(--bg-hover-light,#E9E9E9)] active:!bg-[var(--state-disabled,#D9D9D9)]"
        >
          <${Icon} icon="navigation/close" size="xsm" color="var(--icon-normal-primary,#1B1B1B)" />
        </${Button}>
      `}
    </div>
  `;
};
