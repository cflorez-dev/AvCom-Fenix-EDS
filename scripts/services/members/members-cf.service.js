import { fetchAEMData } from '../../utils/aem-data.js';

/**
 * Members Config — Content Fragment service (1255303 + cross-PBI).
 *
 * Consume el CF `members-config` modelado por el equipo AEM, vía la persisted query
 * `getMembersConfig` contra AEM publish DIRECTO (decisión del usuario). La URL base sale
 * de environment.json (key `AV_MEMBERS_CF_URL`) con fallback a la URL publish del plan,
 * para no hardcodear el host en el bundle. Mismo patrón de lectura de env que
 * `hub-destination.service.js`.
 *
 * Fail-soft: cualquier error (4xx/5xx/timeout/locale sin fragmento) → `null`, y el caller
 * (`loadMembersConfig`) cae a los defaults de `APP_CONFIG`.
 */

// Fallback hardcodeado (constante) a la persisted query de AEM publish. Solo se usa si
// environment.json NO trae `AV_MEMBERS_CF_URL`. NO incluye el `;path=` (se arma por locale).
const PUBLISH_CF_URL = 'https://publish-p34631-e1321407.adobeaemcloud.com/graphql/execute.json/avianca/getMembersConfig';

// Path del CF por idioma. El segmento `{locale}` se reemplaza por es|en|pt|fr.
const CF_PATH_TEMPLATE = '/content/dam/avianca/content-fragments/members/{locale}/members-config';

/**
 * Resuelve la URL base de la persisted query desde environment.json (key `AV_MEMBERS_CF_URL`),
 * con fallback a la constante publish. environment.json es un spreadsheet ({data:[{Key,Text}]}).
 * @returns {Promise<string>}
 */
const resolveCfBaseUrl = async () => {
  try {
    const envData = await fetchAEMData('environment');
    const rows = Array.isArray(envData?.data) ? envData.data : [];
    const base = rows.find((r) => r.Key === 'AV_MEMBERS_CF_URL')?.Text?.trim();
    return base || PUBLISH_CF_URL;
  } catch (e) {
    return PUBLISH_CF_URL;
  }
};

/**
 * Trae el item del CF para un locale. Devuelve `data.membersConfigByPath.item` o `null`
 * ante cualquier error (fail-soft → el caller usa APP_CONFIG).
 * @param {string} locale es|en|pt|fr
 * @returns {Promise<Object|null>}
 */
export async function fetchMembersCF(locale) {
  try {
    const base = await resolveCfBaseUrl();
    const path = CF_PATH_TEMPLATE.replace('{locale}', locale);
    const url = `${base};path=${path}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.membersConfigByPath?.item || null;
  } catch (e) {
    return null;
  }
}

/**
 * Normaliza el `item` del CF al shape que YA consumen los servicios/UI de Members.
 * Solo emite las claves derivables del CF: las ausentes se omiten para que el merge
 * en `loadMembersConfig` deje ver el default de `APP_CONFIG` (fallback por campo).
 *
 * `logout` sale de `menuItems.find(isLogout)`. `tiers`/`modals` se devuelven como dict
 * por `key`. `menuItems` se filtra (no-logout) y se ordena por `sortOrder`. `body.html`
 * y `oneTap.tcText` se pasan como string HTML CRUDO — el render los sanitiza con
 * `sanitizeHTMLAsync` (XSS), nunca acá.
 *
 * @param {Object|null} item  `data.membersConfigByPath.item`
 * @returns {Object|null} shape parcial de la app, o `null` si no hay item.
 */
export function normalizeMembersCF(item) {
  if (!item) return null;

  const auth = item.authConfig || {};
  const tiersArr = Array.isArray(item.tiers) ? item.tiers : [];
  const menuArr = Array.isArray(item.menuItems) ? item.menuItems : [];
  const modalsArr = Array.isArray(item.modals) ? item.modals : [];

  const out = {};

  // authConfig → shape de la app (omitir undefined → APP_CONFIG queda como fallback).
  [
    'loginMode', 'loginReturnTo', 'loginReturnUrl', 'redirectAfterLogout', 'ssoEnabled',
    'sessionDurationSource', 'sessionMinutesOverride',
  ].forEach((k) => { if (auth[k] !== undefined) out[k] = auth[k]; });
  if (Array.isArray(auth.portalRoutes)) out.portalRoutes = auth.portalRoutes;
  if (Array.isArray(auth.portalExclude)) out.portalExclude = auth.portalExclude;

  // logout ← el menuItem marcado isLogout (1255584): { show, icon, redirectTo }.
  const logoutItem = menuArr.find((m) => m && m.isLogout);
  if (logoutItem) {
    out.logout = {
      show: logoutItem.visible,
      icon: logoutItem.icon,
      redirectTo: logoutItem.link || '',
    };
  }

  // oneTap (CU-282): solo claves presentes; el merge en loadMembersConfig completa con defaults.
  const oneTap = {};
  if (auth.oneTapEnabled !== undefined) oneTap.enabled = auth.oneTapEnabled;
  if (auth.oneTapFrequencyHours !== undefined) oneTap.frequencyHours = auth.oneTapFrequencyHours;
  if (Array.isArray(auth.oneTapCorporatePaths)) oneTap.corporatePaths = auth.oneTapCorporatePaths;
  if (auth.oneTapTcRequired !== undefined) oneTap.tcRequired = auth.oneTapTcRequired;
  if (auth.oneTapTcText?.html !== undefined) oneTap.tcText = auth.oneTapTcText.html;
  if (Object.keys(oneTap).length) out.oneTap = oneTap;

  // tiers (1255338): dict por key → { displayName, colorStart, colorEnd, textColor, icon, ... }.
  // Propagamos TODAS las claves visuales del modelo (incluidas las nuevas:
  // colorStartStop, gradientStop, gradientAngle, cardBackground, cardShadow,
  // progressBarFill, cardColor*Stop*, balanceCardBg, pill*, logoPrimary/Secondary)
  // porque `cfTierToTheme` las consume directamente. Las ausentes/null caen al
  // preset local en el helper. NO filtramos por null aquí (el helper hace `||`).
  const tiers = tiersArr.reduce((acc, t) => {
    if (t && t.key) {
      acc[t.key] = {
        key: t.key,
        displayName: t.displayName,
        // Gradient drawer/header (CF clásico)
        colorStart: t.colorStart,
        colorStartStop: t.colorStartStop,
        colorEnd: t.colorEnd,
        gradientStop: t.gradientStop,
        gradientAngle: t.gradientAngle,
        // Card (CF nuevo — alias específico para el membership card; hoy null en
        // todos los tiers en CF, el helper cae al preset). Si la intención del
        // autor es que `cardColor*` reemplacen a `colorStart/End` para el card,
        // el mapeo a `gradientFrom/To` debe actualizarse en `cfTierToTheme`.
        cardColorStart: t.cardColorStart,
        cardColorStartStop: t.cardColorStartStop,
        cardColorEnd: t.cardColorEnd,
        cardColorEndStop: t.cardColorEndStop,
        cardBackground: t.cardBackground,
        cardShadow: t.cardShadow,
        // Progress bar elite (CF nuevo)
        progressBarFill: t.progressBarFill,
        // Divisor vertical del MembersDataGrid (CF nuevo). Hex string.
        dividerColor: t.dividerColor,
        // Texto / paleta secundaria
        textColor: t.textColor,
        balanceCardBg: t.balanceCardBg,
        pillBg: t.pillBg,
        pillBorder: t.pillBorder,
        pillTextHover: t.pillTextHover,
        // Icono + logos del card (DAM refs → el helper resuelve _publishUrl)
        icon: t.icon,
        logoPrimary: t.logoPrimary,
        logoPrimaryAlt: t.logoPrimaryAlt,
        logoSecondary: t.logoSecondary,
        logoSecondaryAlt: t.logoSecondaryAlt,
        sortOrder: t.sortOrder,
      };
    }
    return acc;
  }, {});
  if (Object.keys(tiers).length) out.tiers = tiers;

  // menuItems (1255431): array no-logout, visibles o no (el render decide), por sortOrder.
  out.menuItems = menuArr
    .filter((m) => m && !m.isLogout)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((m) => ({
      key: m.key,
      label: m.label,
      icon: m.icon,
      link: m.link,
      linkType: m.linkType,
      visible: m.visible,
      sortOrder: m.sortOrder,
    }));

  // dashboardCards (1263921, "Bloque 4"): grid de cards de navegación del Dashboard.
  // ⚠️ SCHEMA DEL CF SIN CONFIRMAR (el sub-CF "Dashboard Card" aún no está modelado;
  // ver ESPEC-CF-DASHBOARD-CARDS.md). Mapeo DEFENSIVO, estilo del bloque `hero`:
  // leemos `item.dashboardCards` (nombre propuesto) o `item.cards` (fallback), y SOLO
  // si viene un array no vacío seteamos `out.cards`; si no, el caller cae a
  // `APP_CONFIG.cards` (defaults estructurales) + copies de members-i18n. NO filtramos
  // `visible` acá (el render del organism decide); solo ordenamos por sortOrder. El
  // `icon` es un STRING (ref al catálogo /icons/, como menuItems.icon), no imagen DAM.
  // ⚠️ Confirmar el nombre exacto del campo con el modeler antes de fijarlo.
  let cardsArr = [];
  if (Array.isArray(item.dashboardCards)) cardsArr = item.dashboardCards;
  else if (Array.isArray(item.cards)) cardsArr = item.cards;
  const cards = cardsArr
    .filter((c) => c && c.key)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((c) => {
      const card = {
        key: c.key,
        icon: c.icon,
        title: c.title,
        description: c.description,
        link: c.link,
        linkType: c.linkType,
        visible: c.visible,
        sortOrder: c.sortOrder,
      };
      // Variante especial "Actividad de millas" (1263921, CA10): si el CF marca
      // `type:'activity'` o la `key === 'activity'`, el organism renderiza el
      // molecule de acordeón + preview de transacciones. `activity.previewCount`
      // y `activity.defaultOpen` son editables desde AEM (schema pendiente —
      // mapeo defensivo). El propio servicio mockea las transacciones por ahora
      // (ver `members-activity.service.js`).
      if (c.type === 'activity' || c.key === 'activity') {
        card.type = 'activity';
        let previewCount;
        if (Number.isFinite(c.activityPreviewCount)) previewCount = c.activityPreviewCount;
        else if (Number.isFinite(c?.activity?.previewCount)) previewCount = c.activity.previewCount;
        let defaultOpen;
        if (typeof c.activityDefaultOpen === 'boolean') defaultOpen = c.activityDefaultOpen;
        else if (typeof c?.activity?.defaultOpen === 'boolean') defaultOpen = c.activity.defaultOpen;
        if (previewCount !== undefined || defaultOpen !== undefined) {
          card.activity = { previewCount, defaultOpen };
        }
      }
      // Badge de completitud de perfil (1263921, card `account`). Solo se proyecta
      // si el CF trae config de badge; las reglas (fields/threshold) las aplica el
      // organism contra `session.user.profileFields`. Los copies son por-locale (CF).
      if (c.badgeEnabled != null || Array.isArray(c.profileCompletenessFields)) {
        const fields = Array.isArray(c.profileCompletenessFields)
          ? c.profileCompletenessFields
          : undefined;
        const threshold = Number.isFinite(c.profileCompletenessThreshold)
          ? c.profileCompletenessThreshold
          : undefined;
        card.badge = {
          enabled: c.badgeEnabled !== false,
          fields,
          threshold,
          completeLabel: c.badgeCompleteLabel || undefined,
          incompleteLabel: c.badgeIncompleteLabel || undefined,
        };
      }
      return card;
    });
  if (cards.length) out.cards = cards;

  // modals (1255601): dict por key → descriptor crudo (body.html se sanitiza al render).
  const modals = modalsArr.reduce((acc, mo) => {
    if (mo && mo.key) acc[mo.key] = mo;
    return acc;
  }, {});
  if (Object.keys(modals).length) out.modals = modals;

  // hero (1263924): config ESTRUCTURAL del hero "Mi Lifemiles". ⚠️ SCHEMA DEL CF
  // SIN CONFIRMAR (gaps #8/#12). Mapeo defensivo: si el CF trae `hero`, proyectamos
  // solo las claves estructurales conocidas; las ausentes se OMITEN → el merge en
  // `loadMembersConfig` (mergeHeroConfig) deja ver el default de APP_CONFIG. Los
  // COPIES NO van acá (viven en members-i18n). Ajustar nombres al confirmar schema.
  const heroSrc = item.hero || null;
  // quickActions: el modelo del CF las tiene a NIVEL TOP (`item.quickActions`), NO
  // anidadas en `hero`. Fallback a `hero.quickActions` por compatibilidad.
  const qaSrc = (Array.isArray(item.quickActions) && item.quickActions)
    || (Array.isArray(heroSrc?.quickActions) && heroSrc.quickActions)
    || null;
  if (heroSrc || qaSrc) {
    const hero = {};
    const h = heroSrc || {};
    if (h.defaultState !== undefined) hero.defaultState = h.defaultState;
    if (h.borderAccentColor !== undefined) hero.borderAccentColor = h.borderAccentColor;
    if (h.toggleDurationMs !== undefined) hero.toggleDurationMs = h.toggleDurationMs;
    if (qaSrc) {
      hero.quickActions = qaSrc
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((q) => ({
          key: q.key,
          label: q.label,
          // `icon` = content-reference de imagen del DAM → resolvemos su `_publishUrl`
          // (igual que modales y logo). Si aún no hay imagen (ref vacía `{}`) o no es
          // string → `''` (el átomo degrada sin romper). Fallback: string tal cual (key
          // del átomo `Icon`).
          // eslint-disable-next-line no-underscore-dangle
          icon: q.icon?._publishUrl || (typeof q.icon === 'string' ? q.icon : ''),
          iconAlt: q.iconAlt,
          url: q.url,
          newTab: q.newTab,
          visible: q.visible,
          sortOrder: q.sortOrder,
        }));
    }
    if (Object.keys(hero).length) out.hero = hero;
  }

  // profile.quickActions (Dashboard / `/members/profile`, AVAEMF2P20-200): el CF
  // expone un campo CLON de `quickActions` llamado `quickActionsProfile` con la
  // botonera propia del dashboard (Datos personales / Seguridad / Preferencias /
  // Facturación). MISMO modelo `Members Quick Action` que el hero (idénticos
  // fields: key/label/icon[DAM]/iconAlt/url/newTab/visible/sortOrder) — por eso
  // reusamos la misma proyección. Fallback a `profileQuickActions` por si el
  // nombre del field difiere entre publish y modelo.
  const profileQaSrc = (Array.isArray(item.quickActionsProfile) && item.quickActionsProfile)
    || (Array.isArray(item.profileQuickActions) && item.profileQuickActions)
    || null;
  if (profileQaSrc) {
    out.profile = {
      quickActions: profileQaSrc
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((q) => ({
          key: q.key,
          label: q.label,
          // Mismo helper que en hero.quickActions: DAM ref → _publishUrl, string
          // → passthrough, vacío → '' (el átomo Icon degrada sin romper).
          // eslint-disable-next-line no-underscore-dangle
          icon: q.icon?._publishUrl || (typeof q.icon === 'string' ? q.icon : ''),
          iconAlt: q.iconAlt,
          url: q.url,
          newTab: q.newTab,
          visible: q.visible,
          sortOrder: q.sortOrder,
        })),
    };
  }

  // eliteGoals (1263924): metas del progreso elite POR TIER (umbrales + mapeo de qué
  // métrica de `qualified` alimenta cada barra). El API NO las trae → son del CF/PO.
  // Dict por `tierKey` (lowercase) para lookup O(1) desde session.service.
  const eliteGoalsArr = Array.isArray(item.eliteGoals) ? item.eliteGoals : [];
  const eliteGoals = eliteGoalsArr.reduce((acc, g) => {
    if (g && g.tierKey) {
      acc[String(g.tierKey).toLowerCase()] = {
        metaTotal: Number(g.metaTotal) || 0,
        metaAvianca: Number(g.metaAvianca) || 0,
        metricTotal: g.metricTotal,
        metricAvianca: g.metricAvianca,
      };
    }
    return acc;
  }, {});
  if (Object.keys(eliteGoals).length) out.eliteGoals = eliteGoals;

  return out;
}
