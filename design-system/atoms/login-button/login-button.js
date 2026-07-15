import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { Tooltip } from '../tooltip/tooltip.js';
import { SimpleLoader } from '../simple-loader/simple-loader.js';
import loadSVGIcon from '../../../scripts/utils/svg.helper.js';

const html = htm.bind(h);

/**
 * LoginButton - Botón de login/perfil de Members (Figma 40:6320).
 *
 * Patrón de estado uniforme entre tiers:
 *  - default: bg transparente + border tier-color
 *  - hover:   bg #e9e9e9 + border tier-color
 *  - active:  bg #d9d9d9 + border tier-color
 *
 * Geometría (altura total 36px en TODAS las variantes):
 *  - logged-out full-button: contenido 34px + 1px border arriba/abajo (sin padding-y)
 *  - tier-* full-button:      contenido 26px + 4px padding-y + 1px border = 36px
 *  - chip (icon-only):        cuadrado 36×36
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTAS PARA EL BLOQUE CONSUMIDOR (a11y / UX que dependen de datos del block):
 *  1. Pasar SIEMPRE `userName` cuando esté disponible (aunque solo se muestre
 *     el chip): el átomo lo usa para construir un `aria-label` legible
 *     ("Mi perfil, Sofía Ramírez") y evita que el SR deletree las iniciales.
 *  2. El estado `disabled`/`aria-disabled` (mientras carga la sesión, etc.)
 *     debe gestionarse desde el block pasando `disabled` en `...rest`; este
 *     átomo no lo modela porque el flujo de sesión vive fuera del DS.
 *  3. La decisión responsive `full-button` (≥768px) vs `chip` (<768px) la
 *     toma el block consumidor con `useViewport` o media queries CSS.
 *  4. Si se usa dentro de un menú desplegable, el block debe añadir
 *     `aria-haspopup="menu"` y `aria-expanded` en `...rest`.
 *  5. El `Tooltip` debe quedar enlazado al trigger vía `aria-describedby`
 *     (responsabilidad del átomo Tooltip; verificar al integrar).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Props
 * @param {string} [tier='logged-out']
 *   Uno de: 'logged-out' | 'lifemiles' | 'red-plus' | 'silver' | 'gold' |
 *   'diamond' | 'magno'. Define el border-color del botón.
 * @param {('full-button'|'chip')} [variation='full-button']
 *   `full-button` = pill con texto. `chip` = botón cuadrado 36×36 (icono o iniciales).
 *   La decisión responsive (full-button ≥768px / chip <768px) la toma el block consumidor.
 * @param {string} [userName='']
 *   Full name para a11y / tooltip cuando tier !== 'logged-out'. Si no se pasa
 *   `userDisplayName`, se renderiza también como texto visible en `full-button`.
 *   Trunca con ellipsis. Se usa siempre para enriquecer el aria-label del chip.
 * @param {string} [userDisplayName='']
 *   Texto a mostrar en `full-button` (Figma Members usa solo el firstName,
 *   ej. "Sebastián"). Si está vacío, cae a `userName`. Solo afecta el render
 *   visible — el aria-label sigue construyéndose con `userName` para que el
 *   SR escuche el nombre completo.
 * @param {string} [userInitials='']
 *   Iniciales a mostrar en `chip` cuando tier !== 'logged-out'. Ej: 'SR'.
 * @param {string} [loginText='Iniciar sesión']
 *   Texto del estado logged-out (full-button). También usado como aria-label en chip
 *   logged-out.
 * @param {string} [tooltipText='Mi perfil']
 *   Texto del tooltip que aparece debajo del chip al hover/focus para tiers logueados.
 * @param {string} [href]
 *   Si se pasa, renderiza un `<a>` en lugar de `<button>`.
 * @param {string} [customClassName='']
 *   Clases extra aplicadas al elemento raíz.
 * @param {object} [tierColors=null]
 *   Colores del tier provenientes del CF "Members Config" (1255338): `colorStart`,
 *   `colorEnd`, `textColor`, `icon`. Si se pasa
 *   `colorStart`, se usa como border-color (override de la CSS var por tier). `colorEnd`
 *   se expone como custom prop `--tier-color-end` (sin cambio visual hoy; reservado para
 *   un futuro borde con gradiente). Si es `null`/sin `colorStart`, cae a `TIER_COLORS[tier]`.
 * @param {string} [icon='']
 *   Nombre del SVG (ej. 'social/person') para el icono del estado logged-out,
 *   configurable desde el CMS (CU-279 CA2). Si se omite, se usa el `PersonIcon`
 *   inline por defecto (Figma) — pintado inmediato, 0 CLS. Si se provee, se carga
 *   async en una caja reservada de 18×18 (sin layout shift, solo se pinta tarde).
 *   Solo aplica al estado `logged-out`; los tiers logueados muestran iniciales/nombre.
 * @param {boolean} [loading=false]
 *   Muestra un spinner (`SimpleLoader`) en lugar del icono leading mientras una acción
 *   async está en curso (ej. `login()` resolviendo el servicio de LM). Setea `aria-busy`.
 *   El anti-doble-click/`disabled` lo gestiona el block consumidor.
 */

// Fallback de color de borde por tier (CSS vars) cuando el CF "Members Config" NO provee
// `tiers[key]` (1255338). Las variantes *-cenit no tienen token propio: caen al color del
// tier base (gold/diamond) — sensato como degradación; el color real lo trae el CF.
const TIER_COLORS = {
  // logged-out: borde gris fino (#d9d9d9) para igualar al selector de país/idioma
  // del rediseño del header (AVAEMF2P20-158). Los tiers premium mantienen su color.
  'logged-out': 'var(--color-border-stroke-default)',
  lifemiles: 'var(--color-tier-lifemiles)',
  'red-plus': 'var(--color-tier-red-plus)',
  silver: 'var(--color-tier-silver)',
  gold: 'var(--color-tier-gold)',
  'gold-cenit': 'var(--color-tier-gold)',
  diamond: 'var(--color-tier-diamond)',
  'diamond-cenit': 'var(--color-tier-diamond)',
  magno: 'var(--color-tier-magno)',
};

// PersonIcon - SVG inline (NO se usa el átomo `Icon`).
//
// Razón: el átomo `Icon` carga el SVG con `fetch` async dentro de un
// `useEffect`, lo que en este botón provocaría:
//   - Flash/CLS al renderizar primero un placeholder vacío y luego el SVG.
//   - 1 request de red por instancia (cacheable, pero aún así).
//   - Coste extra de hooks (`useState` + `useEffect`) en un elemento crítico
//     above-the-fold del header.
// Mantener el SVG inline garantiza pintado inmediato (server-side incluido)
// y 0 CLS. Si en el futuro `Icon` soporta un modo `inline`/sprite estático,
// reconsiderar la migración.
const PersonIcon = () => html`
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9 9C10.6575 9 12 7.6575 12 6C12 4.3425 10.6575 3 9 3C7.3425 3 6 4.3425 6 6C6 7.6575 7.3425 9 9 9ZM9 10.5C6.9975 10.5 3 11.505 3 13.5V15H15V13.5C15 11.505 11.0025 10.5 9 10.5Z"
      fill="currentColor"
    />
  </svg>
`;

export const LoginButton = ({
  tier = 'logged-out',
  variation = 'full-button',
  userName = '',
  userDisplayName = '',
  userInitials = '',
  loginText = 'Iniciar sesión',
  tooltipText = 'Mi perfil',
  href = null,
  customClassName = '',
  icon = '',
  loading = false,
  tierColors = null,
  children,
  ...rest
}) => {
  const isChip = variation === 'chip';
  const isLoggedOut = tier === 'logged-out';
  // Color de borde: prioriza el `colorStart` del CF (1255338); si no, la CSS var del tier.
  const fallbackColor = TIER_COLORS[tier] || TIER_COLORS['logged-out'];
  const borderColor = tierColors?.colorStart || fallbackColor;
  const colorEnd = tierColors?.colorEnd || borderColor;

  // Icono configurable (CU-279 CA2): si el block authora `user-button-icon`, lo cargamos
  // async y lo pintamos en una caja de tamaño fijo (18×18) → NO hay CLS, solo aparece un
  // instante después. Si no hay `icon`, el render usa el `PersonIcon` inline (default Figma,
  // 0 CLS). El efecto NO corre cuando `icon` está vacío, así el camino por defecto no paga hooks.
  const [customIconHtml, setCustomIconHtml] = useState(null);
  useEffect(() => {
    if (!icon) {
      setCustomIconHtml(null);
      return undefined;
    }
    let alive = true;
    const codeBasePath = window.hlx?.codeBasePath || '';
    loadSVGIcon(`${codeBasePath}/icons/${icon}.svg`).then((svg) => {
      if (!alive || !svg) return;
      svg.setAttribute('width', '18');
      svg.setAttribute('height', '18');
      setCustomIconHtml(svg.outerHTML);
    });
    return () => { alive = false; };
  }, [icon]);

  // Tooltip de nombre truncado (Figma 76:12391).
  // Solo aplica a `full-button` de un tier logueado: el `<span>` del nombre
  // tiene `max-w-[136px]` + `text-ellipsis`; cuando el texto real excede el
  // ancho renderizado (`scrollWidth > clientWidth`) mostramos el nombre
  // completo en un Tooltip debajo del botón (gap 4px).
  //
  // Reglas del cliente:
  //  - Solo desktop (≥1024px). En móvil el hover no aplica y el touch podría
  //    disparar el estado sin intención → no renderizamos el Tooltip.
  //  - Solo si el texto está VISUALMENTE truncado. Si el nombre cabe entero,
  //    no hay tooltip.
  //
  // Implementación (patrón ref-callback + state):
  //  - `setNameNode` es un ref-callback que guarda el nodo DOM del span
  //    visible en un state. Esto es CRÍTICO porque cuando `isTruncated`
  //    pasa a true envolvemos el botón en `<Tooltip>` → Preact desmonta y
  //    remonta el <button> → nace un span DIFERENTE. Con `useRef` clásico
  //    el efecto no se re-ejecutaría y el `ResizeObserver` seguiría
  //    observando el nodo viejo (bug). Con state el efecto se re-corre
  //    cada vez que cambia el nodo → observer siempre sobre el actual.
  //  - `ResizeObserver` recalcula al cambiar el ancho del propio span
  //    (cubre resize de ventana + cambios de layout del contenedor sin
  //    tener que escuchar `window.resize` a mano).
  //  - `matchMedia('(min-width: 1024px)')` corta el flujo en móvil.
  const [nameNode, setNameNode] = useState(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!nameNode || typeof ResizeObserver === 'undefined') {
      setIsTruncated(false);
      return undefined;
    }
    const check = () => {
      // Tolerancia de 1px para diferencias por sub-pixel rendering.
      setIsTruncated(nameNode.scrollWidth > nameNode.clientWidth + 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(nameNode);
    return () => ro.disconnect();
  }, [nameNode, userDisplayName, userName]);

  // Nodo del icono "leading": spinner si `loading` (feedback de acción async, ej. login),
  // el SVG configurado (en caja reservada), o el PersonIcon inline por defecto.
  let leadingIcon;
  if (loading) {
    leadingIcon = html`
      <span class="inline-flex items-center justify-center w-[18px] h-[18px] shrink-0">
        <${SimpleLoader} size="small" />
      </span>
    `;
  } else if (icon) {
    leadingIcon = html`
      <span
        class="inline-flex items-center justify-center w-[18px] h-[18px] shrink-0"
        dangerouslySetInnerHTML=${{ __html: customIconHtml || '' }}
      ></span>
    `;
  } else {
    leadingIcon = html`<${PersonIcon} />`;
  }

  // Clases base – altura total 36px, border 1px, radius 32px, transición suave.
  // El bg sigue el patrón uniforme: transparent → #e9e9e9 (hover) → #d9d9d9 (active).
  // - `motion-safe:transition-colors` respeta `prefers-reduced-motion: reduce`.
  // - El ring de focus se renderiza con un <div> absoluto (mismo patrón que el
  //   átomo `Button`, ver outlineClasses más abajo). Por eso aquí se anula
  //   cualquier outline nativo, para evitar doble anillo.
  const baseClasses = 'group relative inline-flex items-center justify-center'
    + ' gap-[var(--spacing-tiny,4px)]'
    + ' h-9 rounded-[32px] border border-solid bg-transparent'
    + ' text-[14px] text-text-normal-primary'
    + ' motion-safe:transition-colors motion-safe:duration-150 ease-in-out'
    + ' cursor-pointer select-none'
    + ' hover:bg-[var(--color-background-brand-secondary-hover)]'
    + ' active:bg-[var(--color-background-brand-secondary-active)]'
    + ' outline-none focus:outline-none focus-visible:outline-none'
    + ' no-underline';

  // Geometría específica por variation/tier.
  let sizingClasses;
  if (isChip) {
    // 36×36 cuadrado, sin padding interno (el contenido se centra).
    sizingClasses = 'w-9 px-0 py-0';
  } else if (isLoggedOut) {
    // logged-out full-button: contenido 34px (h-9 - 2*1px border) + 9px X padding.
    sizingClasses = 'px-[9px] py-0 max-w-[160px]';
  } else {
    // tier-* full-button: contenido 26px (h-9 - 2*1px border - 2*4px padding-y).
    sizingClasses = 'px-[13px] py-1 max-w-[160px]';
  }

  // Focus ring — mismo patrón que el átomo `Button`:
  //   - <div> absoluto que cubre el botón.
  //   - Usa `outline` (no `border`) con `outline-offset` positivo para que el
  //     anillo aparezca por FUERA del elemento sin alterar su tamaño.
  //   - `hidden group-focus-visible:block` → solo visible al navegar con
  //     teclado (Tab), no al hacer click/touch.
  //   - `motion-safe:` respeta `prefers-reduced-motion`.
  const focusRing = html`
    <div
      aria-hidden="true"
      class="hidden group-focus-visible:block absolute w-full h-full max-w-full max-h-full pointer-events-none rounded-[32px] outline-2 outline-[var(--color-border-stroke-focus)] outline-offset-[4px] motion-safe:transition-all"
    ></div>
  `;

  // Contenido según variation × tier.
  let content;
  if (isLoggedOut && !isChip) {
    content = html`
      ${leadingIcon}
      <span class="font-normal whitespace-nowrap leading-none">${loginText}</span>
    `;
  } else if (isLoggedOut && isChip) {
    content = html`${leadingIcon}`;
  } else if (isChip) {
    content = html`
      <span class="font-bold leading-none uppercase tracking-[0]">
        ${userInitials || children}
      </span>
    `;
  } else {
    // Texto visible del full-button tier-*: si el block pasa `userDisplayName`
    // (típicamente solo el firstName, ej. "Sebastián" en Figma 14:31447), se
    // usa ese para el render. `userName` queda reservado para el aria-label
    // (full name → mejor a11y).
    const visibleName = userDisplayName || userName || children;
    content = html`
      <span
        ref=${setNameNode}
        class="font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[136px] leading-none"
      >
        ${visibleName}
      </span>
    `;
  }

  // Aria-label:
  // - chip logged-out: usa loginText (no hay texto visible).
  // - chip tier-*: prioriza `userName` si el block lo provee (evita que el SR
  //   deletree las iniciales letra por letra: "S, R"). Si solo hay iniciales,
  //   se usan como fallback.
  // - full-button tier-*: añade contexto de acción al nombre visible
  //   (ej. "Mi perfil, Sofía Ramírez") para que el SR no lea solo el nombre.
  // - full-button logged-out: NO se setea aria-label; el texto visible
  //   ("Iniciar sesión") ya es el accessible name.
  // NOTA(block): si `userName` no llega, el átomo cae al fallback de iniciales;
  // procurar pasar `userName` desde el block siempre que esté disponible.
  let ariaLabel;
  if (isChip && isLoggedOut) {
    ariaLabel = loginText;
  } else if (isChip) {
    ariaLabel = userName
      ? `${tooltipText}, ${userName}`
      : `${tooltipText}${userInitials ? `, ${userInitials}` : ''}`;
  } else if (!isLoggedOut && userName) {
    ariaLabel = `${tooltipText}, ${userName}`;
  }

  const cleanClasses = `${baseClasses} ${sizingClasses} ${customClassName}`.trim();

  // Exponemos el color del tier como CSS variable en el elemento raíz para
  // evitar crear un objeto `style` nuevo en cada render (mejor reuso de
  // referencias y mejor legibilidad en DevTools).
  // `--tier-color-start`/`--tier-color-end` quedan expuestas para un futuro borde con
  // gradiente (hoy el borde es sólido = colorStart). `--tier-color` se conserva por compat.
  const tierStyle = `--tier-color:${borderColor};--tier-color-start:${borderColor};`
    + `--tier-color-end:${colorEnd};border-color:${borderColor}`;

  const dataAttrs = {
    'data-name': 'loginButton',
    'data-tier': tier,
    'data-variation': variation,
    'aria-busy': loading || undefined,
  };

  const inner = html`
    ${focusRing}
    ${content}
  `;

  let trigger;
  if (href) {
    trigger = html`
      <a
        href=${href}
        class=${cleanClasses}
        style=${tierStyle}
        aria-label=${ariaLabel}
        ...${dataAttrs}
        ...${rest}
      >
        ${inner}
      </a>
    `;
  } else {
    trigger = html`
      <button
        type="button"
        class=${cleanClasses}
        style=${tierStyle}
        aria-label=${ariaLabel}
        ...${dataAttrs}
        ...${rest}
      >
        ${inner}
      </button>
    `;
  }

  // Tooltip variant="hint" SOLO en chip de tiers logueados.
  // Cumple AC del cliente: "al hacer hover sobre un botón icon-only debe
  // aparecer un tooltipHint con el label de la acción y el cursor debe
  // cambiar a pointer" (Figma 12:18324). La variante `hint` del átomo
  // Tooltip ya aplica `cursor-pointer` y posiciona el hint debajo del
  // trigger con el gap correcto.
  if (isChip && !isLoggedOut && tooltipText) {
    return html`
      <${Tooltip} content=${tooltipText} variant="hint" position="bottom">
        ${trigger}
      </${Tooltip}>
    `;
  }

  // Tooltip de nombre truncado (Figma 76:12391) para `full-button` de tiers
  // logueados: solo desktop y solo cuando el `<span>` visible del nombre
  // está realmente truncado (`scrollWidth > clientWidth`).
  //
  // El tooltip muestra el MISMO texto que el botón (concatenado sin espacio,
  // Figma 76:11915), no el aria-label con espacio. Por eso preferimos
  // `userDisplayName` (que el organismo compone como `firstName+lastName`
  // sin espacio para el visible) sobre `userName` (con espacio, reservado
  // para el aria-label / lectores de pantalla).
  //
  // Separación de 4px al bottom del botón (override del `mt-[10px]` por
  // defecto de la variante `hint` vía `tooltipClassName="!mt-[4px]"`).
  //
  // NOTA: NO usar `!mt-1`. Este proyecto sobrescribe la escala de spacing
  // de Tailwind (`--spacing-1 = 0.4rem = 6.4px`, no los 4px por defecto).
  // Arbitrary value `!mt-[4px]` es literal y no depende de la escala.
  if (
    !isChip
    && !isLoggedOut
    && isDesktop
    && isTruncated
    && (userDisplayName || userName)
  ) {
    return html`
      <${Tooltip}
        content=${userDisplayName || userName}
        variant="hint"
        position="bottom"
        tooltipClassName="!mt-[4px]"
      >
        ${trigger}
      </${Tooltip}>
    `;
  }

  return trigger;
};

export default LoginButton;
