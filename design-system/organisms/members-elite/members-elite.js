import { h } from '@dropins/tools/preact.js';
import { useState, useEffect, useRef } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { session as sessionStore } from '../../../scripts/services/members/session.store.js';
import { whenLmReady } from '../../../scripts/services/members/lm-script.loader.js';
import {
  getMembersConfigSync,
  loadMembersConfig,
} from '../../../scripts/services/members/members-config.js';
import {
  getEliteLabelsSync,
  loadEliteLabels,
} from '../../../scripts/services/members/members-i18n.js';
import { buildEliteDetailVM } from '../../../scripts/services/members/elite-detail.service.js';
import { buildPanelModel } from '../../../scripts/services/members/goal-progress.logic.js';
import { loadCobrandCatalog, buildCobrandVM } from '../../../scripts/services/members/cobrand.service.js';
import { loadClubSubscription } from '../../../scripts/services/members/club-subscription.service.js';
import { getStoredCountry, getStoredLanguage } from '../../../scripts/services/header/language-country-selector.js';
import {
  shouldShowAlert,
  dismissAlert,
  detectTierChange,
  detectCenitCross,
} from '../../../scripts/services/members/alert-persistence.js';
import { getEliteTierTokens } from '../../helpers/members-tier-theme.js';
import { MembersTabs, getInitialTab } from '../../molecules/members-tabs/members-tabs.js';
import { MembersEliteSkeleton } from '../../molecules/members-elite-skeleton/members-elite-skeleton.js';
import { TAB_PROGRESS, TAB_BENEFITS } from '../../molecules/members-tabs/members-tabs.logic.js';
import { CenitPanel } from '../../molecules/cenit-panel/cenit-panel.js';
import { HowToEarnPanel } from '../../molecules/how-to-earn-panel/how-to-earn-panel.js';
import { NewYearStatusModal } from '../../molecules/new-year-status-modal/new-year-status-modal.js';
import { shouldShowNewYearModal, markNewYearModalSeen } from '../../../scripts/services/members/new-year-modal.logic.js';
import { AchievementAlert } from '../../molecules/achievement-alert/achievement-alert.js';
import { GoalProgressPanel } from '../goal-progress-panel/goal-progress-panel.js';
import { BenefitsSection } from '../benefits-section/benefits-section.js';
import { MembersEliteHeader } from '../members-elite-header/members-elite-header.js';
import { Icon } from '../../atoms/icon/icon.js';

const html = htm.bind(h);

/** Interpolación simple de templates i18n `{placeholder}`. */
const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

/**
 * Ícono ilustrativo de una barra de progreso (CU-346, configurable por CF).
 * `value` = key del átomo Icon (ej. 'members/lm') o URL de imagen del DAM;
 * si es URL (http/https o path absoluto) → `<img>`, si es key → `<Icon>`; si
 * viene vacío, cae a `fallbackKey`. `size` en px.
 */
const barIcon = (value, fallbackKey, size) => {
  const src = value || fallbackKey;
  const isUrl = /^(https?:\/\/|\/)/.test(src);
  return isUrl
    ? html`<img src=${src} alt="" style=${{ width: `${size}px`, height: `${size}px` }} />`
    : html`<${Icon} icon=${src} customSize=${size} />`;
};

/** Lee el JSON de un resultado de `Promise.allSettled` sobre un wrapper LM
 * (mismo criterio no-rompedor que el hero: fallo → null → métricas 0). */
const readWrapperJson = async (settled) => {
  if (!settled || settled.status !== 'fulfilled') return null;
  const resp = settled.value;
  if (resp && resp.ok && typeof resp.json === 'function') {
    try { return await resp.json(); } catch (e) { return null; }
  }
  return null;
};

/**
 * MembersElite — organism raíz de la página "Progreso Elite y beneficios"
 * (1271689, Fase 1a). Montado por el bloque puente `blocks/members-elite/`.
 *
 * Estructura de esta fase (shell):
 *  - Slot **header placeholder** (la Fase 1b — plan 1271692 — monta el
 *    MemberHeader real por estatus).
 *  - `MembersTabs` (Progreso | Beneficios) con deep-linking `?tab=`.
 *  - Panel **Progreso**: contenedor estructural vacío (1271699 lo llena).
 *  - Panel **Beneficios**: 3 slots ordenados que renderizan `null` en esta fase
 *    (① catálogo por estatus — bloque 9, PBI hermano · ② cobrand — 1271694 ·
 *    ③ Lifemiles Plus — 1271694, gated). SOLO se deja la estructura y el orden.
 *
 * Estado de carga (decisión T13): mientras la sesión no sea `authenticated` o la
 * config no haya resuelto → `MembersEliteSkeleton` de la tab activa. La cortina
 * `members-gate-pending` + la guardia de ruta cubren el anti-flash de auth y el
 * redirect del deslogueado (portalRoutes cubre `/members/profile/elite`).
 *
 * Lee el signal `session.store` con el idiom de `members-hero` (el store NO
 * auto-suscribe) + `getMembersConfigSync`/`loadMembersConfig` + los copies de
 * `members-i18n` (getEliteLabelsSync/loadEliteLabels).
 */
export const MembersElite = ({ wrapperOverride = null } = {}) => {
  // `wrapperOverride` (SOLO samples/tests): función con la firma de
  // `lmFetchWrapper` que reemplaza al global. Evita pelear con el loader real
  // de LM, que pisa `window.lmFetchWrapper` al cargar (fix e2e sample
  // 2026-07-05). Default null = producción intacta (lee el global).
  const [session, setSessionState] = useState(() => sessionStore.value);
  // cfg: el header (1271692) consume `cfg.tiers` (dict de tokens de color por
  // tier del CF, extendido en Paso 2 con los campos nuevos del AC).
  const [cfg, setCfg] = useState(() => getMembersConfigSync());
  const [labels, setLabels] = useState(() => getEliteLabelsSync());
  // ¿Resolvió el primer `loadMembersConfig`? Warm load (cache poblada con
  // tierThemes) arranca en `true`; cold load espera el fetch (success O failure).
  const [cfgLoaded, setCfgLoaded] = useState(
    () => Object.keys(getMembersConfigSync().tierThemes || {}).length > 0,
  );
  // Tab activa: fuente inicial = URL (`?tab=`). MembersTabs es dueño del estado
  // una vez montado; acá la reflejamos vía `onTabChange` para elegir la variante
  // del skeleton si la sesión vuelve a un estado de carga.
  const [activeTab, setActiveTab] = useState(() => {
    const initial = getInitialTab(getEliteLabelsSync());
    // Beneficios (1271694) aún no va: si el CF no lo habilita, el deep-link
    // `?tab=benefits` no debe elegir la variante benefits del skeleton.
    const benefitsOn = getMembersConfigSync().benefitsEnabled === true;
    return (!benefitsOn && initial === TAB_BENEFITS) ? TAB_PROGRESS : initial;
  });

  // Raws de la tab Progreso (1271699): `eliteProgram` (métricas qualified) +
  // `memberProfile` (región T16). El VM de sesión no los guarda → se traen
  // acá best-effort (refreshLoginFlag=false, regla del repo) una vez
  // autenticado. Fallo de wrapper → raws null → VM con métricas 0 (sin crash).
  const [eliteData, setEliteData] = useState({
    status: 'loading', eliteRaw: null, profileRaw: null,
  });
  // Alertas de logro activas (status/cenit) — los detect* de last-seen MUTAN
  // localStorage, así que corren UNA vez por carga (ref-guard), no por render.
  const [activeAlerts, setActiveAlerts] = useState([]);
  const alertsComputed = useRef(false);
  // NewYearStatusModal (1271694, A3): gated por `cfg.newYearModal.enabled` +
  // trigger "primer login del año" (`shouldShowNewYearModal`). Ref-guard: la
  // decisión (que MUTA last-seen) corre UNA vez por carga, no por render.
  const [showNewYear, setShowNewYear] = useState(false);
  const newYearComputed = useRef(false);
  // Tab Beneficios (1271694): VMs de cobrand (sheet + matching sobre el
  // profileRaw ya traído) y Lifemiles Plus (wrapper fail-soft).
  const [benefits, setBenefits] = useState({
    status: 'loading', cobrandVM: null, lmPlusVM: null,
  });

  // El store usa signals-core SIN integración preact → suscripción manual.
  useEffect(() => sessionStore.subscribe(setSessionState), []);

  useEffect(() => {
    let mounted = true;
    loadMembersConfig()
      .then((c) => { if (mounted) setCfg(c); })
      .catch(() => {})
      .finally(() => { if (mounted) setCfgLoaded(true); });
    loadEliteLabels().then((l) => { if (mounted) setLabels(l); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const { status } = session;

  useEffect(() => {
    if (status !== 'authenticated') return undefined;
    let mounted = true;
    (async () => {
      let eliteRaw = null;
      let profileRaw = null;
      try {
        // FIX UAT ronda 1 (2026-07-06): SIN esperar al loader de LM había un
        // race (efecto corre al autenticar, ANTES de que el script exponga
        // `lmFetchWrapper`) → raws null → panel con fallback vacío aunque el
        // header ya tuviera datos.
        // FIX 1b: whenLmReady es sin-timeout POR DISEÑO, pero el script LM
        // puede dejar el global en estado NO-función (visto en UAT) y ahí la
        // espera sería infinita → race con timeout local. Usamos la FUNCIÓN
        // que la promesa capturó en la asignación (inmune a pisados
        // posteriores del global).
        let readyFn = null;
        if (!wrapperOverride) {
          readyFn = await Promise.race([
            whenLmReady('lmFetchWrapper').catch(() => null),
            new Promise((resolve) => { setTimeout(() => resolve(null), 8000); }),
          ]);
        }
        const globalFn = (typeof window !== 'undefined' && typeof window.lmFetchWrapper === 'function')
          ? window.lmFetchWrapper : null;
        const wrapperFn = wrapperOverride || readyFn || globalFn;
        if (typeof wrapperFn === 'function') {
          const [eliteRes, profileRes] = await Promise.allSettled([
            wrapperFn('eliteProgram', {}, false),
            wrapperFn('memberProfile', {}, false),
          ]);
          eliteRaw = await readWrapperJson(eliteRes);
          profileRaw = await readWrapperJson(profileRes);
        }
      } catch (e) { /* raws null → panel en estado 0 */ }
      if (mounted) setEliteData({ status: 'ready', eliteRaw, profileRaw });
    })();
    return () => { mounted = false; };
  }, [status]);

  // Tab Beneficios (1271694): catálogo cobrand por POS + estado LM+. Corre
  // cuando los raws están listos (el matching usa profileRaw). Fail-soft:
  // catálogo vacío sin sheet; LM+ 'unavailable' si el wrapper no responde.
  useEffect(() => {
    if (status !== 'authenticated' || eliteData.status !== 'ready') return undefined;
    let mounted = true;
    (async () => {
      let pos = '';
      try { pos = getStoredCountry() || ''; } catch (e) { /* sin POS → sheet vacío */ }
      // Idioma activo para el catálogo cobrand (AC "por POS e idioma").
      let lang = '';
      try {
        lang = String(getStoredLanguage() || (typeof document !== 'undefined' && document.documentElement.lang) || '')
          .toLowerCase().slice(0, 2);
      } catch (e) { /* sin idioma → filas universales */ }
      const [catalog, lmPlusVM] = await Promise.all([
        loadCobrandCatalog(pos, lang),
        loadClubSubscription(wrapperOverride || undefined),
      ]);
      const cobrandVM = buildCobrandVM({ profileRaw: eliteData.profileRaw, catalog });
      if (mounted) setBenefits({ status: 'ready', cobrandVM, lmPlusVM });
    })();
    return () => { mounted = false; };
  }, [status, eliteData]);

  // Alertas: detección por CAMBIO (last-seen) + gate de dismiss persistido
  // (T10; flag `alertsPersistDismiss`). `met-maintain` NO va como alerta acá:
  // su superficie es el banner del GoalProgressPanel (AC bloque 5); las
  // dismissibles con cóndor son status / cenit-1m / cenit-2m (§B).
  useEffect(() => {
    if (alertsComputed.current) return;
    if (eliteData.status !== 'ready' || !cfgLoaded || !session.user) return;
    // FIX UAT ronda 1: sin raws reales NO computar alertas ni last-seen — el VM
    // de fallback (tier base) disparaba "¡Ahora eres lifemiles!" falso y
    // contaminaba el last-seen en localStorage.
    if (!eliteData.eliteRaw) return;
    alertsComputed.current = true;
    const vm = buildEliteDetailVM({
      eliteRaw: eliteData.eliteRaw,
      profileRaw: eliteData.profileRaw,
      config: cfg,
      sessionUser: session.user, // FIX UAT 1b: degradado con tier de sesión
    });
    const model = buildPanelModel(vm, labels);
    const persistOpts = {
      persist: cfg.eliteProgress?.alertsPersistDismiss !== false,
      member: session.user?.membershipNumber || '',
    };
    const tierChanged = detectTierChange(vm.tierBase, persistOpts);
    // Mantiene el last-seen de cruces Cenit aunque la visibilidad del alert
    // sea por condición (AC: "Ya eres Cenit..." visible hasta el dismiss).
    detectCenitCross(
      vm.metrics.avLifetime,
      { oneGoal: vm.cenit.oneGoal, twoGoal: vm.cenit.twoGoal },
      persistOpts,
    );
    const active = model.alerts.filter((a) => {
      if (a.type === 'met-maintain') return false; // banner del panel
      if (!shouldShowAlert(a.key, persistOpts)) return false;
      if (a.type === 'status') return tierChanged; // solo al CAMBIAR de estatus
      return true; // cenit-1m / cenit-2m: condición actual + sin dismiss
    });
    setActiveAlerts(active);
  }, [eliteData, cfgLoaded, session.user, cfg, labels]);

  // NewYearStatusModal (1271694, A3): decidir visibilidad una vez, cuando hay
  // sesión + config. Gated por el flag del CF (`enabled`, default false) → hoy
  // NO se muestra hasta que el PO confirme el trigger y lo prenda por autoría.
  useEffect(() => {
    if (newYearComputed.current) return;
    if (!cfgLoaded || !session.user) return;
    newYearComputed.current = true;
    if (cfg.newYearModal?.enabled !== true) return;
    const member = session.user?.membershipNumber || '';
    if (shouldShowNewYearModal({ member })) setShowNewYear(true);
  }, [cfgLoaded, session.user, cfg]);

  const closeNewYear = () => {
    markNewYearModalSeen({ member: session.user?.membershipNumber || '' });
    setShowNewYear(false);
  };

  // Estado de carga: UN SOLO skeleton (MembersEliteSkeleton — el que replica el
  // layout final que espera el cliente) mientras no estén listos auth + config +
  // banner (`session.user`) Y progreso (`eliteData`). Se espera a AMBOS a
  // propósito (decisión 2026-07-09): antes el banner se pintaba primero y el
  // área de progreso mostraba un segundo skeleton "pobre" que no matcheaba el
  // diseño. `eliteData` SIEMPRE resuelve (cap de 8s en su efecto) → nunca cuelga.
  if (status !== 'authenticated' || !cfgLoaded || !session.user || eliteData.status !== 'ready') {
    return html`
      <div
        class="members-elite"
        data-name="members-elite"
        data-state="loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span class="sr-only">${labels.loadingLabel || ''}</span>
        <${MembersEliteSkeleton} tab=${activeTab} />
      </div>
    `;
  }

  // --- Panel Progreso (1271699): título + alertas activas + GoalProgressPanel
  // + CenitPanel + HowToEarnPanel, cableados session.store → raws →
  // buildEliteDetailVM → buildPanelModel → props.
  // `eliteData` ya está 'ready' acá: el skeleton unificado (gate de arriba) espera
  // banner + progreso juntos → un solo skeleton, sin segundo placeholder pobre.
  let progressContent;
  {
    const vm = buildEliteDetailVM({
      eliteRaw: eliteData.eliteRaw,
      profileRaw: eliteData.profileRaw,
      config: cfg,
      sessionUser: session.user, // FIX UAT 1b: degradado con tier de sesión
    });
    // Nombres display por tier: el CF (`tiers[].displayName`) pisa los defaults
    // de la lógica (data-driven, T14). FIX UAT 2 (2026-07-06): el CF de Mi
    // Lifemiles trae displayName con prefijo de marca ("LifeMiles Diamond"),
    // pero en el panel/hitos el diseño usa el tier PELADO ("Diamond", "Mantener
    // Diamond en 2027"). El prefijo alargaba los labels (desborde visual) y no
    // matcheaba el mock → se remueve el "LifeMiles " inicial.
    const stripBrand = (s) => String(s).replace(/^\s*lifemiles\s+/i, '').trim();
    const tierNames = Object.keys(cfg.tiers || {}).reduce((acc, k) => {
      const dn = cfg.tiers[k]?.displayName;
      if (dn) acc[String(k).toLowerCase()] = stripBrand(dn);
      return acc;
    }, {});
    const panelLabels = { ...labels, tierNames };
    const model = buildPanelModel(vm, panelLabels);
    const tokens = getEliteTierTokens(vm.tierBase, cfg.tiers);
    const persistOpts = {
      persist: cfg.eliteProgress?.alertsPersistDismiss !== false,
      member: session.user?.membershipNumber || '',
    };
    const tierDisplay = vm.displayTier || vm.tierBase;
    const alertCopy = {
      status: {
        title: tpl(labels.alertStatusTitle, { tier: tierDisplay }),
        body: tpl(labels.alertStatusBody, { tier: tierDisplay }),
      },
      'cenit-1m': {
        title: tpl(labels.alertCenit1Title, { tier: tierDisplay }),
        body: tpl(labels.alertCenit1Body, { tier: tierDisplay }),
      },
      'cenit-2m': {
        title: tpl(labels.alertCenit2Title, { tier: tierDisplay }),
        body: tpl(labels.alertCenit2Body, { tier: tierDisplay }),
      },
    };

    progressContent = html`
      <div class="flex flex-col gap-4 md:gap-6">
        <h2 class="!m-0">
          <span class="block text-2xl font-semibold leading-normal text-[#1b1b1b]">
            ${tpl(labels.progressTitle, { year: vm.year })}
          </span>
        </h2>

        ${activeAlerts.map((a) => html`
          <${AchievementAlert}
            key=${a.key}
            tier=${vm.tierBase}
            title=${alertCopy[a.type]?.title || ''}
            body=${alertCopy[a.type]?.body || ''}
            cfTiers=${cfg.tiers || {}}
            onDismiss=${() => {
    dismissAlert(a.key, persistOpts);
    setActiveAlerts((prev) => prev.filter((x) => x.key !== a.key));
  }}
          />
        `)}

        <${GoalProgressPanel}
          panelModel=${model}
          labels=${panelLabels}
          year=${vm.year}
          subtitleVisible=${cfg.eliteProgress?.progressDescriptionVisible !== false}
          tierColor=${tokens.overlay}
          cfTiers=${cfg.tiers || {}}
          fabConfig=${cfg.fabConfig || null}
          fabBorderColor=${tokens.gradientStrongFrom}
          withFab=${cfg.eliteProgress?.fabEnabled === true}
          rowIcons=${{
    // Íconos ilustrativos de las filas (Figma §B; CU-346 configurable desde
    // AEM): `eliteProgress.progressBarIcon{Total,Avianca}` del CF → key del
    // átomo Icon o URL de imagen del DAM; sin CF, defaults del repo (members/lm
    // + action/plane). `barIcon` decide <Icon> (key) vs <img> (URL DAM).
    total: barIcon(cfg.eliteProgress?.progressBarIconTotal, 'members/lm', 13),
    avianca: barIcon(cfg.eliteProgress?.progressBarIconAvianca, 'action/plane', 16),
  }}
          fabIcons=${{
    // Botón FAB sobre la barra: MISMA fuente que rowIcons (eliteIcons del CF).
    // Figma muestra el ícono de la métrica en el círculo (lm / avión), NO un
    // rayo — el rayo va en el header del tooltip (AC 1271694 línea 49). Tamaño
    // 24 = ícono xl del FAB (botón 40px).
    total: barIcon(cfg.eliteProgress?.progressBarIconTotal, 'members/lm', 24),
    avianca: barIcon(cfg.eliteProgress?.progressBarIconAvianca, 'action/plane', 24),
  }}
        />

        <${CenitPanel}
          cenit=${model.cenit}
          labels=${panelLabels}
          fabConfig=${cfg.fabConfig || null}
          fabBorderColor=${tokens.gradientStrongFrom}
          withFab=${cfg.eliteProgress?.fabEnabled === true}
          fabIcon=${barIcon(cfg.eliteProgress?.progressBarIconAvianca, 'action/plane', 24)}
        />

        <${HowToEarnPanel}
          tier=${vm.tierBase}
          maxTier23=${cfg.eliteProgress?.howToEarnSections23MaxTier || 'gold-cenit'}
          labels=${panelLabels}
          icons=${{
    // Íconos de sección (CU-349, mock 765:75842): avión / lm / regalo.
    // CF-first (key del Icon o URL DAM) con fallback a los assets del repo.
    s1: barIcon(cfg.eliteProgress?.howToEarnIconS1, 'action/plane', 14),
    s2: barIcon(cfg.eliteProgress?.howToEarnIconS2, 'members/lm', 14),
    s3: barIcon(cfg.eliteProgress?.howToEarnIconS3, 'members/gift', 14),
  }}
        />
      </div>
    `;
  }

  const progressPanel = html`
    <section
      class="members-elite__progress"
      data-panel="progress"
      aria-label=${labels.tabProgress || 'Progreso'}
    >
      ${progressContent}
    </section>
  `;

  // Panel Beneficios: slot ① intacto (bloque 9, PBI hermano); slots ② y ③
  // montados por BenefitsSection (1271694) con los VMs de cobrand/LM+.
  const benefitsPanel = html`
    <section
      class="members-elite__benefits flex flex-col gap-6"
      data-panel="benefits"
      aria-label=${labels.tabBenefits || 'Beneficios'}
    >
      ${/* ① Slot catálogo por estatus (bloque 9, PBI hermano) */ ''}
      ${null}
      ${/* ②+③ Cobrand + Lifemiles Plus (1271694) */ ''}
      ${benefits.status === 'ready' ? html`
        <${BenefitsSection}
          cobrandVM=${benefits.cobrandVM}
          lmPlusVM=${benefits.lmPlusVM}
          labels=${labels}
          flags=${cfg.benefitsFlags || {}}
          milesLabel=${tpl(labels.cobrandMilesLabel, { year: new Date().getFullYear() })}
        />
      ` : html`
        <span class="block h-[180px] w-full rounded-2xl bg-[#e9e9e9] animate-pulse" aria-hidden="true" data-state="loading"></span>
      `}
    </section>
  `;

  return html`
    <div
      class="members-elite flex flex-col gap-6 lg:gap-8"
      data-name="members-elite"
      data-state="ready"
    >
      ${/* Header personalizado por estatus (1271692, Fase 1b). Datos del socio
          del VM de sesión; tokens de color por tier de `cfg.tiers` (CF). */ ''}
      <${MembersEliteHeader}
        user=${session.user}
        balance=${{
    totalMiles: session.user?.totalMiles ?? null,
    milesExpiryDate: session.user?.milesExpiryDate ?? null,
  }}
        statusExpiry=${session.user?.statusExpiry ?? null}
        tierThemes=${cfg.tiers || {}}
        labels=${labels}
      />

      ${/* Sheet de contenido gris (#DFDFDF, full-bleed 100vw) detrás de
          tabs + paneles (refinamiento 2026-07-15). En mobile solapa el borde
          inferior del hero con esquinas superiores redondeadas 16px (efecto
          sheet); en desktop queda a ras, sin redondeo. Estilo en styles.css
          (.members-elite-sheet) — el ::before full-bleed necesita position
          relative + z-index para pintar el gris por encima del hero en el
          solape. NO va el footer del sitio (queda fuera). */ ''}
      <div class="members-elite-sheet">
        <${MembersTabs}
          labels=${labels}
          benefitsEnabled=${cfg.benefitsEnabled === true}
          onTabChange=${setActiveTab}
          panels=${{ [TAB_PROGRESS]: progressPanel, [TAB_BENEFITS]: benefitsPanel }}
        />
      </div>

      ${/* NewYearStatusModal (1271694, A3): gated por cfg.newYearModal.enabled;
          tier del servicio (sin prefijo de marca, como el header); año actual. */ ''}
      <${NewYearStatusModal}
        open=${showNewYear}
        onClose=${closeNewYear}
        tier=${String(session.user?.tier || '').replace(/^\s*lifemiles\s+/i, '').trim()}
        year=${new Date().getFullYear()}
        labels=${labels}
        profileUrl=${cfg.viewProfileUrl || ''}
        tertiaryUrl=${cfg.newYearModal?.tertiaryUrl || ''}
      />
    </div>
  `;
};

export default MembersElite;
