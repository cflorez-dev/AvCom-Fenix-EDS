import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { NavbarMobile } from './navbar-mobile.js';
import { NavbarDesktop } from './navbar-desktop.js';

const html = htm.bind(h);

/**
 * Navbar - Componente maestro de navegación del header
 *
 * ## Props
 * - `mode`: `"desktop" | "mobile"` – Modo de visualización (por defecto: `"mobile"`).
 * - `sections`: `Array` – Array de objetos con la estructura de navegación:
 *   `[{ itemLabel: string, url: string, subItems?: Array }]`.
 * - `customClassName`: Clases CSS adicionales.
 * - `...rest`: Otras propiedades válidas.
 */
export const Navbar = ({
  mode = 'mobile',
  sections = [],
  customClassName = '',
  ...rest
}) => {
  if (mode === 'mobile') {
    return html`
      <${NavbarMobile} sections=${sections} customClassName=${customClassName} ...${rest} />
    `;
  }

  return html`
    <${NavbarDesktop} sections=${sections} customClassName=${customClassName} ...${rest} />
  `;
};

export default Navbar;
