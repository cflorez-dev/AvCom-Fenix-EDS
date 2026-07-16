import { fetchAEMData } from '../../utils/aem-data.js';
import { getStoredLanguage } from '../header/language-country-selector.js';

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
