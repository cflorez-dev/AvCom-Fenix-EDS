import { h } from '@dropins/tools/preact.js';
import htm from 'htm';
import { getMembersCardTheme, MEMBERS_CARD_SHADOW_DEFAULT } from '../../helpers/members-tier-theme.js';

const html = htm.bind(h);

/**
 * MembersCardCondor — SVG inline del watermark de la membership card (Figma
 * 518:23837). Dos piezas "engranadas":
 *  - **Cuerpo sólido** (path 0): rellenado con linearGradient parametrizado
 *    por tier. Los 4 puntos del vector (x1/y1/x2/y2) + las dos paradas
 *    (fromStop/toStop) también varían por tier (ej. Silver: stop2=0.905595,
 *    vector más diagonal). Defaults = valores de Red Plus (Figma 518:23839);
 *    Lifemiles y Magno usan variantes dedicadas con stroke-width 1.35443.
 *  - **Líneas de detalle** (paths 1-3): stroke con linearGradient blanco a
 *    opacidad 0.3 (constante en todas las variantes según Figma). Refuerzan
 *    la silueta sin pelearse con el gradient del cuerpo.
 *
 * IDs de los `<linearGradient>` se sufijan con `tier` para evitar colisión si
 * el design-system preview renderiza múltiples cards en la misma página.
 */
const MembersCardCondor = ({
  tier,
  colorFrom,
  colorTo,
  fromStop = '0',
  toStop = '1',
  x1 = '-160.456',
  y1 = '35.5291',
  x2 = '165.35',
  y2 = '159.319',
}) => {
  const fillId = `members-card-condor-${tier}-fill`;
  const strokeId = `members-card-condor-${tier}-stroke`;
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="224"
      height="200"
      viewBox="0 0 224 200"
      fill="none"
      aria-hidden="true"
      class="absolute top-0 right-0 pointer-events-none select-none"
      data-name="members-card-condor"
    >
      <path
        d="M228.772 -13.001V202.179H193.569C165.167 193.419 139.655 176.951 117.452 156.023H137.318C145.559 156.023 149.214 156.708 151.513 157.749C147.985 146.767 136.866 138.204 97.6837 135.267H97.673C59.6522 90.948 34.0405 34.2444 23.7717 -13.001H228.772Z"
        fill=${`url(#${fillId})`}
      />
      <path
        d="M137.23 156.059C145.501 156.059 149.167 156.743 151.474 157.786C147.934 146.798 136.777 138.232 97.4587 135.293C103.738 142.563 110.333 149.527 117.287 156.059H137.23Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.5"
        stroke-width="1.09228"
      />
      <path
        d="M97.4589 135.304C59.2993 90.9597 33.5927 34.226 23.2889 -13.0469C23.2889 -13.0469 2.31274 5.45348 0.648127 44.3611C-1.19559 86.8824 21.6137 129.751 96.732 135.219C96.9743 135.261 97.2271 135.262 97.4589 135.293V135.304Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.5"
        stroke-width="1.09228"
      />
      <path
        d="M117.286 156.058C87.6702 156.058 36.5414 156.058 36.5414 156.058C37.616 158.566 41.314 160.325 49.7319 160.82C100.134 163.812 107.266 203.363 179.403 203.363C185.735 203.363 189.686 202.983 193.679 202.235C165.17 193.47 139.568 176.992 117.286 156.048V156.058Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.5"
        stroke-width="1.09228"
      />
      <defs>
        <linearGradient id=${fillId} x1=${x1} y1=${y1} x2=${x2} y2=${y2} gradientUnits="userSpaceOnUse">
          <stop offset=${fromStop} stop-color=${colorFrom} />
          <stop offset=${toStop} stop-color=${colorTo} />
        </linearGradient>
        <linearGradient id=${strokeId} x1="8.82968" y1="69.2845" x2="164.2" y2="208.808" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.3" />
          <stop offset="1" stop-color="white" stop-opacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  `;
};

/**
 * MembersCardCondorCompact — variante COMPACTA del watermark del cóndor
 * (Figma 518:22622 / node 833:25542). NO es el mismo cóndor escalado: es un
 * SVG con viewBox propio (206.683 × 185.283) y paths recomputados para caber
 * dentro de sus bounds (los paths grandes se salían del viewBox 224×200 y
 * dependían del `overflow-hidden` de la card para clippear; los compact ya
 * caben "natively"). Stroke-width 0.92844 (vs 1.09228 del grande), stroke-
 * opacity 0.5. Fill parametrizado por tier (colorFrom/To + stops); default
 * = Gold del Figma (D79913 → AE5E29, stop2=0.406094).
 *
 * Posición: `right:-16.48px top:-11.96px w:206.683 h:185.283` sobre una card
 * de 289×170. Estos offsets corresponden al bleed real (los `inset-[-25.91%_0
 * _-0.4%_-23.67%]` que Figma aplica al wrapper del img); el "container box"
 * 167.119×146.694 que aparece en el export es solo un bounding-box de
 * diseñador — el cóndor real ocupa ~190×170 visible tras el `overflow-hidden`
 * de la card.
 */
const MembersCardCondorCompact = ({
  tier,
  colorFrom,
  colorTo,
  fromStop = '0.406094',
  toStop = '1',
  x1 = '193.767',
  y1 = '349.113',
  x2 = '95.84',
  y2 = '67.0022',
}) => {
  const fillId = `members-card-condor-compact-${tier}-fill`;
  const strokeId = `members-card-condor-compact-${tier}-stroke`;
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="206.683"
      height="185.283"
      viewBox="0 0 206.683 185.283"
      fill="none"
      aria-hidden="true"
      class="absolute top-[-11.96px] right-[-16.48px] w-[206.683px] h-[185.283px] pointer-events-none select-none"
      data-name="members-card-condor"
    >
      <path
        d="M192.331 0.910076V183.813H164.534C140.392 176.367 118.706 162.37 99.8346 144.58H116.72C123.725 144.58 126.831 145.163 128.786 146.048C125.787 136.713 116.336 129.434 83.0312 126.938H83.0221C50.7044 89.2667 28.9345 41.0686 20.2059 0.910076H192.331Z"
        fill=${`url(#${fillId})`}
      />
      <path
        d="M116.646 144.61C123.676 144.61 126.792 145.192 128.753 146.079C125.744 136.739 116.261 129.458 82.8399 126.96C88.1772 133.139 93.7832 139.058 99.6936 144.61H116.646Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.5"
        stroke-width="0.92844"
      />
      <path
        d="M82.8401 126.969C50.4044 89.2762 28.5538 41.0526 19.7956 0.870647C19.7956 0.870647 1.96583 16.5959 0.550909 49.6674C-1.01625 85.8106 18.3717 122.249 82.2222 126.897C82.4281 126.933 82.6431 126.933 82.8401 126.96V126.969Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.5"
        stroke-width="0.92844"
      />
      <path
        d="M99.6927 144.61C74.5197 144.61 31.0602 144.61 31.0602 144.61C31.9736 146.741 35.1169 148.237 42.2721 148.658C85.1137 151.201 91.1764 184.819 152.493 184.819C157.875 184.819 161.233 184.496 164.627 183.861C140.394 176.41 118.633 162.404 99.6927 144.601V144.61Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.5"
        stroke-width="0.92844"
      />
      <defs>
        <linearGradient id=${fillId} x1=${x1} y1=${y1} x2=${x2} y2=${y2} gradientUnits="userSpaceOnUse">
          <stop offset=${fromStop} stop-color=${colorFrom} />
          <stop offset=${toStop} stop-color=${colorTo} />
        </linearGradient>
        <linearGradient id=${strokeId} x1="7.50523" y1="70.8523" x2="139.57" y2="189.448" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.3" />
          <stop offset="1" stop-color="white" stop-opacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  `;
};

/**
 * MembersCardCondorLifemiles — variante dedicada al tier base Lifemiles (Figma
 * 518:23838). Comparte la "geometría grande" con Magno (stroke-width 1.35443,
 * paths con coordenadas .361/.5898/.418) pero con fill linear (no radial) y
 * paleta rojo → magenta (`#FF0000` → `#B50080`) que conecta con el balance
 * card del HeroHeader. Stroke con opacidad variable 0.3 → 0.5 (único tier que
 * lo hace) y vector ligeramente offset (8.96075 vs 8.82968 del resto).
 */
const MembersCardCondorLifemiles = ({ tier }) => {
  const fillId = `members-card-condor-${tier}-fill`;
  const strokeId = `members-card-condor-${tier}-stroke`;
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="224"
      height="200"
      viewBox="0 0 224 200"
      fill="none"
      aria-hidden="true"
      class="absolute top-0 right-0 pointer-events-none select-none"
      data-name="members-card-condor"
    >
      <path
        d="M230.403 -13.001V202.179H193.7C165.298 193.419 139.786 176.951 117.583 156.023H137.449C145.69 156.023 149.345 156.708 151.644 157.749C148.116 146.767 136.997 138.204 97.8148 135.267H97.8041C59.7833 90.948 34.1716 34.2444 23.9028 -13.001H230.403Z"
        fill=${`url(#${fillId})`}
      />
      <path
        d="M137.361 156.059C145.632 156.059 149.298 156.743 151.605 157.786C148.065 146.798 136.908 138.232 97.5898 135.293C103.869 142.563 110.464 149.527 117.418 156.059H137.361Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.5"
        stroke-width="1.35443"
      />
      <path
        d="M97.59 135.304C59.4303 90.9597 33.7237 34.226 23.42 -13.0469C23.42 -13.0469 2.44381 5.45348 0.779196 44.3611C-1.06452 86.8824 21.7448 129.751 96.863 135.219C97.1053 135.261 97.3582 135.262 97.59 135.293V135.304Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.5"
        stroke-width="1.35443"
      />
      <path
        d="M117.417 156.058C87.8013 156.058 36.6724 156.058 36.6724 156.058C37.7471 158.566 41.4451 160.325 49.8629 160.82C100.265 163.812 107.397 203.363 179.534 203.363C185.866 203.363 189.817 202.983 193.81 202.235C165.301 193.47 139.699 176.992 117.417 156.048V156.058Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.5"
        stroke-width="1.35443"
      />
      <defs>
        <linearGradient id=${fillId} x1="-142.987" y1="101.255" x2="298.949" y2="162.142" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF0000" />
          <stop offset="0.918625" stop-color="#B50080" />
        </linearGradient>
        <linearGradient id=${strokeId} x1="8.96075" y1="69.2845" x2="164.331" y2="208.808" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.3" />
          <stop offset="1" stop-color="white" stop-opacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  `;
};

/**
 * MembersCardCondorMagno — variante única del cóndor para el tier Magno (Figma
 * 518:23846). Difiere de la versión linear estándar en 3 ejes:
 *  1. **Fill**: radialGradient (negro a #1F0B00) con gradientTransform matricial
 *     anclado en (170,183) — simula una luz tenue desde el centro inferior.
 *  2. **Strokes**: linearGradient de 4 paradas en tonos marrón/cobre
 *     (#5F2900 → #C19075 → #692A06 → #3A1500). NO usa white/0.3 como el resto.
 *  3. **Atributos de stroke**: stroke-width 1.35443 (vs 1.09228) y
 *     stroke-opacity 0.8 (vs 0.5).
 *
 * Además el path del fill arranca en x=203.037 (vs 226.272 en el resto), por
 * lo que el path data es propio. Hardcoded acompletamente: no hay otros tiers
 * que reusen esta variante.
 */
const MembersCardCondorMagno = ({ tier }) => {
  const fillId = `members-card-condor-${tier}-fill`;
  const strokeId = `members-card-condor-${tier}-stroke`;
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="224"
      height="200"
      viewBox="0 0 224 200"
      fill="none"
      aria-hidden="true"
      class="absolute top-0 right-0 pointer-events-none select-none"
      data-name="members-card-condor"
    >
      <path
        d="M203.037 -13.001V202.179H193.7C165.298 193.419 139.786 176.951 117.583 156.023H137.449C145.69 156.023 149.345 156.708 151.644 157.749C148.116 146.767 136.997 138.204 97.8148 135.267H97.8041C59.7832 90.948 34.1716 34.2444 23.9028 -13.001H203.037Z"
        fill=${`url(#${fillId})`}
      />
      <path
        d="M137.361 156.059C145.632 156.059 149.298 156.743 151.605 157.786C148.065 146.798 136.908 138.232 97.5898 135.293C103.869 142.563 110.464 149.527 117.418 156.059H137.361Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.8"
        stroke-width="1.35443"
      />
      <path
        d="M97.59 135.304C59.4303 90.9597 33.7237 34.226 23.42 -13.0469C23.42 -13.0469 2.44381 5.45348 0.779196 44.3611C-1.06452 86.8824 21.7448 129.751 96.863 135.219C97.1053 135.261 97.3582 135.262 97.59 135.293V135.304Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.8"
        stroke-width="1.35443"
      />
      <path
        d="M117.417 156.058C87.8013 156.058 36.6724 156.058 36.6724 156.058C37.7471 158.566 41.4451 160.325 49.8629 160.82C100.265 163.812 107.397 203.363 179.534 203.363C185.866 203.363 189.817 202.983 193.81 202.235C165.301 193.47 139.699 176.992 117.417 156.048V156.058Z"
        stroke=${`url(#${strokeId})`}
        stroke-opacity="0.8"
        stroke-width="1.35443"
      />
      <defs>
        <radialGradient
          id=${fillId}
          cx="0"
          cy="0"
          r="1"
          gradientTransform="matrix(-89.9193 -169.758 91.3623 -178.567 170.723 183.513)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0486285" stop-color="#1F0B00" />
          <stop offset="1" stop-color="#000000" />
        </radialGradient>
        <linearGradient id=${strokeId} x1="13.1772" y1="-3.43603" x2="175.677" y2="214.306" gradientUnits="userSpaceOnUse">
          <stop offset="0.113137" stop-color="#5F2900" />
          <stop offset="0.445666" stop-color="#C19075" />
          <stop offset="0.783144" stop-color="#692A06" />
          <stop offset="0.941102" stop-color="#3A1500" />
        </linearGradient>
      </defs>
    </svg>
  `;
};

/**
 * MembersMembershipCard — tarjeta visual de membresía del hero expandido (1263924).
 * Figma 518:27631 (card) / 518:23837 (variantes por tier): gradient por tier,
 * watermark cuyo cuerpo es el cóndor (decorativo, esquina sup-derecha),
 * lockup "avianca lifemiles" + badge de tier (top-right), nombre del socio +
 * stack de marca/sub-status (bottom-right).
 *
 * SOLO se muestra en desktop (≥1024px); la VISIBILIDAD la controla el organism
 * (`members-hero`) envolviéndola, no la molécula — así queda reusable para el
 * Dashboard hermano (1263921), que la dispone distinto. Theme por tier vía
 * `getTierTheme` (Gold usa gradientToStop 124.8%).
 *
 * ## Bottom-right (CF-driven)
 * Dos slots INDEPENDIENTES (Figma 518:23842 — gold-cenit):
 *  - `logoPrimary` → ancla al footer bottom-right (junto al nombre del socio).
 *    Tamaño fijo 38.498×38.498 — el "Star Alliance Imagotype + Gold badge"
 *    para tiers regulares, o cualquier composición para cenit/custom tiers.
 *  - `logoSecondary` → flota a la derecha del card, centrado vertical (16px
 *    inset del borde derecho). Su rol semantico es un sello/badge ADICIONAL
 *    (ej. "Cenit" stamp para gold-cenit/diamond-cenit), no parte del lockup.
 *    Tamaño intrínseco hasta 43px de ancho (matchea el container Cenit en
 *    Figma). Solo aparece si el CF envía imagen; tiers regulares lo dejan
 *    null y el slot queda vacío.
 * Si NO hay `logoPrimary`, el slot del footer queda vacío — el autor del CF
 * es responsable de poblar el campo por tier. No hay fallback local.
 *
 * ## Props
 * - `tier`: string — tier crudo del VM. Default 'lifemiles'.
 * - `tierThemes`: object|null — themes del CF. Default null (presets locales).
 * - `tierLabel`: string — texto del badge. Default = tier capitalizado.
 * - `memberName`: string — nombre del socio ya compuesto (ej. "Sebastián Ruiz").
 * - `logoUrl`: string|null — lockup. Default = asset local avianca-lifemiles.svg.
 * - `logoAlt`: string — alt del lockup. Default 'Avianca LifeMiles'.
 * - `compact`: boolean — variante compacta 289×170 (Figma 518:22622, dashboard
 *   colapsable). Escala todo el contenido interno a 0.85× (paddings 13.6/10.968,
 *   texto 11.9px, lockup 17px, radius 12.903, shadow suave, cóndor reposicionado
 *   a 167.119×146.694 con offset right:-16.48/top:26.05). Default `false`
 *   (variante grande 224×200 usada en `/members/profile`).
 * - `customClassName`: string.
 */
export const MembersMembershipCard = ({
  tier = 'lifemiles',
  tierThemes = null,
  tierLabel = '',
  memberName = '',
  logoUrl = null,
  logoAlt = 'Avianca LifeMiles',
  compact = false,
  customClassName = '',
  ...rest
}) => {
  const theme = getMembersCardTheme(tier, tierThemes || {});
  const visibleTier = tierLabel
    || (theme.key === 'red-plus'
      ? 'Red Plus'
      : theme.key.charAt(0).toUpperCase() + theme.key.slice(1));

  const codeBasePath = (typeof window !== 'undefined' && window.hlx?.codeBasePath) || '';
  const logoSrc = logoUrl || `${codeBasePath}/assets/logos/members/avianca-lifemiles.svg`;
  // Colores del cóndor (SVG inline): preset del tier; si el preset no los
  // tiene (tier recién agregado al CF sin valores), cae al gradient de la card
  // como aproximación visible — nunca queda transparente.
  const condorFrom = theme.condorFrom || theme.gradientFrom;
  const condorTo = theme.condorTo || theme.gradientTo;
  // Logos del CF (opcionales). `logoPrimary` (bottom-right) y `logoSecondary`
  // (right-center) son slots INDEPENDIENTES — cada uno renderiza si su src
  // está presente, sin depender del otro. Sin fallback local: si el CF no
  // envía la URL, el slot queda vacío (responsabilidad del autor poblarlo
  // por tier).
  const primaryLogoSrc = theme.logoPrimary || '';
  const secondaryLogoSrc = theme.logoSecondary || '';
  const primaryLogoNode = primaryLogoSrc
    ? html`
        <img
          src=${primaryLogoSrc}
          alt=${theme.logoPrimaryAlt || ''}
          aria-hidden=${theme.logoPrimaryAlt ? undefined : 'true'}
          class=${compact ? 'block w-[32.744px] h-[43.871px] shrink-0' : 'block w-[38.522px] h-[51.613px] shrink-0'}
          data-name="members-card-logo-primary"
        />
      `
    : null;

  // La tarjeta usa el gradient del tier; el cóndor va como watermark absoluto
  // (overflow-hidden lo recorta contra la card sin pintar fuera del border-radius).
  //
  // Tres caminos para el background, en orden de precedencia:
  //  1. `theme.cardBackground` (CF/preset): override TOTAL (ej. magno radial).
  //  2. linear-gradient construido con `theme.gradientAngle` (Figma por tier:
  //     111.84° lifemiles, 230° gold, 244° gold-cenit, -69.88° diamond…).
  //  3. Si NO hay angle ni en CF ni en preset → '135deg' genérico (red de
  //     seguridad; no es ningún Figma real).
  // Shadow: `theme.cardShadow` (solo magno hoy) → default Figma `shadow/large`.
  const cardBgImage = theme.cardBackground
    || `linear-gradient(${theme.gradientAngle || '135deg'}, ${theme.gradientFrom} ${theme.gradientFromStop}, ${theme.gradientTo} ${theme.gradientToStop})`;
  // Shadow: variante compact (Figma 518:22622) usa shadow suave 1.7/17/1.7 con
  // rgba(73,73,73,0.25); default sigue `shadow/large` del CF/preset.
  const compactShadow = '0px 1.7px 17px 1.7px rgba(73, 73, 73, 0.25)';
  const cardStyle = {
    backgroundImage: cardBgImage,
    boxShadow: compact ? compactShadow : (theme.cardShadow || MEMBERS_CARD_SHADOW_DEFAULT),
  };

  // Dispatch del cóndor: Lifemiles y Magno usan variantes dedicadas con
  // stroke-width 1.35 (vs 1.09 del linear estándar). Lifemiles agrega además
  // un fill rojo→magenta y stroke-opacity variable; Magno usa radial + strokes
  // marrones. El resto cae al linear estándar con stops/vector del theme.
  // Dispatch del cóndor:
  //  - `compact=true` (Figma 518:22622, dashboard colapsable): variante propia
  //    con viewBox 206.683×185.283, paths recomputados y stroke-width 0.92844.
  //    Fill parametrizado por tier (colorFrom/To + stops); las variantes
  //    magno/lifemiles NO tienen compact dedicado hoy — caen al mismo con
  //    sus colores del theme (aceptable porque el dashboard solo pinta Gold
  //    en el comp de referencia).
  //  - `compact=false`: Lifemiles y Magno usan variantes dedicadas con
  //    stroke-width 1.35 (vs 1.09 del linear estándar). Lifemiles agrega
  //    fill rojo→magenta y stroke-opacity variable; Magno usa radial +
  //    strokes marrones. El resto cae al linear estándar con stops/vector
  //    del theme.
  let condorNode;
  if (compact) {
    condorNode = html`<${MembersCardCondorCompact}
      tier=${theme.key}
      colorFrom=${condorFrom}
      colorTo=${condorTo}
    />`;
  } else if (theme.condorVariant === 'magno') {
    condorNode = html`<${MembersCardCondorMagno} tier=${theme.key} />`;
  } else if (theme.condorVariant === 'lifemiles') {
    condorNode = html`<${MembersCardCondorLifemiles} tier=${theme.key} />`;
  } else {
    condorNode = html`<${MembersCardCondor}
      tier=${theme.key}
      colorFrom=${condorFrom}
      colorTo=${condorTo}
      fromStop=${theme.condorFromStop || undefined}
      toStop=${theme.condorToStop || undefined}
      x1=${theme.condorX1 || undefined}
      y1=${theme.condorY1 || undefined}
      x2=${theme.condorX2 || undefined}
      y2=${theme.condorY2 || undefined}
    />`;
  }

  return html`
    <div
      class=${`relative overflow-hidden flex flex-col justify-between text-white ${compact ? 'min-h-[170px] max-h-[170px] rounded-[12.903px]' : 'min-h-[200px] rounded-2xl'} ${customClassName}`}
      style=${cardStyle}
      data-name="members-membership-card"
      data-tier=${theme.key}
      ...${rest}
    >
      ${/* Cóndor watermark (Figma 518:23838 / 518:23846). Dos piezas SVG
           engranadas: cuerpo sólido con gradient por tier + líneas de detalle.
           Anclado al borde INFERIOR-DERECHO (bottom: -3.225 / right: -19.385),
           recortado por el overflow-hidden de la card contra el border-radius.
           Variantes dedicadas: 'lifemiles' (rojo→magenta, stroke 1.35) y
           'magno' (radial + 4-stop strokes marrones). */ ''}
      ${condorNode}
      ${/* Secondary CF logo (Figma 518:23842 — Cenit stamp): flota a la
           DERECHA del card, centrado vertical, 16px de inset del borde
           derecho. Independiente del primary; solo aparece si el CF envía
           imagen. Tamaño intrínseco hasta 43px de ancho (container Cenit
           en Figma). Variante compact (Figma 518:22622): 32.744×43.871.
           `z-[1]` para quedar sobre el cóndor. */ ''}
      ${secondaryLogoSrc && html`
        <img
          src=${secondaryLogoSrc}
          alt=${theme.logoSecondaryAlt || ''}
          aria-hidden=${theme.logoSecondaryAlt ? undefined : 'true'}
          class=${compact
    ? 'absolute right-[16px] top-1/2 -translate-y-1/2 z-[1] block w-[32.744px] h-[43.871px] pointer-events-none'
    : 'absolute right-[16px] top-1/2 -translate-y-1/2 z-[1] block w-[43px] h-[53.7px] pointer-events-none'}
          data-name="members-card-logo-secondary"
        />
      `}
      ${/* Header: lockup + tier, alineados a la DERECHA (comp 518:27631).
           Padding 16px (Figma `pt-[16px] px-[16px]`). Variante compact:
           pt/px 13.6px (Figma 518:22622). `relative z-[1]` para que quede
           sobre el cóndor. */ ''}
      <div class=${`relative z-[1] flex items-start justify-end ${compact ? 'pt-[13.6px] px-[13.6px]' : 'pt-4 px-4'}`}>
        <div class="flex flex-col items-end gap-px">
          <img
            src=${logoSrc}
            alt=${logoAlt || ''}
            aria-hidden=${logoAlt ? undefined : 'true'}
            class=${compact ? 'block h-[17px] w-auto' : 'block h-5 w-auto'}
            data-name="members-card-lockup"
          />
          <span class=${`font-normal text-white text-right ${compact ? 'text-[11.9px] leading-none' : 'text-sm leading-[19px]'}`} data-name="members-card-tier">
            ${visibleTier}
          </span>
        </div>
      </div>
      ${/* Footer: nombre (izq) + primary CF logo (der, bottom-right). Padding
           y gap 12.903px (Figma `pb-[12.903px] px-[12.903px] gap-[12.903px]`,
           comp `User Details` 518:23842) — levemente más cerca del borde que
           el header (16px) para matchear el comp. Variante compact: 10.968
           (Figma 518:22622). El secondary NO va acá (vive flotando al
           right-center, ver arriba). */ ''}
      <div class=${`relative z-[1] flex items-end justify-between ${compact ? 'gap-[10.968px] pb-[10.968px] px-[10.968px]' : 'gap-[12.903px] pb-[12.903px] px-[12.903px]'}`}>
        ${memberName && html`
          <span class=${`font-bold text-white truncate min-w-0 ${compact ? 'text-[14px] leading-[19px]' : 'text-base leading-[21px]'}`} data-name="members-card-name">
            ${memberName}
          </span>
        `}
        ${primaryLogoNode}
      </div>
    </div>
  `;
};

export default MembersMembershipCard;
