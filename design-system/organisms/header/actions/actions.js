import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';
import { HeaderButton } from '../../../atoms/header-button/header-button.js';
import { UserSession } from '../../user-session/user-session.js';
import loadSVGIcon from '../../../../scripts/utils/svg.helper.js';

const html = htm.bind(h);

/**
 * Actions - Header actions component (cart and user)
 *
 * Cart chip (Members spec — Figma 9:16447): icon-only `HeaderButton` with
 * chevron + green notification dot. The label is read for a11y (aria-label /
 * tooltip-hint) but never rendered as visible text — the button always opens
 * the cart popover/modal via `onCartClick`.
 *
 * ## Props
 * - `cart`: Object with cart button configuration
 *   - `label`: string - Used for aria-label / tooltip text (no visible text)
 *   - `icon`: string - SVG icon name (e.g.: "cart-Icon")
 *   - `show`: boolean - Whether the button should be shown
 * - `user`: Object with user button configuration
 *   - `label`: string - Button text (optional, iconOnly if empty)
 *   - `icon`: string - SVG icon name (e.g.: "social/person")
 *   - `show`: boolean - Whether the button should be shown
 * - `session`: Object (optional) - Members session toggle. When present, the user
 *   button delegates to the `user-session` organism (state-driven, reads the signal
 *   store). When absent, the legacy user button renders (backward compatible).
 * - `cartHasNotification`: boolean - Show the green dot on the cart chip (default true).
 * - `cartIsOpen`: boolean - Visual `open` state for the cart chip (chevron flip + green border).
 * - `customClassName`: string - Additional CSS classes
 * - `onCartClick`: function - Callback when the cart button is clicked
 * - `onUserClick`: function - Callback when the user button is clicked
 * - `...rest`: Other valid properties
 */
export const Actions = ({
  cart = { label: '', icon: '', show: true },
  user = { label: '', icon: '', show: true },
  session,
  cartHasNotification = true,
  cartIsOpen = false,
  customClassName = '',
  onCartClick,
  onUserClick,
  ...rest
}) => {
  const [cartIcon, setCartIcon] = useState(null);
  const [userIcon, setUserIcon] = useState(null);

  // Load cart icon
  useEffect(() => {
    if (cart.show && cart.icon) {
      const loadIcon = async () => {
        try {
          const codeBasePath = window.hlx?.codeBasePath || '';
          const iconPath = `${codeBasePath}/icons/${cart.icon}.svg`;
          const iconSVG = await loadSVGIcon(iconPath);
          setCartIcon(iconSVG);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error loading cart icon:', error);
        }
      };
      loadIcon();
    }
  }, [cart.show, cart.icon]);

  // Load user icon
  useEffect(() => {
    if (user.show && user.icon) {
      const loadIcon = async () => {
        try {
          const codeBasePath = window.hlx?.codeBasePath || '';
          const iconPath = `${codeBasePath}/icons/${user.icon}.svg`;
          const iconSVG = await loadSVGIcon(iconPath);
          setUserIcon(iconSVG);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error loading user icon:', error);
        }
      };
      loadIcon();
    }
  }, [user.show, user.icon]);

  // Render icon as Preact vnode using dangerouslySetInnerHTML
  const renderIcon = (iconElement) => {
    if (!iconElement) return null;
    return html`
      <span 
        dangerouslySetInnerHTML=${{ __html: iconElement.outerHTML }}
        style=${{ display: 'inline-flex', alignItems: 'center' }}
      />
    `;
  };

  // Render button content (icon + label or icon only)
  const renderButtonContent = (icon, label) => {
    const iconNode = renderIcon(icon);
    if (!label || label.trim() === '') {
      // Icon only mode
      return iconNode;
    }
    // Icon + label mode
    return html`
      <span style=${{ display: 'flex', alignItems: 'center', gap: 'var(--gap-8)' }}>
        ${iconNode}
        <span>${label}</span>
      </span>
    `;
  };

  return html`
    <div class=${`avi-header-actions h-[48px] flex items-center justify-center flex-row gap-[8px] ${customClassName}`} ...${rest}>
    ${user.show && html`
      <div class="${user.label ? '' : 'w-[48px]'} flex justify-center">
        ${session
    ? html`<${UserSession} user=${user} />`
    : html`
        <${Button}
          variant="secondary"
          size="sm"
          iconOnly=${!user.label || user.label.trim() === ''}
          onClick=${onUserClick}
          aria-label=${user.label}
        >
          ${renderButtonContent(userIcon, user.label)}
        </${Button}>
      `}
      </div>
      `}
      ${cart.show && html`
        <div class="flex items-center justify-center">
          <${HeaderButton}
            icon=${cartIcon ? html`<span class="inline-flex items-center justify-center w-full h-full" dangerouslySetInnerHTML=${{ __html: cartIcon.outerHTML }} />` : null}
            label=""
            chevron=${true}
            state=${cartIsOpen ? 'open' : 'default'}
            notification=${cartHasNotification}
            tooltipText=${cart.label || 'Carrito'}
            ariaLabel=${cart.label || 'Carrito'}
            onClick=${onCartClick}
          />
        </div>
      `}
    </div>
  `;
};

export default Actions;
