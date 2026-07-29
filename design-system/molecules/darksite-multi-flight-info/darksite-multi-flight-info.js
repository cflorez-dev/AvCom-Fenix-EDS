import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Button } from '../../atoms/button/button.js';
import { Icon } from '../../atoms/icon/icon.js';
import { LinkButton } from '../../atoms/link-button/link-button.js';

const html = htm.bind(h);

/**
 * DarksiteMultiFlightInfo — Variante del interstitial cuando la operación
 * afecta a MÚLTIPLES vuelos. Match Figma nodo 9611:7745. Se monta sobre el
 * fondo `#3F4448` del overlay.
 *
 * A diferencia de `DarksiteFlightInfo` (single), aquí no hay dos CTAs por
 * vuelo: cada fila expone un único link "Ver detalle →" hacia su `detailUrl`,
 * y debajo de la lista aparece un solo botón "Continuar en avianca.com"
 * (bypass del gate). Los contactos se muestran fuera de este molecule
 * (los orquesta el gate con `DarksiteContactInfo`).
 *
 * Compuesto exclusivamente por atoms del DS:
 * - `Button` (variante `primary-dark`) — CTA único "Continuar en avianca.com".
 * - `Icon` (`action/plane2` por defecto) — separador visual entre origen/destino.
 * - `LinkButton` (variant `link`, size `medium`) — link "Ver detalle" por fila.
 *   Se sobre-escribe color y font-size vía `style` (inline) porque los tokens
 *   por defecto del DS son para fondo claro; el interstitial darksite es dark.
 * - `Icon` (`navigation/arrow-forward-20`) — flecha → del link "Ver detalle"
 *   cuando `detailCtaChevron=true`. Sprite 20×20 con path interno 13.33×13.33
 *   (padding) para match pixel-perfect del spec Figma 9611:7759.
 *
 * ## Props
 * - `title`: `string` — Titular H1000. Ej: `"Información sobre vuelos afectados"`.
 * - `flights`: `Array<{ flightCode, origin, destination, operator, detailUrl }>`
 *   — Lista de vuelos afectados. `operator` se antepone al string de operador
 *   completo (por ej. la plantilla del CF genera `"Operado por Avianca"` y se
 *   pasa como `operator`). `detailUrl` es el destino del link "Ver detalle".
 * - `detailCtaLabel`: `string` — Label del link por vuelo (ej. `"Ver detalle"`).
 * - `detailCtaChevron`: `boolean` — `true` (default) dibuja una flecha-derecha
 *   (→) después del label; `false` ⇒ solo texto (el autor NO debe hornear la
 *   flecha en `detailCtaLabel`). Controlado desde el CF (`detailCtaChevron`).
 *   El nombre del prop conserva `Chevron` por retro-compat del contrato CF
 *   aunque visualmente el sprite es un arrow-forward.
 * - `showFlightIcon`: `boolean` — `true` (default) dibuja el sprite `flightIcon`
 *   entre origen y destino; `false` dibuja el texto `flightSeparator`.
 *   Controlado desde el CF (`showFlightIcon`).
 * - `flightIcon`: `string` — Nombre del sprite del icono separador (ej.
 *   `"action/plane2"`). Sólo se usa cuando `showFlightIcon=true`. Vacío ⇒
 *   fallback a `'action/plane2'`.
 * - `flightSeparator`: `string` — Texto separador entre origen y destino
 *   cuando `showFlightIcon=false` (ej. `"-"`, `"|"`, `"→"`). Vacío ⇒
 *   fallback a `'-'`.
 * - `secondaryCta`: `{ label, href, alt, onClick }` — Botón único inferior.
 *   Corresponde a "Continuar en avianca.com" (bypass). El gate lo detecta por
 *   `href$="#darksite-continue"` — mantén ese hash si el consumidor es el
 *   overlay del gate.
 * - `customClassName`: `string` — Clases extra sobre el wrapper.
 * - `...rest`: props extra al wrapper.
 */
export const DarksiteMultiFlightInfo = ({
  title,
  flights = [],
  detailCtaLabel = 'Ver detalle',
  detailCtaChevron = true,
  showFlightIcon = true,
  flightIcon = 'action/plane2',
  flightSeparator = '',
  secondaryCta,
  customClassName = '',
  ...rest
}) => {
  // Gap vertical entre bloque de vuelos (título + lista) y CTA "Continuar".
  // Mobile: 32px. Desde 768px (breakpoint md): 48px. Match single-flight.
  const rootClasses = `flex flex-col items-center gap-[32px] md:gap-[48px] ${customClassName}`.trim();

  // Bloque título + lista (§ Figma 9611:7747): gap 50px en desktop; en
  // móvil lo reducimos a 32px para no comer viewport.
  const headerBlockClasses = 'w-full flex flex-col items-center justify-center gap-[32px] md:gap-[50px]';

  // Título H1000 (Figma: Red Hat Display Bold 44px, blanco). Idéntico al
  // single-flight — mismo token fluido para escala responsive consistente.
  const titleClasses = '!m-0 text-center font-[family-name:var(--font-family-primary)] font-bold text-[var(--font-size-x-huge)] leading-[var(--line-height-100)] tracking-[var(--letter-spacing-normal)] text-white break-words';

  // Lista de rows (§ Figma 9611:7749): flex column, gap 24px, ancho fluido
  // hasta 992px (spec Figma). En viewports < 992px ocupa 100%.
  const listClasses = 'w-full max-w-[992px] flex flex-col items-stretch gap-[var(--spacing-large)]';

  // Row wrapper (§ Figma 9611:7750): border 1px rgba(255,255,255,0.4),
  // rounded 16px, padding 16px 24px, flex justify-between items-center.
  // En móvil pequeño (< 768px) la parte izquierda envuelve para que el link
  // "Ver detalle" no se salga; el border se mantiene.
  const rowClasses = 'flex flex-wrap items-center justify-between gap-[var(--spacing-medium)] py-[var(--spacing-medium)] px-[var(--spacing-large)] rounded-[var(--border-radius-large)] border border-solid border-[rgba(255,255,255,0.4)]';

  // Lado izquierdo del row (flightCode + route + divider + operator).
  const rowLeftClasses = 'flex flex-wrap items-center gap-[var(--spacing-medium)]';

  // Route (origen ✈ destino): gap 8px.
  const routeClasses = 'flex items-center gap-[var(--spacing-x-small)]';

  // Divider vertical 1px × 24px, gris D9D9D9 (Figma 9611:7757).
  const dividerClasses = 'shrink-0 w-px h-6 bg-[#d9d9d9]';

  // Texto ruta/operador: Red Hat Display Regular 24px line-height 1.5, blanco.
  // Hardcodeado a 24px (spec Figma pide tamaño fijo, no fluido) — el título
  // ya absorbe la escala responsive.
  const cityTextClasses = 'font-[family-name:var(--font-family-primary)] font-normal text-[24px] leading-[var(--line-height-150)] text-white whitespace-nowrap';

  // FlightCode: mismo tamaño 24px pero bold.
  const flightCodeClasses = 'font-[family-name:var(--font-family-primary)] font-bold text-[24px] leading-[var(--line-height-150)] text-white whitespace-nowrap';

  // Link "Ver detalle" (§ Figma 9611:7759): text-24 Regular blanco subrayado
  // permanente + icono 20px, gap 8px. Usamos el atom `LinkButton` del DS con
  // `size='medium'` (aporta gap-8px + leading-normal + font-normal) y
  // `underline=true` (aporta el treatment `[text-underline-position:from-font]`
  // + `[text-decoration-skip-ink:none]` que exige el spec).
  //
  // Color y font-size van INLINE (no clase Tailwind) para dos razones:
  //   1. Los color-variants del LinkButton apuntan a tokens de fondo claro
  //      (teal / purple / brown). Aquí necesitamos blanco puro sobre dark bg
  //      y no queremos crear un color-variant nuevo solo para este caso.
  //   2. El size `medium` fuerza `!text-[20px]`; el spec pide 24px. Ganar contra
  //      `!important` de misma especificidad depende del orden de emisión de
  //      Tailwind (frágil). Inline style siempre gana ⇒ predecible.
  //
  // Hover: opacity 80% vía customClassName. El LinkButton normalmente cambia
  // de color en hover (tokens "active"); esos tokens quedan neutralizados por
  // el `style.color` inline, así que el opacity es el único feedback visible.
  const detailLinkStyle = { fontSize: '24px', color: '#ffffff' };
  const detailLinkClassName = 'hover:!opacity-80 active:!opacity-80 whitespace-nowrap';

  const renderRow = (flight) => {
    if (!flight || !flight.flightCode) return null;
    // Separador origen→destino: icono del sprite (default) o texto plano si
    // el CF apagó `showFlightIcon`. Extraído fuera del template para evitar
    // ternarios embebidos que rompen la regla `indent` de ESLint dentro de HTM.
    const separatorNode = showFlightIcon
      ? html`<${Icon} icon=${flightIcon || 'action/plane2'} size="xl" color="var(--logo-avianca-light)" ariaLabel="Vuelo" />`
      : html`<span class=${cityTextClasses} aria-hidden="true">${flightSeparator || '-'}</span>`;
    return html`
      <div class=${rowClasses} data-name="darksiteFlightRow">
        <div class=${rowLeftClasses}>
          <span class=${flightCodeClasses}>${flight.flightCode}</span>
          <div class=${routeClasses}>
            <span class=${cityTextClasses}>${flight.origin}</span>
            ${separatorNode}
            <span class=${cityTextClasses}>${flight.destination}</span>
          </div>
          ${flight.operator && html`
            <div class=${dividerClasses} aria-hidden="true"></div>
            <span class=${cityTextClasses}>${flight.operator}</span>
          `}
        </div>
        ${flight.detailUrl && html`
          <${LinkButton}
            variant="link"
            size="medium"
            underline=${true}
            href=${flight.detailUrl}
            style=${detailLinkStyle}
            customClassName=${detailLinkClassName}
            data-cta="darksiteFlightDetail"
          >
            ${detailCtaLabel}
            ${detailCtaChevron && html`
              <${Icon} icon="navigation/arrow-forward-20" size="m" color="var(--logo-avianca-light)" ariaLabel="" />
            `}
          </${LinkButton}>
        `}
      </div>
    `;
  };

  const renderCta = (cta) => {
    if (!cta || !cta.label) return null;
    return html`
      <${Button}
        variant="primary-dark"
        size="md"
        href=${cta.href || null}
        onClick=${cta.onClick || null}
        aria-label=${cta.alt || null}
      >
        ${cta.label}
      </${Button}>
    `;
  };

  return html`
    <div
      class=${rootClasses}
      data-name="darksiteMultiFlightInfo"
      ...${rest}
    >
      <div class=${headerBlockClasses}>
        ${title && html`<h1 class=${titleClasses}>${title}</h1>`}
        <div class=${listClasses}>
          ${flights.map(renderRow)}
        </div>
      </div>
      ${renderCta(secondaryCta)}
    </div>
  `;
};

export default DarksiteMultiFlightInfo;
