import { describe, it, expect } from 'vitest';
import {
  buildPanelModel,
  formatMiles,
  DEFAULT_TIER_NAMES,
} from '../../../scripts/services/members/goal-progress.logic.js';

/**
 * Máquina de estados del panel de progreso (1271699 paso 6).
 * Una suite por variante de tier (tabla AC bloque 6 + exhibits contexto-figma
 * §B) + edges: recalibración al sobrepasar, diamond doble-meta, sin
 * acumulación, región COL vs EXCOL.
 */

// Tabla del AC (bloque 4) — misma fuente que DEFAULT_ELITE_GOALS.
const GOALS = {
  'red-plus': { total: { COL: 4000, EXCOL: 6000 }, avianca: { COL: 1000, EXCOL: 1000 } },
  silver: { total: { COL: 8000, EXCOL: 12000 }, avianca: { COL: 2000, EXCOL: 3000 } },
  gold: { total: { COL: 20000, EXCOL: 24000 }, avianca: { COL: 8000, EXCOL: 12000 } },
  diamond: { total: { COL: 45000, EXCOL: 45000 }, avianca: { COL: 15000, EXCOL: 22500 } },
  magno: { total: null, avianca: { COL: 110000, EXCOL: 110000 } },
};
const LADDER_KEYS = ['lifemiles', 'red-plus', 'silver', 'gold', 'diamond', 'magno'];

/** VM sintético con el mismo shape que buildEliteDetailVM. */
const makeVM = ({
  tierBase = 'lifemiles', cenitLevel = null, totalYear = 0, avYear = 0,
  avLifetime = 0, region = 'COL', magnoTotal = null,
} = {}) => {
  // `magnoTotal` permite testear el CF con meta de totales de Magno autorada
  // (prod 2026-07-15) sin cambiar el default del AC (Magno sin meta de totales).
  const totalOf = (t) => {
    if (t === 'magno') return magnoTotal;
    return GOALS[t]?.total ? GOALS[t].total[region] : null;
  };
  const ladder = LADDER_KEYS.map((t) => ({
    tier: t,
    total: totalOf(t),
    avianca: GOALS[t]?.avianca ? GOALS[t].avianca[region] : null,
  }));
  const pure = tierBase.replace(/-cenit$/, '');
  const idx = ladder.findIndex((e) => e.tier === pure);
  const m = ladder[idx] || {};
  const maintain = (m.total != null || m.avianca != null)
    ? { total: m.total, avianca: m.avianca } : null;
  const n = ladder[idx + 1] || null;
  const next = n ? { tier: n.tier, total: n.total, avianca: n.avianca } : null;
  const visible = avLifetime >= 500000 || pure === 'magno' || (cenitLevel != null && cenitLevel >= 1);
  const version = avLifetime < 1000000 ? '1m' : '2m';
  return {
    tierBase,
    cenitLevel,
    displayTier: null,
    year: 2026,
    maintainYear: 2027,
    region,
    metrics: { totalYear, avYear, avLifetime },
    goals: { maintain, next, ladder },
    cenit: {
      visible,
      version,
      goal: version === '1m' ? 1000000 : 2000000,
      current: avLifetime,
      oneGoal: 1000000,
      twoGoal: 2000000,
    },
  };
};

const LABELS = {
  startLabel: 'Inicio',
  maintainMilestone: 'Mantener {tier} en {year}',
  goalTitle: 'Meta para llegar a estatus {tier}',
  goalBody: 'Completa {total} millas calificables totales, de las cuales {avianca} millas deben ser con Avianca.',
  barTotalTitle: 'Millas totales calificables',
  barTotalHint: 'Incluye tus millas con Avianca',
  barAviancaTitle: 'Millas requeridas con Avianca',
  cenitTitle: 'Progreso Cenit',
  cenitBody1M: 'Completa {goal} millas para el estatus {tier}.',
  cenitBody2M: 'Completa {goal} millas para el estatus {tier}.',
  cenitBarTitle: 'Millas totales con Avianca',
  cenitDoneText: '¡Disfruta de {tier} de por vida!',
  cenitMilestone1M: '{tier} 1M',
  cenitMilestone2M: '{tier} 2M',
};

const rowsOf = (model, mode) => model.rows.filter((r) => r.mode === mode);
const rowOf = (model, mode, kind) => rowsOf(model, mode).find((r) => r.kind === kind) || null;
const labelsOf = (row) => row.milestones.map((ms) => ms.label);
const statesOf = (row) => row.milestones.map((ms) => ms.state);

describe('goal-progress.logic · variantes por tier (AC bloque 6)', () => {
  it('Lifemiles: hito único Red Plus en ambas barras; sin meta de mantener', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'lifemiles', totalYear: 500, avYear: 500 }), LABELS);

    expect(model.goalCard).toMatchObject({ visible: true, tier: 'red-plus' });
    // Título como template + params ({tier} coloreado por la molécula).
    expect(model.goalCard.title).toBe('Meta para llegar a estatus {tier}');
    expect(model.goalCard.titleParams).toEqual({ tier: 'Red Plus' });
    expect(model.goalCard.bodyParams).toEqual({ total: '4,000', avianca: '1,000' });
    expect(model.subtitleVariant).toBe('default');

    const total = rowOf(model, 'detail', 'total');
    expect(labelsOf(total)).toEqual(['Inicio', 'Red Plus']);
    expect(total.milestones[1].sublabel).toBe('4,000');
    expect(total.counterValue).toBe(500);
    expect(total.counterGoal).toBe(4000);
    expect(total.remaining).toBe(3500);
    expect(total.fillPct).toBeCloseTo(12.5);
    expect(total.fillStyleKey).toBe('total');

    const avianca = rowOf(model, 'detail', 'avianca');
    expect(avianca.counterGoal).toBe(1000);
    expect(avianca.fillPct).toBeCloseTo(50);
    expect(avianca.fillStyleKey).toBe('avianca');

    expect(model.metMaintainBanner).toBe(false);
    expect(model.cenit.visible).toBe(false);
    expect(model.alerts).toEqual([{ type: 'status', key: 'status:lifemiles:2026' }]);
  });

  it('Red Plus: mantener a la mitad + Silver al final; fill piecewise', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'red-plus', totalYear: 2000, avYear: 500 }), LABELS);

    const total = rowOf(model, 'detail', 'total');
    expect(labelsOf(total)).toEqual(['Inicio', 'Mantener Red Plus en 2027', 'Silver']);
    expect(total.milestones.map((ms) => ms.pos)).toEqual([0, 0.5, 1]);
    expect(total.milestones.map((ms) => ms.labelAlign)).toEqual(['left', 'center', 'right']);
    expect(total.milestones[1].sublabel).toBe('4,000');
    expect(total.milestones[2].sublabel).toBe('8,000');
    expect(total.counterGoal).toBe(8000);
    // 2000/4000 del primer tramo → 25% de la barra.
    expect(total.fillPct).toBeCloseTo(25);

    const avianca = rowOf(model, 'detail', 'avianca');
    expect(labelsOf(avianca)).toEqual(['Inicio', 'Mantener Red Plus en 2027', 'Silver']);
    expect(avianca.counterGoal).toBe(2000);
  });

  it('Silver: cumplir la meta de mantener → hito verde y barra al 50%', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'silver', totalYear: 8000, avYear: 1000 }), LABELS);
    const total = rowOf(model, 'detail', 'total');
    expect(labelsOf(total)).toEqual(['Inicio', 'Mantener Silver en 2027', 'Gold']);
    expect(statesOf(total)).toEqual(['success', 'success', 'default']);
    expect(total.fillPct).toBeCloseTo(50);
    // Solo UNA meta de mantener cumplida (avianca 1000 < 2000) → sin banner.
    expect(model.metMaintainBanner).toBe(false);
  });

  it('Gold (no cenit): mantener Gold + Diamond; datos del fixture real (8000/8000)', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'gold', totalYear: 8000, avYear: 8000 }), LABELS);

    const total = rowOf(model, 'detail', 'total');
    expect(labelsOf(total)).toEqual(['Inicio', 'Mantener Gold en 2027', 'Diamond']);
    expect(total.counterGoal).toBe(45000);
    expect(total.fillPct).toBeCloseTo((8000 / 20000) * 50);

    const avianca = rowOf(model, 'detail', 'avianca');
    // avianca 8000 == meta de mantener Gold → hito verde + barra al 50%.
    expect(statesOf(avianca)).toEqual(['success', 'success', 'default']);
    expect(avianca.fillPct).toBeCloseTo(50);
    expect(avianca.counterGoal).toBe(15000);
    // Banner requiere AMBAS metas de mantener (totales 8000 < 20000).
    expect(model.metMaintainBanner).toBe(false);
  });

  it('Gold Cenit 1M: hito ÚNICO Diamond (sin mantener) + panel Cenit visible', () => {
    const model = buildPanelModel(
      makeVM({
        tierBase: 'gold-cenit', cenitLevel: 1, totalYear: 30000, avYear: 10000, avLifetime: 1200000,
      }),
      LABELS,
    );
    const total = rowOf(model, 'detail', 'total');
    expect(labelsOf(total)).toEqual(['Inicio', 'Diamond']);
    expect(total.counterGoal).toBe(45000);
    const avianca = rowOf(model, 'detail', 'avianca');
    expect(labelsOf(avianca)).toEqual(['Inicio', 'Diamond']);
    expect(avianca.counterGoal).toBe(15000);
    // avstar 1.2M → versión 2M del panel Cenit.
    expect(model.cenit.visible).toBe(true);
    expect(model.cenit.version).toBe('2m');
  });

  it('Diamond: totales con hito único de mantener (sin hito superior); avianca mantener + Magno', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'diamond', totalYear: 20000, avYear: 12000 }), LABELS);

    const total = rowOf(model, 'detail', 'total');
    expect(labelsOf(total)).toEqual(['Inicio', 'Mantener Diamond en 2027']);
    expect(total.milestones[1].pos).toBe(1);
    expect(total.counterGoal).toBe(45000);

    const avianca = rowOf(model, 'detail', 'avianca');
    expect(labelsOf(avianca)).toEqual(['Inicio', 'Mantener Diamond en 2027', 'Magno']);
    expect(avianca.counterGoal).toBe(110000);

    // GoalCard hacia Magno: sin meta de totales (bodyParams.total null).
    expect(model.goalCard).toMatchObject({ visible: true, tier: 'magno' });
    expect(model.goalCard.bodyParams).toEqual({ total: null, avianca: '110,000' });
  });

  it('Diamond Cenit 1M: misma estructura que Diamond + Cenit visible', () => {
    const model = buildPanelModel(
      makeVM({
        tierBase: 'diamond-cenit', cenitLevel: 1, totalYear: 15000, avYear: 15000, avLifetime: 45000,
      }),
      LABELS,
    );
    const total = rowOf(model, 'detail', 'total');
    expect(labelsOf(total)).toEqual(['Inicio', 'Mantener Diamond en 2027']);
    const avianca = rowOf(model, 'detail', 'avianca');
    expect(labelsOf(avianca)).toEqual(['Inicio', 'Mantener Diamond en 2027', 'Magno']);
    // Visible porque el SERVICIO marca cenit, aunque avstar esté bajo el umbral.
    expect(model.cenit.visible).toBe(true);
    expect(model.cenit.version).toBe('1m');
  });

  it('Diamond Cenit 2M: SOLO fila avianca (hito único Magno); Cenit 2M completado', () => {
    const model = buildPanelModel(
      makeVM({
        tierBase: 'diamond-cenit', cenitLevel: 2, totalYear: 50000, avYear: 30000, avLifetime: 2100000,
      }),
      LABELS,
    );
    expect(rowOf(model, 'detail', 'total')).toBeNull();
    expect(rowOf(model, 'full', 'total')).toBeNull();

    const avianca = rowOf(model, 'detail', 'avianca');
    expect(labelsOf(avianca)).toEqual(['Inicio', 'Magno']);
    expect(avianca.counterGoal).toBe(110000);

    // Cenit 2M completado: barra llena, contador → texto configurable.
    expect(model.cenit).toMatchObject({
      visible: true, version: '2m', done: true, fillPct: 100,
    });
    expect(model.cenit.doneText).toBe('¡Disfruta de Diamond de por vida!');
    // Alertas Cenit 1M y 2M candidatas (gateo por persistencia en el host).
    expect(model.alerts.map((a) => a.type)).toEqual(
      expect.arrayContaining(['status', 'cenit-1m', 'cenit-2m']),
    );
  });

  it('Magno: sin GoalCard, SOLO avianca con "Mantener Magno"; subtítulo variante maintain', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'magno', avYear: 100000, avLifetime: 100000 }), LABELS);

    expect(model.goalCard).toBeNull();
    expect(model.subtitleVariant).toBe('maintain');
    expect(rowOf(model, 'detail', 'total')).toBeNull();

    const avianca = rowOf(model, 'detail', 'avianca');
    expect(labelsOf(avianca)).toEqual(['Inicio', 'Mantener Magno en 2027']);
    expect(avianca.counterValue).toBe(100000);
    expect(avianca.counterGoal).toBe(110000);
    expect(avianca.fillPct).toBeCloseTo((100000 / 110000) * 100);
    // Magno siempre ve el panel Cenit.
    expect(model.cenit.visible).toBe(true);
    // Magno NO está en la lista del banner "cumpliste meta para mantener".
    expect(model.metMaintainBanner).toBe(false);
  });

  it('Magno Cenit: misma estructura que Magno + Cenit en el estado correspondiente', () => {
    const model = buildPanelModel(
      makeVM({
        tierBase: 'magno', cenitLevel: 1, avYear: 115000, avLifetime: 1130000,
      }),
      LABELS,
    );
    expect(model.goalCard).toBeNull();
    expect(rowOf(model, 'detail', 'total')).toBeNull();
    const avianca = rowOf(model, 'detail', 'avianca');
    // Meta única cumplida → verde + barra llena (AC bloque 5).
    expect(statesOf(avianca)).toEqual(['success', 'success']);
    expect(avianca.fillPct).toBe(100);
    expect(model.cenit.version).toBe('2m');
    expect(model.cenit.done).toBe(false);
  });
});

describe('goal-progress.logic · edges (AC bloque 5)', () => {
  it('recalibración: Lifemiles que logra Red Plus → Red Plus a la mitad (verde) y Silver como meta', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'lifemiles', totalYear: 5000, avYear: 1500 }), LABELS);

    const total = rowOf(model, 'detail', 'total');
    // Hito cumplido = la META lograda (nombre del tier, no "Mantener").
    expect(labelsOf(total)).toEqual(['Inicio', 'Red Plus', 'Silver']);
    expect(statesOf(total)).toEqual(['success', 'success', 'default']);
    expect(total.milestones[1].pos).toBe(0.5);
    expect(total.counterGoal).toBe(8000);
    expect(total.fillPct).toBeCloseTo(50 + (1000 / 4000) * 50);

    const avianca = rowOf(model, 'detail', 'avianca');
    expect(labelsOf(avianca)).toEqual(['Inicio', 'Red Plus', 'Silver']);
    expect(avianca.counterGoal).toBe(2000);
    expect(avianca.fillPct).toBeCloseTo(75);
    // La GoalCard recalibra al nuevo objetivo.
    expect(model.goalCard).toMatchObject({ visible: true, tier: 'silver' });
  });

  it('recalibración Gold Cenit 1M → Magno: Diamond a la mitad, meta Magno, totales DESAPARECE', () => {
    const model = buildPanelModel(
      makeVM({
        tierBase: 'gold-cenit', cenitLevel: 1, totalYear: 50000, avYear: 20000, avLifetime: 900000,
      }),
      LABELS,
    );
    expect(rowOf(model, 'detail', 'total')).toBeNull();
    const avianca = rowOf(model, 'detail', 'avianca');
    expect(labelsOf(avianca)).toEqual(['Inicio', 'Diamond', 'Magno']);
    expect(statesOf(avianca)).toEqual(['success', 'success', 'default']);
    expect(avianca.counterGoal).toBe(110000);
    expect(model.goalCard).toMatchObject({ visible: true, tier: 'magno' });
  });

  it('Diamond doble-meta de mantener: fila totales desaparece + banner + alerta met-maintain', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'diamond', totalYear: 45000, avYear: 15000 }), LABELS);
    expect(rowOf(model, 'detail', 'total')).toBeNull();
    expect(rowOf(model, 'detail', 'avianca')).not.toBeNull();
    expect(model.metMaintainBanner).toBe(true);
    expect(model.alerts.map((a) => a.type)).toContain('met-maintain');
    // Aún no logró la meta Magno (15000 < 110000) → GoalCard sigue visible.
    expect(model.goalCard).toMatchObject({ visible: true, tier: 'magno' });
  });

  it('Diamond que logra la meta para ser Magno: la GoalCard DESAPARECE', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'diamond', totalYear: 45000, avYear: 110000 }), LABELS);
    expect(model.goalCard).toBeNull();
  });

  it('sin acumulación: fill 0, hitos default, contadores 0/meta', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'gold' }), LABELS);
    const total = rowOf(model, 'detail', 'total');
    expect(total.fillPct).toBe(0);
    expect(statesOf(total)).toEqual(['success', 'default', 'default']);
    expect(total.counterValue).toBe(0);
    expect(total.remaining).toBe(45000);
    expect(model.metMaintainBanner).toBe(false);
    expect(model.alerts).toHaveLength(1); // solo la candidata de status
  });

  it('región EXCOL cambia montos de hitos y contadores (gold)', () => {
    const col = buildPanelModel(makeVM({ tierBase: 'gold', region: 'COL' }), LABELS);
    const row = buildPanelModel(makeVM({ tierBase: 'gold', region: 'EXCOL' }), LABELS);
    expect(rowOf(col, 'detail', 'total').milestones[1].sublabel).toBe('20,000');
    expect(rowOf(row, 'detail', 'total').milestones[1].sublabel).toBe('24,000');
    expect(rowOf(col, 'detail', 'avianca').counterGoal).toBe(15000);
    expect(rowOf(row, 'detail', 'avianca').counterGoal).toBe(22500);
    expect(col.goalCard.bodyParams).toEqual({ total: '45,000', avianca: '15,000' });
    expect(row.goalCard.bodyParams).toEqual({ total: '45,000', avianca: '22,500' });
  });
});

describe('goal-progress.logic · vista completa (AC bloque 4)', () => {
  it('Lifemiles: Inicio + tiers con meta; check por estatus, fill por millas (Opción 1)', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'lifemiles', totalYear: 500 }), LABELS);
    const total = rowOf(model, 'full', 'total');
    // Sin meta de totales para Magno (default AC) → totales sin Magno.
    expect(labelsOf(total)).toEqual(['Inicio', 'Red Plus', 'Silver', 'Gold', 'Diamond']);
    expect(total.milestones[0].marker).toBe('flag');
    expect(total.milestones[0].sublabel).toBe('');
    // 500 millas totales, av 0 → ningún estatus asegurado.
    expect(statesOf(total)).toEqual(['success', 'default', 'default', 'default', 'default']);
    // Fill PROPORCIONAL a las millas (500 de 4.000 del primer tramo) → ~3,1%.
    expect(total.fillPct).toBeCloseTo(3.125, 2);

    const avianca = rowOf(model, 'full', 'avianca');
    expect(labelsOf(avianca)).toEqual(['Inicio', 'Red Plus', 'Silver', 'Gold', 'Diamond', 'Magno']);
    expect(avianca.milestones[4].sublabel).toBe('15,000');
    expect(avianca.milestones[5].sublabel).toBe('110,000');
  });

  it('Red Plus sin millas: ningún hito asegurado, fill 0 (por millas, no por posición)', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'red-plus', totalYear: 0 }), LABELS);
    const total = rowOf(model, 'full', 'total');
    expect(labelsOf(total)).toEqual(['Inicio', 'Red Plus', 'Silver', 'Gold', 'Diamond']);
    expect(statesOf(total)).toEqual(['success', 'default', 'default', 'default', 'default']);
    // Opción 1: fill por millas → 0 (antes 25% forzado por posición de Red Plus).
    expect(total.fillPct).toBe(0);
  });

  it('Opción 1 (caso real Fernando/LM): estatus asegurado + fill por millas + Magno en totales', () => {
    // Gold, 55.900 totales / 8.000 avianca, con meta de totales de Magno autorada.
    const model = buildPanelModel(
      makeVM({
        tierBase: 'gold', totalYear: 55900, avYear: 8000, magnoTotal: 110000,
      }),
      LABELS,
    );
    const total = rowOf(model, 'full', 'total');
    expect(labelsOf(total)).toEqual(['Inicio', 'Red Plus', 'Silver', 'Gold', 'Diamond', 'Magno']);
    // Estatus asegurado (ambas dims): RP/Silver/Gold ✓; Diamond GRIS pese a
    // totales 55.900 ≥ 45.000, porque avianca 8.000 < 15.000 (igual que LM). Magno gris.
    expect(statesOf(total)).toEqual(['success', 'success', 'success', 'success', 'default', 'default']);
    // La barra avianca muestra EL MISMO patrón de checks (estatus asegurado).
    const avianca = rowOf(model, 'full', 'avianca');
    expect(statesOf(avianca)).toEqual(['success', 'success', 'success', 'success', 'default', 'default']);
    // Fill por millas: totales 55.900 entre Diamond (45.000) y Magno (110.000) → ~83%.
    expect(total.fillPct).toBeCloseTo(83.35, 1);
    // Avianca 8.000 = meta Gold exacta → posición de Gold (60%).
    expect(avianca.fillPct).toBeCloseTo(60, 1);
  });

  it('Gold Cenit sin millas del año: todos grises, fill 0 (por millas)', () => {
    const model = buildPanelModel(
      makeVM({ tierBase: 'gold-cenit', cenitLevel: 1, avLifetime: 600000 }),
      LABELS,
    );
    const total = rowOf(model, 'full', 'total');
    expect(statesOf(total)).toEqual(['success', 'default', 'default', 'default', 'default']);
    // Opción 1: sin millas del año → fill 0 (antes 75% forzado a la posición de Gold).
    expect(total.fillPct).toBe(0);
  });

  it('Magno: la fila de totales no existe; avianca por estatus asegurado + fill por millas', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'magno', totalYear: 50000, avYear: 50000 }), LABELS);
    expect(rowOf(model, 'full', 'total')).toBeNull();
    const avianca = rowOf(model, 'full', 'avianca');
    expect(labelsOf(avianca)).toEqual(['Inicio', 'Red Plus', 'Silver', 'Gold', 'Diamond', 'Magno']);
    // 50.000 (ambas dims) asegura hasta Diamond; Magno (110.000) gris.
    expect(statesOf(avianca)).toEqual(['success', 'success', 'success', 'success', 'success', 'default']);
    // Fill por millas: 50.000 avianca entre Diamond (15.000) y Magno (110.000) → ~87%.
    expect(avianca.fillPct).toBeCloseTo(87.37, 1);
  });
});

describe('goal-progress.logic · panel Cenit (AC bloque 7)', () => {
  it('1M en progreso: hito {tier} 1M al final, fill por avstar', () => {
    const model = buildPanelModel(
      makeVM({ tierBase: 'gold', totalYear: 0, avLifetime: 600000 }),
      LABELS,
    );
    expect(model.cenit).toMatchObject({
      visible: true, version: '1m', done: false, counterValue: 600000, counterGoal: 1000000,
    });
    expect(model.cenit.remaining).toBe(400000);
    expect(model.cenit.remainingTier).toBe('Gold');
    expect(model.cenit.fillPct).toBeCloseTo(60);
    // Hito en 2 líneas ("Gold" / "1M"), gris hasta cumplirse (mock 765-52131).
    expect(model.cenit.milestones.map((ms) => [ms.label, ms.sublabel])).toEqual(
      [['Inicio', ''], ['Gold', '1M']],
    );
    expect(model.cenit.milestones[0].marker).toBe('flag');
    expect(model.cenit.milestones[1].state).toBe('default');
    // Body como template + params ({goal}/{tier} en bold en la molécula).
    expect(model.cenit.body).toBe('Completa {goal} millas para el estatus {tier}.');
    expect(model.cenit.bodyParams).toEqual({ goal: '1,000,000', tier: 'Gold' });
  });

  it('2M en progreso: arranca en la mitad (1M completado en check) + hito Diamond 2M', () => {
    const model = buildPanelModel(
      makeVM({ tierBase: 'diamond-cenit', cenitLevel: 1, avLifetime: 1500000 }),
      LABELS,
    );
    expect(model.cenit).toMatchObject({ version: '2m', done: false });
    expect(model.cenit.milestones.map((ms) => [ms.label, ms.sublabel])).toEqual(
      [['Inicio', ''], ['Diamond', '1M'], ['Diamond', '2M']],
    );
    // Hito 1M logrado → check color Cenit (exhibit 765-52170, no verde).
    expect(model.cenit.milestones[1].state).toBe('cenit');
    expect(model.cenit.milestones[2].state).toBe('default');
    // 1.5M = mitad del tramo 1M→2M → 75% de la barra.
    expect(model.cenit.fillPct).toBeCloseTo(75);
    expect(model.cenit.bodyParams).toEqual({ goal: '2,000,000', tier: 'Diamond' });
    expect(model.cenit.remainingTier).toBe('Diamond');
  });

  it('oculto cuando no aplica (sin umbral, sin magno, sin cenit del servicio)', () => {
    const model = buildPanelModel(makeVM({ tierBase: 'gold', avLifetime: 23000 }), LABELS);
    expect(model.cenit).toEqual({ visible: false });
  });
});

describe('goal-progress.logic · helpers', () => {
  it('formatMiles agrupa con coma (formato de los mocks)', () => {
    expect(formatMiles(4000)).toBe('4,000');
    expect(formatMiles(1000000)).toBe('1,000,000');
    expect(formatMiles(0)).toBe('0');
    expect(formatMiles(null)).toBe('0');
  });

  it('DEFAULT_TIER_NAMES cubre la escalera completa', () => {
    expect(Object.keys(DEFAULT_TIER_NAMES)).toEqual(LADDER_KEYS);
  });
});

// FIX UAT 2 (2026-07-06): meta a Magno (sin dimensión de totales) → el goalCard
// usa el body avianca-only, no el body con {total} en blanco.
describe('buildPanelModel — goalCard avianca-only (FIX UAT 2)', () => {
  const labels = {
    goalBody: 'Completa {total} totales, de las cuales {avianca} con Avianca.',
    goalBodyAviancaOnly: 'Completa {avianca} con Avianca.',
  };
  const vmDiamond = {
    tierBase: 'diamond',
    cenitLevel: 1,
    year: 2026,
    maintainYear: 2027,
    region: 'COL',
    metrics: { totalYear: 15000, avYear: 15000, avLifetime: 120000 },
    goals: {
      maintain: { total: 45000, avianca: 15000 },
      next: { tier: 'magno', total: null, avianca: 110000 },
      ladder: [
        { tier: 'red-plus', total: 4000, avianca: 1000 },
        { tier: 'silver', total: 8000, avianca: 2000 },
        { tier: 'gold', total: 20000, avianca: 8000 },
        { tier: 'diamond', total: 45000, avianca: 15000 },
        { tier: 'magno', total: null, avianca: 110000 },
      ],
    },
    cenit: {
      visible: true, version: '1m', goal: 1000000, current: 120000, oneGoal: 1000000, twoGoal: 2000000,
    },
  };

  it('target Magno (total null) → body = goalBodyAviancaOnly (sin {total} en blanco)', () => {
    const model = buildPanelModel(vmDiamond, labels);
    expect(model.goalCard).toBeTruthy();
    expect(model.goalCard.body).toBe(labels.goalBodyAviancaOnly);
    expect(model.goalCard.bodyParams.total).toBeNull();
    expect(model.goalCard.bodyParams.avianca).toBe('110,000');
  });
});
