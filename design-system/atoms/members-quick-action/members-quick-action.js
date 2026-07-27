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
  // defaults de código son keys del átomo `Icon`. URL/ruta → <img>; key → Icon.
  // Ícono a 32×32 (Figma: chip 50×50 = 32 content + 8 padding × 2 + 1 border × 2,
  // box-border). El átomo `Icon` no tiene preset `size` para 32 (sus presets
  // son xs=8/s=16/m=20/xl=24/l=40), por eso usamos `customSize={32}`.
  const isImageIcon = typeof icon === 'string' && (/^(https?:)?\/\//.test(icon) || icon.startsWith('/'));
  const iconNode = isImageIcon
    ? html`<img src=${icon} alt=${iconAlt} class="w-8 h-8 object-contain" loading="lazy" />`
    : html`<${Icon} icon=${icon} customSize=${32} color="#ffffff" />`;

  return html`
    <a
      href=${url || '#'}
      target=${newTab ? '_blank' : undefined}
      rel=${newTab ? 'noopener noreferrer' : undefined}
      onClick=${handleClick}
      aria-label=${ariaLabel || label || undefined}
      class=${`group flex flex-col items-center gap-[2px] pt-[8px] px-[4px] pb-[4px] w-full max-w-[80px] max-[640px]:max-w-none max-[640px]:self-stretch max-[640px]:justify-self-stretch no-underline text-center outline-none ${customClassName}`}
      data-name="members-quick-action"
      data-key=${icon || undefined}
      ...${rest}
    >
      <span
        class="flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px] p-[8px] aspect-square rounded-full bg-[#262626] border border-solid border-[#9a9a9a] text-white shrink-0 box-border motion-safe:transition-colors motion-safe:duration-150 group-hover:bg-[#333333] group-active:bg-[#000000] group-focus-visible:[box-shadow:0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff]"
      >
        ${iconNode}
      </span>
      <span class=${`text-sm font-normal leading-[19px] antialiased ${labelTheme === 'light' ? 'text-[#262626]' : 'text-white'}`}>${label}</span>
    </a>
  `;
};

export default MembersQuickAction;
