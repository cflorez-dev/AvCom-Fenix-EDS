import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { getTierTheme } from '../../helpers/members-tier-theme.js';

const html = htm.bind(h);

/**
 * MembersHeroCompact — estado COMPRIMIDO del hero "Mi Lifemiles" (1263924).
 * Figma mobile 518:22527 / desktop 518:22525.
 *
 * Contenido: saludo "Hola, {firstName}", línea "Tier | NN.NNN millas" y el CTA
 * toggle "Ver detalle ▾" que expande el hero (emite `onToggle`).
 *
 * Layout responsive (tokens Figma):
 *  - mobile (<lg): pt-24 pb-16 px-16, h3 20px, toggle 14px, bottom rounded-16 cóncavo.
 *  - desktop (≥lg): py-16 px-32, h4 24px, toggle 16px, sin rounded.
 *
 * Fondo gradient por tier (`getTierTheme`, mismo idiom que members-hero-header).
 *
 * NOTA: En collapsed Figma (mobile 518:22527 y desktop 518:22525) NO se renderiza
 * "Ver perfil" — vive solo en el estado expandido. Las props `viewProfileLabel`
 * y `viewProfileUrl` se mantienen por compatibilidad con la API y son ignoradas.
 *
 * ## Props
 * - `firstName`: string — nombre para el saludo. Default '—'.
 * - `greetingLabel`: string — template del saludo con `{name}`. Default 'Hola, {name}'.
 * - `tier`: string — tier crudo del VM. Default 'lifemiles'.
 * - `tierThemes`: object|null — map de themes del CF. Default null (presets locales).
 * - `tierLabel`: string — texto visible del tier. Default = tier capitalizado.
 * - `totalMilesLabel`: string — millas YA formateadas por locale (ej. "18.056 millas").
 * - `toggleLabel`: string — texto del toggle. Default 'Ver detalle'.
 * - `toggleAriaLabel`: string — aria-label del toggle. Default = toggleLabel.
 * - `onToggle`: function — click en el toggle (expande).
 * - `borderAccentColor`: string|null — color del border accent (CF). null = sin borde.
 * - `customClassName`: string.
 */
export const MembersHeroCompact = ({
  firstName = '—',
  greetingLabel = 'Hola, {name}',
  tier = 'lifemiles',
  tierThemes = null,
  tierLabel = '',
  totalMilesLabel = '',
  toggleLabel = 'Ver detalle',
  toggleAriaLabel = '',
  // viewProfileLabel/viewProfileUrl: ignored (kept for API compat, no Figma usage in collapsed).
  viewProfileLabel: _viewProfileLabel,
  viewProfileUrl: _viewProfileUrl,
  onToggle = null,
  borderAccentColor = null,
  customClassName = '',
  ...rest
}) => {
  const theme = getTierTheme(tier, tierThemes || {});
  const greeting = greetingLabel.replace('{name}', firstName);
  const visibleTier = tierLabel
    || (theme.key === 'red-plus'
      ? 'Red Plus'
      : theme.key.charAt(0).toUpperCase() + theme.key.slice(1));

  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, ${theme.gradientFrom} ${theme.gradientFromStop}, ${theme.gradientTo} ${theme.gradientToStop})`,
    ...(borderAccentColor ? { borderColor: borderAccentColor } : {}),
  };

  // Toggle "Ver detalle ▾" (Figma mobile h6=14px / desktop h6=16px, chevron 24x24).
  const toggle = html`
    <button
      type="button"
      onClick=${onToggle}
      aria-expanded="false"
      aria-label=${toggleAriaLabel || toggleLabel}
      class="group relative inline-flex items-center gap-[4px] shrink-0 bg-transparent border-0 p-0 cursor-pointer text-white font-normal! text-[14px]! leading-[19px]! lg:text-[16px]! lg:leading-[21px]! outline-none rounded-[4px]"
      data-name="members-hero-toggle"
    >
      ${/* Estados del CTA (Figma 518:22242 "Action Button"): hover = SUBRAYADO solo
           en la etiqueta (el chevron no se subraya); active/pressed = SemiBold.
           El `!` es obligatorio: `styles.css` trae un `font: inherit` sin capa que
           le gana a `@layer utilities`, así que `font-semibold` pelado no aplica
           sobre un <button> (mismo motivo que el `font-normal!` de arriba). */ ''}
      ${/* Focus ring (Figma 518:22271): `-inset-1` da 4px de aire entre el texto y
           el ring azul (`#28a8ff` 1.5px) + halo blanco (3px). Va en span aparte
           porque el ring de un box-shadow pegado al `<button>` (sin padding) queda
           demasiado ajustado al texto y no coincide con el mock. Mismo patrón
           que `MembersCopyMembership`. */ ''}
      <span
        aria-hidden="true"
        class="absolute -inset-1 rounded-[4px] pointer-events-none opacity-0 group-focus-visible:opacity-100 [box-shadow:0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff]"
      ></span>
      ${/* Grid-stack para evitar layout shift en pressed: Figma (518:22262) cambia
           el weight 400→600 en pressed. Un sibling invisible con `font-semibold!`
           reserva el ancho máximo (bold) y el visible cambia weight sin correr
           el chevron ni el resto del layout. */ ''}
      <span class="relative inline-grid">
        <span aria-hidden="true" class="col-start-1 row-start-1 invisible font-semibold! pointer-events-none select-none">${toggleLabel}</span>
        <span class="col-start-1 row-start-1 group-hover:underline group-hover:decoration-solid group-active:no-underline group-active:font-semibold!">${toggleLabel}</span>
      </span>
      ${/* chevron-down del DS (mismo path relleno que `header-button.js`, anclado a
           la spec de Figma del chip de carrito). Antes era un chevron STROKED
           dibujado a mano, que no coincidía con el recurso de diseño (1284630).
           viewBox 16 con caja 24 → conserva el tamaño renderizado de siempre. */ ''}
      <svg width="24" height="24" viewBox="0 0 16 16" fill="none" aria-hidden="true" class="relative motion-safe:transition-transform">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M11.06 5.72656L8 8.7799L4.94 5.72656L4 6.66656L8 10.6666L12 6.66656L11.06 5.72656Z"
          fill="currentColor"
        />
      </svg>
    </button>
  `;

  return html`
    <div
      class=${`relative w-full pt-[24px] pb-[16px] px-[16px] rounded-bl-[16px] rounded-br-[16px] lg:rounded-none lg:py-[16px] lg:px-[32px] ${borderAccentColor ? 'border border-solid' : ''} ${customClassName}`}
      style=${gradientStyle}
      data-name="members-hero-compact"
      data-tier=${theme.key}
      ...${rest}
    >
      <div class="flex items-center gap-[24px] max-w-[1248px] w-full mx-auto">
        <div class="flex flex-1 min-w-0 flex-col items-start justify-center">
          <h2
            class="m-0! font-semibold! text-white! text-[20px]! leading-[normal]! -mb-[2px]! max-w-[200px] lg:max-w-none lg:text-[24px]!"
            data-name="members-hero-greeting"
          >${greeting}</h2>
          <div class="flex flex-col gap-[4px] items-start justify-center py-[4px]" data-name="members-hero-tierline">
            <div class="flex gap-[8px] items-center w-full">
              <div class="flex gap-[4px] items-center">
                <span class="font-normal text-[18px] leading-[normal] text-white whitespace-nowrap">${visibleTier}</span>
              </div>
              ${totalMilesLabel && html`
                <span class="block w-px h-[14px] bg-[rgba(217,217,217,0.5)] shrink-0" aria-hidden="true"></span>
                <span class="font-normal text-[18px] leading-[normal] text-white whitespace-nowrap text-right">${totalMilesLabel}</span>
              `}
            </div>
          </div>
        </div>
        ${toggle}
      </div>
    </div>
  `;
};

export default MembersHeroCompact;
