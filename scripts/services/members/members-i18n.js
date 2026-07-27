import { fetchAEMData } from '../../utils/aem-data.js';
import { getStoredLanguage } from '../header/language-country-selector.js';

// cache-sync 2026-07-20 (purga edge code-bus)
/**
 * Labels i18n de Members. Salen de los spreadsheets por idioma `{es,en,pt,fr}.json`
 * (columnas `Key | Text`, mismo formato que el resto del sitio). Mientras el autor no
 * los llene — o si falla la carga — se usan los FALLBACKS de abajo, así nada queda en
 * blanco. NINGÚN texto de Members debe quedar hardcodeado en los componentes.
 *
 * Para autoría: agregar estas filas (Key → Text por idioma) en cada spreadsheet.
 */
export const MEMBERS_I18N_KEYS = {
  signIn: 'members.login.signIn',
  logout: 'members.logout.label',
  account: 'members.header.account',
  profileTooltip: 'members.header.profileTooltip',
  // Sufijo del aria-label en items del drawer que abren en nueva ventana
  // (linkType:'external'). Se concatena al label visible para que el SR
  // anuncie p.ej. "Gestionar mis millas, abre en nueva ventana".
  opensInNewWindow: 'members.menu.opensInNewWindow',
};

const FALLBACKS = {
  pt: {
    signIn: 'Iniciar sessão', logout: 'Sair', account: 'Minha conta', profileTooltip: 'Meu perfil', opensInNewWindow: 'abre em nova janela',
  },
  es: {
    signIn: 'Iniciar sesión', logout: 'Cerrar sesión', account: 'Mi cuenta', profileTooltip: 'Mi perfil', opensInNewWindow: 'abre en nueva ventana',
  },
  en: {
    signIn: 'Sign in', logout: 'Log out', account: 'My account', profileTooltip: 'My profile', opensInNewWindow: 'opens in new window',
  },
  fr: {
    signIn: 'Se connecter', logout: 'Se déconnecter', account: 'Mon compte', profileTooltip: 'Mon profil', opensInNewWindow: 'ouvre dans une nouvelle fenêtre',
  },
};

const resolveLang = () => String(
  getStoredLanguage() || (typeof document !== 'undefined' && document.documentElement.lang) || 'pt',
).toLowerCase().slice(0, 2);

/** Fallback síncrono para el primer render (antes de que cargue el spreadsheet). */
export const getMembersLabelsSync = () => ({ ...(FALLBACKS[resolveLang()] || FALLBACKS.pt) });

const cache = {};

/**
 * Carga los labels del idioma actual desde el spreadsheet, leyendo por `Key` con el
 * mismo patrón que el resto del repo (`data[].Key/Text`), y cae al fallback por key.
 * @returns {Promise<{signIn:string, logout:string, account:string, profileTooltip:string}>}
 */
export async function loadMembersLabels() {
  const lang = resolveLang();
  if (cache[lang]) return cache[lang];
  const fb = FALLBACKS[lang] || FALLBACKS.pt;
  let labels = { ...fb };
  try {
    const i18 = await fetchAEMData(lang);
    const rows = Array.isArray(i18?.data) ? i18.data : [];
    const read = (key, fallback) => rows.find((r) => r.Key === key)?.Text?.trim() || fallback;
    labels = {
      signIn: read(MEMBERS_I18N_KEYS.signIn, fb.signIn),
      logout: read(MEMBERS_I18N_KEYS.logout, fb.logout),
      account: read(MEMBERS_I18N_KEYS.account, fb.account),
      profileTooltip: read(MEMBERS_I18N_KEYS.profileTooltip, fb.profileTooltip),
      opensInNewWindow: read(MEMBERS_I18N_KEYS.opensInNewWindow, fb.opensInNewWindow),
    };
  } catch (e) { /* fallback ya seteado */ }
  cache[lang] = labels;
  return labels;
}

// Modal de error de conexión (Figma OMNI-Members-01062026 node 108:11024). El TRIGGER
// (cuándo aparece) lo cablea login.service ante un fallo real; el modal de EXPIRACIÓN es 1255601.
export const MEMBERS_ERROR_KEYS = {
  connTitle: 'members.error.connection.title',
  connDescription: 'members.error.connection.description',
  connCta: 'members.error.connection.cta',
  // CTA alternativo para errores que vuelven por la callback (recargar loopearía el ?error=).
  ctaHome: 'members.error.cta.home',
};

const ERROR_FALLBACKS = {
  pt: {
    connTitle: 'Problema de conexão',
    connDescription: 'Estamos com dificuldades para nos conectar. Por favor, tente novamente.',
    connCta: 'Recarregar página',
    ctaHome: 'Voltar ao início',
  },
  es: {
    connTitle: 'Problema de conexión',
    connDescription: 'Estamos teniendo dificultades para conectarnos. Por favor, inténtalo de nuevo.',
    connCta: 'Recargar página',
    ctaHome: 'Volver al inicio',
  },
  en: {
    connTitle: 'Connection problem',
    connDescription: 'We are having trouble connecting. Please try again.',
    connCta: 'Reload page',
    ctaHome: 'Back to home',
  },
  fr: {
    connTitle: 'Problème de connexion',
    connDescription: 'Nous rencontrons des difficultés de connexion. Veuillez réessayer.',
    connCta: 'Recharger la page',
    ctaHome: "Retour à l'accueil",
  },
};

/** Fallback síncrono de los labels del modal de error (render inmediato). */
export const getErrorLabelsSync = () => ({
  ...(ERROR_FALLBACKS[resolveLang()] || ERROR_FALLBACKS.pt),
});

const errorCache = {};

/**
 * Carga los labels del modal de error de conexión desde el spreadsheet (mismo patrón por Key).
 * @returns {Promise<{connTitle:string, connDescription:string, connCta:string}>}
 */
export async function loadErrorLabels() {
  const lang = resolveLang();
  if (errorCache[lang]) return errorCache[lang];
  const fb = ERROR_FALLBACKS[lang] || ERROR_FALLBACKS.pt;
  let labels = { ...fb };
  try {
    const i18 = await fetchAEMData(lang);
    const rows = Array.isArray(i18?.data) ? i18.data : [];
    const read = (key, fallback) => rows.find((r) => r.Key === key)?.Text?.trim() || fallback;
    labels = {
      connTitle: read(MEMBERS_ERROR_KEYS.connTitle, fb.connTitle),
      connDescription: read(MEMBERS_ERROR_KEYS.connDescription, fb.connDescription),
      connCta: read(MEMBERS_ERROR_KEYS.connCta, fb.connCta),
      ctaHome: read(MEMBERS_ERROR_KEYS.ctaHome, fb.ctaHome),
    };
  } catch (e) { /* fallback ya seteado */ }
  errorCache[lang] = labels;
  return labels;
}

// ---------------------------------------------------------------------------
// Descriptores de modal por key (1255601). Mismo patrón de carga que loadErrorLabels:
// fallback síncrono por idioma + override de TEXTO autorado por Key del spreadsheet.
//
// ⚠️ La fuente REAL en runtime es el CF (`config.modals` vía loadMembersConfig); este
// registro local es la RED DE SEGURIDAD si el CF cae (nada queda en blanco). El descriptor
// expone TODO lo que pide el PBI: { icon, title, description, primaryCtaLabel/Action,
// secondaryCtaLabel/Action, dismissible }. Las acciones son `reload|home|dismiss|url`.
//
// Autoría del fallback: filas `members.modal.<key>.{title|description|primaryCta|secondaryCta}`.
// ---------------------------------------------------------------------------

/** Construye el descriptor de `connection-error` a partir de los labels de error ya existentes
 *  (NO duplicamos copy — reusa connTitle/connDescription/connCta). Comportamiento idéntico al
 *  modal de conexión embrionario de 1255303: CTA primaria = recargar, sin secundaria. */
const connectionDescriptorFrom = (labels) => ({
  icon: 'alert/Error',
  title: labels.connTitle,
  description: labels.connDescription,
  primaryCtaLabel: labels.connCta,
  primaryCtaAction: 'reload',
  dismissible: true,
});

const MODALS_FALLBACK = {
  pt: {
    'session-expired': {
      icon: 'alert/Error',
      title: 'Sua sessão expirou',
      description: 'Por segurança, encerramos sua sessão. Faça login novamente para continuar.',
      primaryCtaLabel: 'Iniciar sessão',
      primaryCtaAction: 'home',
      dismissible: true,
    },
    'generic-error': {
      icon: 'alert/Error',
      title: 'Algo deu errado',
      description: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
      primaryCtaLabel: 'Recarregar',
      primaryCtaAction: 'reload',
      secondaryCtaLabel: 'Voltar ao início',
      secondaryCtaAction: 'home',
      dismissible: true,
    },
  },
  es: {
    'session-expired': {
      icon: 'alert/Error',
      title: 'Tu sesión expiró',
      description: 'Por seguridad cerramos tu sesión. Inicia sesión nuevamente para continuar.',
      primaryCtaLabel: 'Iniciar sesión',
      primaryCtaAction: 'home',
      dismissible: true,
    },
    'generic-error': {
      icon: 'alert/Error',
      title: 'Algo salió mal',
      description: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
      primaryCtaLabel: 'Recargar',
      primaryCtaAction: 'reload',
      secondaryCtaLabel: 'Volver al inicio',
      secondaryCtaAction: 'home',
      dismissible: true,
    },
  },
  en: {
    'session-expired': {
      icon: 'alert/Error',
      title: 'Your session expired',
      description: 'For your security, we closed your session. Please sign in again to continue.',
      primaryCtaLabel: 'Sign in',
      primaryCtaAction: 'home',
      dismissible: true,
    },
    'generic-error': {
      icon: 'alert/Error',
      title: 'Something went wrong',
      description: 'An unexpected error occurred. Please try again.',
      primaryCtaLabel: 'Reload',
      primaryCtaAction: 'reload',
      secondaryCtaLabel: 'Back to home',
      secondaryCtaAction: 'home',
      dismissible: true,
    },
  },
  fr: {
    'session-expired': {
      icon: 'alert/Error',
      title: 'Votre session a expiré',
      description: 'Pour votre sécurité, nous avons fermé votre session. Veuillez vous reconnecter pour continuer.',
      primaryCtaLabel: 'Se connecter',
      primaryCtaAction: 'home',
      dismissible: true,
    },
    'generic-error': {
      icon: 'alert/Error',
      title: "Une erreur s'est produite",
      description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
      primaryCtaLabel: 'Recharger',
      primaryCtaAction: 'reload',
      secondaryCtaLabel: "Retour à l'accueil",
      secondaryCtaAction: 'home',
      dismissible: true,
    },
  },
};

/** Descriptor base por idioma+key (sin la composición especial de connection-error). */
const fallbackDescriptor = (key) => {
  const byLang = MODALS_FALLBACK[resolveLang()] || MODALS_FALLBACK.pt;
  const base = byLang[key] || MODALS_FALLBACK.pt[key];
  return base ? { ...base } : null;
};

/**
 * Fallback síncrono del descriptor de un modal (render inmediato, antes del spreadsheet/CF).
 * @param {string} key  connection-error | session-expired | generic-error
 * @returns {object|null} descriptor o null si la key no tiene fallback local.
 */
export function getModalDescriptorSync(key) {
  if (key === 'connection-error') return connectionDescriptorFrom(getErrorLabelsSync());
  return fallbackDescriptor(key);
}

const modalCache = {};

/**
 * Carga async del descriptor de un modal: arranca del fallback local y le superpone el TEXTO
 * autorado del spreadsheet por Key (mismo patrón que loadErrorLabels). Estructura (icon, acciones,
 * dismissible) viene del fallback; el CF (config.modals) la override-a en runtime vía el host.
 * @param {string} key
 * @returns {Promise<object|null>}
 */
export async function loadModalDescriptor(key) {
  if (key === 'connection-error') return connectionDescriptorFrom(await loadErrorLabels());
  const lang = resolveLang();
  const cacheKey = `${lang}:${key}`;
  if (modalCache[cacheKey]) return modalCache[cacheKey];
  const base = fallbackDescriptor(key);
  if (!base) return null;
  let descriptor = { ...base };
  try {
    const i18 = await fetchAEMData(lang);
    const rows = Array.isArray(i18?.data) ? i18.data : [];
    const read = (k, fallback) => rows.find((r) => r.Key === k)?.Text?.trim() || fallback;
    descriptor = {
      ...base,
      title: read(`members.modal.${key}.title`, base.title),
      description: read(`members.modal.${key}.description`, base.description),
      primaryCtaLabel: read(`members.modal.${key}.primaryCta`, base.primaryCtaLabel),
      secondaryCtaLabel: base.secondaryCtaLabel
        ? read(`members.modal.${key}.secondaryCta`, base.secondaryCtaLabel)
        : base.secondaryCtaLabel,
    };
  } catch (e) { /* fallback ya seteado */ }
  modalCache[cacheKey] = descriptor;
  return descriptor;
}

// ---------------------------------------------------------------------------
// Hero "Mi Lifemiles" (1263924, Sub A). TODOS los copies del hero viven acá (no
// hardcodeados en componentes, no duplicados en APP_CONFIG): mismo patrón que el
// resto de Members (keys del spreadsheet por idioma + fallback síncrono).
//
// Templates con placeholders: `greeting` usa `{name}`; los títulos elite usan
// `{tier}` y `{year}` (el año lo inyecta el sistema — nota Figma 518:25996).
// Autoría: agregar las filas `members.hero.*` (Key → Text) en cada spreadsheet.
// ---------------------------------------------------------------------------
export const MEMBERS_HERO_I18N_KEYS = {
  greeting: 'members.hero.greeting',
  viewDetail: 'members.hero.viewDetail',
  hideDetail: 'members.hero.hideDetail',
  viewProfile: 'members.hero.viewProfile',
  viewProgress: 'members.hero.viewProgress',
  milesLabel: 'members.hero.miles',
  milesUnit: 'members.hero.milesUnit',
  expiryLabel: 'members.hero.expiry',
  statusLabel: 'members.hero.status',
  statusExpiryPrefix: 'members.hero.statusExpiry',
  membershipLabel: 'members.hero.membership',
  copyAriaLabel: 'members.hero.copyAria',
  copiedLabel: 'members.hero.copied',
  eliteTitleMaintain: 'members.hero.elite.maintain',
  eliteTitleMaintainSingle: 'members.hero.elite.maintainSingle',
  eliteTitleEnjoy: 'members.hero.elite.enjoy',
  eliteCondition1: 'members.hero.elite.condition1',
  eliteCondition2: 'members.hero.elite.condition2',
  eliteCondition1Completed: 'members.hero.elite.condition1Completed',
  eliteCondition2Completed: 'members.hero.elite.condition2Completed',
  eliteTooltip: 'members.hero.elite.tooltip',
  eliteTooltipAria: 'members.hero.elite.tooltipAria',
  emptyTitle: 'members.hero.empty.title',
  emptyMessage: 'members.hero.empty.message',
  errorMessage: 'members.hero.error.message',
  placeholder: 'members.hero.placeholder',
};

const HERO_FALLBACKS = {
  es: {
    greeting: 'Hola, {name}',
    viewDetail: 'Ver detalle',
    hideDetail: 'Ocultar detalle',
    viewProfile: 'Ver perfil',
    viewProgress: 'Ver progreso',
    milesLabel: 'Tienes',
    milesUnit: 'millas',
    expiryLabel: 'Fecha de vencimiento',
    statusLabel: 'Estatus Lifemiles',
    statusExpiryPrefix: 'Vence:',
    membershipLabel: 'Número de socio',
    copyAriaLabel: 'Copiar número de socio',
    copiedLabel: 'Copiado',
    eliteTitleMaintain: 'Tu progreso elite {tier} para {year}',
    eliteTitleMaintainSingle: 'Mantener tu estatus elite {tier} en {year}',
    eliteTitleEnjoy: 'Disfruta tu estatus elite {tier} en {year}',
    eliteCondition1: 'Millas totales calificables',
    eliteCondition2: 'Millas requeridas con avianca',
    eliteCondition1Completed: 'Millas calificables completadas',
    eliteCondition2Completed: 'Millas requeridas con avianca completadas',
    eliteTooltip: 'Completa las millas calificables totales y las requeridas con avianca para mantener tu estatus.',
    eliteTooltipAria: 'Más información',
    emptyTitle: 'Aún no podemos mostrar tus datos',
    emptyMessage: 'Vuelve a intentarlo en unos minutos.',
    errorMessage: 'No pudimos cargar tu información. Inténtalo de nuevo.',
    placeholder: '—',
  },
  pt: {
    greeting: 'Olá, {name}',
    viewDetail: 'Ver detalhes',
    hideDetail: 'Ocultar detalhes',
    viewProfile: 'Ver perfil',
    viewProgress: 'Ver progresso',
    milesLabel: 'Você tem',
    milesUnit: 'milhas',
    expiryLabel: 'Data de vencimento',
    statusLabel: 'Status Lifemiles',
    statusExpiryPrefix: 'Vence:',
    membershipLabel: 'Número de sócio',
    copyAriaLabel: 'Copiar número de sócio',
    copiedLabel: 'Copiado',
    eliteTitleMaintain: 'Seu progresso elite {tier} para {year}',
    eliteTitleMaintainSingle: 'Manter seu status elite {tier} em {year}',
    eliteTitleEnjoy: 'Aproveite seu status elite {tier} em {year}',
    eliteCondition1: 'Milhas totais qualificáveis',
    eliteCondition2: 'Milhas exigidas com avianca',
    eliteCondition1Completed: 'Milhas qualificáveis concluídas',
    eliteCondition2Completed: 'Milhas exigidas com avianca concluídas',
    eliteTooltip: 'Complete as milhas qualificáveis totais e as exigidas com avianca para manter seu status.',
    eliteTooltipAria: 'Mais informações',
    emptyTitle: 'Ainda não podemos mostrar seus dados',
    emptyMessage: 'Tente novamente em alguns minutos.',
    errorMessage: 'Não foi possível carregar suas informações. Tente novamente.',
    placeholder: '—',
  },
  en: {
    greeting: 'Hi, {name}',
    viewDetail: 'View details',
    hideDetail: 'Hide details',
    viewProfile: 'View profile',
    viewProgress: 'View progress',
    milesLabel: 'You have',
    milesUnit: 'miles',
    expiryLabel: 'Expiration date',
    statusLabel: 'Lifemiles status',
    statusExpiryPrefix: 'Expires:',
    membershipLabel: 'Membership number',
    copyAriaLabel: 'Copy membership number',
    copiedLabel: 'Copied',
    eliteTitleMaintain: 'Your {tier} elite progress for {year}',
    eliteTitleMaintainSingle: 'Maintain your {tier} elite status in {year}',
    eliteTitleEnjoy: 'Enjoy your {tier} elite status in {year}',
    eliteCondition1: 'Total qualifying miles',
    eliteCondition2: 'Required miles with avianca',
    eliteCondition1Completed: 'Qualifying miles completed',
    eliteCondition2Completed: 'Required miles with avianca completed',
    eliteTooltip: 'Complete your total qualifying miles and the required miles with avianca to keep your status.',
    eliteTooltipAria: 'More information',
    emptyTitle: 'We can’t show your data yet',
    emptyMessage: 'Please try again in a few minutes.',
    errorMessage: 'We couldn’t load your information. Please try again.',
    placeholder: '—',
  },
  fr: {
    greeting: 'Bonjour, {name}',
    viewDetail: 'Voir le détail',
    hideDetail: 'Masquer le détail',
    viewProfile: 'Voir le profil',
    viewProgress: 'Voir la progression',
    milesLabel: 'Vous avez',
    milesUnit: 'miles',
    expiryLabel: "Date d'expiration",
    statusLabel: 'Statut Lifemiles',
    statusExpiryPrefix: 'Expire :',
    membershipLabel: 'Numéro de membre',
    copyAriaLabel: 'Copier le numéro de membre',
    copiedLabel: 'Copié',
    eliteTitleMaintain: 'Votre progression élite {tier} pour {year}',
    eliteTitleMaintainSingle: 'Conservez votre statut élite {tier} en {year}',
    eliteTitleEnjoy: 'Profitez de votre statut élite {tier} en {year}',
    eliteCondition1: 'Total des miles qualifiants',
    eliteCondition2: 'Miles requis avec avianca',
    eliteCondition1Completed: 'Miles qualifiants complétés',
    eliteCondition2Completed: 'Miles requis avec avianca complétés',
    eliteTooltip: 'Complétez vos miles qualifiants totaux et ceux requis avec avianca pour conserver votre statut.',
    eliteTooltipAria: 'Plus d’informations',
    emptyTitle: 'Nous ne pouvons pas encore afficher vos données',
    emptyMessage: 'Veuillez réessayer dans quelques minutes.',
    errorMessage: 'Nous n’avons pas pu charger vos informations. Veuillez réessayer.',
    placeholder: '—',
  },
};

/** Fallback síncrono de los copies del hero (primer render, antes del spreadsheet). */
export const getHeroLabelsSync = () => ({
  ...(HERO_FALLBACKS[resolveLang()] || HERO_FALLBACKS.pt),
});

const heroCache = {};

/**
 * Carga los copies del hero del idioma actual desde el spreadsheet (por Key, mismo
 * patrón que loadMembersLabels) y cae al fallback por key. Cacheado por idioma.
 * @returns {Promise<Object>} mapa de copies (ver MEMBERS_HERO_I18N_KEYS).
 */
export async function loadHeroLabels() {
  const lang = resolveLang();
  if (heroCache[lang]) return heroCache[lang];
  const fb = HERO_FALLBACKS[lang] || HERO_FALLBACKS.pt;
  let labels = { ...fb };
  try {
    const i18 = await fetchAEMData(lang);
    const rows = Array.isArray(i18?.data) ? i18.data : [];
    const read = (key, fallback) => rows.find((r) => r.Key === key)?.Text?.trim() || fallback;
    labels = Object.keys(MEMBERS_HERO_I18N_KEYS).reduce((acc, k) => {
      acc[k] = read(MEMBERS_HERO_I18N_KEYS[k], fb[k]);
      return acc;
    }, {});
  } catch (e) { /* fallback ya seteado */ }
  heroCache[lang] = labels;
  return labels;
}

// ---------------------------------------------------------------------------
// Cards del Dashboard (1263921, "Bloque 4"). Copies (title + description) por
// `key` de card y por idioma. Mismo patrón que el hero: fallback síncrono +
// override de TEXTO autorado por Key del spreadsheet. La ESTRUCTURA (icon, link,
// orden, visibilidad) vive en `APP_CONFIG.cards` / el CF — acá SOLO el texto
// traducible. Las `key` (elite-progress/account/my-trips/manage-miles) son ids
// internos estables y NO se traducen. Sin locale conocido → fallback ES.
// Autoría: filas `members.dashboard.card.<key>.{title|description}` por idioma.
// ---------------------------------------------------------------------------
const CARD_KEYS = ['elite-progress', 'account', 'my-trips', 'manage-miles', 'activity'];

const cardI18nKey = (key, field) => `members.dashboard.card.${key}.${field}`;

const CARDS_FALLBACKS = {
  es: {
    'elite-progress': {
      title: 'Progreso Elite y beneficios',
      description: 'Consulta tu nivel actual, tus beneficios y tu progreso hacia el siguiente estatus.',
    },
    account: {
      title: 'Gestión de cuenta',
      description: 'Administra tu información personal, documentos de viaje, preferencias y ajustes de seguridad.',
    },
    'my-trips': {
      title: 'Mis viajes',
      description: 'Consulta tus próximos vuelos y el historial de los viajes que has realizado con Avianca.',
    },
    'manage-miles': {
      title: 'Gestionar millas',
      description: 'Transfiere, dona, cambia tus puntos y gestiona tus millas según tus necesidades.',
    },
    activity: {
      title: 'Actividad de millas',
      description: 'Últimas transacciones',
      emptyLabel: 'Aún no tienes transacciones recientes.',
    },
  },
  pt: {
    'elite-progress': {
      title: 'Progresso Elite e benefícios',
      description: 'Confira seu nível atual, seus benefícios e seu progresso rumo ao próximo status.',
    },
    account: {
      title: 'Gestão da conta',
      description: 'Gerencie suas informações pessoais, documentos de viagem, preferências e configurações de segurança.',
    },
    'my-trips': {
      title: 'Minhas viagens',
      description: 'Confira seus próximos voos e o histórico das viagens que você fez com a Avianca.',
    },
    'manage-miles': {
      title: 'Gerenciar milhas',
      description: 'Transfira, doe, troque seus pontos e gerencie suas milhas conforme suas necessidades.',
    },
    activity: {
      title: 'Atividade de milhas',
      description: 'Últimas transações',
      emptyLabel: 'Você ainda não possui transações recentes.',
    },
  },
  en: {
    'elite-progress': {
      title: 'Elite progress and benefits',
      description: 'Check your current level, your benefits and your progress toward the next status.',
    },
    account: {
      title: 'Account management',
      description: 'Manage your personal information, travel documents, preferences and security settings.',
    },
    'my-trips': {
      title: 'My trips',
      description: "Check your upcoming flights and the history of the trips you've taken with Avianca.",
    },
    'manage-miles': {
      title: 'Manage miles',
      description: 'Transfer, donate, redeem your points and manage your miles according to your needs.',
    },
    activity: {
      title: 'Miles activity',
      description: 'Latest transactions',
      emptyLabel: 'You have no recent transactions yet.',
    },
  },
  fr: {
    'elite-progress': {
      title: 'Progression Élite et avantages',
      description: 'Consultez votre niveau actuel, vos avantages et votre progression vers le prochain statut.',
    },
    account: {
      title: 'Gestion du compte',
      description: 'Gérez vos informations personnelles, vos documents de voyage, vos préférences et vos paramètres de sécurité.',
    },
    'my-trips': {
      title: 'Mes voyages',
      description: "Consultez vos prochains vols et l'historique des voyages que vous avez effectués avec Avianca.",
    },
    'manage-miles': {
      title: 'Gérer les miles',
      description: 'Transférez, donnez, échangez vos points et gérez vos miles selon vos besoins.',
    },
    activity: {
      title: 'Activité des miles',
      description: 'Dernières transactions',
      emptyLabel: 'Vous n’avez pas encore de transactions récentes.',
    },
  },
};

// Labels del badge de completitud de perfil (card `account`, 1263921). Fallback
// por idioma cuando el CF no trae `badgeCompleteLabel`/`badgeIncompleteLabel`.
const CARD_BADGE_FALLBACKS = {
  es: { badgeComplete: 'Perfil completo', badgeIncomplete: 'Completa tu perfil' },
  pt: { badgeComplete: 'Perfil completo', badgeIncomplete: 'Complete seu perfil' },
  en: { badgeComplete: 'Profile complete', badgeIncomplete: 'Complete your profile' },
  fr: { badgeComplete: 'Profil complet', badgeIncomplete: 'Complétez votre profil' },
};

/** Fallback síncrono de los copies de las cards del Dashboard (primer render,
 *  antes del spreadsheet). Incluye `opensInNewWindow` (sufijo aria de cards
 *  externas) y los labels del badge de completitud. */
export const getCardsLabelsSync = () => {
  const lang = resolveLang();
  const cards = CARDS_FALLBACKS[lang] || CARDS_FALLBACKS.es;
  const general = FALLBACKS[lang] || FALLBACKS.es;
  const badge = CARD_BADGE_FALLBACKS[lang] || CARD_BADGE_FALLBACKS.es;
  return { ...cards, opensInNewWindow: general.opensInNewWindow, ...badge };
};

const cardsCache = {};

/**
 * Carga los copies de las cards del idioma actual desde el spreadsheet (por Key,
 * mismo patrón que loadHeroLabels) y cae al fallback por card. Cacheado por idioma.
 * @returns {Promise<Object>} `{ [cardKey]: {title, description}, opensInNewWindow }`.
 */
export async function loadCardsLabels() {
  const lang = resolveLang();
  if (cardsCache[lang]) return cardsCache[lang];
  const fb = CARDS_FALLBACKS[lang] || CARDS_FALLBACKS.es;
  const general = FALLBACKS[lang] || FALLBACKS.es;
  const badge = CARD_BADGE_FALLBACKS[lang] || CARD_BADGE_FALLBACKS.es;
  let labels = { ...fb, opensInNewWindow: general.opensInNewWindow, ...badge };
  try {
    const i18 = await fetchAEMData(lang);
    const rows = Array.isArray(i18?.data) ? i18.data : [];
    const read = (key, fallback) => rows.find((r) => r.Key === key)?.Text?.trim() || fallback;
    const cards = CARD_KEYS.reduce((acc, k) => {
      const base = fb[k] || {};
      const out = {
        title: read(cardI18nKey(k, 'title'), base.title),
        description: read(cardI18nKey(k, 'description'), base.description),
      };
      // Campos opcionales por card (ej. `emptyLabel` en 'activity'): si el fallback
      // los trae, los proyectamos con el mismo patrón Key (`members.dashboard.card.<key>.<field>`)
      // para permitir override desde el spreadsheet sin tocar código.
      Object.keys(base).forEach((field) => {
        if (field === 'title' || field === 'description') return;
        out[field] = read(cardI18nKey(k, field), base[field]);
      });
      acc[k] = out;
      return acc;
    }, {});
    labels = {
      ...cards,
      opensInNewWindow: read(MEMBERS_I18N_KEYS.opensInNewWindow, general.opensInNewWindow),
      badgeComplete: read('members.dashboard.badge.complete', badge.badgeComplete),
      badgeIncomplete: read('members.dashboard.badge.incomplete', badge.badgeIncomplete),
    };
  } catch (e) { /* fallback ya seteado */ }
  cardsCache[lang] = labels;
  return labels;
}

// ---------------------------------------------------------------------------
// Sección "Progreso Elite y beneficios" (1271689, ProgElite+Ben). Copies de la
// arquitectura general de la página: labels de las tabs + valores localizados
// del query param de deep-linking (`?tab=`) + aria-label del tablist + label de
// carga. Mismo patrón que el hero: fallback síncrono por idioma + override de
// TEXTO autorado por Key del spreadsheet.
//
// Los `tabParam*` son los valores del query param POR IDIOMA (SEO, decisión T3):
// es `progreso|beneficios` · en `progress|benefits` · pt `progresso|beneficios`
// · fr `progres|avantages`. `paramToTab` (members-tabs.logic.js) acepta el valor
// de CUALQUIER idioma y lo normaliza a la key interna `progress|benefits`.
// Autoría: filas `members.elite.*` (Key → Text) en cada spreadsheet.
// ---------------------------------------------------------------------------
export const MEMBERS_ELITE_I18N_KEYS = {
  tabProgress: 'members.elite.tab.progress',
  tabBenefits: 'members.elite.tab.benefits',
  tabParamProgress: 'members.elite.tabParam.progress',
  tabParamBenefits: 'members.elite.tabParam.benefits',
  tabsAriaLabel: 'members.elite.tabs.ariaLabel',
  loadingLabel: 'members.elite.loading',
  // Header por estatus (1271692, Bloque 2). `headerGreeting` usa `{name}`;
  // `headerGreetingNoName` es la variante sin nombre (§7.3: socio sin givenName).
  headerGreeting: 'members.elite.header.greeting',
  headerGreetingNoName: 'members.elite.header.greetingNoName',
  headerExpiresLabel: 'members.elite.header.expires',
  youHaveLabel: 'members.elite.header.youHave',
  milesUnit: 'members.elite.header.milesUnit',
  milesExpiryLabel: 'members.elite.header.milesExpiry',
  breadcrumbMyLifemiles: 'members.elite.breadcrumb.myLifemiles',
  breadcrumbAccount: 'members.elite.breadcrumb.account',
  breadcrumbElite: 'members.elite.breadcrumb.elite',
  // --- Tab Progreso (1271699, bloques 3-8). Interpolaciones: {year} = año del
  // ciclo (del servicio, T11); {tier} = display del tier; {total}/{avianca}/
  // {goal}/{n} = números YA formateados por locale. Las keys `howToEarnS*Items`
  // son listas separadas por `|` (una fila Key→Text por sección; el componente
  // splitea). Fallbacks PT/FR: coherentes con las planillas, SUJETOS A REVISIÓN
  // TL (la planilla pisa el fallback — no bloquea).
  progressTitle: 'members.elite.progress.title',
  progressPanelTitle: 'members.elite.progress.panelTitle',
  progressSubtitle: 'members.elite.progress.subtitle',
  progressSubtitleMaintain: 'members.elite.progress.subtitleMaintain',
  subTabDetail: 'members.elite.progress.subTab.detail',
  subTabFull: 'members.elite.progress.subTab.full',
  goalTitle: 'members.elite.progress.goal.title',
  goalTitleMaintain: 'members.elite.progress.goal.titleMaintain',
  goalBody: 'members.elite.progress.goal.body',
  goalBodyAviancaOnly: 'members.elite.progress.goal.bodyAviancaOnly',
  barTotalTitle: 'members.elite.progress.barTotal.title',
  barTotalHint: 'members.elite.progress.barTotal.hint',
  barAviancaTitle: 'members.elite.progress.barAvianca.title',
  remainingLabel: 'members.elite.progress.remaining',
  startLabel: 'members.elite.progress.start',
  maintainMilestone: 'members.elite.progress.maintainMilestone',
  metGoalTitle: 'members.elite.progress.metGoal.title',
  metGoalBody: 'members.elite.progress.metGoal.body',
  cenitTitle: 'members.elite.progress.cenit.title',
  cenitBody1M: 'members.elite.progress.cenit.body1m',
  cenitBody2M: 'members.elite.progress.cenit.body2m',
  cenitBarTitle: 'members.elite.progress.cenit.barTitle',
  cenitDoneText: 'members.elite.progress.cenit.doneText',
  cenitMilestone1M: 'members.elite.progress.cenit.milestone1m',
  cenitMilestone2M: 'members.elite.progress.cenit.milestone2m',
  alertStatusTitle: 'members.elite.progress.alert.status.title',
  alertStatusBody: 'members.elite.progress.alert.status.body',
  alertCenit1Title: 'members.elite.progress.alert.cenit1.title',
  alertCenit1Body: 'members.elite.progress.alert.cenit1.body',
  alertCenit2Title: 'members.elite.progress.alert.cenit2.title',
  alertCenit2Body: 'members.elite.progress.alert.cenit2.body',
  howToEarnTitle: 'members.elite.progress.howToEarn.title',
  howToEarnS1Title: 'members.elite.progress.howToEarn.s1.title',
  howToEarnS1Items: 'members.elite.progress.howToEarn.s1.items',
  howToEarnS1Tip: 'members.elite.progress.howToEarn.s1.tip',
  howToEarnS2Title: 'members.elite.progress.howToEarn.s2.title',
  howToEarnS2Items: 'members.elite.progress.howToEarn.s2.items',
  howToEarnS2Tip: 'members.elite.progress.howToEarn.s2.tip',
  howToEarnS3Title: 'members.elite.progress.howToEarn.s3.title',
  howToEarnS3Items: 'members.elite.progress.howToEarn.s3.items',
  howToEarnS3Tip: 'members.elite.progress.howToEarn.s3.tip',
  // --- FAB Gamification + tab Beneficios (1271694, bloque 10). {n}/{m} =
  // paginación del slider; {plan}/{price} = upsell LM+; {date} = fin de
  // beneficios de suscripción suspendida. Fallbacks EN/PT/FR coherentes,
  // SUJETOS A REVISIÓN TL (la planilla pisa el fallback).
  fabTitle: 'members.elite.fab.title',
  fabBodyMultiply: 'members.elite.fab.bodyMultiply',
  fabBodyAvianca: 'members.elite.fab.bodyAvianca',
  fabCtaBuy: 'members.elite.fab.ctaBuy',
  fabCtaFly: 'members.elite.fab.ctaFly',
  fabAriaLabel: 'members.elite.fab.ariaLabel',
  cobrandSectionTitle: 'members.elite.cobrand.sectionTitle',
  cobrandPagination: 'members.elite.cobrand.pagination',
  cobrandSeeMore: 'members.elite.cobrand.seeMore',
  cobrandMilesLabel: 'members.elite.cobrand.milesLabel',
  cobrandAdd: 'members.elite.cobrand.add',
  cobrandRequest: 'members.elite.cobrand.request',
  cobrandEmptyTitle: 'members.elite.cobrand.empty.title',
  cobrandEmptyBody: 'members.elite.cobrand.empty.body',
  cobrandEmptyRequest: 'members.elite.cobrand.empty.request',
  lmPlusSectionTitle: 'members.elite.lmplus.sectionTitle',
  lmPlusManage: 'members.elite.lmplus.manage',
  lmPlusActive: 'members.elite.lmplus.active',
  lmPlusSuspended: 'members.elite.lmplus.suspended',
  lmPlusSubscriptionLabel: 'members.elite.lmplus.subscriptionLabel',
  lmPlusMilesMonthLabel: 'members.elite.lmplus.milesMonthLabel',
  // Lista `|` de beneficios del panel punteado del PlanCard; segmentos entre
  // `**` van en negrita (parse local, sin HTML). Contenido de marketing —
  // editable por planilla (hoy estático configurable, paso 11).
  lmPlusBenefits: 'members.elite.lmplus.benefits',
  lmPlusUpsell: 'members.elite.lmplus.upsell',
  lmPlusImprove: 'members.elite.lmplus.improve',
  lmPlusActivate: 'members.elite.lmplus.activate',
  lmPlusSuspendedNotice: 'members.elite.lmplus.suspendedNotice',
  lmPlusBannerTitle: 'members.elite.lmplus.banner.title',
  lmPlusBannerBody: 'members.elite.lmplus.banner.body',
  lmPlusBannerCta: 'members.elite.lmplus.banner.cta',
  // --- NewYearStatusModal (1271694, decisión A3 — gated por CF `newYearModal`).
  // {year} = año en curso (item 2 — nota de diseño: "configurable o dinámico").
  // El CF puede pisar cada texto con literal autorado (title/body/ctaLabel/
  // items[]/tertiaryLabel); estas keys son el default por idioma.
  newYearTitle: 'members.elite.newYear.title',
  newYearBody: 'members.elite.newYear.body',
  newYearCta: 'members.elite.newYear.cta',
  newYearItem1: 'members.elite.newYear.item1',
  newYearItem2: 'members.elite.newYear.item2',
  newYearItem3: 'members.elite.newYear.item3',
  newYearTertiary: 'members.elite.newYear.tertiary',
  newYearCloseLabel: 'members.elite.newYear.close',
  // --- Catálogo de Beneficios por estatus (1271693, bloque 9 · rework plan A,
  // componente BenefitsCards de Figma). VALOR tipado por sub-beneficio (decisión
  // A4 — Figma manda; deroga "entradas disponibles"/"Ilimitadas"): {n} = número
  // YA formateado. `count` → "N veces" · `unlimited` → "Ilimitado" (Static) ·
  // `na` → "No aplica" (disable/gris) · `discount` → "X% descuento". El título
  // del módulo usa {tier}. Los títulos de categoría (`benefitsCat*`) son DEFAULTS
  // de las categorías seed — el CF puede pisarlos con `title` literal por
  // categoría. Fallbacks EN/PT/FR SUJETOS A REVISIÓN TL (la planilla pisa).
  benefitsCatalogTitle: 'members.elite.benefits.catalogTitle',
  benefitsValueCount: 'members.elite.benefits.value.count',
  benefitsValueCountSuffix: 'members.elite.benefits.value.countSuffix',
  benefitsValueUnlimited: 'members.elite.benefits.value.unlimited',
  benefitsValueNa: 'members.elite.benefits.value.na',
  benefitsValueDiscount: 'members.elite.benefits.value.discount',
  benefitsTerms: 'members.elite.benefits.terms',
  benefitsSeeAll: 'members.elite.benefits.seeAll',
  benefitsCardBanner: 'members.elite.benefits.cardBanner',
  benefitsCatUpgrades: 'members.elite.benefits.cat.upgrades',
  benefitsCatLounges: 'members.elite.benefits.cat.lounges',
  benefitsCatPriority: 'members.elite.benefits.cat.priority',
  benefitsCatBaggage: 'members.elite.benefits.cat.baggage',
  benefitsCatSeating: 'members.elite.benefits.cat.seating',
  benefitsCatDefault: 'members.elite.benefits.cat.default',
};

const ELITE_FALLBACKS = {
  es: {
    tabProgress: 'Progreso',
    tabBenefits: 'Beneficios',
    tabParamProgress: 'progreso',
    tabParamBenefits: 'beneficios',
    tabsAriaLabel: 'Progreso y beneficios',
    loadingLabel: 'Cargando tu información…',
    headerGreeting: 'Hola, {name}',
    headerGreetingNoName: 'Hola',
    headerExpiresLabel: 'Vence:',
    youHaveLabel: 'Tienes',
    milesUnit: 'millas',
    milesExpiryLabel: 'Fecha de vencimiento',
    breadcrumbMyLifemiles: 'Mi Lifemiles',
    breadcrumbAccount: 'Cuenta Lifemiles',
    breadcrumbElite: 'Progreso Elite y beneficios',
    progressTitle: 'Mi progreso Elite {year}',
    progressPanelTitle: 'Progreso elite en {year}',
    progressSubtitle: 'Cumple las metas entre el 1 de enero y el 31 de diciembre para avanzar al siguiente estatus.',
    progressSubtitleMaintain: 'Cumple la meta entre el 1 de enero y el 31 de diciembre para mantener tu estatus.',
    subTabDetail: 'Detalle de progreso',
    subTabFull: 'Vista completa',
    goalTitle: 'Meta para llegar a estatus {tier}',
    goalTitleMaintain: 'Meta para mantener estatus {tier}',
    goalBody: 'Completa {total} millas calificables totales, de las cuales {avianca} millas deben ser con Avianca.',
    goalBodyAviancaOnly: 'Completa {avianca} millas calificables con Avianca.',
    barTotalTitle: 'Millas totales calificables',
    barTotalHint: 'Incluye tus millas con Avianca',
    barAviancaTitle: 'Millas requeridas con Avianca',
    remainingLabel: 'Faltan: {n} millas para {tier}',
    startLabel: 'Inicio',
    maintainMilestone: 'Mantener {tier} en {year}',
    metGoalTitle: '¡Cumpliste la meta para mantener tu estatus!',
    metGoalBody: 'Sigue acumulando millas para alcanzar el siguiente estatus.',
    cenitTitle: 'Progreso Cenit',
    cenitBody1M: 'Completa {goal} millas volando con avianca, para ganar de manera vitalicia todos los beneficios del estatus {tier}.',
    cenitBody2M: 'Completa {goal} millas volando con avianca, para ganar de manera vitalicia todos los beneficios del estatus {tier}.',
    cenitBarTitle: 'Millas totales con Avianca',
    cenitDoneText: '¡Disfruta de {tier} de por vida!',
    cenitMilestone1M: '{tier} 1M',
    cenitMilestone2M: '{tier} 2M',
    alertStatusTitle: '¡Felicitaciones! Ahora eres {tier}',
    alertStatusBody: 'Accede a beneficios exclusivos y sigue acumulando millas para llegar a tu siguiente estatus.',
    alertCenit1Title: '¡Felicitaciones! Alcanzaste Cenit One Million',
    alertCenit1Body: 'Ganaste de manera vitalicia todos los beneficios del estatus {tier}.',
    alertCenit2Title: '¡Felicitaciones! Alcanzaste Cenit Two Million',
    alertCenit2Body: 'Ganaste de manera vitalicia todos los beneficios del estatus Diamond.',
    howToEarnTitle: 'Cómo ganar millas calificables',
    howToEarnS1Title: 'Con Avianca y GOL',
    howToEarnS1Items: 'Vuelos con Avianca.|Servicios adicionales en Avianca.|Vuelos con aerolíneas GOL.',
    howToEarnS1Tip: 'Ganas 1 milla calificable por cada milla ganada',
    howToEarnS2Title: 'Aliados y productos Lifemiles',
    howToEarnS2Items: 'Vuelos con aerolíneas Star Alliance.|Tarjetas de crédito y débito Avianca Lifemiles|Lifemiles plus|Comercios aliados|Compra de millas|Conversión de puntos a millas y transferencias de millas',
    howToEarnS2Tip: 'Ganas 1 milla calificable por cada 2 millas ganadas',
    howToEarnS3Title: 'Bonos y otras millas',
    howToEarnS3Items: 'Bono elite.|Otros bonos de millas.',
    howToEarnS3Tip: 'Ganas 1 milla calificable por cada 20 millas ganadas',
    newYearTitle: 'Empiezas un nuevo año',
    newYearBody: 'Cada año, tu progreso se actualiza y comienzas un nuevo ciclo en tu categoría Elite.',
    newYearCta: 'Ir al perfil',
    newYearItem1: 'Tus objetivos de acumulación de millas han sido actualizados.',
    newYearItem2: 'Cumple tus metas entre el 1 de enero y el 31 de diciembre del {year}.',
    newYearItem3: 'Tu contador de millas inicia en cero, pero mantienes los beneficios del estatus alcanzado el año pasado.',
    newYearTertiary: 'Conoce el programa Elite de Lifemiles',
    newYearCloseLabel: 'Cerrar',
    fabTitle: 'Acelera tu progreso',
    fabBodyMultiply: 'Compra o multiplica tus millas para llegar más rápido a la meta.',
    fabBodyAvianca: 'Cada vuelo te acerca más a tu siguiente estatus élite.',
    fabCtaBuy: 'Comprar millas',
    fabCtaFly: 'Reservar un vuelo',
    fabAriaLabel: 'Abrir acelerador de progreso',
    cobrandSectionTitle: 'Beneficios por tus tarjetas',
    cobrandPagination: '{n} de {m}',
    cobrandSeeMore: 'Conoce todos los beneficios',
    cobrandMilesLabel: 'Total acumulado en {year}',
    cobrandAdd: 'Agregar tarjeta',
    cobrandRequest: 'Solicitar nueva tarjeta',
    cobrandEmptyTitle: 'Con tu tarjeta Avianca Lifemiles, tus beneficios aparecen aquí',
    cobrandEmptyBody: 'Acumula millas, accede a salas VIP y acumula más con cada compra.',
    cobrandEmptyRequest: 'Solicitar tarjeta',
    lmPlusSectionTitle: 'Beneficios por tu plan Lifemiles Plus',
    lmPlusManage: 'Administrar suscripción',
    lmPlusActive: 'Plan activo',
    lmPlusSuspended: 'Plan suspendido',
    lmPlusSubscriptionLabel: 'Suscripción',
    lmPlusMilesMonthLabel: 'Millas por mes',
    lmPlusBenefits: 'Si pagas tu suscripción con tu tarjeta Lifemiles, duplicamos hasta **5,000 millas** de tus compras.|**Descuento** en tus vuelos a Lifemiles.com|**20% de descuento adicional** en tu suscripción por ser socio Diamond',
    lmPlusUpsell: 'Obtén más beneficios con el {plan} por solo {price} adicional',
    lmPlusImprove: 'Mejorar plan',
    lmPlusActivate: 'Activar plan',
    lmPlusSuspendedNotice: 'Tu suscripción ha sido suspendida, podrás disfrutar de tus beneficios hasta el {date}.',
    lmPlusBannerTitle: 'Suscríbete a Lifemiles Plus',
    lmPlusBannerBody: 'Multiplica tus millas mensualmente y recibe beneficios para viajar',
    lmPlusBannerCta: 'Suscríbete ya',
    benefitsCatalogTitle: 'Beneficios por tu estatus {tier}',
    benefitsValueCount: '{n} de {total}',
    benefitsValueCountSuffix: 'de {total}',
    benefitsValueUnlimited: 'Ilimitado',
    benefitsValueNa: 'No aplica',
    benefitsValueDiscount: '{n}% descuento',
    benefitsTerms: 'Términos y condiciones',
    benefitsSeeAll: 'Conoce todos los beneficios',
    benefitsCardBanner: 'Tus beneficios también pueden estar disponibles por tus tarjetas de crédito cobrand.',
    benefitsCatUpgrades: 'Business Class',
    benefitsCatLounges: 'Salas VIP',
    benefitsCatPriority: 'Abordaje Prioritario',
    benefitsCatBaggage: 'Equipaje adicional',
    benefitsCatSeating: 'Selección de Asientos',
    benefitsCatDefault: 'Millas adicionales',
  },
  pt: {
    tabProgress: 'Progresso',
    tabBenefits: 'Benefícios',
    tabParamProgress: 'progresso',
    tabParamBenefits: 'beneficios',
    tabsAriaLabel: 'Progresso e benefícios',
    loadingLabel: 'Carregando suas informações…',
    headerGreeting: 'Olá, {name}',
    headerGreetingNoName: 'Olá',
    headerExpiresLabel: 'Vence:',
    youHaveLabel: 'Você tem',
    milesUnit: 'milhas',
    milesExpiryLabel: 'Data de vencimento',
    breadcrumbMyLifemiles: 'Meu Lifemiles',
    breadcrumbAccount: 'Conta Lifemiles',
    breadcrumbElite: 'Progresso Elite e benefícios',
    progressTitle: 'Meu progresso Elite {year}',
    progressPanelTitle: 'Progresso elite em {year}',
    progressSubtitle: 'Cumpra as metas entre 1º de janeiro e 31 de dezembro para avançar ao próximo status.',
    progressSubtitleMaintain: 'Cumpra a meta entre 1º de janeiro e 31 de dezembro para manter seu status.',
    subTabDetail: 'Detalhe do progresso',
    subTabFull: 'Visão completa',
    goalTitle: 'Meta para chegar ao status {tier}',
    goalTitleMaintain: 'Meta para manter o status {tier}',
    goalBody: 'Complete {total} milhas qualificáveis totais, das quais {avianca} milhas devem ser com a Avianca.',
    goalBodyAviancaOnly: 'Complete {avianca} milhas qualificáveis com a Avianca.',
    barTotalTitle: 'Milhas totais qualificáveis',
    barTotalHint: 'Inclui suas milhas com a Avianca',
    barAviancaTitle: 'Milhas requeridas com a Avianca',
    remainingLabel: 'Faltam: {n} milhas para {tier}',
    startLabel: 'Início',
    maintainMilestone: 'Manter {tier} em {year}',
    metGoalTitle: 'Você cumpriu a meta para manter seu status!',
    metGoalBody: 'Continue acumulando milhas para alcançar o próximo status.',
    cenitTitle: 'Progresso Cenit',
    cenitBody1M: 'Complete {goal} milhas voando com a avianca para ganhar de forma vitalícia todos os benefícios do status {tier}.',
    cenitBody2M: 'Complete {goal} milhas voando com a avianca para ganhar de forma vitalícia todos os benefícios do status {tier}.',
    cenitBarTitle: 'Milhas totais com a Avianca',
    cenitDoneText: 'Aproveite {tier} para a vida toda!',
    cenitMilestone1M: '{tier} 1M',
    cenitMilestone2M: '{tier} 2M',
    alertStatusTitle: 'Parabéns! Agora você é {tier}',
    alertStatusBody: 'Acesse benefícios exclusivos e continue acumulando milhas para chegar ao seu próximo status.',
    alertCenit1Title: 'Parabéns! Você alcançou o Cenit One Million',
    alertCenit1Body: 'Você ganhou de forma vitalícia todos os benefícios do status {tier}.',
    alertCenit2Title: 'Parabéns! Você alcançou o Cenit Two Million',
    alertCenit2Body: 'Você ganhou de forma vitalícia todos os benefícios do status Diamond.',
    howToEarnTitle: 'Como ganhar milhas qualificáveis',
    howToEarnS1Title: 'Com Avianca e GOL',
    howToEarnS1Items: 'Voos com a Avianca.|Serviços adicionais na Avianca.|Voos com as companhias GOL.',
    howToEarnS1Tip: 'Você ganha 1 milha qualificável por cada milha ganha',
    howToEarnS2Title: 'Parceiros e produtos Lifemiles',
    howToEarnS2Items: 'Voos com companhias Star Alliance.|Cartões de crédito e débito Avianca Lifemiles|Lifemiles plus|Comércios parceiros|Compra de milhas|Conversão de pontos em milhas e transferências de milhas',
    howToEarnS2Tip: 'Você ganha 1 milha qualificável por cada 2 milhas ganhas',
    howToEarnS3Title: 'Bônus e outras milhas',
    howToEarnS3Items: 'Bônus elite.|Outros bônus de milhas.',
    howToEarnS3Tip: 'Você ganha 1 milha qualificável por cada 20 milhas ganhas',
    newYearTitle: 'Você começa um novo ano',
    newYearBody: 'A cada ano, seu progresso é atualizado e você começa um novo ciclo na sua categoria Elite.',
    newYearCta: 'Ir para o perfil',
    newYearItem1: 'Suas metas de acúmulo de milhas foram atualizadas.',
    newYearItem2: 'Cumpra suas metas entre 1º de janeiro e 31 de dezembro de {year}.',
    newYearItem3: 'Seu contador de milhas começa em zero, mas você mantém os benefícios do status alcançado no ano passado.',
    newYearTertiary: 'Conheça o programa Elite da Lifemiles',
    newYearCloseLabel: 'Fechar',
    fabTitle: 'Acelere seu progresso',
    fabBodyMultiply: 'Compre ou multiplique suas milhas para chegar mais rápido à meta.',
    fabBodyAvianca: 'Cada voo te aproxima do seu próximo status elite.',
    fabCtaBuy: 'Comprar milhas',
    fabCtaFly: 'Reservar um voo',
    fabAriaLabel: 'Abrir acelerador de progresso',
    cobrandSectionTitle: 'Benefícios pelos seus cartões',
    cobrandPagination: '{n} de {m}',
    cobrandSeeMore: 'Conheça todos os benefícios',
    cobrandMilesLabel: 'Total acumulado em {year}',
    cobrandAdd: 'Adicionar cartão',
    cobrandRequest: 'Solicitar novo cartão',
    cobrandEmptyRequest: 'Solicitar cartão',
    cobrandEmptyTitle: 'Com seu cartão Avianca Lifemiles, seus benefícios aparecem aqui',
    cobrandEmptyBody: 'Acumule milhas, acesse salas VIP e acumule mais a cada compra.',
    lmPlusSectionTitle: 'Benefícios pelo seu plano Lifemiles Plus',
    lmPlusManage: 'Gerenciar assinatura',
    lmPlusActive: 'Plano ativo',
    lmPlusSuspended: 'Plano suspenso',
    lmPlusSubscriptionLabel: 'Assinatura',
    lmPlusMilesMonthLabel: 'Milhas por mês',
    lmPlusBenefits: 'Se você paga sua assinatura com seu cartão Lifemiles, duplicamos até **5,000 milhas** das suas compras.|**Desconto** nos seus voos em Lifemiles.com|**20% de desconto adicional** na sua assinatura por ser sócio Diamond',
    lmPlusUpsell: 'Obtenha mais benefícios com o {plan} por apenas {price} adicional',
    lmPlusImprove: 'Melhorar plano',
    lmPlusActivate: 'Ativar plano',
    lmPlusSuspendedNotice: 'Sua assinatura foi suspensa; você poderá aproveitar seus benefícios até {date}.',
    lmPlusBannerTitle: 'Assine o Lifemiles Plus',
    lmPlusBannerBody: 'Multiplique suas milhas mensalmente e receba benefícios para viajar',
    lmPlusBannerCta: 'Assine já',
    benefitsCatalogTitle: 'Benefícios pelo seu status {tier}',
    benefitsValueCount: '{n} de {total}',
    benefitsValueCountSuffix: 'de {total}',
    benefitsValueUnlimited: 'Ilimitado',
    benefitsValueNa: 'Não se aplica',
    benefitsValueDiscount: '{n}% de desconto',
    benefitsTerms: 'Termos e condições',
    benefitsSeeAll: 'Conheça todos os benefícios',
    benefitsCardBanner: 'Seus benefícios também podem estar disponíveis pelos seus cartões de crédito cobrand.',
    benefitsCatUpgrades: 'Upgrades e melhorias',
    benefitsCatLounges: 'Salas VIP',
    benefitsCatPriority: 'Serviços prioritários',
    benefitsCatBaggage: 'Bagagem',
    benefitsCatSeating: 'Seleção de assentos',
    benefitsCatDefault: 'Outros benefícios',
  },
  en: {
    tabProgress: 'Progress',
    tabBenefits: 'Benefits',
    tabParamProgress: 'progress',
    tabParamBenefits: 'benefits',
    tabsAriaLabel: 'Progress and benefits',
    loadingLabel: 'Loading your information…',
    headerGreeting: 'Hi, {name}',
    headerGreetingNoName: 'Hi',
    headerExpiresLabel: 'Expires:',
    youHaveLabel: 'You have',
    milesUnit: 'miles',
    milesExpiryLabel: 'Expiration date',
    breadcrumbMyLifemiles: 'My Lifemiles',
    breadcrumbAccount: 'Lifemiles account',
    breadcrumbElite: 'Elite progress and benefits',
    progressTitle: 'My Elite progress {year}',
    progressPanelTitle: 'Elite progress in {year}',
    progressSubtitle: 'Meet the goals between January 1 and December 31 to advance to the next status.',
    progressSubtitleMaintain: 'Meet the goal between January 1 and December 31 to keep your status.',
    subTabDetail: 'Progress detail',
    subTabFull: 'Full view',
    goalTitle: 'Goal to reach {tier} status',
    goalTitleMaintain: 'Goal to keep {tier} status',
    goalBody: 'Complete {total} total qualifying miles, of which {avianca} miles must be with Avianca.',
    goalBodyAviancaOnly: 'Complete {avianca} qualifying miles with Avianca.',
    barTotalTitle: 'Total qualifying miles',
    barTotalHint: 'Includes your miles with Avianca',
    barAviancaTitle: 'Required miles with Avianca',
    remainingLabel: 'Remaining: {n} miles to {tier}',
    startLabel: 'Start',
    maintainMilestone: 'Keep {tier} in {year}',
    metGoalTitle: 'You met the goal to keep your status!',
    metGoalBody: 'Keep earning miles to reach the next status.',
    cenitTitle: 'Cenit Progress',
    cenitBody1M: 'Complete {goal} miles flying with avianca to earn all the benefits of {tier} status for life.',
    cenitBody2M: 'Complete {goal} miles flying with avianca to earn all the benefits of {tier} status for life.',
    cenitBarTitle: 'Total miles with Avianca',
    cenitDoneText: 'Enjoy {tier} for life!',
    cenitMilestone1M: '{tier} 1M',
    cenitMilestone2M: '{tier} 2M',
    alertStatusTitle: 'Congratulations! You are now {tier}',
    alertStatusBody: 'Access exclusive benefits and keep earning miles to reach your next status.',
    alertCenit1Title: 'Congratulations! You reached Cenit One Million',
    alertCenit1Body: 'You earned all the benefits of {tier} status for life.',
    alertCenit2Title: 'Congratulations! You reached Cenit Two Million',
    alertCenit2Body: 'You earned all the benefits of Diamond status for life.',
    howToEarnTitle: 'How to earn qualifying miles',
    howToEarnS1Title: 'With Avianca and GOL',
    howToEarnS1Items: 'Flights with Avianca.|Additional services with Avianca.|Flights with GOL airlines.',
    howToEarnS1Tip: 'You earn 1 qualifying mile for every mile earned',
    howToEarnS2Title: 'Partners and Lifemiles products',
    howToEarnS2Items: 'Flights with Star Alliance airlines.|Avianca Lifemiles credit and debit cards|Lifemiles plus|Partner merchants|Miles purchases|Points-to-miles conversion and miles transfers',
    howToEarnS2Tip: 'You earn 1 qualifying mile for every 2 miles earned',
    howToEarnS3Title: 'Bonuses and other miles',
    howToEarnS3Items: 'Elite bonus.|Other miles bonuses.',
    howToEarnS3Tip: 'You earn 1 qualifying mile for every 20 miles earned',
    newYearTitle: 'You are starting a new year',
    newYearBody: 'Each year, your progress is updated and you begin a new cycle in your Elite category.',
    newYearCta: 'Go to profile',
    newYearItem1: 'Your mile accumulation goals have been updated.',
    newYearItem2: 'Meet your goals between January 1 and December 31, {year}.',
    newYearItem3: 'Your mile counter starts at zero, but you keep the benefits of the status you reached last year.',
    newYearTertiary: 'Learn about the Lifemiles Elite program',
    newYearCloseLabel: 'Close',
    fabTitle: 'Accelerate your progress',
    fabBodyMultiply: 'Buy or multiply your miles to reach your goal faster.',
    fabBodyAvianca: 'Every flight brings you closer to your next elite status.',
    fabCtaBuy: 'Buy miles',
    fabCtaFly: 'Book a flight',
    fabAriaLabel: 'Open progress accelerator',
    cobrandSectionTitle: 'Benefits from your cards',
    cobrandPagination: '{n} of {m}',
    cobrandSeeMore: 'See all benefits',
    cobrandMilesLabel: 'Total earned in {year}',
    cobrandAdd: 'Add card',
    cobrandRequest: 'Request a new card',
    cobrandEmptyRequest: 'Request card',
    cobrandEmptyTitle: 'With your Avianca Lifemiles card, your benefits appear here',
    cobrandEmptyBody: 'Earn miles, access VIP lounges and earn more with every purchase.',
    lmPlusSectionTitle: 'Benefits from your Lifemiles Plus plan',
    lmPlusManage: 'Manage subscription',
    lmPlusActive: 'Active plan',
    lmPlusSuspended: 'Suspended plan',
    lmPlusSubscriptionLabel: 'Subscription',
    lmPlusMilesMonthLabel: 'Miles per month',
    lmPlusBenefits: 'If you pay your subscription with your Lifemiles card, we double up to **5,000 miles** from your purchases.|**Discount** on your flights at Lifemiles.com|**20% additional discount** on your subscription for being a Diamond member',
    lmPlusUpsell: 'Get more benefits with {plan} for only {price} more',
    lmPlusImprove: 'Upgrade plan',
    lmPlusActivate: 'Activate plan',
    lmPlusSuspendedNotice: 'Your subscription has been suspended; you can enjoy your benefits until {date}.',
    lmPlusBannerTitle: 'Subscribe to Lifemiles Plus',
    lmPlusBannerBody: 'Multiply your miles every month and get benefits to travel',
    lmPlusBannerCta: 'Subscribe now',
    benefitsCatalogTitle: 'Benefits for your {tier} status',
    benefitsValueCount: '{n} of {total}',
    benefitsValueCountSuffix: 'of {total}',
    benefitsValueUnlimited: 'Unlimited',
    benefitsValueNa: 'Not applicable',
    benefitsValueDiscount: '{n}% off',
    benefitsTerms: 'Terms and conditions',
    benefitsSeeAll: 'See all benefits',
    benefitsCardBanner: 'Your benefits may also be available through your cobrand credit cards.',
    benefitsCatUpgrades: 'Upgrades',
    benefitsCatLounges: 'VIP lounges',
    benefitsCatPriority: 'Priority services',
    benefitsCatBaggage: 'Baggage',
    benefitsCatSeating: 'Seat selection',
    benefitsCatDefault: 'Other benefits',
  },
  fr: {
    tabProgress: 'Progrès',
    tabBenefits: 'Avantages',
    tabParamProgress: 'progres',
    tabParamBenefits: 'avantages',
    tabsAriaLabel: 'Progression et avantages',
    loadingLabel: 'Chargement de vos informations…',
    headerGreeting: 'Bonjour, {name}',
    headerGreetingNoName: 'Bonjour',
    headerExpiresLabel: 'Expire :',
    youHaveLabel: 'Vous avez',
    milesUnit: 'miles',
    milesExpiryLabel: "Date d'expiration",
    breadcrumbMyLifemiles: 'Mon Lifemiles',
    breadcrumbAccount: 'Compte Lifemiles',
    breadcrumbElite: 'Progression Élite et avantages',
    progressTitle: 'Ma progression Élite {year}',
    progressPanelTitle: 'Progression élite en {year}',
    progressSubtitle: 'Atteignez les objectifs entre le 1er janvier et le 31 décembre pour passer au statut suivant.',
    progressSubtitleMaintain: "Atteignez l'objectif entre le 1er janvier et le 31 décembre pour conserver votre statut.",
    subTabDetail: 'Détail de la progression',
    subTabFull: 'Vue complète',
    goalTitle: 'Objectif pour atteindre le statut {tier}',
    goalTitleMaintain: 'Objectif pour conserver le statut {tier}',
    goalBody: 'Cumulez {total} milles qualifiables au total, dont {avianca} milles avec Avianca.',
    goalBodyAviancaOnly: 'Cumulez {avianca} milles qualifiables avec Avianca.',
    barTotalTitle: 'Milles qualifiables totaux',
    barTotalHint: 'Inclut vos milles avec Avianca',
    barAviancaTitle: 'Milles requis avec Avianca',
    remainingLabel: 'Il manque : {n} milles pour {tier}',
    startLabel: 'Départ',
    maintainMilestone: 'Conserver {tier} en {year}',
    metGoalTitle: "Vous avez atteint l'objectif pour conserver votre statut !",
    metGoalBody: 'Continuez à cumuler des milles pour atteindre le statut suivant.',
    cenitTitle: 'Progression Cenit',
    cenitBody1M: 'Cumulez {goal} milles en volant avec avianca pour profiter à vie de tous les avantages du statut {tier}.',
    cenitBody2M: 'Cumulez {goal} milles en volant avec avianca pour profiter à vie de tous les avantages du statut {tier}.',
    cenitBarTitle: 'Milles totaux avec Avianca',
    cenitDoneText: 'Profitez de {tier} à vie !',
    cenitMilestone1M: '{tier} 1M',
    cenitMilestone2M: '{tier} 2M',
    alertStatusTitle: 'Félicitations ! Vous êtes maintenant {tier}',
    alertStatusBody: 'Accédez à des avantages exclusifs et continuez à cumuler des milles pour atteindre votre prochain statut.',
    alertCenit1Title: 'Félicitations ! Vous avez atteint Cenit One Million',
    alertCenit1Body: 'Vous avez gagné à vie tous les avantages du statut {tier}.',
    alertCenit2Title: 'Félicitations ! Vous avez atteint Cenit Two Million',
    alertCenit2Body: 'Vous avez gagné à vie tous les avantages du statut Diamond.',
    howToEarnTitle: 'Comment gagner des milles qualifiables',
    howToEarnS1Title: 'Avec Avianca et GOL',
    howToEarnS1Items: 'Vols avec Avianca.|Services additionnels avec Avianca.|Vols avec les compagnies GOL.',
    howToEarnS1Tip: 'Vous gagnez 1 mille qualifiable pour chaque mille gagné',
    howToEarnS2Title: 'Partenaires et produits Lifemiles',
    howToEarnS2Items: 'Vols avec les compagnies Star Alliance.|Cartes de crédit et de débit Avianca Lifemiles|Lifemiles plus|Commerces partenaires|Achat de milles|Conversion de points en milles et transferts de milles',
    howToEarnS2Tip: 'Vous gagnez 1 mille qualifiable pour chaque 2 milles gagnés',
    howToEarnS3Title: 'Bonus et autres milles',
    howToEarnS3Items: 'Bonus élite.|Autres bonus de milles.',
    howToEarnS3Tip: 'Vous gagnez 1 mille qualifiable pour chaque 20 milles gagnés',
    newYearTitle: 'Vous commencez une nouvelle année',
    newYearBody: 'Chaque année, votre progression est mise à jour et vous commencez un nouveau cycle dans votre catégorie Elite.',
    newYearCta: 'Aller au profil',
    newYearItem1: 'Vos objectifs d’accumulation de milles ont été mis à jour.',
    newYearItem2: 'Atteignez vos objectifs entre le 1er janvier et le 31 décembre {year}.',
    newYearItem3: 'Votre compteur de milles repart de zéro, mais vous conservez les avantages du statut obtenu l’année dernière.',
    newYearTertiary: 'Découvrez le programme Elite de Lifemiles',
    newYearCloseLabel: 'Fermer',
    fabTitle: 'Accélérez votre progression',
    fabBodyMultiply: 'Achetez ou multipliez vos milles pour atteindre votre objectif plus vite.',
    fabBodyAvianca: 'Chaque vol vous rapproche de votre prochain statut élite.',
    fabCtaBuy: 'Acheter des milles',
    fabCtaFly: 'Réserver un vol',
    fabAriaLabel: 'Ouvrir l\'accélérateur de progression',
    cobrandSectionTitle: 'Avantages de vos cartes',
    cobrandPagination: '{n} sur {m}',
    cobrandSeeMore: 'Découvrez tous les avantages',
    cobrandMilesLabel: 'Total cumulé en {year}',
    cobrandAdd: 'Ajouter une carte',
    cobrandRequest: 'Demander une nouvelle carte',
    cobrandEmptyRequest: 'Demander une carte',
    cobrandEmptyTitle: 'Avec votre carte Avianca Lifemiles, vos avantages apparaissent ici',
    cobrandEmptyBody: 'Cumulez des milles, accédez aux salons VIP et cumulez plus à chaque achat.',
    lmPlusSectionTitle: 'Avantages de votre plan Lifemiles Plus',
    lmPlusManage: 'Gérer l\'abonnement',
    lmPlusActive: 'Plan actif',
    lmPlusSuspended: 'Plan suspendu',
    lmPlusSubscriptionLabel: 'Abonnement',
    lmPlusMilesMonthLabel: 'Milles par mois',
    lmPlusBenefits: 'Si vous payez votre abonnement avec votre carte Lifemiles, nous doublons jusqu\'à **5,000 milles** de vos achats.|**Remise** sur vos vols sur Lifemiles.com|**20% de remise additionnelle** sur votre abonnement en tant que membre Diamond',
    lmPlusUpsell: 'Obtenez plus d\'avantages avec le {plan} pour seulement {price} de plus',
    lmPlusImprove: 'Améliorer le plan',
    lmPlusActivate: 'Activer le plan',
    lmPlusSuspendedNotice: 'Votre abonnement a été suspendu ; vous pourrez profiter de vos avantages jusqu\'au {date}.',
    lmPlusBannerTitle: 'Abonnez-vous à Lifemiles Plus',
    lmPlusBannerBody: 'Multipliez vos milles chaque mois et recevez des avantages pour voyager',
    lmPlusBannerCta: 'Abonnez-vous maintenant',
    benefitsCatalogTitle: 'Avantages selon votre statut {tier}',
    benefitsValueCount: '{n} sur {total}',
    benefitsValueCountSuffix: 'sur {total}',
    benefitsValueUnlimited: 'Illimité',
    benefitsValueNa: 'Non applicable',
    benefitsValueDiscount: '{n}% de réduction',
    benefitsTerms: 'Conditions générales',
    benefitsSeeAll: 'Découvrez tous les avantages',
    benefitsCardBanner: 'Vos avantages peuvent aussi être disponibles via vos cartes de crédit cobrand.',
    benefitsCatUpgrades: 'Surclassements',
    benefitsCatLounges: 'Salons VIP',
    benefitsCatPriority: 'Services prioritaires',
    benefitsCatBaggage: 'Bagages',
    benefitsCatSeating: 'Sélection de sièges',
    benefitsCatDefault: 'Autres avantages',
  },
};

/** Fallback síncrono de los copies de la sección elite (primer render, antes del spreadsheet). */
export const getEliteLabelsSync = () => ({
  ...(ELITE_FALLBACKS[resolveLang()] || ELITE_FALLBACKS.pt),
});

const eliteCache = {};

/**
 * Carga los copies de la sección elite del idioma actual desde el spreadsheet
 * (por Key, mismo patrón que loadHeroLabels) y cae al fallback por key. Cacheado
 * por idioma.
 * @returns {Promise<Object>} mapa de copies (ver MEMBERS_ELITE_I18N_KEYS).
 */
export async function loadEliteLabels() {
  const lang = resolveLang();
  if (eliteCache[lang]) return eliteCache[lang];
  const fb = ELITE_FALLBACKS[lang] || ELITE_FALLBACKS.pt;
  let labels = { ...fb };
  try {
    const i18 = await fetchAEMData(lang);
    const rows = Array.isArray(i18?.data) ? i18.data : [];
    const read = (key, fallback) => rows.find((r) => r.Key === key)?.Text?.trim() || fallback;
    labels = Object.keys(MEMBERS_ELITE_I18N_KEYS).reduce((acc, k) => {
      acc[k] = read(MEMBERS_ELITE_I18N_KEYS[k], fb[k]);
      return acc;
    }, {});
  } catch (e) { /* fallback ya seteado */ }
  eliteCache[lang] = labels;
  return labels;
}

// ---------------------------------------------------------------------------
// Página "Gestión de mi cuenta" (1279360, shell + kit DS). Copies de la
// arquitectura general: labels de las 3 tabs (Datos | Pagos | Ajustes) + valores
// localizados del query param de deep-linking + aria-label del tablist + crumb
// activo del header + label del CTA "Mi Lifemiles". Mismo patrón que la sección
// elite: fallback síncrono por idioma + override de TEXTO autorado por Key.
//
// Los `tabParam*` son los valores del query param POR IDIOMA (SEO, URL-safe sin
// acentos): es `datos|pagos|ajustes` · en `data|payments|settings` · fr
// `donnees|paiements|parametres` · pt `dados|pagamentos|configuracoes`.
// `paramToTab` (members-account-tabs.logic.js) acepta cualquier idioma.
// Autoría: filas `members.account.*` (Key → Text) en cada spreadsheet.
// ---------------------------------------------------------------------------
export const MEMBERS_ACCOUNT_I18N_KEYS = {
  tabData: 'members.account.tab.data',
  tabPayments: 'members.account.tab.payments',
  tabSettings: 'members.account.tab.settings',
  tabParamData: 'members.account.tabParam.data',
  tabParamPayments: 'members.account.tabParam.payments',
  tabParamSettings: 'members.account.tabParam.settings',
  tabsAriaLabel: 'members.account.tabs.ariaLabel',
  loadingLabel: 'members.account.loading',
  breadcrumbAccountActive: 'members.account.breadcrumb.active',
  headerCtaLabel: 'members.account.header.cta',
  // Tab Wallet (1279362) — módulo Métodos de pago.
  walletPaymentsTitle: 'members.account.wallet.payments.title',
  walletSavedCardsTitle: 'members.account.wallet.savedCards.title',
  walletCardNumberLabel: 'members.account.wallet.card.number',
  walletCardCurrencyLabel: 'members.account.wallet.card.currency',
  walletCobrandChip: 'members.account.wallet.card.cobrandChip',
  walletManageCta: 'members.account.wallet.cta.manage',
  walletRequestCta: 'members.account.wallet.cta.request',
  walletEmptyTitle: 'members.account.wallet.empty.title',
  walletEmptyBody: 'members.account.wallet.empty.body',
  // Tab Wallet — módulo AV Credits.
  avCreditsTitle: 'members.account.avcredits.title',
  avCreditsNumberLabel: 'members.account.avcredits.number',
  avCreditsTypeLabel: 'members.account.avcredits.type',
  avCreditsStateLabel: 'members.account.avcredits.state',
  avCreditsHolderLabel: 'members.account.avcredits.holder',
  avCreditsIssueDateLabel: 'members.account.avcredits.issueDate',
  avCreditsExpiryDateLabel: 'members.account.avcredits.expiryDate',
  avCreditsInitialBalanceLabel: 'members.account.avcredits.initialBalance',
  avCreditsCurrentBalanceLabel: 'members.account.avcredits.currentBalance',
  avCreditsStateActive: 'members.account.avcredits.state.active',
  avCreditsStateNoBalance: 'members.account.avcredits.state.noBalance',
  avCreditsStateCancelled: 'members.account.avcredits.state.cancelled',
  avCreditsMovementsCta: 'members.account.avcredits.cta.movements',
  avCreditsPagination: 'members.account.avcredits.pagination',
  avCreditsCardName: 'members.account.avcredits.cardName',
  // Tab Wallet — módulo Lifemiles Plus (extensiones sobre las keys elite lmPlus*).
  lmPlusPaymentLabel: 'members.account.wallet.lmplus.paymentLabel',
  walletLmPlusActiveUntil: 'members.account.wallet.lmplus.activeUntil',
  walletLmPlusRenewCta: 'members.account.wallet.lmplus.renewCta',
  // === Tab Datos (1279361) — namespace grande de la tab de datos personales ===
  // Banner de completitud (donut + checklist)
  completionIncompleteTitle: 'members.account.data.completion.incompleteTitle',
  completionPending: 'members.account.data.completion.pending',
  completionCompleteTitle: 'members.account.data.completion.completeTitle',
  completionCompleteBody: 'members.account.data.completion.completeBody',
  completionDonutAria: 'members.account.data.completion.donutAria',
  completionDismissAria: 'members.account.data.completion.dismissAria',
  // Paneles y secciones (títulos)
  panelMyProfile: 'members.account.data.panel.myProfile',
  panelPersonalData: 'members.account.data.panel.personalData',
  panelDocuments: 'members.account.data.panel.documents',
  panelCompanions: 'members.account.data.panel.companions',
  sectionPersonal: 'members.account.data.section.personal',
  sectionContact: 'members.account.data.section.contact',
  sectionEmergency: 'members.account.data.section.emergency',
  // Chip de estado por sección (StatusProfileChip incomplete)
  statusIncomplete: 'members.account.data.status.incomplete',
  // Campos (labels)
  fieldGender: 'members.account.data.field.gender',
  fieldFullName: 'members.account.data.field.fullName',
  fieldFirstName: 'members.account.data.field.firstName',
  fieldLastName: 'members.account.data.field.lastName',
  fieldDateOfBirth: 'members.account.data.field.dateOfBirth',
  fieldCountry: 'members.account.data.field.country',
  fieldCity: 'members.account.data.field.city',
  fieldAddress: 'members.account.data.field.address',
  fieldEmail: 'members.account.data.field.email',
  fieldPrefix: 'members.account.data.field.prefix',
  fieldPhone: 'members.account.data.field.phone',
  fieldEmergencyName: 'members.account.data.field.emergencyName',
  fieldDocType: 'members.account.data.field.docType',
  fieldDocNumber: 'members.account.data.field.docNumber',
  fieldDocNationality: 'members.account.data.field.docNationality',
  fieldDocExpiry: 'members.account.data.field.docExpiry',
  fieldCompanionLmNumber: 'members.account.data.field.companionLmNumber',
  // Opciones de género
  genderMale: 'members.account.data.gender.male',
  genderFemale: 'members.account.data.gender.female',
  genderOther: 'members.account.data.gender.other',
  // Tipos de documento
  docTypePassport: 'members.account.data.doc.passport',
  docTypeId: 'members.account.data.doc.id',
  // Errores / placeholders
  errorGeneric: 'members.account.data.error.generic',
  comingSoon: 'members.account.comingSoon',
  errorEmail: 'members.account.data.error.email',
  errorPhone: 'members.account.data.error.phone',
  errorDatePast: 'members.account.data.error.datePast',
  // Documentos de viaje
  docTypeNotEditable: 'members.account.data.doc.notEditable',
  docAdd: 'members.account.data.doc.add',
  docExpiryUnavailable: 'members.account.data.doc.expiryUnavailable',
  docEmptyTitle: 'members.account.data.doc.emptyTitle',
  docEmptyBody: 'members.account.data.doc.emptyBody',
  // Acompañantes frecuentes
  companionsEmptyTitle: 'members.account.data.companions.emptyTitle',
  companionsEmptyBody: 'members.account.data.companions.emptyBody',
  companionsAdd: 'members.account.data.companions.add',
  ageInfant: 'members.account.data.age.infant',
  ageChild: 'members.account.data.age.child',
  ageYoung: 'members.account.data.age.young',
  ageAdult: 'members.account.data.age.adult',
  companionRemoveTitle: 'members.account.data.companions.removeTitle',
  companionRemoveBody: 'members.account.data.companions.removeBody',
  companionRemoveConfirm: 'members.account.data.companions.removeConfirm',
  companionRemoveCancel: 'members.account.data.companions.removeCancel',
  companionErrorTitle: 'members.account.data.companions.errorTitle',
  companionErrorBody: 'members.account.data.companions.errorBody',
  companionErrorRetry: 'members.account.data.companions.errorRetry',
  companionMaxReached: 'members.account.data.companions.maxReached',
  companionsLoadError: 'members.account.data.companions.loadError',
  // Toasts
  toastSaved: 'members.account.data.toast.saved',
  toastDeleted: 'members.account.data.toast.deleted',
  toastDeleteError: 'members.account.data.toast.deleteError',
  // Botones de edición
  btnEdit: 'members.account.data.btn.edit',
  btnCancel: 'members.account.data.btn.cancel',
  btnSave: 'members.account.data.btn.save',
  btnSaving: 'members.account.data.btn.saving',
  btnDeleting: 'members.account.data.btn.deleting',
  // Nombres de mes (pipe-split) para el InlineDateField
  monthsList: 'members.account.data.monthsList',
  // Card de suscripción LM+ (1279362, Entrega 4 — LmPlusSubscriptionCard).
  walletLmPlusSectionTitle: 'members.account.wallet.lmplus.sectionTitle',
  walletLmPlusCardTitle: 'members.account.wallet.lmplus.cardTitle',
  walletLmPlusSubDateLabel: 'members.account.wallet.lmplus.subDate',
  walletLmPlusSubTimeLabel: 'members.account.wallet.lmplus.subTime',
  walletLmPlusNextChargeLabel: 'members.account.wallet.lmplus.nextCharge',
  walletLmPlusActiveUntilLabel: 'members.account.wallet.lmplus.activeUntilLabel',
  walletLmPlusPlanStateLabel: 'members.account.wallet.lmplus.planState',
  walletLmPlusStateActive: 'members.account.wallet.lmplus.stateActive',
  walletLmPlusStateSuspended: 'members.account.wallet.lmplus.stateSuspended',
  walletLmPlusPaymentSummaryTitle: 'members.account.wallet.lmplus.paymentSummary',
  walletLmPlusValueLabel: 'members.account.wallet.lmplus.value',
  walletLmPlusFrequencyLabel: 'members.account.wallet.lmplus.frequency',
  walletLmPlusPromoText: 'members.account.wallet.lmplus.promoText',
  walletLmPlusEditPaymentCta: 'members.account.wallet.lmplus.editPaymentCta',
  walletLmPlusCancelCta: 'members.account.wallet.lmplus.cancelCta',
  walletLmPlusUpgradeCta: 'members.account.wallet.lmplus.upgradeCta',
  // === Tab Ajustes y privacidad (1279363) ===
  // Bloque "Configuraciones de seguridad" (contraseña / PIN / método) + bloque
  // "Notificaciones y privacidad" (opt-ins con Switch). Copies con links inline
  // teal (§D) sanitizados por el consumidor. `statusIncomplete`/`btnEdit`/
  // `btnCancel`/`btnSave`/`btnSaving` se REUSAN del namespace de Datos.
  settingsSecurityTitle: 'members.account.settings.security.title',
  settingsPrivacyTitle: 'members.account.settings.privacy.title',
  securityPasswordTitle: 'members.account.settings.security.password.title',
  securityPasswordDesc: 'members.account.settings.security.password.desc',
  securityPasswordCurrent: 'members.account.settings.security.password.current',
  securityPasswordNew: 'members.account.settings.security.password.new',
  securityPinTitle: 'members.account.settings.security.pin.title',
  securityPinDesc: 'members.account.settings.security.pin.desc',
  securityPinField: 'members.account.settings.security.pin.field',
  securityMethodTitle: 'members.account.settings.security.method.title',
  securityMethodDesc: 'members.account.settings.security.method.desc',
  securityMethodField: 'members.account.settings.security.method.field',
  methodSms: 'members.account.settings.method.sms',
  methodEmail: 'members.account.settings.method.email',
  methodAuthenticator: 'members.account.settings.method.authenticator',
  errorPasswordWeak: 'members.account.settings.error.passwordWeak',
  optInPromotionsTitle: 'members.account.settings.optin.promotions.title',
  optInPromotionsCopy: 'members.account.settings.optin.promotions.copy',
  optInAccountTitle: 'members.account.settings.optin.account.title',
  optInAccountCopy: 'members.account.settings.optin.account.copy',
  optInPartnersTitle: 'members.account.settings.optin.partners.title',
  optInPartnersCopy: 'members.account.settings.optin.partners.copy',
  privacyPolicyLinkLabel: 'members.account.settings.privacy.policyLink',
  editTooltip: 'members.account.settings.editTooltip',
  deleteTooltip: 'members.account.settings.deleteTooltip',
};

const ACCOUNT_FALLBACKS = {
  es: {
    tabData: 'Datos',
    tabPayments: 'Wallet',
    tabSettings: 'Ajustes',
    tabParamData: 'datos',
    tabParamPayments: 'pagos',
    tabParamSettings: 'ajustes',
    tabsAriaLabel: 'Gestión de cuenta',
    loadingLabel: 'Cargando tu información…',
    breadcrumbAccountActive: 'Gestión de cuenta',
    headerCtaLabel: 'Mi Lifemiles',
    walletPaymentsTitle: 'Métodos de pago',
    walletSavedCardsTitle: 'Tarjetas guardadas',
    walletCardNumberLabel: 'Número de tarjeta',
    walletCardCurrencyLabel: 'Moneda de la tarjeta',
    walletCobrandChip: 'Tarjeta Avianca Lifemiles',
    walletManageCta: 'Gestionar métodos de pago',
    walletRequestCta: 'Solicitar nueva tarjeta',
    walletEmptyTitle: 'Aún no tienes tarjetas guardadas',
    walletEmptyBody: 'Agrega o solicita una tarjeta para gestionar tus pagos más rápido.',
    avCreditsTitle: 'Mis Avianca Credits',
    avCreditsNumberLabel: 'Número',
    avCreditsTypeLabel: 'Tipo',
    avCreditsStateLabel: 'Estado',
    avCreditsHolderLabel: 'Titular',
    avCreditsIssueDateLabel: 'Fecha de expedición',
    avCreditsExpiryDateLabel: 'Fecha de vencimiento',
    avCreditsInitialBalanceLabel: 'Saldo inicial',
    avCreditsCurrentBalanceLabel: 'Saldo actual',
    avCreditsStateActive: 'Activo',
    avCreditsStateNoBalance: 'Sin saldo',
    avCreditsStateCancelled: 'Cancelado',
    avCreditsMovementsCta: 'Consultar movimientos',
    avCreditsPagination: '{n} de {m}',
    avCreditsCardName: 'Avianca Credits',
    lmPlusPaymentLabel: 'Método de pago',
    walletLmPlusActiveUntil: 'Suscripción activa hasta {date}',
    walletLmPlusRenewCta: 'Renovar suscripción',
    completionIncompleteTitle: 'Completa tu perfil para una mejor experiencia',
    completionPending: '{n} pendientes',
    completionCompleteTitle: '¡Tu perfil está completo!',
    completionCompleteBody: 'Todo está listo para gestionar tu información y disfrutar una mejor experiencia.',
    completionDonutAria: 'Perfil completado al {percent}%',
    completionDismissAria: 'Cerrar',
    panelMyProfile: 'Mi perfil',
    panelPersonalData: 'Datos personales',
    panelDocuments: 'Documentos de viaje',
    panelCompanions: 'Acompañantes frecuentes',
    sectionPersonal: 'Datos personales',
    sectionContact: 'Información de contacto',
    sectionEmergency: 'Contacto de emergencia',
    statusIncomplete: 'Información incompleta',
    fieldGender: 'Género',
    fieldFullName: 'Nombre/Apellido',
    fieldFirstName: 'Nombre(s)',
    fieldLastName: 'Apellido(s)',
    fieldDateOfBirth: 'Fecha de nacimiento',
    fieldCountry: 'País de residencia',
    fieldCity: 'Ciudad',
    fieldAddress: 'Dirección',
    fieldEmail: 'Correo electrónico',
    fieldPrefix: 'Prefijo',
    fieldPhone: 'Teléfono',
    fieldEmergencyName: 'Nombre',
    fieldDocType: 'Tipo de documento',
    fieldDocNumber: 'Número de documento',
    fieldDocNationality: 'Nacionalidad',
    fieldDocExpiry: 'Fecha de expiración',
    fieldCompanionLmNumber: 'Número Lifemiles',
    genderMale: 'Masculino',
    genderFemale: 'Femenino',
    genderOther: 'Otro',
    docTypePassport: 'Pasaporte',
    docTypeId: 'Documento de identidad',
    errorGeneric: 'No pudimos cargar tu información. Vuelve a intentarlo en unos segundos.',
    comingSoon: 'Próximamente',
    errorEmail: 'Ingresa un correo electrónico válido',
    errorPhone: 'Ingresa un número entre 6 y 15 dígitos',
    errorDatePast: 'La fecha no puede ser pasada',
    docTypeNotEditable: 'Una vez añadidos, el tipo de documento no se puede cambiar, así que asegúrate de seleccionar el correcto.',
    docAdd: '+ Añadir documento de viaje',
    docExpiryUnavailable: 'No disponible',
    docEmptyTitle: 'Agrega tus documentos de viaje',
    docEmptyBody: 'Completa esta información para gestionar tu reserva más rápido.',
    companionsEmptyTitle: 'Agrega tus acompañantes de viaje frecuentes',
    companionsEmptyBody: 'Registra su información para agilizar tus próximas reservas.',
    companionsAdd: '+ Añadir compañero frecuente',
    ageInfant: 'Infante',
    ageChild: 'Niño',
    ageYoung: 'Joven',
    ageAdult: 'Adulto',
    companionRemoveTitle: '¿Eliminar acompañante?',
    companionRemoveBody: 'Esta acción no se puede deshacer.',
    companionRemoveConfirm: 'Sí, elimínalo',
    companionRemoveCancel: 'Cancelar',
    companionErrorTitle: 'No encontramos este número de Lifemiles',
    companionErrorBody: 'Verifica el número e inténtalo nuevamente.',
    companionErrorRetry: 'Intentar nuevamente',
    companionMaxReached: 'Alcanzaste el máximo de acompañantes.',
    companionsLoadError: 'No pudimos cargar tus acompañantes frecuentes. Inténtalo de nuevo más tarde.',
    toastSaved: 'Cambios guardados',
    toastDeleted: 'Acompañante eliminado',
    toastDeleteError: 'No pudimos eliminar el acompañante',
    btnEdit: 'Editar',
    btnCancel: 'Cancelar',
    btnSave: 'Guardar',
    btnSaving: 'Guardando',
    btnDeleting: 'Eliminando',
    monthsList: 'Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre',
    walletLmPlusSectionTitle: 'Suscripción a Lifemiles Plus',
    walletLmPlusCardTitle: 'Lifemiles Plus: {plan}',
    walletLmPlusSubDateLabel: 'Fecha de suscripción',
    walletLmPlusSubTimeLabel: 'Tiempo suscrito',
    walletLmPlusNextChargeLabel: 'Próxima fecha de cobro',
    walletLmPlusActiveUntilLabel: 'Suscripción activa hasta',
    walletLmPlusPlanStateLabel: 'Estado del plan',
    walletLmPlusStateActive: 'Activo',
    walletLmPlusStateSuspended: 'Suspendido',
    walletLmPlusPaymentSummaryTitle: 'Resumen de pago',
    walletLmPlusValueLabel: 'Valor de la suscripción',
    walletLmPlusFrequencyLabel: 'Pago',
    walletLmPlusPromoText: '*Al pagar tu suscripción con tu tarjeta de crédito Avianca Lifemiles puedes duplicar hasta 400 millas de tus compras.',
    walletLmPlusEditPaymentCta: 'Editar método de pago',
    walletLmPlusCancelCta: 'Cancelar suscripción',
    walletLmPlusUpgradeCta: 'Mejorar suscripción',
    settingsSecurityTitle: 'Configuraciones de seguridad',
    settingsPrivacyTitle: 'Notificaciones y privacidad',
    securityPasswordTitle: 'Contraseña',
    securityPasswordDesc: 'Protege tu cuenta y accede de forma segura',
    securityPasswordCurrent: 'Contraseña actual',
    securityPasswordNew: 'Nueva contraseña',
    securityPinTitle: 'PIN de redención',
    securityPinDesc: 'Confirma tus transacciones y el uso de tus millas',
    securityPinField: 'PIN',
    securityMethodTitle: 'Método de verificación',
    securityMethodDesc: 'Elige cómo confirmar tu identidad al iniciar sesión o realizar cambios',
    securityMethodField: 'Método',
    methodSms: 'SMS',
    methodEmail: 'Correo electrónico',
    methodAuthenticator: 'Microsoft Authenticator',
    errorPasswordWeak: 'La contraseña debe tener al menos 8 caracteres',
    optInPromotionsTitle: 'Promociones y ofertas',
    optInPromotionsCopy: 'Recibe promociones, ofertas y novedades de Avianca por correo electrónico y otros canales.',
    optInAccountTitle: 'Notificaciones de la cuenta',
    optInAccountCopy: 'Recibe alertas sobre tu cuenta, tus millas y el estado de tus transacciones.',
    optInPartnersTitle: 'Comunicaciones de aliados',
    optInPartnersCopy: 'Autorizo el tratamiento de mis datos por aliados comerciales según la <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.',
    privacyPolicyLinkLabel: 'Política de privacidad',
    editTooltip: 'Editar',
    deleteTooltip: 'Eliminar',
  },
  pt: {
    tabData: 'Dados',
    tabPayments: 'Wallet',
    tabSettings: 'Configurações',
    tabParamData: 'dados',
    tabParamPayments: 'pagamentos',
    tabParamSettings: 'configuracoes',
    tabsAriaLabel: 'Gestão da conta',
    loadingLabel: 'Carregando suas informações…',
    breadcrumbAccountActive: 'Gestão da conta',
    headerCtaLabel: 'Meu Lifemiles',
    walletPaymentsTitle: 'Métodos de pagamento',
    walletSavedCardsTitle: 'Cartões salvos',
    walletCardNumberLabel: 'Número do cartão',
    walletCardCurrencyLabel: 'Moeda do cartão',
    walletCobrandChip: 'Cartão Avianca Lifemiles',
    walletManageCta: 'Gerenciar métodos de pagamento',
    walletRequestCta: 'Solicitar novo cartão',
    walletEmptyTitle: 'Você ainda não tem cartões salvos',
    walletEmptyBody: 'Adicione ou solicite um cartão para gerenciar seus pagamentos com mais rapidez.',
    avCreditsTitle: 'Meus Avianca Credits',
    avCreditsNumberLabel: 'Número',
    avCreditsTypeLabel: 'Tipo',
    avCreditsStateLabel: 'Estado',
    avCreditsHolderLabel: 'Titular',
    avCreditsIssueDateLabel: 'Data de emissão',
    avCreditsExpiryDateLabel: 'Data de vencimento',
    avCreditsInitialBalanceLabel: 'Saldo inicial',
    avCreditsCurrentBalanceLabel: 'Saldo atual',
    avCreditsStateActive: 'Ativo',
    avCreditsStateNoBalance: 'Sem saldo',
    avCreditsStateCancelled: 'Cancelado',
    avCreditsMovementsCta: 'Consultar movimentações',
    avCreditsPagination: '{n} de {m}',
    avCreditsCardName: 'Avianca Credits',
    lmPlusPaymentLabel: 'Método de pagamento',
    walletLmPlusActiveUntil: 'Assinatura ativa até {date}',
    walletLmPlusRenewCta: 'Renovar assinatura',
    completionIncompleteTitle: 'Complete seu perfil para uma melhor experiência',
    completionPending: '{n} pendentes',
    completionCompleteTitle: 'Seu perfil está completo!',
    completionCompleteBody: 'Tudo está pronto para gerenciar suas informações e desfrutar de uma melhor experiência.',
    completionDonutAria: 'Perfil concluído em {percent}%',
    completionDismissAria: 'Fechar',
    panelMyProfile: 'Meu perfil',
    panelPersonalData: 'Dados pessoais',
    panelDocuments: 'Documentos de viagem',
    panelCompanions: 'Acompanhantes frequentes',
    sectionPersonal: 'Dados pessoais',
    sectionContact: 'Informações de contato',
    sectionEmergency: 'Contato de emergência',
    statusIncomplete: 'Informação incompleta',
    fieldGender: 'Gênero',
    fieldFullName: 'Nome/Sobrenome',
    fieldFirstName: 'Nome(s)',
    fieldLastName: 'Sobrenome(s)',
    fieldDateOfBirth: 'Data de nascimento',
    fieldCountry: 'País de residência',
    fieldCity: 'Cidade',
    fieldAddress: 'Endereço',
    fieldEmail: 'E-mail',
    fieldPrefix: 'Prefixo',
    fieldPhone: 'Telefone',
    fieldEmergencyName: 'Nome',
    fieldDocType: 'Tipo de documento',
    fieldDocNumber: 'Número do documento',
    fieldDocNationality: 'Nacionalidade',
    fieldDocExpiry: 'Data de expiração',
    fieldCompanionLmNumber: 'Número Lifemiles',
    genderMale: 'Masculino',
    genderFemale: 'Feminino',
    genderOther: 'Outro',
    docTypePassport: 'Passaporte',
    docTypeId: 'Documento de identidade',
    errorGeneric: 'Não foi possível carregar suas informações. Tente novamente em alguns segundos.',
    comingSoon: 'Em breve',
    errorEmail: 'Insira um e-mail válido',
    errorPhone: 'Insira um número entre 6 e 15 dígitos',
    errorDatePast: 'A data não pode ser passada',
    docTypeNotEditable: 'Uma vez adicionados, o tipo de documento não pode ser alterado, então certifique-se de selecionar o correto.',
    docAdd: '+ Adicionar documento de viagem',
    docExpiryUnavailable: 'Indisponível',
    docEmptyTitle: 'Adicione seus documentos de viagem',
    docEmptyBody: 'Complete estas informações para gerenciar sua reserva mais rápido.',
    companionsEmptyTitle: 'Adicione seus acompanhantes de viagem frequentes',
    companionsEmptyBody: 'Registre as informações deles para agilizar suas próximas reservas.',
    companionsAdd: '+ Adicionar acompanhante frequente',
    ageInfant: 'Bebê',
    ageChild: 'Criança',
    ageYoung: 'Jovem',
    ageAdult: 'Adulto',
    companionRemoveTitle: 'Excluir acompanhante?',
    companionRemoveBody: 'Esta ação não pode ser desfeita.',
    companionRemoveConfirm: 'Sim, excluir',
    companionRemoveCancel: 'Cancelar',
    companionErrorTitle: 'Não encontramos este número Lifemiles',
    companionErrorBody: 'Verifique o número e tente novamente.',
    companionErrorRetry: 'Tentar novamente',
    companionMaxReached: 'Você atingiu o máximo de acompanhantes.',
    companionsLoadError: 'Não foi possível carregar seus acompanhantes frequentes. Tente novamente mais tarde.',
    toastSaved: 'Alterações salvas',
    toastDeleted: 'Acompanhante excluído',
    toastDeleteError: 'Não foi possível excluir o acompanhante',
    btnEdit: 'Editar',
    btnCancel: 'Cancelar',
    btnSave: 'Salvar',
    btnSaving: 'Salvando',
    btnDeleting: 'Excluindo',
    monthsList: 'Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro',
    walletLmPlusSectionTitle: 'Assinatura Lifemiles Plus',
    walletLmPlusCardTitle: 'Lifemiles Plus: {plan}',
    walletLmPlusSubDateLabel: 'Data de assinatura',
    walletLmPlusSubTimeLabel: 'Tempo de assinatura',
    walletLmPlusNextChargeLabel: 'Próxima data de cobrança',
    walletLmPlusActiveUntilLabel: 'Assinatura ativa até',
    walletLmPlusPlanStateLabel: 'Estado do plano',
    walletLmPlusStateActive: 'Ativo',
    walletLmPlusStateSuspended: 'Suspenso',
    walletLmPlusPaymentSummaryTitle: 'Resumo de pagamento',
    walletLmPlusValueLabel: 'Valor da assinatura',
    walletLmPlusFrequencyLabel: 'Pagamento',
    walletLmPlusPromoText: '*Ao pagar sua assinatura com seu cartão de crédito Avianca Lifemiles, você pode duplicar até 400 milhas de suas compras.',
    walletLmPlusEditPaymentCta: 'Editar método de pagamento',
    walletLmPlusCancelCta: 'Cancelar assinatura',
    walletLmPlusUpgradeCta: 'Melhorar assinatura',
    settingsSecurityTitle: 'Configurações de segurança',
    settingsPrivacyTitle: 'Notificações e privacidade',
    securityPasswordTitle: 'Senha',
    securityPasswordDesc: 'Proteja sua conta e acesse com segurança',
    securityPasswordCurrent: 'Senha atual',
    securityPasswordNew: 'Nova senha',
    securityPinTitle: 'PIN de resgate',
    securityPinDesc: 'Confirme suas transações e o uso das suas milhas',
    securityPinField: 'PIN',
    securityMethodTitle: 'Método de verificação',
    securityMethodDesc: 'Escolha como confirmar sua identidade ao iniciar sessão ou fazer alterações',
    securityMethodField: 'Método',
    methodSms: 'SMS',
    methodEmail: 'E-mail',
    methodAuthenticator: 'Microsoft Authenticator',
    errorPasswordWeak: 'A senha deve ter pelo menos 8 caracteres',
    optInPromotionsTitle: 'Promoções e ofertas',
    optInPromotionsCopy: 'Receba promoções, ofertas e novidades da Avianca por e-mail e outros canais.',
    optInAccountTitle: 'Notificações da conta',
    optInAccountCopy: 'Receba alertas sobre sua conta, suas milhas e o status das suas transações.',
    optInPartnersTitle: 'Comunicações de parceiros',
    optInPartnersCopy: 'Autorizo o tratamento dos meus dados por parceiros comerciais de acordo com a <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.',
    privacyPolicyLinkLabel: 'Política de Privacidade',
    editTooltip: 'Editar',
    deleteTooltip: 'Excluir',
  },
  en: {
    tabData: 'Data',
    tabPayments: 'Wallet',
    tabSettings: 'Settings',
    tabParamData: 'data',
    tabParamPayments: 'payments',
    tabParamSettings: 'settings',
    tabsAriaLabel: 'Account management',
    loadingLabel: 'Loading your information…',
    breadcrumbAccountActive: 'Account management',
    headerCtaLabel: 'My Lifemiles',
    walletPaymentsTitle: 'Payment methods',
    walletSavedCardsTitle: 'Saved cards',
    walletCardNumberLabel: 'Card number',
    walletCardCurrencyLabel: 'Card currency',
    walletCobrandChip: 'Avianca Lifemiles card',
    walletManageCta: 'Manage payment methods',
    walletRequestCta: 'Request new card',
    walletEmptyTitle: "You don't have saved cards yet",
    walletEmptyBody: 'Add or request a card to manage your payments faster.',
    avCreditsTitle: 'My Avianca Credits',
    avCreditsNumberLabel: 'Number',
    avCreditsTypeLabel: 'Type',
    avCreditsStateLabel: 'Status',
    avCreditsHolderLabel: 'Holder',
    avCreditsIssueDateLabel: 'Issue date',
    avCreditsExpiryDateLabel: 'Expiry date',
    avCreditsInitialBalanceLabel: 'Initial balance',
    avCreditsCurrentBalanceLabel: 'Current balance',
    avCreditsStateActive: 'Active',
    avCreditsStateNoBalance: 'No balance',
    avCreditsStateCancelled: 'Cancelled',
    avCreditsMovementsCta: 'View transactions',
    avCreditsPagination: '{n} of {m}',
    avCreditsCardName: 'Avianca Credits',
    lmPlusPaymentLabel: 'Payment method',
    walletLmPlusActiveUntil: 'Subscription active until {date}',
    walletLmPlusRenewCta: 'Renew subscription',
    completionIncompleteTitle: 'Complete your profile for a better experience',
    completionPending: '{n} pending',
    completionCompleteTitle: 'Your profile is complete!',
    completionCompleteBody: 'Everything is ready to manage your information and enjoy a better experience.',
    completionDonutAria: 'Profile {percent}% complete',
    completionDismissAria: 'Dismiss',
    panelMyProfile: 'My profile',
    panelPersonalData: 'Personal data',
    panelDocuments: 'Travel documents',
    panelCompanions: 'Frequent companions',
    sectionPersonal: 'Personal data',
    sectionContact: 'Contact information',
    sectionEmergency: 'Emergency contact',
    statusIncomplete: 'Incomplete information',
    fieldGender: 'Gender',
    fieldFullName: 'Name/Surname',
    fieldFirstName: 'First name(s)',
    fieldLastName: 'Last name(s)',
    fieldDateOfBirth: 'Date of birth',
    fieldCountry: 'Country of residence',
    fieldCity: 'City',
    fieldAddress: 'Address',
    fieldEmail: 'Email',
    fieldPrefix: 'Prefix',
    fieldPhone: 'Phone',
    fieldEmergencyName: 'Name',
    fieldDocType: 'Document type',
    fieldDocNumber: 'Document number',
    fieldDocNationality: 'Nationality',
    fieldDocExpiry: 'Expiration date',
    fieldCompanionLmNumber: 'Lifemiles number',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderOther: 'Other',
    docTypePassport: 'Passport',
    docTypeId: 'ID document',
    errorGeneric: "We couldn't load your information. Please try again in a few seconds.",
    comingSoon: 'Coming soon',
    errorEmail: 'Enter a valid email',
    errorPhone: 'Enter a number between 6 and 15 digits',
    errorDatePast: 'The date cannot be in the past',
    docTypeNotEditable: 'Once added, the document type cannot be changed, so be sure to select the correct one.',
    docAdd: '+ Add travel document',
    docExpiryUnavailable: 'Not available',
    docEmptyTitle: 'Add your travel documents',
    docEmptyBody: 'Complete this information to manage your booking faster.',
    companionsEmptyTitle: 'Add your frequent travel companions',
    companionsEmptyBody: 'Save their information to speed up your next bookings.',
    companionsAdd: '+ Add frequent companion',
    ageInfant: 'Infant',
    ageChild: 'Child',
    ageYoung: 'Youth',
    ageAdult: 'Adult',
    companionRemoveTitle: 'Delete companion?',
    companionRemoveBody: 'This action cannot be undone.',
    companionRemoveConfirm: 'Yes, delete',
    companionRemoveCancel: 'Cancel',
    companionErrorTitle: "We couldn't find this Lifemiles number",
    companionErrorBody: 'Check the number and try again.',
    companionErrorRetry: 'Try again',
    companionMaxReached: "You've reached the maximum number of companions.",
    companionsLoadError: "We couldn't load your frequent companions. Please try again later.",
    toastSaved: 'Changes saved',
    toastDeleted: 'Companion deleted',
    toastDeleteError: "We couldn't delete the companion",
    btnEdit: 'Edit',
    btnCancel: 'Cancel',
    btnSave: 'Save',
    btnSaving: 'Saving',
    btnDeleting: 'Deleting',
    monthsList: 'January|February|March|April|May|June|July|August|September|October|November|December',
    walletLmPlusSectionTitle: 'Lifemiles Plus subscription',
    walletLmPlusCardTitle: 'Lifemiles Plus: {plan}',
    walletLmPlusSubDateLabel: 'Subscription date',
    walletLmPlusSubTimeLabel: 'Time subscribed',
    walletLmPlusNextChargeLabel: 'Next billing date',
    walletLmPlusActiveUntilLabel: 'Subscription active until',
    walletLmPlusPlanStateLabel: 'Plan status',
    walletLmPlusStateActive: 'Active',
    walletLmPlusStateSuspended: 'Suspended',
    walletLmPlusPaymentSummaryTitle: 'Payment summary',
    walletLmPlusValueLabel: 'Subscription value',
    walletLmPlusFrequencyLabel: 'Billing',
    walletLmPlusPromoText: '*When you pay your subscription with your Avianca Lifemiles credit card, you can double up to 400 miles on your purchases.',
    walletLmPlusEditPaymentCta: 'Edit payment method',
    walletLmPlusCancelCta: 'Cancel subscription',
    walletLmPlusUpgradeCta: 'Upgrade subscription',
    settingsSecurityTitle: 'Security settings',
    settingsPrivacyTitle: 'Notifications and privacy',
    securityPasswordTitle: 'Password',
    securityPasswordDesc: 'Protect your account and sign in securely',
    securityPasswordCurrent: 'Current password',
    securityPasswordNew: 'New password',
    securityPinTitle: 'Redemption PIN',
    securityPinDesc: 'Confirm your transactions and the use of your miles',
    securityPinField: 'PIN',
    securityMethodTitle: 'Verification method',
    securityMethodDesc: 'Choose how to confirm your identity when signing in or making changes',
    securityMethodField: 'Method',
    methodSms: 'SMS',
    methodEmail: 'Email',
    methodAuthenticator: 'Microsoft Authenticator',
    errorPasswordWeak: 'Your password must be at least 8 characters',
    optInPromotionsTitle: 'Promotions and offers',
    optInPromotionsCopy: 'Receive Avianca promotions, offers and news by email and other channels.',
    optInAccountTitle: 'Account notifications',
    optInAccountCopy: 'Receive alerts about your account, your miles and the status of your transactions.',
    optInPartnersTitle: 'Partner communications',
    optInPartnersCopy: 'I authorize the processing of my data by commercial partners under the <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.',
    privacyPolicyLinkLabel: 'Privacy Policy',
    editTooltip: 'Edit',
    deleteTooltip: 'Delete',
  },
  fr: {
    tabData: 'Données',
    tabPayments: 'Wallet',
    tabSettings: 'Paramètres',
    tabParamData: 'donnees',
    tabParamPayments: 'paiements',
    tabParamSettings: 'parametres',
    tabsAriaLabel: 'Gestion du compte',
    loadingLabel: 'Chargement de vos informations…',
    breadcrumbAccountActive: 'Gestion du compte',
    headerCtaLabel: 'Mon Lifemiles',
    walletPaymentsTitle: 'Moyens de paiement',
    walletSavedCardsTitle: 'Cartes enregistrées',
    walletCardNumberLabel: 'Numéro de carte',
    walletCardCurrencyLabel: 'Devise de la carte',
    walletCobrandChip: 'Carte Avianca Lifemiles',
    walletManageCta: 'Gérer les moyens de paiement',
    walletRequestCta: 'Demander une nouvelle carte',
    walletEmptyTitle: "Vous n'avez pas encore de cartes enregistrées",
    walletEmptyBody: 'Ajoutez ou demandez une carte pour gérer vos paiements plus rapidement.',
    avCreditsTitle: 'Mes Avianca Credits',
    avCreditsNumberLabel: 'Numéro',
    avCreditsTypeLabel: 'Type',
    avCreditsStateLabel: 'Statut',
    avCreditsHolderLabel: 'Titulaire',
    avCreditsIssueDateLabel: "Date d'émission",
    avCreditsExpiryDateLabel: "Date d'expiration",
    avCreditsInitialBalanceLabel: 'Solde initial',
    avCreditsCurrentBalanceLabel: 'Solde actuel',
    avCreditsStateActive: 'Actif',
    avCreditsStateNoBalance: 'Sans solde',
    avCreditsStateCancelled: 'Annulé',
    avCreditsMovementsCta: 'Consulter les mouvements',
    avCreditsPagination: '{n} de {m}',
    avCreditsCardName: 'Avianca Credits',
    lmPlusPaymentLabel: 'Moyen de paiement',
    walletLmPlusActiveUntil: "Abonnement actif jusqu'au {date}",
    walletLmPlusRenewCta: "Renouveler l'abonnement",
    completionIncompleteTitle: 'Complétez votre profil pour une meilleure expérience',
    completionPending: '{n} en attente',
    completionCompleteTitle: 'Votre profil est complet !',
    completionCompleteBody: "Tout est prêt pour gérer vos informations et profiter d'une meilleure expérience.",
    completionDonutAria: 'Profil complété à {percent} %',
    completionDismissAria: 'Fermer',
    panelMyProfile: 'Mon profil',
    panelPersonalData: 'Données personnelles',
    panelDocuments: 'Documents de voyage',
    panelCompanions: 'Compagnons fréquents',
    sectionPersonal: 'Données personnelles',
    sectionContact: 'Coordonnées',
    sectionEmergency: "Contact d'urgence",
    statusIncomplete: 'Information incomplète',
    fieldGender: 'Genre',
    fieldFullName: 'Nom/Prénom',
    fieldFirstName: 'Prénom(s)',
    fieldLastName: 'Nom(s)',
    fieldDateOfBirth: 'Date de naissance',
    fieldCountry: 'Pays de résidence',
    fieldCity: 'Ville',
    fieldAddress: 'Adresse',
    fieldEmail: 'E-mail',
    fieldPrefix: 'Préfixe',
    fieldPhone: 'Téléphone',
    fieldEmergencyName: 'Nom',
    fieldDocType: 'Type de document',
    fieldDocNumber: 'Numéro de document',
    fieldDocNationality: 'Nationalité',
    fieldDocExpiry: "Date d'expiration",
    fieldCompanionLmNumber: 'Numéro Lifemiles',
    genderMale: 'Masculin',
    genderFemale: 'Féminin',
    genderOther: 'Autre',
    docTypePassport: 'Passeport',
    docTypeId: "Pièce d'identité",
    errorGeneric: 'Impossible de charger vos informations. Veuillez réessayer dans quelques secondes.',
    comingSoon: 'Bientôt disponible',
    errorEmail: 'Saisissez un e-mail valide',
    errorPhone: 'Saisissez un numéro entre 6 et 15 chiffres',
    errorDatePast: 'La date ne peut pas être dans le passé',
    docTypeNotEditable: 'Une fois ajouté, le type de document ne peut pas être modifié, veillez donc à sélectionner le bon.',
    docAdd: '+ Ajouter un document de voyage',
    docExpiryUnavailable: 'Non disponible',
    docEmptyTitle: 'Ajoutez vos documents de voyage',
    docEmptyBody: 'Complétez ces informations pour gérer votre réservation plus rapidement.',
    companionsEmptyTitle: 'Ajoutez vos compagnons de voyage fréquents',
    companionsEmptyBody: 'Enregistrez leurs informations pour accélérer vos prochaines réservations.',
    companionsAdd: '+ Ajouter un compagnon fréquent',
    ageInfant: 'Nourrisson',
    ageChild: 'Enfant',
    ageYoung: 'Jeune',
    ageAdult: 'Adulte',
    companionRemoveTitle: 'Supprimer le compagnon ?',
    companionRemoveBody: 'Cette action est irréversible.',
    companionRemoveConfirm: 'Oui, supprimer',
    companionRemoveCancel: 'Annuler',
    companionErrorTitle: "Nous n'avons pas trouvé ce numéro Lifemiles",
    companionErrorBody: 'Vérifiez le numéro et réessayez.',
    companionErrorRetry: 'Réessayer',
    companionMaxReached: 'Vous avez atteint le nombre maximum de compagnons.',
    companionsLoadError: "Nous n'avons pas pu charger vos accompagnateurs fréquents. Veuillez réessayer plus tard.",
    toastSaved: 'Modifications enregistrées',
    toastDeleted: 'Compagnon supprimé',
    toastDeleteError: "Nous n'avons pas pu supprimer le compagnon",
    btnEdit: 'Modifier',
    btnCancel: 'Annuler',
    btnSave: 'Enregistrer',
    btnSaving: 'Enregistrement',
    btnDeleting: 'Suppression',
    monthsList: 'Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre',
    walletLmPlusSectionTitle: 'Abonnement Lifemiles Plus',
    walletLmPlusCardTitle: 'Lifemiles Plus : {plan}',
    walletLmPlusSubDateLabel: "Date d'abonnement",
    walletLmPlusSubTimeLabel: "Durée d'abonnement",
    walletLmPlusNextChargeLabel: 'Prochaine date de prélèvement',
    walletLmPlusActiveUntilLabel: "Abonnement actif jusqu'au",
    walletLmPlusPlanStateLabel: 'Statut du plan',
    walletLmPlusStateActive: 'Actif',
    walletLmPlusStateSuspended: 'Suspendu',
    walletLmPlusPaymentSummaryTitle: 'Résumé du paiement',
    walletLmPlusValueLabel: "Valeur de l'abonnement",
    walletLmPlusFrequencyLabel: 'Paiement',
    walletLmPlusPromoText: '*En payant votre abonnement avec votre carte de crédit Avianca Lifemiles, vous pouvez doubler jusqu\'à 400 miles sur vos achats.',
    walletLmPlusEditPaymentCta: 'Modifier le moyen de paiement',
    walletLmPlusCancelCta: "Annuler l'abonnement",
    walletLmPlusUpgradeCta: "Améliorer l'abonnement",
    settingsSecurityTitle: 'Paramètres de sécurité',
    settingsPrivacyTitle: 'Notifications et confidentialité',
    securityPasswordTitle: 'Mot de passe',
    securityPasswordDesc: 'Protégez votre compte et connectez-vous en toute sécurité',
    securityPasswordCurrent: 'Mot de passe actuel',
    securityPasswordNew: 'Nouveau mot de passe',
    securityPinTitle: 'PIN de rachat',
    securityPinDesc: "Confirmez vos transactions et l'utilisation de vos miles",
    securityPinField: 'PIN',
    securityMethodTitle: 'Méthode de vérification',
    securityMethodDesc: 'Choisissez comment confirmer votre identité lors de la connexion ou de modifications',
    securityMethodField: 'Méthode',
    methodSms: 'SMS',
    methodEmail: 'E-mail',
    methodAuthenticator: 'Microsoft Authenticator',
    errorPasswordWeak: 'Le mot de passe doit comporter au moins 8 caractères',
    optInPromotionsTitle: 'Promotions et offres',
    optInPromotionsCopy: "Recevez les promotions, offres et actualités d'Avianca par e-mail et autres canaux.",
    optInAccountTitle: 'Notifications du compte',
    optInAccountCopy: "Recevez des alertes sur votre compte, vos miles et l'état de vos transactions.",
    optInPartnersTitle: 'Communications des partenaires',
    optInPartnersCopy: 'J\'autorise le traitement de mes données par les partenaires commerciaux conformément à la <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a>.',
    privacyPolicyLinkLabel: 'Politique de confidentialité',
    editTooltip: 'Modifier',
    deleteTooltip: 'Supprimer',
  },
};

/** Fallback síncrono de los copies de account (primer render, antes del spreadsheet). */
export const getAccountLabelsSync = () => ({
  ...(ACCOUNT_FALLBACKS[resolveLang()] || ACCOUNT_FALLBACKS.pt),
});

const accountCache = {};

/**
 * Carga los copies de la página account del idioma actual desde el spreadsheet
 * (por Key, mismo patrón que loadEliteLabels) y cae al fallback por key. Cacheado
 * por idioma.
 * @returns {Promise<Object>} mapa de copies (ver MEMBERS_ACCOUNT_I18N_KEYS).
 */
export async function loadAccountLabels() {
  const lang = resolveLang();
  if (accountCache[lang]) return accountCache[lang];
  const fb = ACCOUNT_FALLBACKS[lang] || ACCOUNT_FALLBACKS.pt;
  let labels = { ...fb };
  try {
    const i18 = await fetchAEMData(lang);
    const rows = Array.isArray(i18?.data) ? i18.data : [];
    const read = (key, fallback) => rows.find((r) => r.Key === key)?.Text?.trim() || fallback;
    labels = Object.keys(MEMBERS_ACCOUNT_I18N_KEYS).reduce((acc, k) => {
      acc[k] = read(MEMBERS_ACCOUNT_I18N_KEYS[k], fb[k]);
      return acc;
    }, {});
  } catch (e) { /* fallback ya seteado */ }
  accountCache[lang] = labels;
  return labels;
}
