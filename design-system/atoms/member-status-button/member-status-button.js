import { h } from '@dropins/tools/preact.js';
import htm from 'htm';

const html = htm.bind(h);

/**
 * MemberStatusButton - Botón pill por tier de membresía Avianca Members.
 *
 * Figma:
 *  - default: 350:13635
 *  - hover:   350:13668
 *  - pressed: 350:13700
 *  - focus:   350:13733
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTAS PARA EL BLOQUE CONSUMIDOR (Members card):
 *  1. El componente es un átomo: NO calcula el `tier` del usuario, lo recibe
 *     como prop. El bloque debe leerlo del perfil/sesión y mapearlo.
 *  2. El chevron-right es ESTRUCTURAL (parte del diseño del átomo, no opcional).
 *     Si el bloque necesita un botón sin chevron usá `Button` o `LinkButton`.
 *  3. El texto "Ver perfil" es configurable vía prop `label` para soportar
 *     i18n / variaciones de copy sin tocar el átomo.
 *  4. Los colores son LITERALES (hex) porque son tokens de marca Members
 *     que NO existen aún en el sistema de tokens del sitio. Cuando el equipo
 *     de design tokens los publique, migrar el map `TIER_STYLES` a CSS vars.
 *  5. El focus-visible usa `#28a8ff` (azul Microsoft accessibility) según
 *     Figma — distinto del `--color-border-stroke-focus` del resto del sitio.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Props
 * @param {('lifemiles'|'gold'|'red-plus'|'silver'|'diamond'|'magno')} [tier='gold']
 *   Tier de membresía del usuario. Determina colores de bg/border/text.
 * @param {string} [label='Ver perfil']
 *   Texto del botón. Configurable para i18n.
 * @param {string} [href]
 *   URL. Si se pasa, renderiza `<a>`; sino `<button type="button">`.
 * @param {boolean} [disabled=false]
 *   Estado deshabilitado. Reduce opacidad y bloquea interacción.
 * @param {string} [customClassName='']
 *   Clases extra para el root.
 * @param {...any} rest
 *   Otras props (onClick, target, rel, aria-*, etc.).
 */

// ─── Tier color tokens (literal hex - matches Figma exactly) ────────────────
const TIER_STYLES = {
  lifemiles: {
    bg: '#970346', border: '#d7acbf', invertText: '#970346',
  },
  gold: {
    bg: '#703b16', border: '#ceb19c', invertText: '#703b16',
  },
  'red-plus': {
    bg: '#7d0106', border: '#c88f91', invertText: '#7d0106',
  },
  silver: {
    bg: '#262626', border: '#777777', invertText: '#393838',
  },
  diamond: {
    bg: '#0f0f0f', border: '#656565', invertText: '#232021',
  },
  magno: {
    bg: '#1b0900', border: '#6b5d56', invertText: '#1b0900',
  },
};

// ─── Hoisted static class strings (computed once at module load) ────────────
const ROOT_BASE = [
  'group inline-flex items-center justify-center gap-[4px]',
  'px-[12px] py-[7px] rounded-[100px]',
  'border border-solid select-none no-underline',
  'font-[\'Red_Hat_Display\'] font-bold text-[16px] leading-normal tracking-normal',
  'motion-safe:transition-colors motion-safe:duration-150 ease-in-out',
  'focus:outline-none focus-visible:outline-none',
  // Focus-visible: doble shadow ring (azul + white spacer) per Figma 350:13733.
  // Usa box-shadow en vez de outline para no afectar layout y poder componer
  // con el shadow externo blanco que separa el ring del fondo.
  'focus-visible:shadow-[0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff]',
].join(' ');

const ROOT_INTERACTIVE = [
  'cursor-pointer',
  // Hover/active: bg cambia a claro, text al color del tier, border transparente.
  // Se aplica via clases inline porque los colores dependen del tier.
].join(' ');

const ROOT_DISABLED = 'cursor-not-allowed opacity-50 pointer-events-none';

const CHEVRON_WRAPPER = 'shrink-0 inline-flex items-center justify-center w-[18px] h-[18px]';

/**
 * SVG chevron-right inline (18×18, currentColor).
 * Reutiliza el path de `icons/navigation/chevron-right.svg` (viewBox 16) escalado
 * a 18px. Usa `currentColor` para que el text-color del botón controle el fill.
 */
const ChevronRightIcon = () => html`
  <svg
    class=${CHEVRON_WRAPPER}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M6.47027 4L5.53027 4.94L8.58361 8L5.53027 11.06L6.47027 12L10.4703 8L6.47027 4Z"
      fill="currentColor"
    />
  </svg>
`;

export const MemberStatusButton = ({
  tier = 'gold',
  label = 'Ver perfil',
  href = null,
  disabled = false,
  customClassName = '',
  children,
  ...rest
}) => {
  const tierStyles = TIER_STYLES[tier] || TIER_STYLES.gold;

  // Inline styles via CSS custom properties consumed by hover/active utilities.
  // Esto permite que las clases sean estáticas (Tailwind las detecta) y los
  // valores hex sean dinámicos según `tier`.
  const inlineStyle = {
    backgroundColor: tierStyles.bg,
    borderColor: tierStyles.border,
    color: '#ffffff',
    // Custom props para que hover/active los apliquen via arbitrary values.
    '--ms-invert-text': tierStyles.invertText,
  };

  // Hover: bg blanco, text invert, border transparente.
  // Active: bg #e9e9e9, text invert, border transparente.
  // Se escriben como utilities arbitrarias para que Tailwind las compile.
  const interactionClasses = disabled ? '' : [
    'hover:!bg-white hover:!border-transparent hover:!text-[var(--ms-invert-text)]',
    'active:!bg-[#e9e9e9] active:!border-transparent active:!text-[var(--ms-invert-text)]',
  ].join(' ');

  const finalClasses = [
    ROOT_BASE,
    disabled ? ROOT_DISABLED : ROOT_INTERACTIVE,
    interactionClasses,
    customClassName,
  ].filter(Boolean).join(' ');

  const Tag = href ? 'a' : 'button';
  const tagProps = href
    ? { href }
    : { type: 'button', disabled };

  const a11yProps = {
    'aria-disabled': disabled ? 'true' : undefined,
    tabIndex: disabled ? -1 : undefined,
  };

  return html`
    <${Tag}
      class=${finalClasses}
      style=${inlineStyle}
      data-name="memberStatusButton"
      data-tier=${tier}
      ...${tagProps}
      ...${a11yProps}
      ...${rest}
    >
      <span class="leading-normal">${children || label}</span>
      <${ChevronRightIcon} />
    </${Tag}>
  `;
};

export default MemberStatusButton;
