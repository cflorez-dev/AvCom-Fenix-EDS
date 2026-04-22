import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * InformativeBanner component for displaying alert messages with optional dismiss button
 *
 * @param {Object} props - Component properties
 * @param {('informative'|'promo'|'header-alert')} [props.type='informative'] - Banner type
 * @param {string} [props.title=''] - Banner message text
 * @param {string} [props.boldText=''] - Bold text portion (for header-alert type)
 * @param {string} [props.linkText=''] - Link text (for header-alert type)
 * @param {string} [props.linkUrl=''] - Link URL (for header-alert type)
 * @param {Function} [props.onLinkClick] - Callback function when link is clicked
 * @param {boolean} [props.showDismissButton=true] - Whether to show dismiss button
 * @param {Function} [props.onDismiss] - Callback function when banner is dismissed
 * @param {string} [props.customClassName=''] - Additional CSS classes
 * @returns {import('preact').VNode} InformativeBanner component
 */
export const InformativeBanner = ({
  type = 'informative',
  title = 'Recuerda que los tiempos de llegada al aeropuerto El Dorado están un poco altos. Anticípate para llegar a tiempo',
  boldText = '',
  linkText = '',
  linkUrl = '',
  onLinkClick,
  showDismissButton = true,
  onDismiss,
  customClassName = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const applyButtonState = (element, styles) => {
    Object.assign(element.style, styles);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss && typeof onDismiss === 'function') {
      onDismiss();
    }
  };

  if (!isVisible) {
    return null;
  }

  // Type-specific styles
  const typeStyles = {
    informative: {
      backgroundColor: 'var(--modal-informative-bg)',
      color: '#0e4c54',
      iconColor: 'var(--modal-icon-close)',
    },
    promo: {
      backgroundColor: 'var(--modal-promotion-bg)',
      color: 'var(--modal-promotion-text)',
      iconColor: 'var(--modal-icon-close',
    },
    'header-alert': {
      backgroundColor: 'var(--modal-warning-bg)',
      color: 'var(--modal-warning-text)',
      iconColor: 'var(--modal-icon-close',
    },
  };

  const currentStyle = typeStyles[type] || typeStyles.informative;

  const containerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: type === 'header-alert' ? 'center' : 'flex-start',
    gap: 'var(--gap-12, 1.2rem)',
    padding: 'var(--spacing-x-medium) var(--spacing-x-large)',
    backgroundColor: currentStyle.backgroundColor,
    color: currentStyle.color,
    fontFamily: 'var(--font-family-primary, "Red Hat Display", sans-serif)',
    fontSize: type === 'header-alert' ? 'var(--font-size-small, 1.4rem)' : 'var(--paragraph-p300-size, 1.6rem)',
    fontWeight: 'var(--paragraph-p300-weight, 400)',
    lineHeight: 'var(--paragraph-p300-line-height, 1.5)',
    width: '100%',
  };

  const iconContainerStyles = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const contentStyles = {
    flex: type === 'header-alert' ? '1 0 0' : '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: type === 'header-alert' ? 'space-between' : 'flex-start',
    gap: type === 'header-alert' ? 'var(--gap-12)' : '0',
    maxWidth: type === 'header-alert' ? '124.8rem' : 'none',
  };

  const innerContentStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
  };

  const linkStyles = {
    color: currentStyle.color,
    fontSize: 'var(--font-size-normal, 1.6rem)',
    textDecoration: 'underline',
    textDecorationSkipInk: 'none',
    textUnderlinePosition: 'from-font',
    cursor: 'pointer',
    padding: '2px 0',
    background: 'none',
    border: 'none',
    fontFamily: 'inherit',
    lineHeight: 'var(--line-height-150, 1.5)',
  };

  const dismissButtonStyles = {
    flexShrink: 0,
    border: 'none',
    padding: '0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    margin: '0',
    color: currentStyle.iconColor,
    backgroundColor: 'transparent',
  };

  const InfoIcon = html`
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 15C9.45 15 9 14.55 9 14V10C9 9.45 9.45 9 10 9C10.55 9 11 9.45 11 10V14C11 14.55 10.55 15 10 15ZM11 7H9V5H11V7Z"
        fill="currentColor"
      />
    </svg>
  `;

  const CloseIcon = html`
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
        fill="currentColor"
      />
    </svg>
  `;

  const handleLinkClick = (e) => {
    if (onLinkClick) {
      e.preventDefault();
      onLinkClick(e);
    }
  };

  const handleMouseEnter = (e) => {
    applyButtonState(e.currentTarget, {
      backgroundColor: 'var(--modal-icon-close-hover)',
    });
  };

  const handleMouseLeave = (e) => {
    applyButtonState(e.currentTarget, {
      backgroundColor: '',
    });
  };

  const handleMouseDown = (e) => {
    setIsMouseDown(true);
    applyButtonState(e.currentTarget, {
      backgroundColor: 'var(--modal-icon-close-active)',
    });
  };

  const handleMouseUp = (e) => {
    setIsMouseDown(false);
    applyButtonState(e.currentTarget, {
      backgroundColor: 'var(--modal-icon-close-hover)',
    });
  };

  const handleFocus = (e) => {
    if (!isMouseDown) {
      applyButtonState(e.currentTarget, {
        outline: 'none',
        backgroundColor: 'transparent',
        border: '2px solid var(--focus-primary)',
      });
    }
  };

  const handleBlur = (e) => {
    applyButtonState(e.currentTarget, {
      border: '',
      backgroundColor: '',
    });
  };

  const renderContent = () => {
    if (type === 'header-alert' && (boldText || linkText)) {
      return html`
      <p style=${{ margin: '0', lineHeight: 'var(--line-height-150, 1.5)' }}>
        ${title}
        ${boldText
          && html`<strong style=${{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-normal, 1.6rem)' }}>
            ${boldText}
          </strong>`
}
        ${linkText
          && html`
            <a
              href=${linkUrl || '#'}
              style=${linkStyles}
              class="inline hover:[font-weight:var(--font-weight-bold)]"
              onClick=${handleLinkClick}
            >
              ${linkText}
            </a>
          `
}
      </p>
    `;
    }

    return html`<p style=${{ margin: '0' }}>${title}</p>`;
  };

  return html`
    <div
      class="${customClassName}"
      style=${containerStyles}
      role="alert"
      aria-live="polite"
      data-type="${type}"
    >
      ${type === 'header-alert' ? html`
        <div style=${contentStyles}>
          <div style=${{
    display: 'flex', alignItems: 'center', gap: 'var(--gap-12, 1.2rem)', flex: '1 0 0', minWidth: '0',
  }}>
            <div style=${iconContainerStyles} aria-hidden="true">
              ${InfoIcon}
            </div>
            ${renderContent()}
          </div>
          ${showDismissButton
      && html`
          <button
              style=${dismissButtonStyles}
              onClick=${handleDismiss}
              aria-label="Cerrar mensaje"
              type="button"
              onMouseEnter=${handleMouseEnter}
              onMouseLeave=${handleMouseLeave}
              onMouseDown=${handleMouseDown}
              onMouseUp=${handleMouseUp}
              onFocus=${handleFocus}
              onBlur=${handleBlur}
          >
            ${CloseIcon}
          </button>
          `}</div>
      ` : html`
        <div style=${iconContainerStyles} aria-hidden="true">
          ${InfoIcon}
        </div>
        <div style=${contentStyles}>
          ${renderContent()}
        </div>
        ${showDismissButton
      && html`
          <button
            style=${dismissButtonStyles}
            onClick=${handleDismiss}
            aria-label="Cerrar mensaje"
            type="button"
            onMouseEnter=${handleMouseEnter}
            onMouseLeave=${handleMouseLeave}
            onMouseDown=${handleMouseDown}
            onMouseUp=${handleMouseUp}
            onFocus=${handleFocus}
            onBlur=${handleBlur}
          >
          ${CloseIcon}
        </button>
        `}
      `}
    </div>
  `;
};
