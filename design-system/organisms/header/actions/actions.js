import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Button } from '../../../atoms/button/button.js';
import loadSVGIcon from '../../../../scripts/utils/svg.helper.js';

const html = htm.bind(h);

/**
 * Actions - Componente de acciones del header (carrito y usuario)
 *
 * ## Props
 * - `cart`: Object con configuración del botón de carrito
 *   - `label`: string - Texto del botón (opcional, si está vacío será iconOnly)
 *   - `icon`: string - Nombre del icono SVG (ej: "cart-Icon")
 *   - `show`: boolean - Si debe mostrarse el botón
 * - `user`: Object con configuración del botón de usuario
 *   - `label`: string - Texto del botón (opcional, si está vacío será iconOnly)
 *   - `icon`: string - Nombre del icono SVG (ej: "person-icon")
 *   - `show`: boolean - Si debe mostrarse el botón
 * - `customClassName`: string - Clases CSS adicionales
 * - `onCartClick`: function - Callback cuando se hace click en el carrito
 * - `onUserClick`: function - Callback cuando se hace click en el usuario
 * - `...rest`: Otras propiedades válidas
 */
export const Actions = ({
  cart = { label: '', icon: '', show: true },
  user = { label: '', icon: '', show: true },
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
      <div class="${ user.label? '': 'w-[48px]'} flex justify-center">
        <${Button}
          variant="secondary"
          size="sm"
          iconOnly=${!user.label || user.label.trim() === ''}
          onClick=${onUserClick}
          aria-label=${user.label || 'Mi cuenta'}
        >
          ${renderButtonContent(userIcon, user.label)}
        </${Button}>
      </div>
      `}
      ${cart.show && html`
        <div class="${ cart.label? '': 'w-[48px]'} flex justify-center">
          <${Button}
            variant="secondary"
            size="sm"
            iconOnly=${!cart.label || cart.label.trim() === ''}
            onClick=${onCartClick}
            aria-label=${cart.label || 'Carrito'}
          >
            ${renderButtonContent(cartIcon, cart.label)}
          </${Button}>
        </div>
      `}
    </div>
  `;
};

export default Actions;
