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
