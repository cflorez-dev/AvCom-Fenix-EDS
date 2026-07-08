import { h } from '@dropins/tools/preact.js';
import { useState } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { getTierTheme } from '../../helpers/members-tier-theme.js';
import { useMembersHeroCompact } from '../../helpers/use-members-hero-compact.js';

const html = htm.bind(h);

/**
 * MembersHeroHeader - Encabezado gradient del drawer Members (Figma 169:13691,
 * 169:13851 mobile, 111:10076 mobile-chico).
 *
 * Gradient horizontal por tier (Lifemiles default `#b50080 → #e9010d`).
 * Estructura:
 *  1. Toolbar superior: logo `avianca lifemiles` + botón close.
 *  2. Bloque "HeroHeader profile small": vector decorativo + nombre + status row
 *     ("LifeMiles | nº socio | copy" + pill "Ver perfil >") + balance card
 *     ("Total / millas" | "Fecha de vencimiento / fecha").
 *  3. "Tab" inferior blanco con esquinas redondeadas que cose el header con el
 *     listado del drawer (rotate-180 sobre un div con rounded-b-2xl).
 *
 * Responsive:
 *  - ≥320px: status row + pill en una sola línea; balance card en 2 columnas.
 *  - ≤319px (`useMembersHeroCompact`): pill baja a su propia fila bajo el
 *    status; balance card en columna (Total → millas → Fecha → fecha).
 *
 * Datos faltantes en el VM (1255338 toUserVM expone solo {firstName, lastName,
 * tier, membershipNumber, language}). `totalMiles` y `expiryDate` quedan como
 * props con placeholder string para maquetar; cuando el wrapper LM exponga
 * balance/expiration habrá que enriquecer el VM y eliminar los TODOs de abajo.
 *
 * `viewProfileUrl` queda configurable. Si no llega URL, el pill renderiza con
 * `href="#"` (no-op) y se loggea un warn en dev — cuando llegue del CF
 * "Members Config" se cablea la URL real.
 *
 * ## Props
 * - `firstName`: string - nombre visible (h1, blanco). Default '—' como guard.
 * - `tier`: string - tier crudo del VM (ej. "LifeMiles"). Maneja la paleta vía
 *   `getTierTheme`. Default 'lifemiles'.
 * - `tierThemes`: object - map `{key: theme}` indexado del CF "Members Config"
 *   (ver `loadMembersConfig().tierThemes`). Si la key del tier resuelta está
 *   en el map, se usa el theme del CF; si no, cae al `TIER_PRESETS` hardcoded
 *   del helper. Default `null` (siempre presets locales — útil en samples
 *   sin acceso al CF).
 * - `tierLabel`: string - texto visible del tier en el status row (i18n).
 *   Default usa `tier` capitalizado.
 * - `membershipNumber`: string|null - nº de socio. Si null, se oculta la fila.
 * - `totalMiles`: string - total de millas formateado (ej. "232,757 millas").
 *   Default '—' (TODO: leer del wrapper LM).
 * - `expiryDate`: string - fecha de vencimiento formateada (ej. "Dic 31, 2026").
 *   Default '—' (TODO: leer del wrapper LM).
 * - `totalLabel`: string - label "Total" (i18n). Default 'Total'.
 * - `expiryLabel`: string - label "Fecha de vencimiento". Default 'Fecha de vencimiento'.
 * - `viewProfileLabel`: string - texto del pill. Default 'Ver perfil'.
 * - `viewProfileUrl`: string - URL del pill "Ver perfil". Default '#' (warn en
 *   dev). Pasar `false`/`null` lo oculta explícitamente.
 * - `copyAriaLabel`: string - aria-label del botón copiar membershipNumber.
 *   Default 'Copiar número de socio'.
 * - `copiedLabel`: string - texto del tooltip que aparece tras copiar (Figma
 *   169:13208). Default 'Copiado'.
 * - `closeAriaLabel`: string - aria-label del botón close. Default 'Cerrar menú'.
 * - `logoUrl`: string - URL del logo del header (Figma 169:13691, 185.064×24).
 *   Default apunta al asset `assets/logos/members/avianca-lifemiles.svg`. El
 *   block puede sobrescribirla con cualquier ruta absoluta o relativa para
 *   reemplazar el lockup completo (útil para tematización por POS o A/B).
 * - `logoAlt`: string - texto alternativo accesible del logo. Default
 *   'Avianca LifeMiles'. Si se pasa string vacío el logo se trata como
 *   decorativo (`alt=""` + `aria-hidden`).
 * - `nameTag`: 'h1'|'h2'|'h3'|'h4'|'h5'|'h6'|'p' - tag HTML usado para
 *   renderizar `firstName` en el bloque profile (Figma 169:13851). Default
 *   'h3'. El autor (CF "Members Config", futuro campo `profileNameTag`) puede
 *   elegir un nivel distinto para ajustar la jerarquía semántica del drawer
 *   sin tocar el estilo visual (la clase CSS se aplica al tag elegido).
 *   Valores fuera del set permitido caen silenciosamente a 'h3'.
 * - `onClose`: function - callback al click en X.
 * - `onCopyMembership`: function - callback opcional al copiar nº socio.
 *   Default usa `navigator.clipboard.writeText(membershipNumber)`.
 * - `customClassName`: string
 */
export const MembersHeroHeader = ({
  firstName = '—',
  tier = 'lifemiles',
  tierThemes = null,
  tierLabel = '',
  membershipNumber = null,
  totalMiles = '—',
  expiryDate = '—',
  totalLabel = 'Total',
  expiryLabel = 'Fecha de vencimiento',
  viewProfileLabel = 'Ver perfil',
  viewProfileUrl = '#',
  copyAriaLabel = 'Copiar número de socio',
  copiedLabel = 'Copiado',
  closeAriaLabel = 'Cerrar menú',
  logoUrl = null,
  logoAlt = 'Avianca LifeMiles',
  nameTag = 'h3',
  onClose = null,
  onCopyMembership = null,
  customClassName = '',
  ...rest
}) => {
  const theme = getTierTheme(tier, tierThemes || {});
  const isCompact = useMembersHeroCompact();
  const [copied, setCopied] = useState(false);

  // `nameTag` whitelist: solo h1-h6 + p son válidos. Si el CF envía algo
  // distinto (typo, valor legacy, null), caemos a 'h3' silenciosamente — no
  // queremos romper el render del drawer por un valor mal configurado en AEM.
  // La whitelist también previene XSS por inyección de tag arbitrario vía CF.
  const NAME_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p']);
  const NameTag = NAME_TAGS.has(String(nameTag).toLowerCase())
    ? String(nameTag).toLowerCase()
    : 'h3';

  // Tier label visible: si el block lo pasa (i18n), úsalo; si no, capitaliza el
  // tier crudo (LifeMiles → Lifemiles). Nunca cae a string vacío.
  const visibleTierLabel = tierLabel
    || (theme.key === 'red-plus'
      ? 'Red Plus'
      : theme.key.charAt(0).toUpperCase() + theme.key.slice(1));

  // Path absoluto a los assets para que también funcione bajo `hlx.codeBasePath`
  // (subpaths de EDS).
  const codeBasePath = (typeof window !== 'undefined' && window.hlx?.codeBasePath) || '';
  const logoSrc = logoUrl || `${codeBasePath}/assets/logos/members/avianca-lifemiles.svg`;
  const decorativeVector = `${codeBasePath}/assets/logos/members/decorative-vector.svg`;
  const closeIcon = `${codeBasePath}/icons/members/close-24.svg`;
  const copyIcon = `${codeBasePath}/icons/members/copy-20.svg`;

  // Default copy handler: clipboard + flash visual de 1.5s. El consumidor puede
  // sobrescribir para disparar un toast con el design system.
  const handleCopy = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!membershipNumber) return;
    if (onCopyMembership) {
      onCopyMembership(membershipNumber);
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(membershipNumber);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[MembersHeroHeader] copy failed:', err);
    }
  };

  // Gradient inline porque los stops dependen del tier (variables CSS no nos
  // dejan hacer `linear-gradient(var(--from), var(--to))` con valores tier-derived
  // de forma 100% confiable cross-browser sin armar un theme CSS por tier).
  // Gold usa `gradientToStop=124.8%` para que el render visible (0-100%) no
  // alcance el `#ffa625` puro y quede más caoba en el extremo derecho.
  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, ${theme.gradientFrom} ${theme.gradientFromStop}, ${theme.gradientTo} ${theme.gradientToStop})`,
  };

  // Pill "Ver perfil" — SIEMPRE se renderiza (parte del diseño, Figma 360:13890).
  // Si no se pasa URL real, cae a '#' y se loggea un warn en dev. Pasar
  // `viewProfileUrl={false}` o `null` lo oculta explícitamente.
  const showProfilePill = viewProfileUrl !== false && viewProfileUrl !== null;
  const handleProfileClick = (e) => {
    if (viewProfileUrl === '#' || !viewProfileUrl) {
      // eslint-disable-next-line no-console
      console.warn('[MembersHeroHeader] viewProfileUrl no configurada (CF Members Config). Click no navega.');
      e.preventDefault();
    }
  };
  const profilePill = showProfilePill ? html`
    <a
      href=${viewProfileUrl || '#'}
      onClick=${handleProfileClick}
      class="group inline-flex items-center gap-1 px-3 py-[7px] rounded-[100px] border border-solid no-underline shrink-0 outline-none text-white bg-[var(--pill-bg)] [border-color:var(--pill-border)] hover:bg-white hover:border-transparent hover:text-[var(--pill-text-hover)] active:bg-[#e9e9e9] active:border-transparent active:text-[var(--pill-text-hover)] focus-visible:[box-shadow:0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff] motion-safe:transition-colors motion-safe:duration-150"
      style=${{
    '--pill-bg': theme.pillBg,
    '--pill-border': theme.pillBorder,
    '--pill-text-hover': theme.pillTextHover,
  }}
      data-name="members-view-profile"
    >
      <span class="font-bold text-base leading-[21px] whitespace-nowrap">
        ${viewProfileLabel}
      </span>
      ${/* Chevron usa fill="currentColor" para heredar el color del <a> en
          cada estado (default: white; hover/active: pillTextHover). */ ''}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M6.22 4.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L9.94 9 6.22 5.28a.75.75 0 0 1 0-1.06z"
          fill="currentColor"
        />
      </svg>
    </a>
  ` : null;

  // Status row (tier · [número + copy]). El botón agrupa membershipNumber +
  // copyIcon como un solo target hoverable (Figma 169:12888): hover bg
  // `#6d6d6d` con `mix-blend-multiply` opacity 40, `-inset-1` para dejar el
  // halo de 4px alrededor. Tooltip "Copiado" (Figma 169:13208) sobre el botón.
  const statusRow = html`
    <div class="flex items-center gap-2 flex-1 min-w-0" data-name="members-status">
      <span class="font-bold text-base text-white leading-[21px] whitespace-nowrap">
        ${visibleTierLabel}
      </span>
      ${membershipNumber && html`
        <span class="block w-px h-[14px] bg-[rgba(217,217,217,0.5)] shrink-0" aria-hidden="true"></span>
        <button
          type="button"
          onClick=${handleCopy}
          aria-label=${copyAriaLabel}
          class="group relative inline-flex items-center gap-1 p-0 bg-transparent border-0 cursor-pointer outline-none rounded-[4px]"
          data-name="members-copy"
          data-copied=${copied}
        >
          ${/* Halo: bg #6d6d6d 40% (mix-blend-multiply oscurece sobre el
              gradient) en hover y focus-visible. Geometría -inset-1 = 4px de
              respiro alrededor del texto+ícono (Figma 169:12888 / 341:13938). */ ''}
          <span
            aria-hidden="true"
            class="absolute -inset-1 rounded-[4px] bg-[#6d6d6d] mix-blend-multiply opacity-0 motion-safe:transition-opacity motion-safe:duration-150 group-hover:opacity-40 group-focus-visible:opacity-40"
          ></span>
          ${/* Focus ring (Figma 341:13938): 1.5px #28a8ff interior + 3px white
              exterior. Span separado del halo porque el halo usa
              `mix-blend-multiply` y no queremos que el blend afecte al anillo
              azul/blanco. Solo aparece en focus-visible (no en hover). */ ''}
          <span
            aria-hidden="true"
            class="absolute -inset-1 rounded-[4px] pointer-events-none opacity-0 group-focus-visible:opacity-100 [box-shadow:0_0_0_1.5px_#28a8ff,0_0_0_3px_#ffffff]"
          ></span>
          <span class="relative font-bold text-base text-white leading-[21px] whitespace-nowrap">
            ${membershipNumber}
          </span>
          <span class="relative inline-flex items-center justify-center w-5 h-5 shrink-0">
            <img src=${copyIcon} alt="" class="block w-[12.75px] h-[15px]" />
          </span>
          ${copied && html`
            <span
              role="status"
              aria-live="polite"
              class="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-[var(--color-brand-primary,#1b1b1b)] rounded-lg text-white text-sm font-normal leading-normal whitespace-nowrap pointer-events-none z-10"
            >${copiedLabel}</span>
          `}
        </button>
      `}
    </div>
  `;

  // Balance card. Layout horizontal por defecto (Total | Fecha en 2 columnas);
  // vertical cuando isCompact (≤319) — Total → millas → Fecha → fecha apilados.
  const balanceCard = html`
    <div
      class=${`rounded-2xl px-4 ${isCompact ? 'py-4 flex flex-col gap-3' : 'h-[73px] pt-4 pb-3 flex items-center gap-4'}`}
      style=${{ backgroundColor: theme.balanceCardBg }}
      data-name="members-balance-card"
      data-layout=${isCompact ? 'vertical' : 'horizontal'}
    >
      <div class=${`flex flex-col gap-0.5 ${isCompact ? '' : 'shrink-0'}`}>
        <span class="text-sm font-normal text-white leading-[19px]">${totalLabel}</span>
        <span class="text-[18px] font-bold text-white leading-[24px] whitespace-nowrap">
          ${totalMiles}
        </span>
      </div>
      <div class=${`flex flex-col gap-0.5 ${isCompact ? '' : 'flex-1 items-end text-right'}`}>
        <span class="text-sm font-normal text-white leading-[19px]">${expiryLabel}</span>
        <span class="text-[18px] font-bold text-white leading-[24px] whitespace-nowrap">
          ${expiryDate}
        </span>
      </div>
    </div>
  `;

  return html`
    <div
      class=${`relative w-full overflow-hidden ${customClassName}`}
      style=${gradientStyle}
      data-name="members-hero-header"
      data-tier=${theme.key}
      data-compact=${isCompact}
      ...${rest}
    >
      <!-- Toolbar superior: logo + close -->
      <div
        class="relative flex items-center justify-between px-4 pt-[50px] pb-4"
        data-name="members-hero-toolbar"
      >
        <div
          class="relative shrink-0"
          style=${{ width: '185.064px', height: '24px' }}
          data-name="avianca-lifemiles-logo"
        >
          ${/* Logo único SVG (Figma 169:13691: 185.064×24). Reemplazable por
              prop `logoUrl`. Si `logoAlt` viene vacío, lo tratamos como
              decorativo (alt="" + aria-hidden) y dejamos el <span sr-only>
              como texto accesible permanente del header. */ ''}
          <img
            src=${logoSrc}
            alt=${logoAlt || ''}
            aria-hidden=${logoAlt ? null : 'true'}
            class="block w-full h-full"
          />
          ${!logoAlt && html`<span class="sr-only">Avianca LifeMiles</span>`}
        </div>
        ${onClose && html`
          <button
            type="button"
            onClick=${(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            aria-label=${closeAriaLabel}
            class="shrink-0 inline-flex items-center justify-center w-6 h-6 p-0 bg-transparent border-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-white rounded-sm"
            data-name="members-hero-close"
          >
            <img src=${closeIcon} alt="" class="block w-[14px] h-[14px]" />
          </button>
        `}
      </div>

      <!-- Bloque profile -->
      <div class="relative flex flex-col gap-4 pt-4 pb-0" data-name="members-hero-profile">
        <!-- Vector decorativo (Figma 169:13165, hijo de HeroHeader profile small
             169:13164). Se posiciona absolute con top:-25px / right:0 RELATIVO
             a este bloque profile (no al header completo) para que solape 25px
             hacia arriba dentro de la zona del toolbar — así replica la
             geometría exacta de Figma donde el ala del cóndor sale por encima
             del límite superior del bloque profile.
             Se usa <img> apuntando al SVG exportado decorative-vector.svg
             (preserveAspectRatio="none", viewBox 117.647×132.437) en lugar de
             SVG inline para garantizar render pixel-perfect.
             Wrapper interno con inset negativo (-0.72%/-0.13%/-0.38%/-0.43%)
             replica el ligero overflow que Figma aplica para que los strokes
             del borde no queden recortados. Decorativo → aria-hidden. -->
        <div
          class="absolute right-0 -top-[25px] w-[117px] h-[131px] pointer-events-none select-none z-0"
          aria-hidden="true"
          data-name="members-hero-decorative-vector"
        >
          <div
            class="absolute"
            style=${{
    top: '-0.72%', right: '-0.13%', bottom: '-0.38%', left: '-0.43%',
  }}
          >
            <img
              src=${decorativeVector}
              alt=""
              class="block w-full h-full max-w-none"
            />
          </div>
        </div>

        <!-- Hello: nombre + status row -->
        <div class=${`flex flex-col z-1 px-4 ${isCompact ? '' : ''}`} data-name="members-hello">
          ${/* Tag dinámico (h1-h6 / p) según `nameTag` — el estilo visual
              (font, color, leading) se aplica por clase/style, así el autor
              puede ajustar la jerarquía semántica sin alterar el diseño. */ ''}
          <${NameTag}
            class="!m-0 leading-[32px] min-h-[40px]"
            style=${{ color: '#ffffff', fontWeight: 400 }}
            data-name="members-hero-name"
          >
            ${firstName}
          </${NameTag}>
          ${isCompact
    ? html`
        <div class="flex flex-col gap-2">
          ${statusRow}
          ${profilePill && html`<div class="flex">${profilePill}</div>`}
        </div>
      `
    : html`
        <div class="flex items-center gap-1 pt-[4px] pb-[4px] w-full">
          ${statusRow}
          ${profilePill}
        </div>
      `}
        </div>

        <!-- Balance Summary -->
        <div class="px-4" data-name="members-balance-summary">${balanceCard}</div>

        <!-- "Tab" inferior blanco: rotate-180 + rounded-b-2xl crea el efecto de
             pestaña curva entre el gradient y el listado de items debajo. -->
        <div class="w-full" data-name="members-hero-tab">
          <div class="rotate-180 w-full">
            <div class="bg-white h-4 rounded-bl-2xl rounded-br-2xl w-full"></div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export default MembersHeroHeader;
