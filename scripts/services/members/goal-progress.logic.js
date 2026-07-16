/**
 * Goal progress logic — máquina de estados por tier del panel de progreso
 * (1271699, AC bloques 3-8; tabla de variantes en contexto-figma §B).
 *
 * FUNCIONES PURAS sin imports: reciben el VM de `elite-detail.service.js` +
 * los labels de i18n y devuelven el MODELO DE RENDER. Los componentes DS
 * (GoalProgressPanel/GoalProgressRow) consumen este modelo SIN lógica de
 * negocio propia. Fuente final de reglas: AC bloque 6 (decisión T14, todo
 * data-driven — metas/umbrales/textos vienen del VM/labels, cero hardcode).
 *
 * Variantes por tier (pure base + cenitLevel del VM):
 *  - lifemiles ............ hito único: meta del siguiente tier (Red Plus).
 *  - red-plus/silver/gold . hito "Mantener {tier} en {año+1}" a MITAD + meta
 *                           del siguiente tier al FINAL.
 *  - gold + cenit ≥ 1 ..... hito único Diamond (sin hito de mantener).
 *  - diamond (± cenit 1) .. totales: hito único "Mantener Diamond" (magno no
 *                           tiene meta de totales); avianca: mantener + Magno.
 *  - diamond + cenit 2 .... SOLO fila avianca, hito único Magno.
 *  - magno (± cenit) ...... SOLO fila avianca, hito único "Mantener Magno".
 *
 * Reglas transversales (AC bloque 5):
 *  - Verde + check al cumplir cada hito; fila llena al cumplir la meta final.
 *  - RECALIBRACIÓN al sobrepasar AMBAS metas del tier objetivo: el hito
 *    cumplido pasa a la mitad y la meta se actualiza al siguiente tier
 *    (iterativo). Si la nueva meta no tiene dimensión de totales (Magno), la
 *    fila de totales DESAPARECE.
 *  - Diamond con AMBAS metas de mantener cumplidas → fila totales desaparece.
 *  - GoalCard desaparece para Magno* y para Diamond que ya logró la meta Magno.
 *  - Banner "cumpliste meta para mantener": Red Plus/Silver/Gold(no cenit)/
 *    Diamond/Diamond Cenit 1M con ambas metas de mantener cumplidas.
 */

/** Nombres display de los tiers (nombres propios — no se traducen). El caller
 * puede overridearlos vía `labels.tierNames` (ej. displayName del CF). */
export const DEFAULT_TIER_NAMES = {
  lifemiles: 'LifeMiles',
  'red-plus': 'Red Plus',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
  magno: 'Magno',
};

/** Formato de millas de los mocks (separador de miles con coma: "4,000"). Un
 * solo punto de cambio si diseño pide grouping por locale. */
export const formatMiles = (n) => Number(n || 0).toLocaleString('en-US');

const clampPct = (n) => Math.max(0, Math.min(100, n));

/** Interpolación simple de templates i18n `{placeholder}`. */
const tpl = (template, params = {}) => String(template || '').replace(
  /\{(\w+)\}/g,
  (m, k) => (params[k] !== undefined && params[k] !== null ? String(params[k]) : m),
);

const pureBaseOf = (tierBase) => String(tierBase || '').replace(/-cenit$/, '');

/** Fill piecewise sobre la secuencia de hitos de la fila: cada tramo entre
 * hitos consecutivos mapea proporcionalmente su rango de millas al rango de
 * posiciones (AC: cumplir el hito de mitad = barra al 50%). */
const fillFromMilestones = (value, goalStops) => {
  // goalStops: [{pos: 0..1, goal}] ordenados, SIN el "Inicio" (goal 0 implícito).
  let prevPos = 0;
  let prevGoal = 0;
  for (let i = 0; i < goalStops.length; i += 1) {
    const { pos, goal } = goalStops[i];
    if (value <= goal) {
      const span = goal - prevGoal;
      const frac = span > 0 ? (value - prevGoal) / span : 1;
      return clampPct((prevPos + (pos - prevPos) * Math.max(0, frac)) * 100);
    }
    prevPos = pos;
    prevGoal = goal;
  }
  return 100;
};

/**
 * Resuelve los objetivos de la fila detalle tras aplicar la RECALIBRACIÓN
 * (AC bloque 5: sobrepasar ambas metas → hito cumplido a la mitad + meta del
 * siguiente tier). Iterativo hasta que alguna meta no esté cumplida o se acabe
 * la escalera.
 * @returns {{maintain:{tier,total,avianca}|null, next:{tier,total,avianca}|null,
 *   recalibrated:boolean}}
 */
const resolveTargets = (vm, variant) => {
  const { metrics, goals } = vm;
  const pure = pureBaseOf(vm.tierBase);
  const ladder = goals.ladder || [];
  const idxOf = (t) => ladder.findIndex((e) => e.tier === t);
  const bothMet = (g) => !!g
    && (g.total == null || metrics.totalYear >= g.total)
    && (g.avianca == null || metrics.avYear >= g.avianca);

  let maintain = null;
  if (variant === 'maintain-next' || variant === 'maintain-only') {
    maintain = goals.maintain ? { tier: pure, ...goals.maintain } : null;
  }
  let next = goals.next ? { ...goals.next } : null;
  let recalibrated = false;

  if (variant !== 'maintain-only') {
    while (next && bothMet(next) && idxOf(next.tier) >= 0
      && idxOf(next.tier) < ladder.length - 1) {
      const following = ladder[idxOf(next.tier) + 1];
      maintain = { tier: next.tier, total: next.total, avianca: next.avianca };
      next = { ...following };
      recalibrated = true;
    }
  }
  return { maintain, next, recalibrated };
};

const variantOf = (vm) => {
  const pure = pureBaseOf(vm.tierBase);
  const lvl = vm.cenitLevel;
  if (pure === 'magno') return 'maintain-only';
  if (pure === 'diamond' && lvl === 2) return 'single-magno';
  if (pure === 'gold' && lvl != null && lvl >= 1) return 'single-next';
  if (pure === 'lifemiles') return 'single-next';
  return 'maintain-next';
};

/** Hito de fila detalle. `pos` 0..1; labels alineados por posición (diseño:
 * izquierda/centro/derecha según ubicación en la barra). */
const alignFor = (pos) => {
  if (pos <= 0) return 'left';
  if (pos >= 1) return 'right';
  return 'center';
};

const milestone = ({
  pos, label, sublabel = '', state = 'default', marker = 'check',
}) => ({
  pos,
  label,
  sublabel,
  state,
  marker, // 'check' (badge circular) | 'flag' ("Inicio") — anatomía de los mocks
  labelAlign: alignFor(pos),
});

/** Hito "Inicio" (bandera + label, AC bloque 5). Estado `success` → bandera
 * VERDE (Figma 765-50736 `isComplete=True`: "Inicio" siempre está cumplido). */
const startMilestone = (labels) => milestone({
  pos: 0, label: labels.startLabel || '', marker: 'flag', state: 'success',
});

/**
 * Fila del modo DETALLE para una dimensión ('total'|'avianca').
 * Devuelve null si la fila no existe para la variante (se filtra afuera).
 */
const buildDetailRow = (kind, vm, targets, variant, names, labels) => {
  const dim = kind === 'total' ? 'total' : 'avianca';
  const value = kind === 'total' ? vm.metrics.totalYear : vm.metrics.avYear;
  const { maintain, next, recalibrated } = targets;
  const nameOf = (t) => names[t] || t;

  const maintainGoal = maintain ? maintain[dim] : null;
  const nextGoal = next ? next[dim] : null;

  // --- Visibilidad de la fila (AC bloques 5-6). La fila de totales desaparece:
  // Magno*, Diamond Cenit 2M, recalibración hacia una meta sin totales
  // (Gold Cenit → Magno) y Diamond con ambas metas de mantener cumplidas.
  if (kind === 'total') {
    if (variant === 'maintain-only' || variant === 'single-magno') return null;
    if (recalibrated && next && next[dim] == null) return null;
    const pure = pureBaseOf(vm.tierBase);
    const nativeMaintain = vm.goals.maintain;
    const diamondDoubleMet = pure === 'diamond' && nativeMaintain
      && vm.metrics.totalYear >= (nativeMaintain.total ?? Infinity)
      && vm.metrics.avYear >= (nativeMaintain.avianca ?? Infinity);
    if (diamondDoubleMet) return null;
    if (maintainGoal == null && nextGoal == null) return null;
  }

  // --- Hitos + meta del contador según la variante EFECTIVA: la recalibración
  // convierte cualquier variante de hito único en mantener+siguiente (el hito
  // cumplido pasa a la mitad — AC bloque 5).
  const milestones = [startMilestone(labels)];
  const goalStops = [];
  let counterGoal = null;
  let remainingTier = null;

  const maintainLabel = () => (recalibrated
    // Hito cumplido por recalibración: es la META lograda (nombre del tier),
    // no "Mantener" (AC: "la barra ahora tiene a Red Plus a la mitad").
    ? nameOf(maintain.tier)
    : tpl(labels.maintainMilestone, { tier: nameOf(maintain.tier), year: vm.maintainYear }));

  let shape = variant;
  if (variant !== 'maintain-only' && recalibrated && maintain) shape = 'maintain-next';

  if (shape === 'single-next' || shape === 'single-magno') {
    // Hito único: meta del siguiente tier al final.
    if (nextGoal == null) return null;
    milestones.push(milestone({
      pos: 1,
      label: nameOf(next.tier),
      sublabel: formatMiles(nextGoal),
      state: value >= nextGoal ? 'success' : 'default',
    }));
    goalStops.push({ pos: 1, goal: nextGoal });
    counterGoal = nextGoal;
    remainingTier = nameOf(next.tier);
  } else if (shape === 'maintain-only') {
    // Magno*: hito único "Mantener Magno" al final.
    if (maintainGoal == null) return null;
    milestones.push(milestone({
      pos: 1,
      label: tpl(labels.maintainMilestone, { tier: nameOf(maintain.tier), year: vm.maintainYear }),
      sublabel: formatMiles(maintainGoal),
      state: value >= maintainGoal ? 'success' : 'default',
    }));
    goalStops.push({ pos: 1, goal: maintainGoal });
    counterGoal = maintainGoal;
    remainingTier = nameOf(maintain.tier);
  } else if (maintainGoal != null && nextGoal != null) {
    // Mantener a la MITAD + meta siguiente al FINAL.
    milestones.push(milestone({
      pos: 0.5,
      label: maintainLabel(),
      sublabel: formatMiles(maintainGoal),
      state: value >= maintainGoal ? 'success' : 'default',
    }));
    milestones.push(milestone({
      pos: 1,
      label: nameOf(next.tier),
      sublabel: formatMiles(nextGoal),
      state: value >= nextGoal ? 'success' : 'default',
    }));
    goalStops.push({ pos: 0.5, goal: maintainGoal }, { pos: 1, goal: nextGoal });
    counterGoal = nextGoal;
    remainingTier = nameOf(next.tier);
  } else if (maintainGoal != null) {
    // Sin meta superior en esta dimensión (Diamond totales): hito único de
    // mantener al final ("sin hito superior", tabla §B).
    milestones.push(milestone({
      pos: 1,
      label: maintainLabel(),
      sublabel: formatMiles(maintainGoal),
      state: value >= maintainGoal ? 'success' : 'default',
    }));
    goalStops.push({ pos: 1, goal: maintainGoal });
    counterGoal = maintainGoal;
    remainingTier = nameOf(maintain.tier);
  } else {
    return null;
  }

  return {
    kind,
    mode: 'detail',
    visible: true,
    title: kind === 'total' ? (labels.barTotalTitle || '') : (labels.barAviancaTitle || ''),
    hint: kind === 'total' ? (labels.barTotalHint || '') : '',
    counterValue: value,
    counterGoal,
    remaining: Math.max(0, counterGoal - value),
    remainingTier,
    fillPct: fillFromMilestones(value, goalStops),
    fillStyleKey: kind,
    milestones,
  };
};

/**
 * Fila del modo VISTA COMPLETA: comparativa con los hitos de TODOS los tiers
 * de la dimensión (mock canónico 765-50723: arranca en "Inicio" + cada tier
 * con su monto y badge check). Red Plus siempre incluido (refinamiento
 * 2026-07-14; deroga el AC bloque 4 que lo ocultaba para tiers ≥ Silver).
 *
 * **Opción 1 (paridad LM, refinamiento 2026-07-15):**
 *  - **RELLENO por MILLAS** de la dimensión (proporcional, `fillFromMilestones`):
 *    el indicador llega hasta donde llegan las millas, NO a la posición del tier
 *    del socio. Coherente con LM (el avión se posiciona por millas).
 *  - **CHECK por ESTATUS ASEGURADO**: verde solo si el socio cumple AMBAS
 *    dimensiones (total Y avianca) del tier → mismo patrón de checks en las dos
 *    barras. Igual que LM: Diamond queda GRIS si faltan millas avianca aunque
 *    sobren las totales (el relleno puede pasar por encima de un check gris:
 *    magnitud de millas ≠ estatus logrado).
 */
const buildFullRow = (kind, vm, detailRow, names, labels) => {
  if (!detailRow) return null; // misma visibilidad que la fila detalle
  const dim = kind === 'total' ? 'total' : 'avianca';
  const ladder = vm.goals.ladder || [];
  const entries = ladder.filter((e) => e[dim] != null);
  if (!entries.length) return null;

  // Millas del socio en ESTA dimensión (para el relleno proporcional).
  const value = kind === 'total' ? vm.metrics.totalYear : vm.metrics.avYear;
  // Estatus asegurado: el socio cumple AMBAS dimensiones del tier (null = n/a).
  // Idéntico en total y avianca → las dos barras muestran el mismo patrón verde.
  const secured = (e) => (e.total == null || vm.metrics.totalYear >= e.total)
    && (e.avianca == null || vm.metrics.avYear >= e.avianca);

  // Posiciones equidistantes: Inicio en 0 + tiers hasta el final.
  const denom = Math.max(1, entries.length);
  const goalStops = entries.map((e, i) => ({ pos: (i + 1) / denom, goal: e[dim] }));
  const milestones = [
    startMilestone(labels),
    ...entries.map((e, i) => milestone({
      pos: (i + 1) / denom,
      label: names[e.tier] || e.tier,
      sublabel: e[dim] != null ? formatMiles(e[dim]) : '',
      state: secured(e) ? 'success' : 'default',
    })),
  ];

  return {
    ...detailRow,
    mode: 'full',
    milestones,
    fillPct: fillFromMilestones(value, goalStops),
  };
};

/**
 * Modelo del panel Cenit (AC bloque 7) a partir de `vm.cenit`:
 *  - 1M: fila única X/1,000,000, hito `{tier} / 1M` al final.
 *  - 2M: barra arranca "con la mitad completada" (1M como punto de partida),
 *    hito 1M logrado (check color Cenit — exhibit 765-52170) a la mitad +
 *    `Diamond / 2M` al final.
 *  - 2M completado: barra llena, contador reemplazado por `cenitDoneText`.
 * `body` va como TEMPLATE + `bodyParams` para que la molécula pinte `{goal}` y
 * `{tier}` en bold (mock canónico).
 */
const buildCenitModel = (vm, names, labels) => {
  const c = vm.cenit || {};
  if (!c.visible) return { visible: false };
  const pure = pureBaseOf(vm.tierBase);
  const tierName = names[pure] || pure;
  const diamondName = names.diamond || 'Diamond';
  const done = c.version === '2m' && c.current >= c.goal;

  // Sublabel del hito desde el template configurable ('{tier} 1M' → '1M').
  const subOf = (template) => tpl(template, { tier: '' }).trim();

  let fillPct;
  let milestones;
  if (c.version === '1m') {
    fillPct = clampPct((c.current / (c.goal || 1)) * 100);
    milestones = [
      startMilestone(labels),
      milestone({
        pos: 1,
        label: tierName,
        sublabel: subOf(labels.cenitMilestone1M),
        state: c.current >= c.goal ? 'cenit' : 'default',
      }),
    ];
  } else {
    const span = Math.max(1, (c.twoGoal ?? c.goal) - (c.oneGoal ?? 0));
    fillPct = clampPct(50 + (((c.current - (c.oneGoal ?? 0)) / span) * 50));
    milestones = [
      startMilestone(labels),
      milestone({
        pos: 0.5,
        label: tierName,
        sublabel: subOf(labels.cenitMilestone1M),
        state: 'cenit', // 1M ya alcanzado en versión 2M (check color Cenit)
      }),
      milestone({
        pos: 1,
        label: diamondName,
        sublabel: subOf(labels.cenitMilestone2M),
        state: done ? 'cenit' : 'default',
      }),
    ];
  }

  const remainingTier = c.version === '1m' ? tierName : diamondName;

  return {
    visible: true,
    version: c.version,
    done,
    title: labels.cenitTitle || '',
    body: c.version === '1m' ? (labels.cenitBody1M || '') : (labels.cenitBody2M || ''),
    bodyParams: {
      goal: formatMiles(c.goal),
      tier: c.version === '1m' ? tierName : diamondName,
    },
    barTitle: labels.cenitBarTitle || '',
    counterValue: c.current,
    counterGoal: c.goal,
    remaining: Math.max(0, c.goal - c.current),
    remainingTier,
    doneText: done ? tpl(labels.cenitDoneText, { tier: diamondName }) : null,
    fillPct: done ? 100 : fillPct,
    fillStyleKey: 'cenit',
    milestones,
  };
};

/**
 * Construye el modelo de render COMPLETO del panel para AMBOS modos.
 * @param {object} vm  VM de `buildEliteDetailVM`.
 * @param {object} [labels]  labels de i18n (`getEliteLabelsSync`/`loadEliteLabels`);
 *   opcional `labels.tierNames` overridea los nombres display de tiers.
 * @returns {{
 *   goalCard:{visible:boolean, tier:string, title:string, body:string,
 *             bodyParams:{total:string, avianca:string}}|null,
 *   subtitleVariant:('default'|'maintain'),
 *   rows:object[],                  // filas detail + full (filtrar por mode)
 *   metMaintainBanner:boolean,
 *   cenit:object,
 *   alerts:{type:string, key:string}[],
 * }}
 */
export const buildPanelModel = (vm, labels = {}) => {
  const names = { ...DEFAULT_TIER_NAMES, ...(labels.tierNames || {}) };
  const variant = variantOf(vm);
  const pure = pureBaseOf(vm.tierBase);
  const targets = resolveTargets(vm, variant);

  // --- GoalCard (AC bloque 4): desaparece para Magno* y para Diamond que ya
  // logró la meta para ser Magno (avianca ≥ meta Magno).
  let goalCard = null;
  if (variant !== 'maintain-only') {
    const target = targets.next;
    const diamondMetMagno = pure === 'diamond' && target
      && target.avianca != null && vm.metrics.avYear >= target.avianca;
    if (target && !diamondMetMagno) {
      goalCard = {
        visible: true,
        tier: target.tier,
        // Título como TEMPLATE + params: el `{tier}` va COLOREADO con el token
        // del tier meta (mock canónico 765-50716) — interpola la molécula.
        title: labels.goalTitle || '',
        titleParams: { tier: names[target.tier] || target.tier },
        // FIX UAT 2 (2026-07-06): si la meta destino NO tiene dimensión de
        // totales (Magno = solo avianca), el body con `{total}` quedaba
        // "Completa  millas calificables totales…" (número en blanco). Se usa
        // un template avianca-only cuando `total` es null.
        body: (target.total != null
          ? labels.goalBody
          : (labels.goalBodyAviancaOnly || labels.goalBody)) || '',
        bodyParams: {
          total: target.total != null ? formatMiles(target.total) : null,
          avianca: target.avianca != null ? formatMiles(target.avianca) : null,
        },
      };
    }
  }

  // --- Filas detalle + vista completa.
  const detailTotal = buildDetailRow('total', vm, targets, variant, names, labels);
  const detailAvianca = buildDetailRow('avianca', vm, targets, variant, names, labels);
  const rows = [
    detailTotal,
    detailAvianca,
    buildFullRow('total', vm, detailTotal, names, labels),
    buildFullRow('avianca', vm, detailAvianca, names, labels),
  ].filter(Boolean);

  // --- Banner "cumpliste meta para mantener" (AC bloque 5: Red Plus, Silver,
  // Gold no Cenit, Diamond, Diamond Cenit 1M) con AMBAS metas nativas cumplidas.
  const nativeMaintain = vm.goals.maintain;
  const eligibleForBanner = (
    ['red-plus', 'silver', 'diamond'].includes(pure)
    || (pure === 'gold' && vm.cenitLevel == null)
  ) && !(pure === 'diamond' && vm.cenitLevel === 2);
  const metMaintainBanner = !!(eligibleForBanner && nativeMaintain
    && (nativeMaintain.total == null || vm.metrics.totalYear >= nativeMaintain.total)
    && (nativeMaintain.avianca == null || vm.metrics.avYear >= nativeMaintain.avianca));

  // --- Cenit.
  const cenit = buildCenitModel(vm, names, labels);

  // --- Alertas CANDIDATAS (el host las gatea con alert-persistence: dismiss
  // persistido + disparo por CAMBIO vía last-seen). Keys `{tipo}:{hito}:{año}`
  // (T10). `status` es candidata siempre — la dispara detectTierChange.
  const alerts = [
    { type: 'status', key: `status:${vm.tierBase}:${vm.year}` },
  ];
  const cLvl = vm.cenitLevel;
  if (vm.metrics.avLifetime >= (vm.cenit?.oneGoal ?? Infinity) || (cLvl != null && cLvl >= 1)) {
    alerts.push({ type: 'cenit-1m', key: `cenit-1m:1m:${vm.year}` });
  }
  if (vm.metrics.avLifetime >= (vm.cenit?.twoGoal ?? Infinity) || cLvl === 2) {
    alerts.push({ type: 'cenit-2m', key: `cenit-2m:2m:${vm.year}` });
  }
  if (metMaintainBanner) {
    alerts.push({ type: 'met-maintain', key: `met-maintain:${vm.tierBase}:${vm.year}` });
  }

  return {
    goalCard,
    subtitleVariant: variant === 'maintain-only' ? 'maintain' : 'default',
    rows,
    metMaintainBanner,
    cenit,
    alerts,
  };
};
