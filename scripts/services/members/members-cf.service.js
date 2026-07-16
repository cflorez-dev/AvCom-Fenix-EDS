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
        // Tokens de color de "Progreso Elite y beneficios" (1271692, Bloque 2).
        // Pass-through de los 10 campos del AC (el CF puede no tenerlos aún →
        // undefined → `getEliteTierTokens` cae a legacy/preset). Namespace propio:
        // NO pisan los campos legacy (colorStart/End, balanceCardBg, textColor)
        // que consume el hero de Mi Lifemiles.
        colorGradientStrongStart: t.colorGradientStrongStart,
        colorGradientStrongEnd: t.colorGradientStrongEnd,
        colorGradientSubtleStart: t.colorGradientSubtleStart,
        colorGradientSubtleEnd: t.colorGradientSubtleEnd,
        colorGradientDecorStart: t.colorGradientDecorStart,
        colorGradientDecorEnd: t.colorGradientDecorEnd,
        colorOverlay: t.colorOverlay,
        colorText: t.colorText,
        colorBorderAccent: t.colorBorderAccent,
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

  // eliteGoals v1 (1263924): ELIMINADO (T18, 2026-07-08). El hero de Mi Lifemiles
  // migró a `eliteGoalsV2` (región-aware, metas reales de Avianca). No queda ningún
  // consumidor de v1. La proyección de metas vive ahora en `eliteGoalsV2` (abajo).

  // --- Tab Progreso elite (1271699, paso 3). ⚠️ SCHEMA DEL CF PENDIENTE (espec
  // CF del lote para el TL) — mapeo DEFENSIVO estilo `hero`/`dashboardCards`:
  // cada clave se emite SOLO si el CF trae el dato; ausente → defaults de código
  // (members-config.js, tabla del AC). Número inválido/vacío se OMITE para que
  // el merge campo-a-campo deje ver el default.
  const toNum = (v) => {
    if (v === null || v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  // eliteGoalsV2[]: metas por tier DESTINO con dimensión de región (T16).
  // Campos por entrada (espec P3 confirmada): tierKey + metaTotalCol/metaTotalRow
  // + metaAviancaCol/metaAviancaRow → {totales:{col,row}, avianca:{col,row}}.
  const goalsV2Arr = Array.isArray(item.eliteGoalsV2) ? item.eliteGoalsV2 : [];
  const eliteGoalsV2 = goalsV2Arr.reduce((acc, g) => {
    if (!g || !g.tierKey) return acc;
    const pair = (col, row) => {
      const o = {};
      if (toNum(col) !== undefined) o.col = toNum(col);
      if (toNum(row) !== undefined) o.row = toNum(row);
      return Object.keys(o).length ? o : undefined;
    };
    const entry = {};
    const totales = pair(g.metaTotalCol, g.metaTotalRow);
    const avianca = pair(g.metaAviancaCol, g.metaAviancaRow);
    if (totales) entry.totales = totales;
    if (avianca) entry.avianca = avianca;
    if (Object.keys(entry).length) acc[String(g.tierKey).toLowerCase()] = entry;
    return acc;
  }, {});
  if (Object.keys(eliteGoalsV2).length) out.eliteGoalsV2 = eliteGoalsV2;

  // cenitConfig: umbrales del panel Cenit (AC bloque 7). Acepta objeto anidado
  // (`item.cenitConfig` {visibleFrom,oneGoal,twoGoal}) o campos planos
  // (`cenitVisibleFrom`/`cenitOneGoal`/`cenitTwoGoal`, nombres de la sección 5).
  const cc = item.cenitConfig || {};
  const cenitConfig = {};
  const ccVisibleFrom = toNum(cc.visibleFrom ?? item.cenitVisibleFrom);
  if (ccVisibleFrom !== undefined) cenitConfig.visibleFrom = ccVisibleFrom;
  const ccOneGoal = toNum(cc.oneGoal ?? item.cenitOneGoal);
  if (ccOneGoal !== undefined) cenitConfig.oneGoal = ccOneGoal;
  const ccTwoGoal = toNum(cc.twoGoal ?? item.cenitTwoGoal);
  if (ccTwoGoal !== undefined) cenitConfig.twoGoal = ccTwoGoal;
  if (Object.keys(cenitConfig).length) out.cenitConfig = cenitConfig;

  // eliteMetrics: qué métrica de `qualified[]` alimenta cada contador del panel.
  const em = item.eliteMetrics || {};
  const eliteMetrics = {};
  const emTotal = em.total || em.metricTotal || item.eliteMetricTotal;
  if (typeof emTotal === 'string' && emTotal) eliteMetrics.total = emTotal;
  const emAvianca = em.avianca || em.metricAvianca || item.eliteMetricAvianca;
  if (typeof emAvianca === 'string' && emAvianca) eliteMetrics.avianca = emAvianca;
  const emLifetime = em.lifetime || em.metricLifetime || item.eliteMetricLifetime;
  if (typeof emLifetime === 'string' && emLifetime) eliteMetrics.lifetime = emLifetime;
  if (Object.keys(eliteMetrics).length) out.eliteMetrics = eliteMetrics;

  // countryRegionMap[]: código de `countryOfResidence` (numérico interno LM) →
  // región de metas ('COL'/'EXCOL') (T16). Dict para lookup O(1).
  const crmArr = Array.isArray(item.countryRegionMap) ? item.countryRegionMap : [];
  const countryRegionMap = crmArr.reduce((acc, r) => {
    const code = r?.code ?? r?.countryCode ?? r?.key;
    const region = r?.region ?? r?.value;
    if (code != null && code !== '' && region) acc[String(code)] = String(region).toUpperCase();
    return acc;
  }, {});
  if (Object.keys(countryRegionMap).length) out.countryRegionMap = countryRegionMap;

  // Flags del tab Progreso (T10 dismiss configurable + toggle subtítulo + AC A5).
  // Acepta objeto `item.eliteProgress` o campos planos equivalentes.
  const ep = item.eliteProgress || {};
  const eliteProgress = {};
  const epPersist = ep.alertsPersistDismiss ?? item.alertsPersistDismiss;
  if (typeof epPersist === 'boolean') eliteProgress.alertsPersistDismiss = epPersist;
  const epSubtitle = ep.progressDescriptionVisible ?? item.progressDescriptionVisible;
  if (typeof epSubtitle === 'boolean') eliteProgress.progressDescriptionVisible = epSubtitle;
  // FAB gamification (1271694): flag de visibilidad; default false en el repo.
  const epFab = ep.fabEnabled ?? item.fabEnabled;
  if (typeof epFab === 'boolean') eliteProgress.fabEnabled = epFab;
  const epMaxTier = ep.howToEarnSections23MaxTier ?? item.howToEarnSections23MaxTier;
  if (typeof epMaxTier === 'string' && epMaxTier) {
    eliteProgress.howToEarnSections23MaxTier = epMaxTier;
  }
  // Íconos ilustrativos de las barras (CU-346): DAM ref → _publishUrl, o string
  // (key del átomo Icon). Mismo helper que hero.quickActions.
  // Íconos configurables (CU-346 barras + CU-349 secciones "Cómo ganar millas").
  // Fuente preferida: sub-CF `eliteIcons` (imagen-referencia DAM → _publishUrl);
  // fallback a campo en `eliteProgress` o plano, y a los defaults del repo en el
  // front. Se escriben en `eliteProgress` para no cambiar el shape del organism.
  const eiCF = item.eliteIcons || {};
  ['progressBarIconTotal', 'progressBarIconAvianca', 'howToEarnIconS1', 'howToEarnIconS2', 'howToEarnIconS3'].forEach((k) => {
    const raw = eiCF[k] ?? ep[k] ?? item[k];
    // eslint-disable-next-line no-underscore-dangle
    const resolved = raw?._publishUrl || (typeof raw === 'string' ? raw : '');
    if (resolved) eliteProgress[k] = resolved;
  });
  if (Object.keys(eliteProgress).length) out.eliteProgress = eliteProgress;

  // --- FAB Gamification + flags Beneficios (1271694, paso 1). ⚠️ SCHEMA CF
  // PENDIENTE (espec del lote) — mapeo DEFENSIVO estilo `cenitConfig`.

  // fabConfig[]: entradas por POS y barra. `pos` acepta string CSV ("CO,PE"),
  // array o 'all' → se normaliza a 'all' | array de códigos UPPERCASE. Textos
  // literales autorados (title/body/ctaLabel) + ctaUrl + action ('buy'|'multiply').
  const fabArr = Array.isArray(item.fabConfig) ? item.fabConfig : [];
  const fabConfig = fabArr.reduce((acc, f) => {
    if (!f || !f.bar) return acc;
    const bar = String(f.bar).toLowerCase();
    if (!['total', 'avianca', 'cenit'].includes(bar)) return acc;
    let pos = 'all';
    if (Array.isArray(f.pos)) {
      pos = f.pos.map((p) => String(p).trim().toUpperCase()).filter(Boolean);
    } else if (typeof f.pos === 'string' && f.pos.trim() && f.pos.trim().toLowerCase() !== 'all') {
      pos = f.pos.split(',').map((p) => p.trim().toUpperCase()).filter(Boolean);
    }
    const entry = { pos, bar };
    if (typeof f.title === 'string' && f.title) entry.title = f.title;
    if (typeof f.body === 'string' && f.body) entry.body = f.body;
    if (typeof f.ctaLabel === 'string' && f.ctaLabel) entry.ctaLabel = f.ctaLabel;
    if (typeof f.ctaUrl === 'string' && f.ctaUrl) entry.ctaUrl = f.ctaUrl;
    entry.action = (String(f.action || '').toLowerCase() === 'buy') ? 'buy' : 'multiply';
    acc.push(entry);
    return acc;
  }, []);
  if (fabConfig.length) out.fabConfig = fabConfig;

  // benefitsFlags: apagado por autoría de cobrand/LM+ (anidado u objeto plano).
  const bf = item.benefitsFlags || {};
  const benefitsFlags = {};
  const bfCobrand = bf.cobrandEnabled ?? item.cobrandEnabled;
  if (typeof bfCobrand === 'boolean') benefitsFlags.cobrandEnabled = bfCobrand;
  const bfLmPlus = bf.lmPlusEnabled ?? item.lmPlusEnabled;
  if (typeof bfLmPlus === 'boolean') benefitsFlags.lmPlusEnabled = bfLmPlus;
  if (Object.keys(benefitsFlags).length) out.benefitsFlags = benefitsFlags;

  // newYearModal (1271694, A3): flag de visibilidad + URL del link terciario.
  // Anidado (`item.newYearModal` {enabled,tertiaryUrl}) o campos planos
  // (`newYearModalEnabled`/`newYearTertiaryUrl`).
  const nym = item.newYearModal || {};
  const newYearModal = {};
  const nymEnabled = nym.enabled ?? item.newYearModalEnabled;
  if (typeof nymEnabled === 'boolean') newYearModal.enabled = nymEnabled;
  const nymUrl = nym.tertiaryUrl ?? item.newYearTertiaryUrl;
  if (typeof nymUrl === 'string') newYearModal.tertiaryUrl = nymUrl;
  if (Object.keys(newYearModal).length) out.newYearModal = newYearModal;

  return out;
}
