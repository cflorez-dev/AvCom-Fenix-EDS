import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { LinkCardVertical } from './link-card-vertical.js';
import { LinkCardHorizontal } from './link-card-horizontal.js';

const html = htm.bind(h);

/**
 * LinkCard - Componente controlador que renderiza la variante correcta según columns y rows
 *
 * ## Props
 * - `columns`: `number` – Número de columnas en la grilla (por defecto: `1`).
 * - `rows`: `number` – Número de filas en la grilla (por defecto: `1`).
 * - `title`: `string` – Título de la tarjeta (requerido).
 * - `description`: `string` – Texto descriptivo de la tarjeta (requerido).
 * - `image`: `string` – URL de la imagen principal (requerido).
 * - `imageAlt`: `string` – Texto alternativo para la imagen (por defecto: `''`).
 * - `linkText`: `string` – Texto del enlace (por defecto: `"Descubre más"`).
 * - `href`: `string` – URL del enlace (requerido si se quiere que la card sea clickeable).
 * - `onClick`: `function` – Handler de click para la card o botón.
 * - `customClassName`: Clases CSS adicionales.
 * - `...rest`: Otras propiedades válidas.
 *
 * ## Lógica de renderizado
 * - **Horizontal**: 2 columns, 1 row
 * - **Vertical**: Cualquier otra configuración (1 column 2-3 rows, 2 columns 2 rows, etc.)
 */
export const LinkCard = ({
  columns = 1,
  rows = 1,
  title,
  description,
  image,
  imageAlt = '',
  linkText = '',
  href,
  onClick,
  customClassName = '',
  ...rest
}) => {
  // Determinar qué variante renderizar según columns y rows
  // Horizontal: 2 columns, 1 row
  // Vertical: cualquier otra configuración
  const isHorizontal = columns === 2 && rows === 1;

  // Props comunes para ambas variantes
  const commonProps = {
    title,
    description,
    image,
    imageAlt,
    linkText,
    href,
    onClick,
    customClassName,
    ...rest,
  };
  const commonPropsVertical = {
    ...commonProps,
    columns,
    rows,
  };

  if (isHorizontal) {
    return html`
      <${LinkCardHorizontal}
        ...${commonProps}
      />
    `;
  }

  return html`
    <${LinkCardVertical}
      ...${commonPropsVertical}
    />
  `;
};

export default LinkCard;
