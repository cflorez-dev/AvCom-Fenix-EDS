import { fetchAEMData } from '../../utils/aem-data.js';
import { getStoredLanguage } from '../header/language-country-selector.js';
import { indexTierThemes } from '../../../design-system/helpers/members-tier-theme.js';
import { fetchMembersCF, normalizeMembersCF } from './members-cf.service.js';

// IMPORTANTE (verificado por ingeniería inversa del script, 2026-06-04):
// NO armamos window.__LM_LOGIN_CONFIG__. El script lm-login.umd.js inyecta por sí mismo
// un 2º script POR HOST (`${env}-env-config-${window.location.host}.js`, de Lifemiles)
// que setea la config real (AUTH_URL_BASE, ALLOWED_DOMAINS_URL, redirectUri, etc.).
// Setearla nosotros la pisa y rompe el flujo. Lifemiles debe registrar el env-config de cada host.
//
// Esta config es SOLO lo nuestro: modo de login (popup|redirect) y destinos de las páginas
// puente placeholder. `env` (uat/prd) sale de environment.json (P8).
const APP_CONFIG = {
  loginMode: 'redirect', // P4 (redirect|window|fullscreen|popup legacy) — del CF; binario en lmLogin (redirect vs popup)
  // Destino tras login (P6): 'home' del POS por ahora; 'origin' = volver a la página
  // donde estaba (usa la ruta guardada en sessionStorage al hacer click). Futuro CF.
  loginReturnTo: 'home',
  // P1=C (1255576): rutas de "página del Portal" (perfil del socio). Default funcional
  // hasta que exista el CF "Members Config" (que lo override-ará). Una tab en estas rutas
  // se REDIRIGE a home al recibir un logout cross-tab; el resto solo actualiza el header.
  portalRoutes: ['/members'], // matchea el SEGMENTO (leaf pelado /lang/members o anidado /members/x)
  portalExclude: ['/members/auth'], // páginas-puente (callback/redirect) NO son Portal
  // CU-292: configuración del botón de logout. Configurable desde CF "Members Config".
  logout: {
    show: true, // mostrar/ocultar el item (default visible)
    icon: 'action/exit-to-app', // ícono del item
    redirectTo: '', // '' = home del POS (default); o ruta CMS
  },
  // CU-282 (One Tap): defaults usados cuando el CF no responde. Preservan el comportamiento
  // actual (frecuencia 24h, prompt habilitado, SOLO en Home). El gate de ruta ahora vive en
  // initOneTap (no en scripts.js): `corporatePaths` define dónde se permite el prompt; default
  // `['/']` = solo Home. El CF lo extiende (ej. ['/', '/corporativo/']).
  oneTap: {
    enabled: true,
    frequencyHours: 24,
    corporatePaths: ['/'],
    tcRequired: false,
    tcText: null, // HTML del T&C (se sanitiza al render con sanitizeHTMLAsync)
  },
  // Hero "Mi Lifemiles" (1263924, Sub A). SOLO config ESTRUCTURAL (no-texto):
  // los COPIES localizados viven en `members-i18n.js` (getHeroLabelsSync /
  // loadHeroLabels), las quick actions per-locale en `DEFAULT_HERO_QUICK_ACTIONS`
  // (inyectadas en `cfg.hero.quickActions`), y los colores de marca de la barra de
  // progreso en el átomo. El CF "Members Config" sobrescribe estos campos
  // (gap #8/#12: schema pendiente; mapeo defensivo en normalizeMembersCF).
  hero: {
    // P2=A: estado inicial al PRIMER acceso. El cambio del usuario se persiste en
    // sessionStorage (lo maneja el organism). CF-override.
    defaultState: 'collapsed', // 'collapsed' | 'expanded'
    // Color del "border accent" configurable desde AEM (notas Figma 518:22531 /
    // 518:24899). null = el componente usa su default. Gap #12: confirmar a qué
    // borde exacto aplica (tarjeta de membresía / cards).
    borderAccentColor: null,
    // Duración de la animación del toggle (Smart-animate Figma 518:22528 = 300ms).
    // El organism respeta `prefers-reduced-motion` (sin animación si está activo).
    toggleDurationMs: 300,
  },
  // Dashboard "Bloque 4" (PBI 1263921): grid de cards de navegación. SOLO
  // estructura (no-texto): los COPIES (title/description) viven en
  // `members-i18n.js` (getCardsLabelsSync / loadCardsLabels) ×4 idiomas; acá solo
  // key, ícono, link (placeholder `{lang}` resuelto por locale en getDefaultCards),
  // tipo, visibilidad y orden. El CF "Members Config" (sub-CF "Dashboard Card",
  // `dashboardCards[]`) sobrescribe estos campos vía normalizeMembersCF (mapeo
  // defensivo, schema pendiente). Escalable a N cards (la 6ª = otra entry con su
  // sortOrder). Íconos del catálogo `/icons/`, editables desde AEM.
  // ⚠️ `elite-progress` (assessment) y `manage-miles` (quick-book-miles) usan
  // proxies aproximados — el catálogo no tiene un SVG de "progreso ascendente"
  // ni de "transferencia". Confirmar/añadir el ícono final con diseño (Figma).
  // URLs `link` = placeholders pendientes de confirmar con PO/arquitectura de rutas.
  cards: [
    {
      key: 'elite-progress', icon: 'action/assessment', link: '/{lang}/members/profile/elite', linkType: 'internal', visible: true, sortOrder: 1,
    },
    {
      key: 'account',
      icon: 'action/data-setting',
      link: '/{lang}/members/profile',
      linkType: 'internal',
      visible: true,
      sortOrder: 2,
      // Badge "perfil completo" (1263921). Default = mismas reglas que el CF autorado
      // (para que funcione aun con el CF caído/CORS). Labels por locale en members-i18n.
      // El CF override-a estos campos cuando responde (badgeEnabled/profileCompleteness*).
      badge: {
        enabled: true,
        fields: ['firstName', 'lastName', 'email', 'phone', 'documentId'],
        threshold: 100,
      },
    },
    {
      key: 'my-trips', icon: 'action/plane', link: '/{lang}/members/viajes', linkType: 'internal', visible: true, sortOrder: 3,
    },
    {
      key: 'manage-miles', icon: 'members/quick-book-miles', link: '/{lang}/members/millas', linkType: 'internal', visible: true, sortOrder: 4,
    },
    {
      // CA10 (1263921): card "Actividad de millas". Layout distinto al resto
      // (preview inline de las últimas transacciones, NO es collapsible);
      // detectada por `type:'activity'` en el organism. `previewCount` editable
      // desde CF.
      // ⚠️ `members-activity.service.js` devuelve data MOCK hasta que el wrapper
      // LM de historial de transacciones esté disponible (ver TODO en el servicio).
      key: 'activity',
      type: 'activity',
      icon: 'navigation/unfold-more',
      link: '/{lang}/members/actividad',
      linkType: 'internal',
      visible: true,
      sortOrder: 5,
      activity: {
        previewCount: 3,
      },
    },
  ],
};

// --- Defaults del drawer Members (first-paint + fallback CF caído) ---
//
// `DEFAULT_MENU_ITEMS` se mantiene aunque el CF "Members Config" exponga
// `menuItems[]` porque cumple 3 funciones que el CF NO puede cubrir solo:
//  1. **First paint síncrono**: `getMembersConfigSync()` corre antes del fetch
//     del CF; sin defaults el drawer renderiza VACÍO los primeros ~100-300ms.
//  2. **Fallback ante CF caído**: si publish está en mantenimiento o CORS rompe,
//     el drawer sigue siendo navegable (incluido el botón de cerrar sesión).
//  3. **Fallback de schema**: si Adobe cambia el shape de la persisted query,
//     los defaults garantizan UX mínima.
//
// Cuando el CF resuelve correctamente sobreescribe estos items (el CF es
// fuente única de verdad en operación normal). Las `key` deben matchear las
// del CF para que el mapping de icon/orden/visibilidad sea estable durante
// la transición default → CF.
const ITEM_CHEVRON = 'navigation/chevron-right';
const ITEM_EXTERNAL = 'navigation/open-in-new';
const ITEM_LOGOUT_ICON = 'action/exit-to-app';
// URL pública de LifeMiles. Hardcoded a propósito (solo se usa en defaults;
// en operación normal el CF expone el link real de cada item).
const LM_URL = 'https://www.lifemiles.com';

// Default del pill "Ver perfil" del drawer Members (Figma 360:13890). El CF
// expone `authConfig.portalProfileUrl` per-locale; mientras llegue para todos
// los POS apuntamos a la página de perfil del Portal Members del locale en
// curso (`/{locale}/members/profile`) — coincide con la ruta canónica del
// dashboard (CU-321) y reemplaza el fallback previo a `lifemiles.com`.
const getDefaultViewProfileUrl = (locale) => `/${locale}/members/profile`;

// Dashboard "Ver mi cuenta" (1263924, Sub C · Bloque 8): URL placeholder per-locale
// hasta que el Dashboard (PBI 1263921) publique su página. Configurable desde el CF
// (`authConfig.dashboardUrl`, passthrough raw); fail-soft → este default.
const getDefaultDashboardUrl = (locale) => `/${locale}/members/cuenta`;

const buildItem = (overrides) => ({
  visible: true,
  isLogout: false,
  ...overrides,
});

const buildLogoutItem = (label) => buildItem({
  key: 'logout',
  label,
  icon: ITEM_LOGOUT_ICON,
  link: null,
  linkType: 'internal',
  isLogout: true,
  sortOrder: 99,
});

const DEFAULT_MENU_ITEMS = {
  es: [
    buildItem({
      key: 'book-with-miles', label: 'Reservar vuelo con millas', icon: ITEM_CHEVRON, link: '/es/reserva-tu-vuelo', linkType: 'internal', sortOrder: 1,
    }),
    buildItem({
      key: 'elite-status', label: 'Mi estatus elite', icon: ITEM_CHEVRON, link: '/es/members/profile/elite', linkType: 'internal', sortOrder: 2,
    }),
    buildItem({
      key: 'cards', label: 'Mis tarjetas', icon: ITEM_CHEVRON, link: '/es/members/tarjetas', linkType: 'internal', sortOrder: 3,
    }),
    buildItem({
      key: 'trips', label: 'Mis viajes', icon: ITEM_CHEVRON, link: '/es/members/viajes', linkType: 'internal', sortOrder: 4,
    }),
    buildItem({
      key: 'manage-miles', label: 'Gestionar mis millas', icon: ITEM_EXTERNAL, link: LM_URL, linkType: 'external', sortOrder: 5,
    }),
    buildItem({
      key: 'transactions', label: 'Historial de transacciones', icon: ITEM_EXTERNAL, link: LM_URL, linkType: 'external', sortOrder: 6,
    }),
    buildLogoutItem('Cerrar sesión'),
  ],
  pt: [
    buildItem({
      key: 'book-with-miles', label: 'Reservar voo com milhas', icon: ITEM_CHEVRON, link: '/pt/reserve-seu-voo', linkType: 'internal', sortOrder: 1,
    }),
    buildItem({
      key: 'elite-status', label: 'Meu status elite', icon: ITEM_CHEVRON, link: '/pt/members/profile/elite', linkType: 'internal', sortOrder: 2,
    }),
    buildItem({
      key: 'cards', label: 'Meus cartões', icon: ITEM_CHEVRON, link: '/pt/members/cartoes', linkType: 'internal', sortOrder: 3,
    }),
    buildItem({
      key: 'trips', label: 'Minhas viagens', icon: ITEM_CHEVRON, link: '/pt/members/viagens', linkType: 'internal', sortOrder: 4,
    }),
    buildItem({
      key: 'manage-miles', label: 'Gerenciar minhas milhas', icon: ITEM_EXTERNAL, link: LM_URL, linkType: 'external', sortOrder: 5,
    }),
    buildItem({
      key: 'transactions', label: 'Histórico de transações', icon: ITEM_EXTERNAL, link: LM_URL, linkType: 'external', sortOrder: 6,
    }),
    buildLogoutItem('Sair'),
  ],
  en: [
    buildItem({
      key: 'book-with-miles', label: 'Book flight with miles', icon: ITEM_CHEVRON, link: '/en/book-your-flight', linkType: 'internal', sortOrder: 1,
    }),
    buildItem({
      key: 'elite-status', label: 'My elite status', icon: ITEM_CHEVRON, link: '/en/members/profile/elite', linkType: 'internal', sortOrder: 2,
    }),
    buildItem({
      key: 'cards', label: 'My cards', icon: ITEM_CHEVRON, link: '/en/members/cards', linkType: 'internal', sortOrder: 3,
    }),
    buildItem({
      key: 'trips', label: 'My trips', icon: ITEM_CHEVRON, link: '/en/members/trips', linkType: 'internal', sortOrder: 4,
    }),
    buildItem({
      key: 'manage-miles', label: 'Manage my miles', icon: ITEM_EXTERNAL, link: LM_URL, linkType: 'external', sortOrder: 5,
    }),
    buildItem({
      key: 'transactions', label: 'Transaction history', icon: ITEM_EXTERNAL, link: LM_URL, linkType: 'external', sortOrder: 6,
    }),
    buildLogoutItem('Log out'),
  ],
  fr: [
    buildItem({
      key: 'book-with-miles', label: 'Réserver un vol avec des milles', icon: ITEM_CHEVRON, link: '/fr/reservez-votre-vol', linkType: 'internal', sortOrder: 1,
    }),
    buildItem({
      key: 'elite-status', label: 'Mon statut élite', icon: ITEM_CHEVRON, link: '/fr/members/profile/elite', linkType: 'internal', sortOrder: 2,
    }),
    buildItem({
      key: 'cards', label: 'Mes cartes', icon: ITEM_CHEVRON, link: '/fr/members/cartes', linkType: 'internal', sortOrder: 3,
    }),
    buildItem({
      key: 'trips', label: 'Mes voyages', icon: ITEM_CHEVRON, link: '/fr/members/voyages', linkType: 'internal', sortOrder: 4,
    }),
    buildItem({
      key: 'manage-miles', label: 'Gérer mes milles', icon: ITEM_EXTERNAL, link: LM_URL, linkType: 'external', sortOrder: 5,
    }),
    buildItem({
      key: 'transactions', label: 'Historique des transactions', icon: ITEM_EXTERNAL, link: LM_URL, linkType: 'external', sortOrder: 6,
    }),
    buildLogoutItem('Se déconnecter'),
  ],
};

const getDefaultMenuItems = (lang) => {
  const set = DEFAULT_MENU_ITEMS[lang] || DEFAULT_MENU_ITEMS.pt;
  return set.map((it) => ({ ...it }));
};

// Default del grid de cards del Dashboard (1263921). Estructura desde
// `APP_CONFIG.cards` (locale-agnóstica); acá se resuelve el placeholder `{lang}`
// del link por locale. Los copies (title/description) los pone el organism desde
// i18n por `key`. El CF override-a este default cuando trae `dashboardCards[]`.
const getDefaultCards = (locale) => APP_CONFIG.cards.map((c) => ({
  ...c,
  link: typeof c.link === 'string' ? c.link.replace('{lang}', locale) : c.link,
}));

// Fallback campo-a-campo del CF contra el default por `key` (1263921). Si el CF
// trae `dashboardCards[]` pero alguna entry no rellena un campo estructural
// (típicamente `icon` — el catálogo `/icons/` no es seleccionable como DAM),
// se hereda del default `APP_CONFIG.cards` por la misma `key`. Cards con `key`
// nueva (no presente en defaults) pasan tal cual.
const mergeCardsWithDefaults = (cfCards, locale) => {
  const defaultsByKey = getDefaultCards(locale).reduce((acc, c) => {
    acc[c.key] = c;
    return acc;
  }, {});
  return cfCards.map((c) => {
    const def = defaultsByKey[c?.key];
    if (!def) return c;
    const merged = { ...def };
    Object.keys(c).forEach((k) => {
      if (c[k] !== undefined && c[k] !== null && c[k] !== '') merged[k] = c[k];
    });
    return merged;
  });
};

// --- Quick actions del hero expandido (P7=B + Figma 518:27631 desktop) ---
//
// Defaults SEMBRADOS con los 4 de desktop. Los ÍCONOS y URLs son placeholders
// (gaps #2/#3 — pendientes de diseño); el átomo Icon degrada con gracia si la key
// no existe. Todo CF-override (orden/activación/texto/ícono/URL) — mismo patrón
// per-locale que `DEFAULT_MENU_ITEMS` para que el CF mapee 1:1 por `key`.
const QA_ICON = {
  book: 'members/quick-book-miles',
  upgrade: 'members/quick-upgrade-business',
  lounges: 'members/quick-lounges',
  lmplus: 'members/quick-lifemiles-plus',
};
const buildQuickAction = (overrides) => ({
  visible: true, newTab: false, url: '#', ...overrides,
});
const DEFAULT_HERO_QUICK_ACTIONS = {
  es: [
    buildQuickAction({
      key: 'book-with-miles', label: 'Reserva con millas', icon: QA_ICON.book, sortOrder: 1,
    }),
    buildQuickAction({
      key: 'upgrade-business', label: 'Ascenso a Business', icon: QA_ICON.upgrade, sortOrder: 2,
    }),
    buildQuickAction({
      key: 'lounges', label: 'Avianca Lounges', icon: QA_ICON.lounges, sortOrder: 3,
    }),
    buildQuickAction({
      key: 'lifemiles-plus', label: 'Lifemiles plus', icon: QA_ICON.lmplus, sortOrder: 4,
    }),
  ],
  pt: [
    buildQuickAction({
      key: 'book-with-miles', label: 'Reserve com milhas', icon: QA_ICON.book, sortOrder: 1,
    }),
    buildQuickAction({
      key: 'upgrade-business', label: 'Upgrade para Business', icon: QA_ICON.upgrade, sortOrder: 2,
    }),
    buildQuickAction({
      key: 'lounges', label: 'Avianca Lounges', icon: QA_ICON.lounges, sortOrder: 3,
    }),
    buildQuickAction({
      key: 'lifemiles-plus', label: 'Lifemiles Plus', icon: QA_ICON.lmplus, sortOrder: 4,
    }),
  ],
  en: [
    buildQuickAction({
      key: 'book-with-miles', label: 'Book with miles', icon: QA_ICON.book, sortOrder: 1,
    }),
    buildQuickAction({
      key: 'upgrade-business', label: 'Upgrade to Business', icon: QA_ICON.upgrade, sortOrder: 2,
    }),
    buildQuickAction({
      key: 'lounges', label: 'Avianca Lounges', icon: QA_ICON.lounges, sortOrder: 3,
    }),
    buildQuickAction({
      key: 'lifemiles-plus', label: 'Lifemiles Plus', icon: QA_ICON.lmplus, sortOrder: 4,
    }),
  ],
  fr: [
    buildQuickAction({
      key: 'book-with-miles', label: 'Réservez avec des milles', icon: QA_ICON.book, sortOrder: 1,
    }),
    buildQuickAction({
      key: 'upgrade-business', label: 'Surclassement en Business', icon: QA_ICON.upgrade, sortOrder: 2,
    }),
    buildQuickAction({
      key: 'lounges', label: 'Salons Avianca', icon: QA_ICON.lounges, sortOrder: 3,
    }),
    buildQuickAction({
      key: 'lifemiles-plus', label: 'Lifemiles Plus', icon: QA_ICON.lmplus, sortOrder: 4,
    }),
  ],
};

export const getDefaultHeroQuickActions = (lang) => {
  const set = DEFAULT_HERO_QUICK_ACTIONS[lang] || DEFAULT_HERO_QUICK_ACTIONS.pt;
  return set.map((it) => ({ ...it }));
};

// --- Quick actions del Dashboard / `/members/profile` (AVAEMF2P20-200) ---
//
// Defaults SEMBRADOS con los 4 items autorados en el CF "Quick Actions Profile"
// (clon del CF de hero, pero con keys/copy propios del dashboard). Mismo patrón
// per-locale + CF-override que `DEFAULT_HERO_QUICK_ACTIONS`: si el CF no envía
// `quickActionsProfile[]`, el dashboard cae a estos defaults (red de seguridad).
// Íconos = placeholders (mismo gap #3 que el hero — el átomo Icon degrada).
const QA_PROFILE_ICON = {
  personal: 'members/quick-personal-data',
  security: 'members/quick-security',
  preferences: 'members/quick-preferences',
  billing: 'members/quick-billing',
};
const DEFAULT_PROFILE_QUICK_ACTIONS = {
  es: [
    buildQuickAction({
      key: 'personal-data', label: 'Datos personales', icon: QA_PROFILE_ICON.personal, sortOrder: 1,
    }),
    buildQuickAction({
      key: 'security', label: 'Seguridad y contraseña', icon: QA_PROFILE_ICON.security, sortOrder: 2,
    }),
    buildQuickAction({
      key: 'preferences', label: 'Preferencias', icon: QA_PROFILE_ICON.preferences, sortOrder: 3,
    }),
    buildQuickAction({
      key: 'billing', label: 'Facturación', icon: QA_PROFILE_ICON.billing, sortOrder: 4,
    }),
  ],
  pt: [
    buildQuickAction({
      key: 'personal-data', label: 'Dados pessoais', icon: QA_PROFILE_ICON.personal, sortOrder: 1,
    }),
    buildQuickAction({
      key: 'security', label: 'Segurança e senha', icon: QA_PROFILE_ICON.security, sortOrder: 2,
    }),
    buildQuickAction({
      key: 'preferences', label: 'Preferências', icon: QA_PROFILE_ICON.preferences, sortOrder: 3,
    }),
    buildQuickAction({
      key: 'billing', label: 'Faturamento', icon: QA_PROFILE_ICON.billing, sortOrder: 4,
    }),
  ],
  en: [
    buildQuickAction({
      key: 'personal-data', label: 'Personal data', icon: QA_PROFILE_ICON.personal, sortOrder: 1,
    }),
    buildQuickAction({
      key: 'security', label: 'Security and password', icon: QA_PROFILE_ICON.security, sortOrder: 2,
    }),
    buildQuickAction({
      key: 'preferences', label: 'Preferences', icon: QA_PROFILE_ICON.preferences, sortOrder: 3,
    }),
    buildQuickAction({
      key: 'billing', label: 'Billing', icon: QA_PROFILE_ICON.billing, sortOrder: 4,
    }),
  ],
  fr: [
    buildQuickAction({
      key: 'personal-data', label: 'Données personnelles', icon: QA_PROFILE_ICON.personal, sortOrder: 1,
    }),
    buildQuickAction({
      key: 'security', label: 'Sécurité et mot de passe', icon: QA_PROFILE_ICON.security, sortOrder: 2,
    }),
    buildQuickAction({
      key: 'preferences', label: 'Préférences', icon: QA_PROFILE_ICON.preferences, sortOrder: 3,
    }),
    buildQuickAction({
      key: 'billing', label: 'Facturation', icon: QA_PROFILE_ICON.billing, sortOrder: 4,
    }),
  ],
};

export const getDefaultProfileQuickActions = (lang) => {
  const set = DEFAULT_PROFILE_QUICK_ACTIONS[lang] || DEFAULT_PROFILE_QUICK_ACTIONS.pt;
  return set.map((it) => ({ ...it }));
};

/**
 * Mergea la config del dashboard (`cfg.profile`): defaults locales + override
 * del CF `quickActionsProfile` (fail-soft). Mismo contrato que `mergeHeroConfig`:
 * el CF GANA solo si trae un array no vacío.
 * @param {object[]} defaultQuickActions  defaults per-locale
 * @param {object|null} cfProfile  fragmento `profile` normalizado del CF
 * @returns {{quickActions: object[]}}
 */
export const mergeProfileConfig = (defaultQuickActions, cfProfile) => {
  const cfQa = cfProfile?.quickActions;
  const quickActions = (Array.isArray(cfQa) && cfQa.length) ? cfQa : defaultQuickActions;
  return { quickActions };
};

/**
 * Mergea la config del hero: defaults estructurales (`APP_CONFIG.hero`) + quick
 * actions per-locale + override del CF (`cfHero`, fail-soft por campo). Las quick
 * actions del CF GANAN solo si traen un array no vacío; si no, defaults locales
 * (red de seguridad para que el hero nunca quede sin acciones).
 * @param {object} baseHero  APP_CONFIG.hero
 * @param {object[]} defaultQuickActions  defaults per-locale
 * @param {object|null} cfHero  fragmento `hero` normalizado del CF
 * @returns {object}
 */
export const mergeHeroConfig = (baseHero, defaultQuickActions, cfHero) => {
  const merged = { ...baseHero, quickActions: defaultQuickActions, ...(cfHero || {}) };
  if (!(Array.isArray(cfHero?.quickActions) && cfHero.quickActions.length)) {
    merged.quickActions = defaultQuickActions;
  }
  return merged;
};

// --- Tab Progreso elite (1271699, bloques 3-8) ---
//
// Defaults EN CÓDIGO de la tabla de metas del AC (bloque 4) por tier DESTINO y
// región de residencia (COL vs resto, decisión T16). Editables vía CF cuando el
// TL modele la espec del lote (`eliteGoalsV2[]`); mientras, red de seguridad
// para que el panel de progreso funcione sin CF. `magno.totales = null` = la
// fila de millas totales NO existe para la meta Magno (AC bloque 5).
export const DEFAULT_ELITE_GOALS = {
  'red-plus': { totales: { col: 4000, row: 6000 }, avianca: { col: 1000, row: 1000 } },
  silver: { totales: { col: 8000, row: 12000 }, avianca: { col: 2000, row: 3000 } },
  gold: { totales: { col: 20000, row: 24000 }, avianca: { col: 8000, row: 12000 } },
  diamond: { totales: { col: 45000, row: 45000 }, avianca: { col: 15000, row: 22500 } },
  magno: { totales: null, avianca: { col: 110000, row: 110000 } },
};

// Umbrales del panel "Progreso Cenit" (AC bloque 7): visibilidad (≥500k millas
// avianca vitalicias, configurable) + metas 1M/2M. CF-override (`cenitConfig`).
export const DEFAULT_CENIT_CONFIG = {
  visibleFrom: 500000,
  oneGoal: 1000000,
  twoGoal: 2000000,
};

// Mapeo por defecto de qué métrica de `eliteProgram.qualified[]` alimenta cada
// contador (captura 2026-07-03, verificacion-wrappers §5): `historic` = totales
// del año · `av-miles` = avianca del año · `avstar` = avianca vitalicias (Cenit).
// NO reusar el `metricAvianca` del CF del hero (apunta a `avstar`, bajo revisión
// del PO). CF-override (`eliteMetrics`).
export const DEFAULT_ELITE_METRICS = {
  total: 'historic',
  avianca: 'av-miles',
  lifetime: 'avstar',
};

// Flags de comportamiento del tab Progreso. CF-override (`eliteProgress`).
//  - alertsPersistDismiss (T10): persistir el dismiss de alertas en localStorage.
//  - progressDescriptionVisible: toggle CMS del subtítulo del panel (Figma §B).
//  - howToEarnSections23MaxTier (AC A5): último tier (inclusive) que VE las
//    secciones 2-3 de "Cómo ganar millas"; comparación por orden de tiers.
//  - progressBarIcon{Total,Avianca} (CU-346.CA1/CA2): ícono ilustrativo de cada
//    barra, configurable desde AEM. Valor = key del átomo Icon (ej. 'members/lm')
//    o URL de imagen del DAM. Defaults = assets del repo.
export const DEFAULT_ELITE_PROGRESS_FLAGS = {
  alertsPersistDismiss: true,
  progressDescriptionVisible: true,
  // FAB gamification (1271694, PARQUEADO): OCULTO por default en esta entrega —
  // gatea el FAB acelerador de las 3 barras (total/avianca/cenit). Se re-activa
  // por CF (`eliteProgress.fabEnabled: true`) cuando entre 1271694, sin deploy
  // (mismo patrón que `benefitsEnabled` de la tab Beneficios).
  fabEnabled: false,
  howToEarnSections23MaxTier: 'gold-cenit',
  progressBarIconTotal: 'members/lm',
  progressBarIconAvianca: 'action/plane',
  // Íconos de sección de "Cómo ganar millas" (CU-349, mock 765:75842): s1 Avianca
  // y GOL → avión · s2 Aliados Lifemiles → monograma lm · s3 Bonos → regalo.
  // Key del átomo Icon o URL DAM. Configurables desde AEM (pendiente campos CF).
  howToEarnIconS1: 'action/plane',
  howToEarnIconS2: 'members/lm',
  howToEarnIconS3: 'members/gift',
};

// --- FAB Gamification (1271694, AC bloque 10.1) ---
//
// Defaults EN CÓDIGO por barra (estado default OBLIGATORIO del AC: sin config
// activa para el POS → acción multiplicación). Los TEXTOS default van por
// KEYS de i18n (`titleKey`/`bodyKey`/`ctaLabelKey` → labels de members-i18n),
// no strings: el CF (`fabConfig[]`) puede pisar con texto literal autorado
// (`title`/`body`/`ctaLabel`) + `ctaUrl` por POS, sin redespliegue.
// Reglas de CTA por barra (AC): totales → según config del POS (buy|multiply);
// avianca → default "Reservar un vuelo" SIEMPRE; cenit → SIEMPRE "Reservar un
// vuelo". `ctaUrl` default vacío → el CTA no navega hasta que autoría cargue
// la URL del POS (editable sin deploy).
export const DEFAULT_FAB_CONFIG = [
  {
    pos: 'all',
    bar: 'total',
    // AC bloque 10.1 línea 56: "default obligatorio = multiplicación" si el POS
    // no tiene config → CTA "Reservar un vuelo". "Comprar millas" (action:'buy')
    // se activa autorando la entrada del POS en el CF (fabConfig[]).
    action: 'multiply',
    titleKey: 'fabTitle',
    bodyKey: 'fabBodyMultiply',
    ctaLabelKey: 'fabCtaFly',
    ctaUrl: '',
  },
  {
    pos: 'all',
    bar: 'avianca',
    action: 'multiply',
    titleKey: 'fabTitle',
    bodyKey: 'fabBodyAvianca',
    ctaLabelKey: 'fabCtaFly',
    ctaUrl: '',
  },
  {
    pos: 'all',
    bar: 'cenit',
    action: 'multiply',
    titleKey: 'fabTitle',
    bodyKey: 'fabBodyAvianca',
    ctaLabelKey: 'fabCtaFly',
    ctaUrl: '',
  },
];

// Flags de apagado por autoría de la tab Beneficios (1271694, respuesta A2:
// "dejarlo sin mostrar si hace falta"). CF-override (`benefitsFlags`).
export const DEFAULT_BENEFITS_FLAGS = {
  cobrandEnabled: true,
  lmPlusEnabled: true,
};

// NewYearStatusModal (1271694, decisión A3). GATED: `enabled` default false —
// el modal NO se muestra hasta que el PO confirme el trigger (pregunta #2) y se
// prenda por autoría (sin redeploy). `tertiaryUrl` = link "Conoce el programa
// Elite…" (por POS/idioma desde AEM; vacío → el link no navega). CF-override
// (`newYearModal`).
export const DEFAULT_NEW_YEAR_MODAL = {
  enabled: false,
  tertiaryUrl: '',
};

/**
 * Resuelve la entrada de FAB config para un POS y una barra (1271694):
 * ① entrada del CF específica del POS (campo `pos` array con el código) →
 * ② entrada del CF `pos:'all'` → ③ default de código de esa barra (estado
 * default obligatorio del AC — multiplicación). Devuelve siempre una entrada.
 * @param {object[]|null} fabConfig lista efectiva (CF o defaults)
 * @param {{pos?: string, bar: string}} args POS activo (ej. 'CO') + barra
 * @returns {object} entrada resuelta
 */
export const resolveFabEntry = (fabConfig, { pos = '', bar } = {}) => {
  const list = Array.isArray(fabConfig) ? fabConfig : [];
  const posUp = String(pos || '').toUpperCase();
  const forBar = list.filter((e) => e && e.bar === bar);
  const byPos = forBar.find(
    (e) => Array.isArray(e.pos) && e.pos.map((p) => String(p).toUpperCase()).includes(posUp),
  );
  if (byPos) return byPos;
  const forAll = forBar.find((e) => e.pos === 'all' || (Array.isArray(e.pos) && e.pos.includes('all')));
  if (forAll) return forAll;
  return DEFAULT_FAB_CONFIG.find((e) => e.bar === bar) || DEFAULT_FAB_CONFIG[0];
};

/**
 * Merge campo-a-campo de las metas del CF (`eliteGoalsV2` normalizado: dict por
 * tierKey → {totales?:{col,row}, avianca?:{col,row}}) sobre `DEFAULT_ELITE_GOALS`.
 * CF ausente → defaults completos; CF parcial (ej. solo `totales.col` de gold)
 * → hereda el resto del default del mismo tier; tier nuevo del CF → passthrough.
 * @param {Object|null} cfGoals fragmento normalizado del CF (o null)
 * @returns {Object} dict por tierKey con las metas efectivas
 */
export const mergeEliteGoalsV2 = (cfGoals) => {
  const out = {};
  Object.keys(DEFAULT_ELITE_GOALS).forEach((k) => {
    const d = DEFAULT_ELITE_GOALS[k];
    out[k] = {
      totales: d.totales ? { ...d.totales } : null,
      avianca: d.avianca ? { ...d.avianca } : null,
    };
  });
  if (!cfGoals) return out;
  Object.keys(cfGoals).forEach((k) => {
    const cf = cfGoals[k] || {};
    const base = out[k] || { totales: null, avianca: null };
    out[k] = {
      totales: (cf.totales || base.totales)
        ? { ...(base.totales || {}), ...(cf.totales || {}) }
        : null,
      avianca: (cf.avianca || base.avianca)
        ? { ...(base.avianca || {}), ...(cf.avianca || {}) }
        : null,
    };
  });
  return out;
};

// Cache POR LOCALE: el CF trae fragmentos por idioma (portalRoutes locale-prefixed,
// copy, etc.), así que no se puede servir el `es` en `pt`.
const cache = {};

/**
 * Locale activo. Prefiere la cookie del language selector (intención del usuario)
 * y cae a `document.documentElement.lang`. Fallback 'es'.
 */
function resolveLocale() {
  let stored = null;
  // Guard: en entornos sin `document` (tests Node), `getStoredLanguage` lee
  // cookies y loguea un error. Saltar el llamado evita el ruido.
  if (typeof document !== 'undefined') {
    try { stored = getStoredLanguage(); } catch (e) { stored = null; }
  }
  const docLang = (typeof document !== 'undefined' && document.documentElement?.lang) || null;
  return String(stored || docLang || 'es').toLowerCase().slice(0, 2);
}

/**
 * Devuelve la config en caché (sin esperar async). Render inmediato con defaults,
 * y cuando se carga el CF se actualizará. Mismo patrón que `getMembersLabelsSync`.
 * @param {string} [locale] idioma; default = locale del documento.
 */
export function getMembersConfigSync(locale = resolveLocale()) {
  if (cache[locale]) return cache[locale];
  // First-paint stub: el drawer no debe quedar vacío mientras vuela el CF.
  // `viewProfileUrl` necesita una URL real desde el primer render para que
  // el pill no quede apuntando a '#'.
  return {
    ...APP_CONFIG,
    env: 'uat',
    menuItems: getDefaultMenuItems(locale),
    // Cards del Dashboard (1263921): defaults estructurales con link resuelto por
    // locale. El `...APP_CONFIG` trae `cards` con placeholder `{lang}` sin resolver;
    // este override lo resuelve. CF lo override-a en loadMembersConfig.
    cards: getDefaultCards(locale),
    tiers: {},
    tierThemes: {},
    modals: {},
    authConfig: null,
    viewProfileUrl: getDefaultViewProfileUrl(locale),
    dashboardUrl: getDefaultDashboardUrl(locale),
    profileNameTag: null,
    logoUrl: null,
    logoAlt: null,
    // Hero (1263924): defaults estructurales + quick actions per-locale (sin CF).
    hero: mergeHeroConfig(APP_CONFIG.hero, getDefaultHeroQuickActions(locale), null),
    // Dashboard / `/members/profile` (AVAEMF2P20-200): defaults per-locale (sin CF).
    profile: mergeProfileConfig(getDefaultProfileQuickActions(locale), null),
    // Tab Progreso elite (1271699) + hero (T18): metas por tier+región.
    eliteGoalsV2: mergeEliteGoalsV2(null),
    cenitConfig: { ...DEFAULT_CENIT_CONFIG },
    eliteMetrics: { ...DEFAULT_ELITE_METRICS },
    countryRegionMap: {},
    eliteProgress: { ...DEFAULT_ELITE_PROGRESS_FLAGS },
    // FAB + tab Beneficios (1271694): defaults de código sin CF.
    fabConfig: DEFAULT_FAB_CONFIG.map((e) => ({ ...e })),
    benefitsFlags: { ...DEFAULT_BENEFITS_FLAGS },
    // NewYearStatusModal (1271694, A3): gated off por default.
    newYearModal: { ...DEFAULT_NEW_YEAR_MODAL },
  };
}

/**
 * Carga async de la config de Members. Resuelve el CF `members-config` del locale
 * (AEM publish directo) y lo mergea sobre `APP_CONFIG` (fallback por campo). El `env`
 * (uat/prd) sigue saliendo de environment.json (`AV_MEMBERS_ENV`). Si el CF cae
 * (4xx/5xx/timeout/locale sin fragmento) → queda `{ ...APP_CONFIG, env }` + defaults
 * locales para `menuItems` (red de seguridad para que el drawer siempre tenga botón
 * de logout). La config OAuth de Lifemiles NO va acá — la inyecta el script por host.
 *
 * @param {string} [locale] idioma; default = locale del documento.
 * @returns {Promise<Object>} config mergeada (loginMode, portalRoutes, logout, oneTap,
 *  tiers, tierThemes, menuItems, modals, viewProfileUrl, profileNameTag, logoUrl,
 *  logoAlt, env...)
 */
// eslint-disable-next-line import/prefer-default-export
export async function loadMembersConfig(locale = resolveLocale()) {
  if (cache[locale]) return cache[locale];

  let env = 'uat';
  try {
    const envData = await fetchAEMData('environment');
    // environment.json es un spreadsheet ({data:[{Key,Text}]}), NO un objeto plano:
    // se lee por Key como el resto del repo (apim-mode, hub-destination). Default 'uat'.
    const rows = Array.isArray(envData?.data) ? envData.data : [];
    env = rows.find((r) => r.Key === 'AV_MEMBERS_ENV')?.Text?.trim() || 'uat';
  } catch (e) { /* fallback uat */ }

  // CF del locale: fetch raw + normalizado. Fail-soft: si cae el CF, queda en
  // null y el merge se hace solo sobre APP_CONFIG + defaults locales.
  //
  // Mantenemos AMBOS valores (`rawItem` + `normalized`) porque:
  //  - `normalized` (compañero) proyecta authConfig/portalRoutes/logout/oneTap/
  //    tiers (dict) / modals (dict) / menuItems sin logout — shape esperado por
  //    los servicios de sesión (logout.service, one-tap, route guard).
  //  - `rawItem` lo necesita el drawer Members para extraer fields que el
  //    normalizer NO proyecta (header del Hero: logo, portalProfileUrl,
  //    userNameStyle, logoAlt) y para indexar tierThemes con el helper local.
  let rawItem = null;
  let normalized = null;
  try {
    rawItem = await fetchMembersCF(locale);
    normalized = normalizeMembersCF(rawItem);
  } catch (e) { rawItem = null; normalized = null; }

  // Hero header del drawer Members (Figma 169:13691 / 169:13851). Mapeo
  // verificado contra la respuesta real del CF publish (UAT, es):
  //  - `viewProfileUrl` ← `authConfig.portalProfileUrl` (ej. "/es/members/profile").
  //  - `logoUrl` ← `authConfig.logo._publishUrl` (AEM expone ImageRef con
  //    `_publishUrl` absoluto y `_path` interno DAM). Preferimos `_publishUrl`
  //    para no depender de proxies. Si llega como string (modelo legacy) o no
  //    llega, el molecule cae al SVG local del lockup AvLM.
  //  - `profileNameTag` ← `authConfig.userNameStyle` (ej. "h3"). El molecule
  //    valida contra whitelist h1-h6/p.
  const auth = rawItem?.authConfig || null;
  const cfLogo = auth?.logo;
  // eslint-disable-next-line no-underscore-dangle
  const logoFromCf = (typeof cfLogo === 'string')
    ? cfLogo
    // eslint-disable-next-line no-underscore-dangle
    : (cfLogo?._publishUrl || cfLogo?._path || cfLogo?.url || null);

  // `tierThemes`: map indexado por key (lifemiles/gold/...) → theme normalizado
  // listo para `<MembersHeroHeader tierThemes=...>`. Usa el RAW (array) porque
  // `indexTierThemes` consume el shape original del CF (key + colorStart/End/
  // textColor/icon). Si el CF no trae `tiers[]`, queda `{}` y el header cae a
  // los `TIER_PRESETS` hardcoded del helper.
  const rawTiers = Array.isArray(rawItem?.tiers) ? rawItem.tiers : [];
  const tierThemes = indexTierThemes(rawTiers);

  // menuItems: si el CF trae items, partir del RAW (que incluye el item
  // marcado `isLogout: true` — el normalizer del compañero lo strippea para
  // exponer `logout` aparte). Si el CF no trae nada, defaults locales.
  //
  // Guard de integridad: el item de logout es no-eliminable por contrato UX
  // (spec drawer Members: "Acción: logout — no editable"). Si el CF responde
  // con un `menuItems[]` que NO contiene un item con `isLogout: true`, anexamos
  // el logout del set default para el idioma para garantizar que el drawer
  // siempre tenga botón de cerrar sesión.
  const rawMenu = Array.isArray(rawItem?.menuItems) ? rawItem.menuItems : [];
  const menuItems = rawMenu.length ? rawMenu.slice() : getDefaultMenuItems(locale);
  if (!menuItems.some((it) => it && it.isLogout)) {
    const fallbackLogout = getDefaultMenuItems(locale).find((it) => it.isLogout);
    if (fallbackLogout) menuItems.push(fallbackLogout);
  }

  cache[locale] = {
    ...APP_CONFIG,
    ...(normalized || {}),
    // oneTap: deep-merge para conservar defaults de subclaves ausentes en el CF.
    oneTap: { ...APP_CONFIG.oneTap, ...(normalized?.oneTap || {}) },
    env,
    // Override de `menuItems` para garantizar el item de logout (el normalizer
    // lo expone aparte como `cfg.logout`, pero `<MembersMenuList>` consume el
    // array con el item dentro).
    menuItems,
    // Cards del Dashboard (1263921): el CF (`normalized.cards`, Paso 5) override-a
    // los defaults estructurales cuando trae `dashboardCards[]`; si no, defaults
    // locales (link resuelto por locale). El `...normalized` ya pudo traer `cards`,
    // pero este override garantiza el fallback resuelto cuando el CF no las trae.
    // Cuando sí las trae, hacemos fallback campo-a-campo contra el default por
    // `key` para que campos no llenos en el CF (típicamente `icon`) hereden el
    // valor por defecto en vez de quedar `undefined` y romper el ícono.
    cards: (Array.isArray(normalized?.cards) && normalized.cards.length)
      ? mergeCardsWithDefaults(normalized.cards, locale)
      : getDefaultCards(locale),
    // Hero header del drawer (campos no proyectados por normalizeMembersCF).
    tierThemes,
    authConfig: auth,
    viewProfileUrl: auth?.portalProfileUrl || getDefaultViewProfileUrl(locale),
    dashboardUrl: auth?.dashboardUrl || getDefaultDashboardUrl(locale),
    profileNameTag: auth?.userNameStyle || null,
    logoUrl: logoFromCf,
    logoAlt: auth?.logoAlt || null,
    // Hero (1263924): defaults estructurales + quick actions per-locale; el CF
    // (`normalized.hero`) override-a por campo (fail-soft). Ver mergeHeroConfig.
    hero: mergeHeroConfig(APP_CONFIG.hero, getDefaultHeroQuickActions(locale), normalized?.hero),
    // Dashboard / `/members/profile` (AVAEMF2P20-200): quick actions del CF
    // (`quickActionsProfile[]`) o defaults per-locale si el CF no trae nada.
    // Consumido por el organism MembersHero cuando surface === 'profile'.
    profile: mergeProfileConfig(getDefaultProfileQuickActions(locale), normalized?.profile),
    // Metas por tier+región (1271699 tab Progreso + hero T18): defaults de código
    // (tabla AC) + override del CF (`eliteGoalsV2`, merge campo-a-campo). v1
    // (`eliteGoals`) eliminado — el hero migró a v2 (T18, 2026-07-08).
    eliteGoalsV2: mergeEliteGoalsV2(normalized?.eliteGoalsV2),
    cenitConfig: { ...DEFAULT_CENIT_CONFIG, ...(normalized?.cenitConfig || {}) },
    eliteMetrics: { ...DEFAULT_ELITE_METRICS, ...(normalized?.eliteMetrics || {}) },
    countryRegionMap: normalized?.countryRegionMap || {},
    eliteProgress: { ...DEFAULT_ELITE_PROGRESS_FLAGS, ...(normalized?.eliteProgress || {}) },
    // FAB (1271694): entradas del CF por POS cuando existan (la resolución por
    // POS+barra con default obligatorio la hace `resolveFabEntry`); si el CF no
    // trae `fabConfig[]`, defaults de código (multiplicación).
    fabConfig: (Array.isArray(normalized?.fabConfig) && normalized.fabConfig.length)
      ? normalized.fabConfig
      : DEFAULT_FAB_CONFIG.map((e) => ({ ...e })),
    benefitsFlags: { ...DEFAULT_BENEFITS_FLAGS, ...(normalized?.benefitsFlags || {}) },
    // NewYearStatusModal (1271694, A3): CF puede prender `enabled` + setear
    // `tertiaryUrl` por POS/idioma; sin CF → gated off por default.
    newYearModal: { ...DEFAULT_NEW_YEAR_MODAL, ...(normalized?.newYearModal || {}) },
  };
  return cache[locale];
}

/**
 * Atajo: solo los `menuItems` (lo que consume `<MembersMenuList>`). El hook
 * `useMembersMenuItems` lo usa para no traer toda la config si no la necesita.
 */
export async function loadMembersMenuItems() {
  const cfg = await loadMembersConfig();
  return cfg.menuItems;
}

/** Atajo síncrono para el primer paint del hook. */
export function getMembersMenuItemsSync() {
  return getMembersConfigSync().menuItems;
}
