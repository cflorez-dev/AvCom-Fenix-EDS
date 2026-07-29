import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/**
 * DarksiteFlightInfo — Bloque de contenido del interstitial darksite que
 * comunica el vuelo afectado y ofrece las dos rutas de salida: (a) continuar
 * en avianca.com (bypass) y (b) ver el detalle del vuelo. Match Figma
 * nodo 9611:8004 (Flight Info). Se monta sobre el fondo `#3F4448` del overlay.
 *
 * Compuesto exclusivamente por atoms del DS:
 * - `Button` (variantes `secondary-dark` y `primary-dark`) — CTAs sobre fondo oscuro.
 * - `Icon` (`action/plane2` por defecto, blanco) — separador visual entre origen/destino.
 *
 * ## Props
 * - `title`: `string` — Titular H1000. Ej: `"Vuelo AV062 afectado"`.
 * - `origin`: `string` — Ciudad de origen (ej. `"Bogotá"`).
 * - `destination`: `string` — Ciudad de destino (ej. `"Miami"`).
 * - `operator`: `string` — Texto de operador (ej. `"Operado por Avianca"`).
 *   Se omite (y con él el divider) si viene vacío.
 * - `showFlightIcon`: `boolean` — `true` (default) dibuja el sprite `flightIcon`
 *   entre origen y destino; `false` dibuja el texto `flightSeparator`.
 *   Controlado desde el CF `getDarksiteInterstitial` (`showFlightIcon`).
 * - `flightIcon`: `string` — Nombre del sprite del icono separador (ej.
 *   `"action/plane2"`). Sólo se usa cuando `showFlightIcon=true`. Vacío ⇒
 *   fallback a `'action/plane2'`.
 * - `flightSeparator`: `string` — Texto separador entre origen y destino cuando
 *   `showFlightIcon=false` (ej. `"-"`, `"|"`, `"→"`). Vacío ⇒ fallback a `'-'`.
 * - `primaryCta`: `{ label, href, onClick }` — CTA principal (fondo blanco).
 *   Corresponde a "Ver información del vuelo". `href` navega a la página
 *   `/darksite/{lang}/flight-info`; `onClick` es opcional (fail-open al href).
 * - `secondaryCta`: `{ label, href, onClick }` — CTA secundario (outlined).
 *   Corresponde a "Continuar en avianca.com" (bypass). El gate lo detecta por
 *   `href$="#darksite-continue"` — mantén ese hash si el consumidor es el
 *   overlay del gate.
 * - `customClassName`: `string` — Clases extra sobre el wrapper.
 * - `...rest`: props extra al wrapper.
 */
export const DarksiteFlightInfo = ({
  title,
  origin,
  destination,
  operator = '',
  showFlightIcon = true,
  flightIcon = 'action/plane2',
  flightSeparator = '',
  primaryCta,
  secondaryCta,
  customClassName = '',
  ...rest
}) => {
  // Gap vertical entre header (título + rutas) y grupo de CTAs.
  // Mobile: 32px. Desde 768px (breakpoint md): 48px. Spec Figma darksite.
  const rootClasses = `flex flex-col items-center gap-[32px] md:gap-[48px] ${customClassName}`.trim();

  // Título + Route Info (§ Figma 9611:8005): gap 8px vertical, ambos centrados.
  const headerBlockClasses = 'flex flex-col items-center justify-center gap-[var(--spacing-x-small)]';

  // Título H1000 (Figma: Red Hat Display Bold 44px, blanco, line-height 100%).
  // Usamos el token fluido --font-size-x-huge (36→52px) que cubre 44px en su
  // rango medio; en móvil pequeño baja a 36px, preservando la jerarquía.
  const titleClasses = '!m-0 text-center font-[family-name:var(--font-family-primary)] font-bold text-[var(--font-size-x-huge)] leading-[var(--line-height-100)] tracking-[var(--letter-spacing-normal)] text-white break-words';

  // Route Info wrapper (§ Figma 9611:8007): flex horizontal centrado, gap 16px.
  // En móviles muy pequeños se envuelve para no forzar overflow.
  const routeInfoClasses = 'w-full flex flex-wrap items-center justify-center gap-[var(--spacing-medium)]';

  // Route (Origen → icono → Destino): gap 8px.
  const routeClasses = 'flex items-center gap-[var(--spacing-x-small)]';

  // Texto de rutas y operador (Figma: 24px Regular blanco line-height 1.5).
  // Se hardcodea 24px en vez de un token porque el spec pide un tamaño fijo,
  // no fluido (el título ya absorbe la escala responsive).
  const cityTextClasses = 'font-[family-name:var(--font-family-primary)] font-normal text-[24px] leading-[var(--line-height-150)] text-white whitespace-nowrap';

  // Divider vertical 1px × 24px, gris D9D9D9 (Figma 9611:8012).
  const dividerClasses = 'shrink-0 w-px h-6 bg-[#d9d9d9]';

  // Grupo de CTAs (§ Figma 9611:8014): flex horizontal centrado, gap 16px.
  // En móvil pequeño (ancho < 480px) los apilamos para evitar botones truncados.
  const ctaGroupClasses = 'flex flex-wrap items-center justify-center gap-[var(--spacing-medium)]';

  const renderCta = (cta, variant) => {
    if (!cta || !cta.label) return null;
    return html`
      <${Button}
        variant=${variant}
        size="md"
        href=${cta.href || null}
        onClick=${cta.onClick || null}
      >
        ${cta.label}
      </${Button}>
    `;
  };

  // Separador origen→destino: icono del sprite (default) o texto plano si el
  // CF apagó `showFlightIcon`. Se resuelve fuera del template para evitar
  // ternarios embebidos que rompen la regla `indent` de ESLint dentro de HTM.
  const separatorNode = showFlightIcon
    ? html`<${Icon} icon=${flightIcon || 'action/plane2'} size="xl" color="var(--logo-avianca-light)" ariaLabel="Vuelo" />`
    : html`<span class=${cityTextClasses} aria-hidden="true">${flightSeparator || '-'}</span>`;

  return html`
    <div
      class=${rootClasses}
      data-name="darksiteFlightInfo"
      ...${rest}
    >
      <div class=${headerBlockClasses}>
        ${title && html`<h1 class=${titleClasses}>${title}</h1>`}
        <div class=${routeInfoClasses}>
          <div class=${routeClasses}>
            <span class=${cityTextClasses}>${origin}</span>
            ${separatorNode}
            <span class=${cityTextClasses}>${destination}</span>
          </div>
          ${operator && html`
            <div class=${dividerClasses} aria-hidden="true"></div>
            <span class=${cityTextClasses}>${operator}</span>
          `}
        </div>
      </div>
      <div class=${ctaGroupClasses}>
        ${renderCta(secondaryCta, 'secondary-dark')}
        ${renderCta(primaryCta, 'primary-dark')}
      </div>
    </div>
  `;
};

export default DarksiteFlightInfo;
