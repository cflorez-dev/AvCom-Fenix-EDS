/**
 * Members tier theme — paleta del HeroHeader / drawer Members por tier.
 *
 * El VM de Lifemiles devuelve `tier` como string libre ("LifeMiles", "Gold",
 * "Diamond"…). Acá lo normalizamos a una key kebab y mapeamos a los tokens
 * visuales del Figma (gradient, balance card bg, pill "Ver perfil" bg/border).
 *
 * Fuentes (Figma "ENTREGABLE-OMNI Members"):
 *  - Lifemiles:  169:12058
 *  - Red Plus:   169:12148
 *  - Silver:     169:12237
 *  - Gold:       169:12504
 *  - Diamond:    169:12326
 *  - Magno:      169:12415
 *
 * Notas:
 *  - Todos los tiers usan texto + íconos blancos. Eso vive en el componente,
 *    no acá.
 *  - Gold tiene una particularidad CSS: la 2ª parada del gradient está a
 *    124.8% en vez de 100% — el render visible (0–100%) interpola entre
 *    `#88431c` (0%) y `#ffa625` (124.8%), por eso se ve más caoba en el
 *    extremo derecho que un naranja puro. Lo modelamos con `gradientToStop`.
 *  - Los hex que ves abajo (`#970346`, `#7d0106`, `#0f0f0f`…) NO están en
 *    `styles/variables/` — son específicos de este header y no se reusan en
 *    otros lados, por eso vienen literales acá y no como CSS vars.
 */

// `TIER_PRESETS` — fuente única de verdad LOCAL para los themes de tier.
// Se mantiene aunque el CF "Members Config" exponga `tiers[]` porque cumple
// 4 funciones que el CF NO puede cubrir solo:
//
//  1. **First paint síncrono**: `getMembersConfigSync()` corre antes del fetch
//     async; sin presets, el primer frame del HeroHeader renderiza con
//     `gradientFrom: undefined` (degradado roto / blanco) durante ~100-300ms.
//  2. **Fallback ante CF caído**: si publish está en mantenimiento, hay error
//     de CORS o Adobe cambia el shape del GraphQL, el drawer sigue temado.
//  3. **Fallback granular por tier**: si el CF trae `tiers[]` pero falta uno
//     (autor borró "Gold" por error, o LM lanza un tier nuevo aún no autorado),
//     ese tier cae al preset y los demás siguen viniendo del CF.
//  4. **Sample del DS**: `members-hero-header.sample.js` usa `getMembersTierTheme`
//     sin acceso al CF — sin presets, /design-system rompe.
//
// Costo: ~80 líneas de hex que casi nunca cambian (vienen del Brand Book; si
// cambian, cambia Figma y vamos a tocar igual ambos lados). NO es duplicación
// viva: el CF gana cuando responde, los presets son red de seguridad.
// Shadow estándar Figma 518:238xx (shadow/large): aplica a 7 de 8 tiers.
// Magno tiene shadow propio (warm-glow marrón). Si el CF envía `cardShadow`,
// gana sobre este default.
export const MEMBERS_CARD_SHADOW_DEFAULT = '0 2px 32px 8px rgba(27, 27, 27, 0.4)';

const TIER_PRESETS = {
  // Lifemiles (Figma 518:23838 — verdad para card; 169:12058 — drawer)
  // Gradient REAL Figma export: angle 111.84°, magenta700 9.77% → red500 105.75%.
  // NOTA: el end-stop > 100% es intencional (el extremo del rojo no aparece
  // sólido; se interpola dentro del 0-100% visible).
  lifemiles: {
    gradientFrom: '#b50080', // magenta/magenta700
    gradientFromStop: '9.77%',
    gradientTo: '#ff0000', // red/red500 (Figma: rgb(255,0,0), NO #e9010d)
    gradientToStop: '105.75%',
    gradientAngle: '111.843deg',
    balanceCardBg: '#970346',
    pillBg: '#970346',
    pillBorder: '#d7acbf',
    pillTextHover: '#970346', // Figma 350:13668 / 350:13700
    // Fill de la `members-progress-bar` (Figma 518:27631 / 518:26305 et al.):
    // siempre 90deg, paleta PROPIA distinta al card (acá magenta700 → red500
    // sólido `#D5013B`, no `#ff0000`). NO se deriva de `gradientFrom/To` porque
    // los del card usan ángulos y stops fuera del 100%; la barra es lineal pura.
    progressBarFill: 'linear-gradient(90deg, #B50080 0%, #D5013B 100%)',
    // Color del divisor vertical en `MembersDataGrid` (entre Tienes|Fecha,
    // entre col izq|col der, y entre Tienes|Estatus en mobile). Varía por
    // tier para combinar con la paleta del hero (rosa para lifemiles/red-plus,
    // bronce para gold/gold-cenit, gris neutro para silver/diamond/magno).
    dividerColor: '#C771AE',
    // Cóndor (Figma 518:23838): variante dedicada. Difiere del linear estándar
    // en stroke-width (1.35), stroke-opacity variable (0.3 → 0.5) y un vector
    // propio para el fill (rojo → magenta, no rojo → burdeo). Implementado como
    // sub-componente; este flag es el dispatcher.
    condorVariant: 'lifemiles',
  },
  // Red Plus (Figma 518:23839 — card; 169:12148 — drawer)
  // Gradient REAL Figma export: angle 110.17°, red900 18.04% → red500 189.82%.
  // NOTA: end-stop 189.82% (muy fuera de rango); el rojo brillante solo se
  // intuye en una esquina porque la interpolación visible se queda en burdeo.
  'red-plus': {
    gradientFrom: '#7c0005', // red/red900
    gradientFromStop: '18.04%',
    gradientTo: '#ff0000', // red/red500 (Figma: rgb(255,0,0), NO #d50102)
    gradientToStop: '189.82%',
    gradientAngle: '110.166deg',
    balanceCardBg: '#7d0106',
    pillBg: '#7d0106',
    pillBorder: '#c88f91',
    pillTextHover: '#7d0106',
    progressBarFill: 'linear-gradient(90deg, #930004 0%, #C90102 100%)',
    dividerColor: '#C771AE',
    // Cóndor (Figma 518:23839): exporte de Figma idéntico a Lifemiles
    // (mismos colores, vector y stops). Se declaran igual para que el lookup
    // sea explícito y no dependa del fallback a defaults.
    condorFrom: '#FF0000',
    condorTo: '#7C0005',
  },
  // Silver (Figma 518:23840 — card; 169:12237 — drawer)
  //
  // HERO / drawer / hero-header / hero-expanded / hero-compact (namespace CF
  // `color*`, ángulo hardcoded 90deg en cada componente):
  //   linear-gradient(90deg, #393838 0%, #6C6C6C 100%)
  //
  // CARD (members-membership-card, namespace CF `cardColor*`, angle desde CF
  // `gradientAngle`). Valores exactos del panel "Dev Mode → CSS" de Figma:
  //   linear-gradient(295deg, #C4C8C5 -85.98%, #393838 68.29%)
  // Puntos críticos que suelen exportarse mal:
  //   • Ángulo `295deg` (no `-52.137deg` del panel de rotación Figma; ése es
  //     el ángulo del handle, no la convención CSS).
  //   • Stop de LIGHT en `-85.98%` NEGATIVO: posiciona el color base fuera del
  //     canvas, dejando solo la parte final del degradado visible. Sin el signo,
  //     domina el silver y se pierde el look oscuro del tier.
  silver: {
    // Fallback del HERO (CF `colorStart/End/StartStop/Stop`).
    gradientFrom: '#393838',
    gradientFromStop: '0%',
    gradientTo: '#6c6c6c',
    gradientToStop: '100%',
    gradientAngle: '90deg',
    // Fallback del CARD (CF `cardColorStart/End/StartStop/EndStop/gradientAngle`).
    // Consumido por `getMembersCardTheme`. Separado del hero porque la paleta
    // y el ángulo son distintos por completo — el card usa una versión "clara
    // con toque oscuro" en diagonal, no la variante "oscuro a gris" horizontal
    // del hero.
    cardGradientFrom: '#c4c8c5', // neutral/opaque/gray500 (LIGHT)
    cardGradientFromStop: '-85.98%',
    cardGradientTo: '#393838', // neutral/opaque/gray1100 (DARK)
    cardGradientToStop: '68.29%',
    cardGradientAngle: '295deg',
    balanceCardBg: '#393838',
    pillBg: '#262626',
    pillBorder: '#777777',
    progressBarFill: 'linear-gradient(90deg, #393838 0%, #6C6C6C 100%)',
    dividerColor: '#6C6C6C',
    // Silver/Diamond son los únicos tiers donde el texto hover/active NO
    // coincide con `pillBg` — Figma usa una variante un poco más clara para
    // mantener contraste sobre fondo blanco/gris claro.
    pillTextHover: '#393838',
    // Cóndor (Figma 518:23840): stop2 cae a 0.905595 (no llega al 1.0) y el
    // vector arranca más arriba a la izquierda para un degradado más diagonal
    // y oscuro hacia la parte baja-derecha del cuerpo.
    condorFrom: '#C4C8C5',
    condorTo: '#393838',
    condorToStop: '0.905595',
    condorX1: '-221.343',
    condorY1: '-103.181',
    condorX2: '224.221',
    condorY2: '148.029',
  },
  // LifeMiles Silver Cenit — en Figma comparte la misma paleta visual que
  // Silver para el pill "Ver perfil" (bg/border/hover), con diferenciación
  // de sub-status fuera del botón.
  'silver-cenit': {
    // Fallback del HERO (mismo look que silver base).
    gradientFrom: '#393838',
    gradientFromStop: '0%',
    gradientTo: '#6c6c6c',
    gradientToStop: '100%',
    gradientAngle: '90deg',
    // Fallback del CARD — ver nota completa en preset `silver`.
    cardGradientFrom: '#c4c8c5',
    cardGradientFromStop: '-85.98%',
    cardGradientTo: '#393838',
    cardGradientToStop: '68.29%',
    cardGradientAngle: '295deg',
    balanceCardBg: '#393838',
    pillBg: '#262626',
    pillBorder: '#777777',
    progressBarFill: 'linear-gradient(90deg, #393838 0%, #6C6C6C 100%)',
    dividerColor: '#6C6C6C',
    pillTextHover: '#393838',
    condorFrom: '#C4C8C5',
    condorTo: '#393838',
    condorToStop: '0.905595',
    condorX1: '-221.343',
    condorY1: '-103.181',
    condorX2: '224.221',
    condorY2: '148.029',
  },
  // Gold (Figma 518:23841 — card; 169:12504 — drawer)
  // Gradient REAL Figma export: angle 230.02°, #F0B806 (yellow-orange) 4.18%
  // → #AE5E29 (mahogany) 55.94%. NO es la paleta vieja #88431C → #FFA625.
  gold: {
    gradientFrom: '#f0b806',
    gradientFromStop: '4.179%',
    gradientTo: '#ae5e29',
    gradientToStop: '55.94%',
    gradientAngle: '230.022deg',
    balanceCardBg: '#703b16',
    pillBg: '#703b16',
    pillBorder: '#ceb19c',
    pillTextHover: '#703b16',
    // Gold barra (Figma): stops 42.01% → 90.56% (mahogany → caramel claro).
    progressBarFill: 'linear-gradient(90deg, #AE5E29 42.01%, #C37D1D 90.56%)',
    dividerColor: '#D28B5D',
    // Cóndor (Figma 518:23841): stop1 entra recién a 0.406094 (la mitad
    // superior queda en el color base sólido antes de empezar a degradar) y
    // el vector va de abajo-derecha hacia el centro-arriba (227,396 → 112,64),
    // espejado respecto a Lifemiles/Silver.
    condorFrom: '#D79913',
    condorTo: '#AE5E29',
    condorFromStop: '0.406094',
    condorX1: '227.961',
    condorY1: '396.65',
    condorX2: '112.753',
    condorY2: '64.7545',
  },
  // LifeMiles Gold Cenit (Figma 518:23842) — sub-tier premium de Gold.
  // Gradient REAL Figma: angle 244.22°, mismas paletas que Gold pero ÁNGULO
  // distinto (244 vs 230) y stops ligeramente más estrechos.
  'gold-cenit': {
    gradientFrom: '#f0b806',
    gradientFromStop: '3.821%',
    gradientTo: '#ae5e29',
    gradientToStop: '55.696%',
    gradientAngle: '244.221deg',
    balanceCardBg: '#806600',
    pillBg: '#806600',
    pillBorder: '#D9B566',
    pillTextHover: '#806600',
    // Gold-cenit barra: idéntica a Gold (mismo gradient en Figma).
    progressBarFill: 'linear-gradient(90deg, #AE5E29 42.01%, #C37D1D 90.56%)',
    dividerColor: '#D28B5D',
    condorFrom: '#D79913',
    condorTo: '#AE5E29',
    condorFromStop: '0.406094',
    condorX1: '227.961',
    condorY1: '396.65',
    condorX2: '112.753',
    condorY2: '64.7545',
  },
  // Diamond (Figma 518:23843 — card; 169:12326 — drawer)
  // Gradient REAL Figma export: angle -69.88°, mint900 (LIGHT) 9.59% →
  // magenta1000 (DARK) 91.14%. Stops invertidos (LIGHT → DARK), igual que Silver.
  diamond: {
    gradientFrom: '#585f5e', // mint/mint900 (LIGHT)
    gradientFromStop: '9.5885%',
    gradientTo: '#232021', // magenta/magenta1000 (DARK)
    gradientToStop: '91.136%',
    gradientAngle: '-69.882deg',
    balanceCardBg: '#232021',
    pillBg: '#0f0f0f',
    pillBorder: '#656565',
    pillTextHover: '#232021', // ver nota Silver.
    // Diamond barra: orden inverso al card (DARK → LIGHT en horizontal).
    progressBarFill: 'linear-gradient(90deg, #232021 0%, #585F5E 100%)',
    dividerColor: '#6C6C6C',
    // Cóndor (Figma 518:23843): mint claro → magenta1000 oscuro, vector
    // diagonal de izquierda-arriba a derecha-abajo (-78,5 → 212,202).
    condorFrom: '#585F5E',
    condorTo: '#232021',
    condorX1: '-78.6016',
    condorY1: '5.28712',
    condorX2: '212.931',
    condorY2: '202.465',
  },
  // LifeMiles Diamond Cenit (Figma 518:23844) — sub-tier premium de Diamond.
  // Gradient REAL Figma: idéntico a Diamond (mismos hex, stops y ángulo);
  // la diferenciación visual cenit vive en logoSecondary, no en el card bg.
  'diamond-cenit': {
    gradientFrom: '#585f5e',
    gradientFromStop: '9.5885%',
    gradientTo: '#232021',
    gradientToStop: '91.136%',
    gradientAngle: '-69.882deg',
    balanceCardBg: '#232021',
    pillBg: '#0f0f0f',
    pillBorder: '#656565',
    pillTextHover: '#232021',
    progressBarFill: 'linear-gradient(90deg, #232021 0%, #585F5E 100%)',
    dividerColor: '#6C6C6C',
    condorFrom: '#585F5E',
    condorTo: '#232021',
    condorX1: '-78.6016',
    condorY1: '5.28712',
    condorX2: '212.931',
    condorY2: '202.465',
  },
  // Magno (Figma 518:23846 — card; 169:12415 — drawer)
  // El ÚNICO tier que NO usa linearGradient: Figma exporta un radial con
  // gradientTransform matriz centrado en (246.76, 182.66) sobre 340×200
  // (≈72.6%×91.3%). Aproximación CSS: radial-gradient ellipse anclado a
  // esa esquina con los 3 stops del Figma. `cardBackground` override total
  // → ignora gradientFrom/To/Angle. `cardShadow` también propio (warm-glow
  // marrón en lugar del shadow oscuro estándar de los otros 7 tiers).
  magno: {
    gradientFrom: '#1f0b00', // se conservan para fallback/condor
    gradientFromStop: '0%',
    gradientTo: '#000000',
    gradientToStop: '100%',
    cardBackground: 'radial-gradient(ellipse 289px 227px at 72.6% 91.3%, #1f0b00 2.62%, #100600 50.47%, #000000 98.33%)',
    cardShadow: '0 1.256px 41.799px 4.718px rgba(193, 144, 117, 0.3)',
    balanceCardBg: '#1b0900',
    pillBg: '#1b0900',
    pillBorder: '#6b5d56',
    pillTextHover: '#1b0900',
    // Magno barra: linear (no radial como el card) negro → marrón muy oscuro.
    progressBarFill: 'linear-gradient(90deg, #000000 0%, #1F0B00 100%)',
    dividerColor: '#6C6C6C',
    // Cóndor (Figma 518:23846): variante única que NO usa el linearGradient
    // estándar — el fill es radial (negro → #1F0B00) y los strokes son un
    // linearGradient de 4 stops en tonos marrón (no white/0.3 como el resto).
    // Cambian también stroke-width (1.35) y stroke-opacity (0.8). Implementado
    // como sub-componente dedicado en la molecule; este flag es el dispatcher.
    condorVariant: 'magno',
  },
};

/**
 * Normaliza un tier string del VM a la key kebab usada acá. El formato del
 * VM es libre ("LifeMiles", "Red Plus", "red_plus"); siempre devuelve algo
 * válido del mapa, default 'lifemiles'.
 *
 * @param {string} raw tier devuelto por el VM (ej. "LifeMiles", "Gold").
 * @returns {('lifemiles'|'gold'|'silver'|'diamond'|'red-plus'|'magno')}
 */
export const normalizeTierKey = (raw) => {
  const k = String(raw || '').toLowerCase().replace(/[\s_]+/g, '-');
  if (k === 'redplus') return 'red-plus';
  if (k === 'silvercenit') return 'silver-cenit';
  if (k === 'goldcenit') return 'gold-cenit';
  if (k === 'diamondcenit') return 'diamond-cenit';
  // Magno no distingue Cenit en theming (1271699): cualquier variante colapsa.
  if (k === 'magnocenit' || k === 'magno-cenit') return 'magno';
  // Keys compuestas del SERVICIO (1271699): `status.current` llega con sufijo de
  // nivel pegado ('diamondone', 'goldone', 'magnotwo'…) y `tier`/`cenitStatus`
  // como display armado ('Diamond Cenit One Million' → 'diamond-cenit-one-million'
  // tras el replace de arriba). Por sufijo, no lista cerrada: ambos formatos
  // colapsan al preset `-cenit` del tier base; si no existe (magno), al base.
  const composite = k.match(/^(redplus|red-plus|lifemiles|silver|gold|diamond|magno)(?:-?cenit)?-?(?:one|two)(?:-million)?$/);
  if (composite) {
    const base = composite[1] === 'redplus' ? 'red-plus' : composite[1];
    const cenitKey = `${base}-cenit`;
    return TIER_PRESETS[cenitKey] ? cenitKey : base;
  }
  return TIER_PRESETS[k] ? k : 'lifemiles';
};

/**
 * Theme final del HeroHeader Members para un tier dado. Si el tier no está
 * mapeado, cae al default Lifemiles.
 *
 * @param {string} rawTier
 * @returns {{
 *   key:string,
 *   gradientFrom:string,
 *   gradientFromStop:string,
 *   gradientTo:string,
 *   gradientToStop:string,
 *   balanceCardBg:string,
 *   pillBg:string,
 *   pillBorder:string,
 *   pillTextHover:string,
 *   logoPrimary:string,
 *   logoPrimaryAlt:string,
 *   logoSecondary:string,
 *   logoSecondaryAlt:string,
 *   condorFrom:string,
 *   condorTo:string,
 *   condorFromStop:string,
 *   condorToStop:string,
 *   condorX1:string,
 *   condorY1:string,
 *   condorX2:string,
 *   condorY2:string,
 *   condorVariant:string,
 * }}
 */
export const getMembersTierTheme = (rawTier) => {
  const key = normalizeTierKey(rawTier);
  const preset = TIER_PRESETS[key];
  return { key, ...preset };
};

/**
 * Adapta una fila del CF "Members Config" → `tiers[]` al shape de theme que
 * consume `MembersHeroHeader`. Mapeo CF → theme:
 *   colorStart      → gradientFrom
 *   colorStartStop  → gradientFromStop  (offset de la 1ª parada del gradient)
 *   colorEnd        → gradientTo
 *   gradientStop    → gradientToStop    (offset de la 2ª parada)
 *   balanceCardBg, pillBg, pillBorder, pillTextHover → passthrough
 *   logoPrimary / logoSecondary → URL del DAM (`_publishUrl`) o string crudo.
 *     Convención visual (Figma 518:23837): `logoPrimary` es el imagotype Star
 *     Alliance (38.5×38.5px, esquina inferior derecha de la membership card);
 *     `logoSecondary` es el badge sub-status ("Star Alliance Silver"/"Gold",
 *     38.5×13.1px, debajo del primary). Ambos opcionales: si el CF no envía
 *     ninguno, los slots quedan vacíos (responsabilidad del autor poblarlos).
 *   logoPrimaryAlt / logoSecondaryAlt → alt accesible (vacío = decorativo).
 *
 * Campos extra del CF (`displayName`, `textColor`, `icon`, `sortOrder`) se
 * preservan en el theme por si el header los consume en el futuro, sin
 * romper el shape actual.
 *
 * Fallback por campo: si el CF no envía `colorStartStop` o `pillTextHover`,
 * se usa el valor del preset local; si tampoco hay preset (tier nuevo no
 * mapeado), se cae a un default seguro (`'0%'` para el stop, `pillBg` para
 * el hover).
 *
 * @param {object} cfTier - fila del CF (al menos {key,colorStart,colorEnd,...}).
 * @returns {object|null} theme normalizado, o `null` si la fila no tiene `key`.
 */
export const cfTierToTheme = (cfTier) => {
  if (!cfTier || !cfTier.key) return null;
  const key = normalizeTierKey(cfTier.key);
  const presetForKey = TIER_PRESETS[key];
  // Resuelve un ImageRef del CF a URL string. Acepta: (a) DAM ref con
  // `_publishUrl` (modelo de AEM cuando el field es Content Reference → image),
  // (b) string crudo (URL absoluta o ruta), (c) null/undefined → ''. Mismo helper
  // que `normalizeMembersCF` usa para `quickActions.icon`.
  const resolveImageRef = (ref) => {
    if (!ref) return '';
    // eslint-disable-next-line no-underscore-dangle
    if (typeof ref === 'object') return ref._publishUrl || ref._path || '';
    return typeof ref === 'string' ? ref : '';
  };
  return {
    key,
    // `colorStart` (color de la 1ª parada): CF → preset → vacío.
    // Fallback al preset garantiza que si el autor borra el campo en CF, NO
    // queda transparente — cae al hex de Figma del preset.
    gradientFrom: cfTier.colorStart
      || (presetForKey && presetForKey.gradientFrom)
      || '',
    // `colorStartStop` (1ª parada): muchos tiers usan `0%`, pero algunos
    // (ej. Gold BP4 518:22622) arrancan en `42.01%` para suavizar el inicio.
    // Fallback: preset → `'0%'`.
    gradientFromStop: cfTier.colorStartStop
      || (presetForKey && presetForKey.gradientFromStop)
      || '0%',
    // `colorEnd` (color de la 2ª parada): mismo patrón que colorStart.
    gradientTo: cfTier.colorEnd
      || (presetForKey && presetForKey.gradientTo)
      || '',
    // `gradientStop` (2ª parada): mismo patrón que colorStartStop. Figma usa
    // valores fuera del 100% (ej. lifemiles 105.75%, red-plus 189.82%) para
    // controlar el rango visible del degradado — preservarlos importa.
    gradientToStop: cfTier.gradientStop
      || (presetForKey && presetForKey.gradientToStop)
      || '100%',
    // `gradientAngle` (CF nuevo): cada tier en Figma 518:238xx usa un ángulo
    // propio (111.84° lifemiles, 230° gold, 244° gold-cenit, -69.88° diamond…).
    // Fallback: preset → '135deg' (genérico seguro, no es ningún Figma real).
    gradientAngle: cfTier.gradientAngle
      || (presetForKey && presetForKey.gradientAngle)
      || '135deg',
    // `cardBackground` (CF nuevo): override TOTAL del background-image cuando
    // el tier necesita algo no-linear (ej. magno = radial-gradient). Si está
    // presente, ignora gradientFrom/To/Angle. Útil para tiers raros o futuros.
    cardBackground: cfTier.cardBackground
      || (presetForKey && presetForKey.cardBackground)
      || '',
    // `cardShadow` (CF nuevo): override del shadow de la card. Solo Magno lo
    // usa hoy (warm-glow marrón); los demás caen al default Figma (`shadow/large`).
    cardShadow: cfTier.cardShadow
      || (presetForKey && presetForKey.cardShadow)
      || '',
    // `progressBarFill` (CF nuevo): string CSS completo (`linear-gradient(...)`
    // o cualquier `background-image` válido) para el fill de la barra de
    // progreso elite. Independiente de `gradient*` del card porque Figma usa
    // paleta y ángulo distintos. Vacío → la molecule cae al fill legacy por
    // `variant` (navy/magenta) del atom.
    progressBarFill: cfTier.progressBarFill
      || (presetForKey && presetForKey.progressBarFill)
      || '',
    // `cardColor*` (CF nuevo, namespace `card*`): paleta EXCLUSIVA del
    // membership card (Figma 518:238xx). Independiente de `colorStart/End`
    // (que sirven a drawer/hero, Figma 169:120xx — paleta + ángulo distintos).
    // Consumidos por `getMembersCardTheme`: si están presentes, sobreescriben
    // `gradientFrom/To/FromStop/ToStop` del card; si están null, el card cae
    // al preset local (comportamiento legacy).
    cardColorStart: cfTier.cardColorStart || '',
    cardColorStartStop: cfTier.cardColorStartStop || '',
    cardColorEnd: cfTier.cardColorEnd || '',
    cardColorEndStop: cfTier.cardColorEndStop || '',
    // `dividerColor` (CF nuevo): color hex del divisor vertical en
    // `MembersDataGrid` (separa Tienes|Fecha en la fila balance, col izq|der
    // del bloque, y Tienes|Estatus en mobile). Por tier en Figma:
    // lifemiles/red-plus #C771AE; gold/gold-cenit #D28B5D; resto #6C6C6C.
    dividerColor: cfTier.dividerColor
      || (presetForKey && presetForKey.dividerColor)
      || '#6c6c6c',
    balanceCardBg: cfTier.balanceCardBg,
    pillBg: cfTier.pillBg,
    pillBorder: cfTier.pillBorder,
    // `pillTextHover`: si el CF no lo envía → preset → `pillBg` (visualmente
    // correcto en 4/6 tiers; Silver/Diamond requieren preset para no romper
    // contraste).
    pillTextHover: cfTier.pillTextHover
      || (presetForKey && presetForKey.pillTextHover)
      || cfTier.pillBg,
    // Extras (no consumidos hoy, expuestos para futuro).
    displayName: cfTier.displayName,
    textColor: cfTier.textColor,
    icon: cfTier.icon,
    sortOrder: cfTier.sortOrder,
    // Logos de la membership card (Figma 518:23837): imagotype Star Alliance
    // (logoPrimary) + badge sub-status opcional (logoSecondary). Resueltos
    // desde DAM ref o passthrough de string. Vacío → la molecule cae al sello
    // local por tier.
    logoPrimary: resolveImageRef(cfTier.logoPrimary),
    logoPrimaryAlt: cfTier.logoPrimaryAlt || '',
    logoSecondary: resolveImageRef(cfTier.logoSecondary),
    logoSecondaryAlt: cfTier.logoSecondaryAlt || '',
    // Cuerpo del cóndor (SVG inline en MembersMembershipCard). El CF puede
    // overridear; si no, cae al preset; si tampoco hay preset, la molecule
    // hace fallback a `gradientFrom`/`gradientTo` para no quedar transparente.
    // Stops y vector también son passthrough (defaults en la molecule = Lifemiles).
    condorFrom: cfTier.condorFrom
      || (presetForKey && presetForKey.condorFrom)
      || '',
    condorTo: cfTier.condorTo
      || (presetForKey && presetForKey.condorTo)
      || '',
    condorFromStop: cfTier.condorFromStop
      || (presetForKey && presetForKey.condorFromStop)
      || '',
    condorToStop: cfTier.condorToStop
      || (presetForKey && presetForKey.condorToStop)
      || '',
    condorX1: cfTier.condorX1
      || (presetForKey && presetForKey.condorX1)
      || '',
    condorY1: cfTier.condorY1
      || (presetForKey && presetForKey.condorY1)
      || '',
    condorX2: cfTier.condorX2
      || (presetForKey && presetForKey.condorX2)
      || '',
    condorY2: cfTier.condorY2
      || (presetForKey && presetForKey.condorY2)
      || '',
    // Discrimina variantes alternativas del cóndor (hoy solo 'magno' usa
    // radial + 4-stop strokes marrones). Default vacío = variante linear.
    condorVariant: cfTier.condorVariant
      || (presetForKey && presetForKey.condorVariant)
      || '',
  };
};

/**
 * Indexa un array de filas del CF `tiers[]` a un map `{ [key]: theme }` listo
 * para lookup O(1) desde el HeroHeader. Filtra filas inválidas (sin `key`).
 *
 * @param {object[]} cfTiers
 * @returns {Object<string, object>} map por `normalizeTierKey(key)`.
 */
export const indexTierThemes = (cfTiers) => {
  if (!Array.isArray(cfTiers) || cfTiers.length === 0) return {};
  const out = {};
  cfTiers.forEach((row) => {
    const theme = cfTierToTheme(row);
    if (theme) out[theme.key] = theme;
  });
  return out;
};

/**
 * Lookup final del theme para un tier crudo del VM. Prioriza el map del CF
 * (`cfTierThemes`) y, si la key resuelta no está, cae al `TIER_PRESETS` local.
 * Esto permite que el drawer NUNCA quede sin paleta aunque el CF falle o un
 * tier nuevo aún no esté en el spreadsheet.
 *
 * @param {string} rawTier - tier crudo del VM ("LifeMiles", "Gold"...).
 * @param {Object<string, object>} [cfTierThemes={}] - map indexado del CF.
 * @returns {object} theme con shape estándar (key + gradient* + bg/pill*).
 */
export const getTierTheme = (rawTier, cfTierThemes = {}) => {
  const key = normalizeTierKey(rawTier);
  const fromCf = cfTierThemes && cfTierThemes[key];
  if (fromCf) return fromCf;
  return { key, ...TIER_PRESETS[key] };
};

/**
 * Theme ESPECÍFICO para `MembersMembershipCard` (Figma 518:238xx). Difiere de
 * `getTierTheme` en que la paleta del card lee del namespace `cardColor*` del
 * CF (campos exclusivos del card), NO del `colorStart/End` clásico (que sirve
 * a drawer/hero — Figma 169:120xx, otra paleta).
 *
 * ## Por qué namespaces separados
 *
 * Los campos `colorStart`/`colorEnd`/`colorStartStop`/`gradientStop` del CF
 * están COMPARTIDOS por 3 componentes legacy:
 *   - `MembersHeroCompact` (members-hero-compact.js)
 *   - `MembersHeroExpanded` (members-hero-expanded.js)
 *   - `MembersHeroHeader` (drawer, members-hero-header.js)
 *
 * Esos componentes usan el design Figma anterior (169:120xx) con ángulo fijo
 * `90deg` y otra paleta. La membership card (Figma 518:238xx) usa una paleta
 * DIFERENTE, ángulos por-tier (111.84°/230°/244°/-69.88°…) y stops fuera del
 * 100%. Por eso el CF expone DOS sets de campos independientes:
 *   - `colorStart/End/Stop/gradientStop` → drawer/hero (paleta vieja).
 *   - `cardColorStart/End/Stop/gradientAngle` → membership card (paleta nueva).
 *
 * ## Resolución de gradientes del card
 *
 * Para cada propiedad de gradient del card, la prioridad es:
 *   1. `cardColor*` del CF (campos nuevos, namespace card)
 *   2. preset local (Figma 518:238xx truth)
 *   3. fallback genérico (vacío)
 *
 * Si el autor deja un `cardColor*` en null/vacío, ese subcampo cae al preset
 * mientras los demás sí pueden venir del CF (resolución por campo, no por
 * tier completo). `cardBackground` (radial Magno) sigue ganando sobre todo.
 *
 * @param {string} rawTier - tier crudo del VM ("LifeMiles", "Gold"...).
 * @param {Object<string, object>} [cfTierThemes={}] - map indexado del CF.
 * @returns {object} theme con gradient* del card resueltos CF → preset → vacío.
 */
export const getMembersCardTheme = (rawTier, cfTierThemes = {}) => {
  const base = getTierTheme(rawTier, cfTierThemes);
  const preset = TIER_PRESETS[base.key] || {};
  return {
    ...base,
    // Gradiente del card: `cardColor*` del CF (cuando esté autorado) gana
    // sobre el preset. Permite al autor tweakear el card sin tocar código,
    // SIN afectar el drawer/hero (que siguen leyendo `colorStart/End`).
    //
    // NOTA de autoring: el CF debe usar los valores del panel "Dev Mode →
    // CSS" de Figma (angle en convención CSS: 0° = arriba, positivo
    // clockwise), NO los del panel de rotación (convención matemática). Ver
    // preset `silver` para el patrón de referencia (angle 295°, stop light
    // -85.98% para "sacar" el color base fuera del canvas). Un fix defensivo
    // en `members-membership-card.js` ordena los stops ascendentes antes de
    // armar el string CSS, así el render no se rompe si el autor pone stops
    // en orden inverso.
    //
    // Fallback: `preset.cardGradient*` (namespace card-específico, ej.
    // silver) → `preset.gradient*` (legacy compartido con hero, para tiers
    // que aún no fueron separados). Así el default del card NO contamina
    // el default del hero cuando la paleta difiere (caso silver).
    gradientFrom: base.cardColorStart || preset.cardGradientFrom || preset.gradientFrom,
    gradientFromStop: base.cardColorStartStop || preset.cardGradientFromStop || preset.gradientFromStop,
    gradientTo: base.cardColorEnd || preset.cardGradientTo || preset.gradientTo,
    gradientToStop: base.cardColorEndStop || preset.cardGradientToStop || preset.gradientToStop,
    // Angle: CF `gradientAngle` → preset `cardGradientAngle` (card-específico)
    // → preset `gradientAngle` (legacy). El resolver de `base.gradientAngle`
    // ya cae del CF al `preset.gradientAngle`; acá preferimos primero el
    // `cardGradientAngle` cuando existe.
    gradientAngle: base.gradientAngle && base.gradientAngle !== preset.gradientAngle
      ? base.gradientAngle
      : (preset.cardGradientAngle || preset.gradientAngle || base.gradientAngle),
    // `cardBackground`, `cardShadow` se preservan del `base` (que ya
    // implementa CF || preset || default).
  };
};

// ---------------------------------------------------------------------------
// Tokens de la sección "Progreso Elite y beneficios" (1271692, Bloque 2 header).
// APPEND-ONLY: no toca `TIER_PRESETS`/`getTierTheme`/`cfTierToTheme` (superficie
// viva del hero de Mi Lifemiles — regresión crítica). Namespace propio de tokens
// del AC (`colorGradientStrong/Subtle/Decor`, `colorOverlay`, `colorText`,
// `colorBorderAccent`) con resolución CF nuevo → legacy → preset.
//
// Hex de `contexto-figma.md` §A (gradiente strong + overlay) y §B (gradiente
// sutil de alertas, listo para 1271699). Decisión D1: Lifemiles strong end
// `#D50013` (variable aplicada; Juan lo levanta con diseño). Variantes CENIT
// comparten los colores de su tier base (así lo documenta el sheet) → los
// presets van por los 6 tiers base y `getEliteTierTokens` colapsa cenit → base.
// ---------------------------------------------------------------------------
export const ELITE_TIER_PRESETS = {
  lifemiles: {
    gradientStrongFrom: '#B50080',
    gradientStrongTo: '#D50013', // D1: variable aplicada (panel dice #D5013B)
    gradientDecorFrom: '#B50080',
    gradientDecorTo: '#D50013',
    overlay: '#970346',
    text: '#FAFAFA',
    borderAccent: '#970346',
  },
  'red-plus': {
    gradientStrongFrom: '#930004',
    gradientStrongTo: '#C90102',
    gradientDecorFrom: '#930004',
    gradientDecorTo: '#C90102',
    gradientSubtleFrom: '#FFF1F2',
    gradientSubtleTo: '#FFFCFC',
    overlay: '#7D0106',
    text: '#FAFAFA',
    borderAccent: '#7D0106',
  },
  silver: {
    gradientStrongFrom: '#393838',
    gradientStrongTo: '#6C6C6C',
    gradientDecorFrom: '#393838',
    gradientDecorTo: '#6C6C6C',
    gradientSubtleFrom: '#F2F2F2',
    gradientSubtleTo: '#FFFFFF',
    overlay: '#393838',
    text: '#FAFAFA',
    borderAccent: '#393838',
  },
  gold: {
    gradientStrongFrom: '#AE5E29',
    gradientStrongFromStop: '42%',
    gradientStrongTo: '#C37D1D',
    gradientStrongToStop: '91%',
    gradientDecorFrom: '#AE5E29',
    gradientDecorTo: '#C37D1D',
    gradientSubtleFrom: '#FFF6E9',
    gradientSubtleTo: '#FFFAF4',
    overlay: '#A55B1F',
    text: '#FAFAFA',
    borderAccent: '#A55B1F',
  },
  diamond: {
    gradientStrongFrom: '#232021',
    gradientStrongTo: '#585F5E',
    gradientDecorFrom: '#232021',
    gradientDecorTo: '#585F5E',
    gradientSubtleFrom: '#F2F2F2',
    gradientSubtleTo: '#D5D5D5',
    overlay: '#0F0F0F',
    text: '#FAFAFA',
    borderAccent: '#0F0F0F',
  },
  magno: {
    gradientStrongFrom: '#000000',
    gradientStrongTo: '#1F0B00',
    gradientDecorFrom: '#000000',
    gradientDecorTo: '#1F0B00',
    gradientSubtleFrom: '#F3EEEB',
    gradientSubtleTo: '#FDFBF9',
    overlay: '#1B0900',
    text: '#FAFAFA',
    borderAccent: '#1B0900',
  },
};

/**
 * Colapsa un tier crudo del VM (incl. variantes Cenit) a una de las 6 keys base
 * de `ELITE_TIER_PRESETS` (decisión 5: "las variantes CENIT comparten los
 * colores de su tier base"). Reusa `normalizeTierKey` para los casos conocidos
 * (gold-cenit → gold, etc.) y rescata por substring las variantes que
 * `normalizeTierKey` no reconoce (ej. "Magno Cenit One Million", que caería a
 * lifemiles). Default seguro: lifemiles.
 * @param {string} rawTier
 * @returns {'lifemiles'|'red-plus'|'silver'|'gold'|'diamond'|'magno'}
 */
export const eliteBaseTierKey = (rawTier) => {
  // Substring PRIMERO: `normalizeTierKey('Gold Cenit One Million')` no reconoce
  // esa string (cae a 'lifemiles'), así que el match por nombre de tier es la
  // fuente autoritativa para las variantes Cenit. Cubre los 5 tiers coloreados.
  const s = String(rawTier || '').toLowerCase();
  if (s.includes('magno')) return 'magno';
  if (s.includes('diamond')) return 'diamond';
  if (s.includes('gold')) return 'gold';
  if (s.includes('silver')) return 'silver';
  if (/red[\s_-]*plus|redplus/.test(s)) return 'red-plus';
  // lifemiles y variantes de naming/casing → normalizeTierKey, colapsando -cenit.
  const base = normalizeTierKey(rawTier).replace(/-cenit$/, '');
  return ELITE_TIER_PRESETS[base] ? base : 'lifemiles';
};

/**
 * Tokens visuales del header elite para un tier crudo del VM. Resuelve
 * campo-a-campo con la cadena **CF nuevo → legacy → preset** (decisión T4-A):
 *   colorGradientStrongStart → colorStart/gradientFrom → preset.gradientStrongFrom
 *   colorOverlay             → balanceCardBg           → preset.overlay
 *   colorText                → textColor               → preset.text
 *   colorBorderAccent        → (sin legacy)            → preset.borderAccent
 * `cfTierMap` es un dict de tiers del CF por key (típicamente `cfg.tiers`, que
 * Paso 2 extiende con los campos nuevos; también tolera `cfg.tierThemes`, que
 * trae los legacy `gradientFrom/To`/`balanceCardBg`). El hero NO se ve afectado
 * (esta función es nueva; `getTierTheme` queda intacto).
 * @param {string} rawTier
 * @param {Object<string, object>} [cfTierMap={}]
 * @returns {{key, gradientStrongFrom, gradientStrongTo, gradientStrongFromStop,
 *   gradientStrongToStop, gradientDecorFrom, gradientDecorTo, gradientSubtleFrom,
 *   gradientSubtleTo, overlay, text, borderAccent}}
 */
export const getEliteTierTokens = (rawTier, cfTierMap = {}) => {
  const key = eliteBaseTierKey(rawTier);
  const preset = ELITE_TIER_PRESETS[key] || ELITE_TIER_PRESETS.lifemiles;
  // Entrada del CF para este tier: probamos la key base, la key normalizada
  // completa (por si el CF autora "gold-cenit" aparte) y la cruda.
  const cf = (cfTierMap && (cfTierMap[key]
    || cfTierMap[normalizeTierKey(rawTier)]
    || cfTierMap[rawTier])) || {};
  const pick = (cfNew, cfLegacy, presetVal) => cfNew || cfLegacy || presetVal;
  // Legacy del strong: `colorStart/End` (shape `cfg.tiers`) o `gradientFrom/To`
  // (shape `cfg.tierThemes`). Se resuelve antes para no pasar los `100`.
  const legacyStart = cf.colorStart || cf.gradientFrom;
  const legacyEnd = cf.colorEnd || cf.gradientTo;
  return {
    key,
    gradientStrongFrom: pick(cf.colorGradientStrongStart, legacyStart, preset.gradientStrongFrom),
    gradientStrongTo: pick(cf.colorGradientStrongEnd, legacyEnd, preset.gradientStrongTo),
    gradientStrongFromStop: cf.colorGradientStrongStartStop || preset.gradientStrongFromStop || '0%',
    gradientStrongToStop: cf.colorGradientStrongEndStop || preset.gradientStrongToStop || '100%',
    gradientDecorFrom: pick(cf.colorGradientDecorStart, null, preset.gradientDecorFrom),
    gradientDecorTo: pick(cf.colorGradientDecorEnd, null, preset.gradientDecorTo),
    gradientSubtleFrom: pick(cf.colorGradientSubtleStart, null, preset.gradientSubtleFrom),
    gradientSubtleTo: pick(cf.colorGradientSubtleEnd, null, preset.gradientSubtleTo),
    overlay: pick(cf.colorOverlay, cf.balanceCardBg, preset.overlay),
    text: pick(cf.colorText, cf.textColor, preset.text),
    borderAccent: pick(cf.colorBorderAccent, null, preset.borderAccent),
  };
};

/**
 * Tokens del chip circular de `MembersQuickAction` por tier — SPEC 2026-07-27:
 *   • Lifemiles → Figma 518:23646 (bg #970346 / border #D7ACBF).
 *   • Red Plus  → Figma 518:23481 (bg #7D0106 / border #C88F91).
 *   • Silver    → Figma 518:23522 (bg #262626 / border #9A9A9A).
 *   • Gold      → Figma 518:23440 (bg #703B16 / border #CEB19C).
 *   • Diamond   → Figma 518:23564 (bg #0F0F0F / border #808080).
 *   • Magno     → Figma 518:23605 (bg #1B0900 / border #6E615B).
 * Ícono blanco en todos (contraste ícono/fill ≥ 8.6). Los ratios de accesibilidad
 * (stroke/fondo oscuro, stroke/fill) están validados en las láminas.
 *
 * La tabla vive acá — NO se derivan de `pillBg/pillBorder` — porque los tokens
 * del chip pueden divergir de la píldora "Ver perfil" (mismo por-tier, pero
 * distinto propósito y potenciales cambios futuros de hover/pressed).
 *
 * Estados hover/pressed: el Figma sí los define — chip completo BLANCO (bg y
 * border) con el ícono en el color del tier. En pressed el chip pasa a `#E9E9E9`
 * manteniendo el borde acompañando. La inversión mantiene el foco del CTA
 * cuando el usuario interactúa (consistente con `pillTextHover` de la píldora
 * "Ver perfil"). Ver Figma 518:23397.
 *
 * @param {string} rawTier
 * @param {Object<string, object>} [cfTierThemes={}] - reservado para override
 *   futuro del CF; hoy la tabla es hardcoded (el Figma es la fuente).
 * @returns {{key,bg,border,icon,bgHover,borderHover,iconHover,bgActive,borderActive,iconActive}|null}
 *   `null` si el tier no matchea ninguna key normalizada ⇒ el átomo cae a su
 *   look oscuro genérico.
 */
const QUICK_ACTION_TOKENS_BY_TIER = Object.freeze({
  lifemiles: { bg: '#970346', border: '#D7ACBF' },
  'red-plus': { bg: '#7D0106', border: '#C88F91' },
  silver: { bg: '#262626', border: '#9A9A9A' },
  gold: { bg: '#703B16', border: '#CEB19C' },
  diamond: { bg: '#0F0F0F', border: '#808080' },
  magno: { bg: '#1B0900', border: '#6E615B' },
});

export const getQuickActionTokens = (rawTier, cfTierThemes = {}) => {
  const key = normalizeTierKey(rawTier);
  const spec = QUICK_ACTION_TOKENS_BY_TIER[key];
  if (!spec) return null;
  const { bg, border } = spec;
  return {
    key,
    bg,
    border,
    icon: '#FFFFFF',
    bgHover: '#FFFFFF',
    borderHover: '#FFFFFF',
    iconHover: bg,
    bgActive: '#E9E9E9',
    borderActive: '#E9E9E9',
    iconActive: bg,
  };
};

export default getMembersTierTheme;
