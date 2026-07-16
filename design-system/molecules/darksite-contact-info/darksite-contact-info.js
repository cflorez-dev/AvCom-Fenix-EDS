import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import TipsCards from '../../organisms/tips-cards/tips-cards.js';

const html = htm.bind(h);

/**
 * DarksiteContactInfo — Sección de "Líneas de contacto" del interstitial
 * darksite (Figma nodo 9611:8017). Se compone de un label superior
 * ("Líneas de contacto:") y una card contenedora con múltiples métodos de
 * contacto en columnas divididas por separadores verticales.
 *
 * Reutiliza el organism `TipsCards` con `theme='dark'` para pintar la card;
 * cada método de contacto se mapea a un objeto `{title, subtitle, footer}` en
 * la prop `cards` del organism (el `footer` es el bloque de teléfonos, que
 * queda alineado al fondo gracias al justify-between del theme dark).
 *
 * ## Props
 * - `label`: `string` — Texto del rótulo superior (default: `"Líneas de contacto:"`).
 * - `contacts`: `Array<{title, subtitle, phones}>` — Métodos de contacto a
 *   pintar como columnas. `phones` puede ser un string o un array; los arrays
 *   se unen con `\n` (el organism preserva saltos vía `whitespace-pre-line`).
 * - `customClassName`: `string` — Clases extra sobre el wrapper.
 * - `...rest`: props extra al wrapper.
 */
export const DarksiteContactInfo = ({
  label = 'Líneas de contacto:',
  contacts = [],
  customClassName = '',
  ...rest
}) => {
  // Label superior (Figma 9611:8018): Regular 20px, blanco, line-height 1.5.
  const labelClasses = '!m-0 font-[family-name:var(--font-family-primary)] font-normal text-[20px] leading-[var(--line-height-150)] text-white';

  // Mapea el shape del molecule al shape que espera TipsCards. Un contacto
  // puede tener uno o varios teléfonos: si es array, los unimos con \n para
  // que el organism los renderice en líneas separadas.
  const cards = contacts.map((c) => ({
    title: c.title,
    subtitle: c.subtitle,
    footer: Array.isArray(c.phones) ? c.phones.filter(Boolean).join('\n') : c.phones,
  }));

  return html`
    <div
      class=${`w-full flex flex-col items-center gap-[var(--spacing-x-large)] ${customClassName}`.trim()}
      data-name="darksiteContactInfo"
      ...${rest}
    >
      ${label && html`<p class=${labelClasses}>${label}</p>`}
      <${TipsCards} theme="dark" cards=${cards} size="large" />
    </div>
  `;
};

export default DarksiteContactInfo;
