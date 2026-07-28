import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { Icon } from '../icon/icon.js';

const html = htm.bind(h);

/**
 * MembersQuickAction — acción rápida del hero expandido: ícono circular oscuro +
 * label debajo + link (Figma 518:27631 / 518:27647). Configurable (ícono, texto,
 * url, nueva pestaña). El ícono admite imagen del DAM (autoreada en el CF, igual que
 * los modales) o, como fallback, una key del átomo `Icon` (si no existe en `/icons`,
 * `Icon` degrada a un placeholder vacío sin romper).
 *
 * Accesibilidad: link con `aria-label` (el caller compone `label` +
 * "abre en nueva ventana" para `newTab`). Foco/hover visibles.
 *
 * ## Props
 * - `icon`: string — imagen del ícono. (a) URL/ruta de imagen del DAM (absoluta
 *   `https://…` o ruta `/…`, resuelta desde `_publishUrl` del CF) → se pinta `<img>`;
 *   o (b) key del átomo `Icon` ('members/quick-book-miles') → fallback de defaults.
 * - `iconAlt`: string — alt de la imagen del DAM (vacío si es decorativa).
 * - `label`: string — texto bajo el ícono (Static2).
 * - `url`: string — destino. Default '#' (placeholder; no navega + warn en dev).
 * - `newTab`: boolean — abre en nueva pestaña (`target=_blank` + rel seguro).
 * - `ariaLabel`: string — aria-label del link. Default = `label`.
 * - `labelTheme`: 'dark' | 'light' — color del texto de la label. Default `'dark'`
 *   (label blanca, diseñada para el chip sobre el gradient oscuro del hero).
 *   Usar `'light'` cuando la action vive sobre un fondo claro (Dashboard /profile)
 *   para que la label sea legible. El chip circular del ícono mantiene su look
 *   oscuro en ambos casos — solo cambia el color del texto inferior.
 * - `chipTokens`: object|null — tokens del chip por tier (Figma 518:23646). Shape:
 *   `{ bg, border, icon, bgHover, iconHover, bgActive, iconActive }`. Los produce
 *   `getQuickActionTokens(tier, tierThemes)` en el helper `members-tier-theme.js`.
 *   Si viene → el chip se pinta con esos colores (fill/stroke/ícono del tier);
 *   si es `null`/`undefined` → chip oscuro genérico (`#262626`/`#9a9a9a`/blanco)
 *   como fallback (backward-compatible con superficies que aún no propagan tier).
 * - `customClassName`: string.
 */
export const MembersQuickAction = ({
  icon = '',
  iconAlt = '',
  label = '',
  url = '#',
  newTab = false,
  ariaLabel = '',
  labelTheme = 'dark',
  chipTokens = null,
  customClassName = '',
  ...rest
}) => {
  const handleClick = (e) => {
    if (!url || url === '#') {
      // eslint-disable-next-line no-console
      console.warn(`[MembersQuickAction] url no configurada (CF) para "${label}". Click no navega.`);
      e.preventDefault();
    }
  };

  // El ícono del CF llega como URL/ruta de imagen del DAM (absoluta o `/…`); los
  // defaults de código son keys del átomo `Icon`. URL/ruta → se enmascara como
  // silueta (mask-image + background=currentColor); key → átomo `Icon` (que ya
  // usa currentColor). En ambos casos el ícono hereda el `text-*` del chip:
  // default = blanco, hover/active = color del tier (Figma 518:23397: cada tier
  // muestra el ícono en su color en hover, no un invert genérico). Ícono a 32×32
  // (Figma: chip 50×50 = 32 content + 8 padding × 2 + 1 border × 2, box-border).
  const isImageIcon = typeof icon === 'string' && (/^(https?:)?\/\//.test(icon) || icon.startsWith('/'));
  // Escape básico para el `url("...")` del CSS: comillas y paréntesis podrían romper
  // la declaración (rutas del DAM/http normalmente son seguras, pero el escape es
  // defensivo — sin normalización de comillas dobles el src puede cerrar `url("..."`).
  const safeIconUrl = isImageIcon
    ? String(icon).replace(/"/g, '%22').replace(/\)/g, '%29')
    : '';
  const iconMaskStyle = {
    WebkitMaskImage: `url("${safeIconUrl}")`,
    maskImage: `url("${safeIconUrl}")`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    backgroundColor: 'currentColor',
  };
  const iconNode = isImageIcon
    ? html`<span
        aria-hidden="true"
        class="block w-8 h-8 shrink-0"
        style=${iconMaskStyle}
      ></span>`
    : html`<${Icon} icon=${icon} customSize=${32} color="currentColor" />`;

  // Theming del chip por tier (Figma 518:23646). Si `chipTokens` viene, pintamos
  // fill/stroke/ícono con CSS vars por instancia y dejamos que Tailwind haga el
  // resto con `group-hover:`/`group-active:` sobre esas mismas vars (mismo patrón
  // que la píldora "Ver perfil" del hero). Si NO viene → clases hardcoded del
  // fallback oscuro histórico (backward-compatible: samples y otras superficies
  // que aún no propagan tier siguen renderizando exactamente igual).
  const chipStyle = chipTokens ? {
    '--qa-bg': chipTokens.bg,
    '--qa-border': chipTokens.border,
    '--qa-icon': chipTokens.icon,
    '--qa-bg-hover': chipTokens.bgHover,
    '--qa-border-hover': chipTokens.borderHover,
    '--qa-icon-hover': chipTokens.iconHover,
    '--qa-bg-active': chipTokens.bgActive,
    '--qa-border-active': chipTokens.borderActive,
    '--qa-icon-active': chipTokens.iconActive,
  } : undefined;
  const chipClasses = chipTokens
    ? 'flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px] p-[8px] aspect-square rounded-full bg-[var(--qa-bg)] border border-solid border-[var(--qa-border)] text-[var(--qa-icon)] shrink-0 box-border motion-safe:transition-colors motion-safe:duration-150 group-hover:bg-[var(--qa-bg-hover)] group-hover:border-[var(--qa-border-hover)] group-hover:text-[var(--qa-icon-hover)] group-active:bg-[var(--qa-bg-active)] group-active:border-[var(--qa-border-active)] group-active:text-[var(--qa-icon-active)]'
    : 'flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px] p-[8px] aspect-square rounded-full bg-[#262626] border border-solid border-[#9a9a9a] text-white shrink-0 box-border motion-safe:transition-colors motion-safe:duration-150 group-hover:bg-white group-hover:border-white group-hover:text-[#262626] group-active:bg-[#e9e9e9] group-active:border-[#e9e9e9] group-active:text-[#262626]';

  return html`
    <a
      href=${url || '#'}
      target=${newTab ? '_blank' : undefined}
      rel=${newTab ? 'noopener noreferrer' : undefined}
      onClick=${handleClick}
      aria-label=${ariaLabel || label || undefined}
      ${/* El foco va sobre el ITEM COMPLETO (chip + label), rectangular con doble borde
           1.5px #28A8FF + 1.5px #FFFFFF (Figma 518:21862 exhibit "Focus"). Antes el anillo
           envolvía solo el chip circular (1284756). */ ''}
      class=${`group flex flex-col items-center gap-[2px] pt-[8px] px-[4px] pb-[4px] w-full max-w-[80px] max-[640px]:max-w-none max-[640px]:self-stretch max-[640px]:justify-self-stretch no-underline text-center outline-none rounded-[4px] focus-visible:[box-shadow:0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff] ${customClassName}`}
      data-name="members-quick-action"
      data-key=${icon || undefined}
      data-tier=${chipTokens ? chipTokens.key : undefined}
      style=${chipStyle}
      ...${rest}
    >
      <span
        ${/* Estados del chip (Figma 518:21862 default + 518:23646 tier-themed):
             default sin tier → oscuro #262626, hover → blanco, pressed → #E9E9E9,
             ícono siempre invierte. Con tier (Figma 518:23646, Lifemiles): fill
             `#970346`, stroke `#D7ACBF`, ícono `#FFFFFF`; hover/pressed conservan
             la inversión (chip claro + ícono en el color del tier), consistente
             con `pillTextHover` de la píldora "Ver perfil". */ ''}
        class=${chipClasses}
      >
        ${iconNode}
      </span>
      <span class=${`text-sm font-normal leading-[19px] antialiased ${labelTheme === 'light' ? 'text-[#262626]' : 'text-white'}`}>${label}</span>
    </a>
  `;
};

export default MembersQuickAction;
