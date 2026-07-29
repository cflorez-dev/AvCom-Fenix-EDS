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

  // Tab Beneficios (flag de la TAB, no de los módulos): default true en APP_CONFIG
  // (2026-07-17). Solo se proyecta si el CF trae el boolean → sirve de kill-switch
  // sin deploy cuando el modeler agregue el campo.
  if (typeof item.benefitsEnabled === 'boolean') out.benefitsEnabled = item.benefitsEnabled;

  // benefitsCatalog (1271693, bloque 9): catálogo de categorías de beneficios
  // por estatus (rework plan A — componente BenefitsCards de Figma). ⚠️ SCHEMA CF
  // PENDIENTE (sub-CF "Benefit Category" + "Benefit SubItem" sin modelar; ver
  // prompt-modeler-cf.md) — mapeo DEFENSIVO estilo `dashboardCards`/`hero`.
  // Cada categoría: key + título (i18n `titleKey` O literal `title`) + `eyebrow`
  // (overline del header) + icon (key del catálogo /icons o ref DAM →
  // _publishUrl) + sortOrder + CTA (`ctaLabel`/`ctaUrl`) + `subBenefits[]`
  // (`{ label, value:{kind,amount?,percent?}, lmGroup? }` — label + valor tipado).
  // Links "Conoce todos"/"T&C" a nivel de catálogo (`seeAllUrl`/`termsUrl`).
  // Umbral "Ilimitado" (`unlimitedThreshold`) plano o anidado. Solo se emite si
  // el CF trae `categories` no vacío; si no, el caller cae al seed de código.
  const bcSrc = item.benefitsCatalog || {};
  const VALID_VALUE_KINDS = ['count', 'unlimited', 'na', 'discount'];
  const normSubValue = (v) => {
    if (!v || typeof v !== 'object' || !VALID_VALUE_KINDS.includes(v.kind)) return { kind: 'na' };
    if (v.kind === 'count') {
      const amount = toNum(v.amount);
      if (!(amount !== undefined && amount > 0)) return { kind: 'na' };
      const total = toNum(v.total); // máximo del beneficio ("N de M"); cae a amount
      return { kind: 'count', amount, total: total !== undefined && total >= amount ? total : amount };
    }
    if (v.kind === 'discount') {
      const percent = toNum(v.percent);
      return percent !== undefined && percent > 0 ? { kind: 'discount', percent } : { kind: 'na' };
    }
    return { kind: v.kind };
  };
  let bcCatsArr = [];
  if (Array.isArray(bcSrc.categories)) bcCatsArr = bcSrc.categories;
  else if (Array.isArray(item.benefitsCategories)) bcCatsArr = item.benefitsCategories;
  const bcCategories = bcCatsArr
    .filter((c) => c && c.key)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((c) => {
      let subBenefits = [];
      if (Array.isArray(c.subBenefits)) {
        subBenefits = c.subBenefits
          .filter((s) => s && s.label)
          .map((s) => {
            // El CF puede traer el valor tipado ANIDADO (`s.value.{kind,amount,
            // total,percent}`) o PLANO (esos campos como hermanos de `label`) — la
            // decisión de modelado a 3 niveles quedó ABIERTA (ver prompt-modeler-
            // beneficios-casos-especiales.md §Nivel 3). Aceptamos ambos: si `s.value`
            // es objeto se usa; si no, se lee del propio `s` (plano). Así la autoría
            // funciona sin depender de qué shape eligió el modeler.
            const valSrc = (s.value && typeof s.value === 'object') ? s.value : s;
            const out2 = { label: String(s.label).trim(), value: normSubValue(valSrc) };
            if (s.lmGroup) out2.lmGroup = String(s.lmGroup).trim();
            // valuesByTier (Plan B, Fase 2): filas por tier del multifield del CF.
            // Cada fila `{tier, kind, amount?, total?, percent?}` (valor plano o
            // anidado, ídem sub-beneficio). `tier` a lowercase para el match del front.
            if (Array.isArray(s.valuesByTier)) {
              const rows = s.valuesByTier
                .filter((r) => r && r.tier)
                .map((r) => {
                  const rSrc = (r.value && typeof r.value === 'object') ? r.value : r;
                  return { tier: String(r.tier).trim().toLowerCase(), ...normSubValue(rSrc) };
                });
              if (rows.length) out2.valuesByTier = rows;
            }
            // maxByTier (Plan B, contador por tier): máximo "de M" del contador POR
            // TIER. LM (2026-07-24) confirmó que `totalAccrual` es histórico de vida
            // (NO el otorgado) → el M del contador sale de config. Solo aplica a los
            // `count` con `lmGroup`. Filas `{tier, max}`; `tier` a lowercase.
            if (Array.isArray(s.maxByTier)) {
              const maxRows = s.maxByTier
                .filter((r) => r && r.tier)
                .map((r) => ({ tier: String(r.tier).trim().toLowerCase(), max: toNum(r.max) }))
                .filter((r) => r.max !== undefined && r.max > 0);
              if (maxRows.length) out2.maxByTier = maxRows;
            }
            return out2;
          });
      }
      // eslint-disable-next-line no-underscore-dangle
      const icon = c.icon?._publishUrl || (typeof c.icon === 'string' ? c.icon : '');
      return {
        key: c.key,
        titleKey: c.titleKey || undefined,
        title: c.title || undefined,
        eyebrow: c.eyebrow || '',
        icon,
        sortOrder: c.sortOrder,
        ctaLabel: c.ctaLabel || '',
        ctaUrl: c.ctaUrl || '',
        subBenefits,
      };
    });
  if (bcCategories.length) {
    out.benefitsCatalog = { categories: bcCategories };
    if (bcSrc.seeAllUrl) out.benefitsCatalog.seeAllUrl = String(bcSrc.seeAllUrl);
    if (bcSrc.termsUrl) out.benefitsCatalog.termsUrl = String(bcSrc.termsUrl);
    // Íconos de los CTAs "Conoce todos"/"T&C" (1271693 AC: "ícono ajustable desde
    // el CMS"). Asset del DAM → se resuelve `_publishUrl` (ídem imágenes del
    // banner); string → key del átomo Icon. Sin ícono → el organism cae al default.
    // eslint-disable-next-line no-underscore-dangle
    const seeAllIcon = bcSrc.seeAllIcon?._publishUrl || (typeof bcSrc.seeAllIcon === 'string' ? bcSrc.seeAllIcon : '');
    if (seeAllIcon) out.benefitsCatalog.seeAllIcon = seeAllIcon;
    // eslint-disable-next-line no-underscore-dangle
    const termsIcon = bcSrc.termsIcon?._publishUrl || (typeof bcSrc.termsIcon === 'string' ? bcSrc.termsIcon : '');
    if (termsIcon) out.benefitsCatalog.termsIcon = termsIcon;
    const bcTh = toNum(bcSrc.unlimitedThreshold ?? item.benefitsUnlimitedThreshold);
    if (bcTh !== undefined) out.benefitsCatalog.unlimitedThreshold = bcTh;
  } else {
    const bcThOnly = toNum(bcSrc.unlimitedThreshold ?? item.benefitsUnlimitedThreshold);
    if (bcThOnly !== undefined) out.benefitsCatalog = { unlimitedThreshold: bcThOnly };
  }

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

  // lmPlusBanner (1271694, Tarea B): banner "Suscríbete a Lifemiles Plus" del estado
  // 'sin plan' (LM+) = SecondaryBanner (imagen lifestyle + gradiente + cóndor). Los
  // campos son 1:1 con las props del SecondaryBanner; las imágenes llegan como asset
  // del DAM → se resuelve `_publishUrl`. `enabled` = kill-switch (null/ausente = ON,
  // fail-open). Sin `lmPlusBanner` → el front cae al LmPlusBanner simple.
  const bnr = item.lmPlusBanner;
  if (bnr && typeof bnr === 'object') {
    const banner = {};
    if (typeof bnr.enabled === 'boolean') banner.enabled = bnr.enabled;
    if (bnr.title) banner.title = String(bnr.title);
    if (bnr.subtitle) banner.subtitle = String(bnr.subtitle);
    // eslint-disable-next-line no-underscore-dangle
    const imgD = bnr.imageDesktop?._publishUrl || (typeof bnr.imageDesktop === 'string' ? bnr.imageDesktop : '');
    if (imgD) banner.imageDesktop = imgD;
    // eslint-disable-next-line no-underscore-dangle
    const imgM = bnr.imageMobile?._publishUrl || (typeof bnr.imageMobile === 'string' ? bnr.imageMobile : '');
    if (imgM) banner.imageMobile = imgM;
    if (bnr.imageAlt) banner.imageAlt = String(bnr.imageAlt);
    if (bnr.imagePosition) banner.imagePosition = String(bnr.imagePosition);
    if (bnr.ctaText) banner.ctaText = String(bnr.ctaText);
    if (bnr.ctaUrl) banner.ctaUrl = String(bnr.ctaUrl);
    if (bnr.backgroundColor) banner.backgroundColor = String(bnr.backgroundColor);
    if (bnr.gradientColorStart) banner.gradientColorStart = String(bnr.gradientColorStart);
    if (bnr.gradientColorEnd) banner.gradientColorEnd = String(bnr.gradientColorEnd);
    if (bnr.condorStrokeColor) banner.condorStrokeColor = String(bnr.condorStrokeColor);
    if (typeof bnr.showCondor === 'boolean') banner.showCondor = bnr.showCondor;
    if (Object.keys(banner).length) out.lmPlusBanner = banner;
  }

  // lmPlusUrls (1271694): CTAs de la card LM+ del tab Beneficios cuando el socio
  // TIENE plan (estado active/suspended): "Administrar suscripción" / "Mejorar
  // plan" / "Activar plan". ⚠️ Los 3 campos viven en el sub-fragmento `account`
  // (`item.account.*`), NO en el hub — porque el `lmPlusUpgradeUrl` que se REUSA
  // ya vivía ahí desde el PBI 1263921 (junto a manageCardsUrl/requestCardUrl) y
  // `manage`/`activate` se agregaron al lado para no partir el trío de CTAs de la
  // misma card. Se lee de `item.account` con fallback a `item` (por robustez si
  // otra fuente los trae planos). La URL de "Suscríbete" (sin plan) NO va acá:
  // vive en `lmPlusBanner.ctaUrl`.
  const lmUrlSrc = (item.account && typeof item.account === 'object') ? item.account : item;
  const lmPlusUrls = {};
  if (typeof lmUrlSrc.lmPlusManageUrl === 'string' && lmUrlSrc.lmPlusManageUrl) lmPlusUrls.manage = lmUrlSrc.lmPlusManageUrl;
  if (typeof lmUrlSrc.lmPlusUpgradeUrl === 'string' && lmUrlSrc.lmPlusUpgradeUrl) lmPlusUrls.upgrade = lmUrlSrc.lmPlusUpgradeUrl;
  if (typeof lmUrlSrc.lmPlusActivateUrl === 'string' && lmUrlSrc.lmPlusActivateUrl) lmPlusUrls.activate = lmUrlSrc.lmPlusActivateUrl;
  if (Object.keys(lmPlusUrls).length) out.lmPlusUrls = lmPlusUrls;

  // --- Sección `account` (Gestión de cuenta, Tandas 1+2 — espec-cf-lote.md).
  // Mapeo FLAT del CF → shape anidado que consume members-config.js. Solo se
  // proyecta lo que el CF trae TIPADO (boolean/string no vacío); lo ausente cae a
  // los defaults de código (DEFAULT_ACCOUNT_CONFIG) vía el deep-merge del loader.
  const acc = {};
  if (typeof item.accountEnabled === 'boolean') acc.accountEnabled = item.accountEnabled;
  if (typeof item.headerCtaEnabled === 'boolean') acc.headerCtaEnabled = item.headerCtaEnabled;
  if (typeof item.headerCtaUrl === 'string' && item.headerCtaUrl) acc.headerCtaUrl = item.headerCtaUrl;
  // Tab Datos (1279361, Tanda 2): campos numéricos/boolean del CF FLAT.
  // maxCompanions (D19/R3), umbrales de la torta (D35), kill-switch de edición
  // mock (P3). Solo se proyecta lo TIPADO y válido; lo ausente cae a los
  // defaults de código (DEFAULT_ACCOUNT_CONFIG) vía el spread del loader.
  const numField = (v) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
  const maxComp = numField(item.maxCompanions);
  if (maxComp != null && maxComp > 0) acc.maxCompanions = maxComp;
  const thWarn = numField(item.completenessThresholdWarning);
  if (thWarn != null) acc.completenessThresholdWarning = thWarn;
  const thPos = numField(item.completenessThresholdPositive);
  if (thPos != null) acc.completenessThresholdPositive = thPos;
  if (typeof item.editMockEnabled === 'boolean') acc.editMockEnabled = item.editMockEnabled;
  // (blockXEnabled eliminados 2026-07-23 — la compuerta por tab es constante de
  // código, ver PANELS_ENABLED en members-account.js.)
  const accWallet = {};
  if (typeof item.walletPaymentMethodsEnabled === 'boolean') accWallet.paymentMethodsEnabled = item.walletPaymentMethodsEnabled;
  if (typeof item.walletAviancaCreditsEnabled === 'boolean') accWallet.aviancaCreditsEnabled = item.walletAviancaCreditsEnabled;
  if (typeof item.walletLmPlusEnabled === 'boolean') accWallet.lmPlusEnabled = item.walletLmPlusEnabled;
  if (typeof item.manageCardsUrl === 'string' && item.manageCardsUrl) accWallet.manageCardsUrl = item.manageCardsUrl;
  if (typeof item.requestCardUrl === 'string' && item.requestCardUrl) accWallet.requestCardUrl = item.requestCardUrl;
  if (typeof item.avCreditsMovementsUrl === 'string' && item.avCreditsMovementsUrl) accWallet.avCreditsMovementsUrl = item.avCreditsMovementsUrl;
  if (typeof item.lmPlusEditPaymentUrl === 'string' && item.lmPlusEditPaymentUrl) accWallet.lmPlusEditPaymentUrl = item.lmPlusEditPaymentUrl;
  if (typeof item.lmPlusCancelUrl === 'string' && item.lmPlusCancelUrl) accWallet.lmPlusCancelUrl = item.lmPlusCancelUrl;
  if (typeof item.lmPlusUpgradeUrl === 'string' && item.lmPlusUpgradeUrl) accWallet.lmPlusUpgradeUrl = item.lmPlusUpgradeUrl;
  if (typeof item.walletMockFallback === 'boolean') accWallet.mockFallback = item.walletMockFallback;
  if (Object.keys(accWallet).length) acc.wallet = accWallet;
  if (Object.keys(acc).length) out.account = acc;

  return out;
}
