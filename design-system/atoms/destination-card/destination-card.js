import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { isSafeUrl } from '../../../scripts/utils/sanitize.js';

const html = htm.bind(h);

/**
 * DestinationCard - Card de destino para carousel de Avianca
 * A clickable card component displaying destination information with image and text overlay
 *
 * ## Props
 * - `destinationName`: `string` – Nombre del destino/ciudad (requerido).
 * - `complementaryText`: `string` – Texto complementario que aparece arriba del nombre (opcional).
 * - `imageUrl`: `string` – URL de la imagen del destino (requerido).
 * - `imageAlt`: `string` – Texto alternativo para la imagen (por defecto: destinationName).
 * - `href`: `string` – URL de navegación (opcional, convierte la card en un link).
 * - `onClick`: `function` – Handler de click (opcional).
 * - `customClassName`: `string` – Clases CSS adicionales.
 * - `...rest`: Otras propiedades válidas del elemento.
 */
export const DestinationCard = ({
  destinationName,
  complementaryText,
  imageUrl,
  imageAlt,
  href,
  onClick,
  customClassName = '',
  iataCityCode,
  ...rest
}) => {
  // Validate the href to prevent XSS via javascript:, data:, etc. schemes
  // injected from CMS-controlled destination data. If the href is unsafe,
  // the card falls back to a non-clickable <div> rather than an <a> with a
  // dummy href — avoiding broken link affordances.
  const safeHref = href && isSafeUrl(href) ? href : null;
  const Tag = safeHref ? 'a' : 'div';
  const linkProps = safeHref ? { href: safeHref } : {};

  return html`
    <${Tag}
      data-name="destinationCard"
      class="group relative w-[240px] h-[240px] p-[12px] rounded-3xl overflow-hidden cursor-pointer block transition-shadow duration-500 focus:outline-none focus-visible:outline-none hover:shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)] active:shadow-[0_2px_20px_2px_rgba(73,73,73,0.25)] ${customClassName}"
      onClick=${onClick}
      ...${linkProps}
      ...${rest}
    >
    <div class="absolute rounded-3xl top-0 h-[240px] transition-all left-0 right-0 w-full border-2 border-transparent group-focus-visible:border-[var(--color-border-stroke-focus)] hidden group-focus-visible:block pointer-events-none z-1"></div>
      <div class="absolute inset-0 w-full h-full transition-transform duration-500 ease-out group-hover:scale-110 group-active:scale-110">
        <img
          src="${imageUrl}"
          alt="${imageAlt || destinationName}"
          class="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
        />
      </div>
      <div
        class="absolute inset-0 bg-[linear-gradient(180deg,_rgba(27,27,27,0)_65.625%,_rgba(27,27,27,0.9)_92.548%)]"
        aria-hidden="true"
      ></div>
      <div
        class="absolute inset-0 bg-[rgba(27,27,27,0.4)] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100"
        aria-hidden="true"
      ></div>
      <div class="absolute bottom-[12px] left-4 right-4 text-center z-10 flex flex-col gap-1">
        ${complementaryText ? html`
          <span class="text-text-normal-lighter text-[12px] font-normal leading-tight opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100">
            ${complementaryText}
          </span>
        ` : ''}
        
        <span class="text-text-normal-lighter text-[18px] font-bold leading-tight">
          ${destinationName}
        </span>
      </div>
    </${Tag}>
  `;
};

export default DestinationCard;
