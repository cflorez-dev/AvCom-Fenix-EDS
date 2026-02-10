import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * DestinationCard - Card de destino para carousel de Avianca
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
  ...rest
}) => {
  const Tag = href ? 'a' : 'div';
  const linkProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {};

  return html`
    <${Tag}
      data-name="destinationCard"
      class="group relative w-[240px] h-[240px] p-[12px] rounded-3xl overflow-hidden cursor-pointer block focus:outline-none focus-visible:ring-2 focus-visible:ring-border-stroke-focus focus-visible:ring-offset-2 ${customClassName}"
      onClick=${onClick}
      ...${linkProps}
      ...${rest}
    >
      <div class="absolute inset-0 w-full h-full transition-transform duration-300 ease-out group-hover:scale-110">
        <img
          src="${imageUrl}"
          alt="${imageAlt || destinationName}"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div 
        class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80 group-hover:via-black/40" 
        aria-hidden="true"
      ></div>
      <div class="absolute bottom-[12px] left-4 right-4 text-center z-10 flex flex-col gap-1">
        ${complementaryText ? html`
          <span class="text-text-normal-lighter text-[12px] font-normal leading-tight">
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
