/* global globalThis */
import {
  describe, it, expect, beforeAll, vi,
} from 'vitest';
import { readFileSync } from 'node:fs';
import { DEFAULT_BENEFITS_CATALOG } from '../../../scripts/services/members/members-config.js';

/**
 * Catálogo de Beneficios por estatus (1271693, bloque 9 · rework plan A):
 * VM del componente BenefitsCards. La ESTRUCTURA (categorías + sub-beneficios +
 * tipo de valor) sale de la config; los valores `count` con `lmGroup` toman el
 * `amount` (DISPONIBLE = N) del wrapper `lmBenefits`. El máximo (M) sale de config
 * por tier (`maxByTier`); LM confirmó (2026-07-24) que `totalAccrual` es histórico
 * de vida, NO el otorgado → NO se usa. Fixture con el shape real confirmado por LM.
 */

const benefitsFx = JSON.parse(
  readFileSync(new URL('../../fixtures/members/elite/lm-benefits.json', import.meta.url), 'utf8'),
);

const servicePath = '../../../scripts/services/members/benefits-catalog.service.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';

// Config con las categorías seed reales (el sample y el organism usan estas).
const CFG = { benefitsCatalog: DEFAULT_BENEFITS_CATALOG };

let loadBenefitsCatalog;
let toBenefitsCatalogVM;
let deriveLmValue;

beforeAll(async () => {
  globalThis.window = globalThis.window || {
    location: { pathname: '/', href: 'http://localhost/', search: '' },
    history: {},
  };
  globalThis.document = globalThis.document || { cookie: '', documentElement: { lang: 'es' } };
  vi.doMock(loaderPath, () => ({
    loadLmScript: vi.fn().mockResolvedValue(undefined),
    whenLmReady: vi.fn().mockResolvedValue(undefined),
  }));
  ({
    loadBenefitsCatalog,
    toBenefitsCatalogVM,
    deriveLmValue,
  } = await import(servicePath));
});

const makeResponse = (json) => new Response(JSON.stringify(json), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

/** Aplana todos los sub-beneficios del VM (útil para buscar por label). */
const allSubs = (vm) => vm.categories.flatMap(
  (c) => c.subBenefits.map((s) => ({ cat: c.key, ...s })),
);

describe('benefits-catalog · deriveLmValue (valor tipado del contador LM)', () => {
  it('1..49 → count · ≥50 → unlimited · 0/negativo/NaN → na', () => {
    expect(deriveLmValue(1)).toEqual({ kind: 'count', amount: 1 });
    expect(deriveLmValue(12)).toEqual({ kind: 'count', amount: 12 });
    expect(deriveLmValue(49)).toEqual({ kind: 'count', amount: 49 });
    expect(deriveLmValue(50)).toEqual({ kind: 'unlimited' });
    expect(deriveLmValue(999)).toEqual({ kind: 'unlimited' });
    expect(deriveLmValue(0)).toEqual({ kind: 'na' });
    expect(deriveLmValue(-3)).toEqual({ kind: 'na' });
    expect(deriveLmValue(null)).toEqual({ kind: 'na' });
    expect(deriveLmValue('x')).toEqual({ kind: 'na' });
  });

  it('umbral "Ilimitado" configurable (unlimitedThreshold)', () => {
    expect(deriveLmValue(10, 10)).toEqual({ kind: 'unlimited' });
    expect(deriveLmValue(9, 10)).toEqual({ kind: 'count', amount: 9 });
    // threshold inválido → cae al default 50.
    expect(deriveLmValue(50, 'nope')).toEqual({ kind: 'unlimited' });
  });
});

describe('benefits-catalog · toBenefitsCatalogVM (estructura config + merge LM)', () => {
  it('arma las categorías del seed ordenadas por sortOrder', () => {
    const vm = toBenefitsCatalogVM(benefitsFx, CFG);
    expect(vm.state).toBe('ready');
    // Orden Silver (Figma 765:39295): upgrades · lounges · baggage · seating ·
    // priority · default (`sortOrder` 1..6 en DEFAULT_BENEFITS_CATALOG).
    expect(vm.categories.map((c) => c.key)).toEqual([
      'upgrades', 'lounges', 'baggage', 'seating', 'priority', 'default',
    ]);
  });

  it('merge LM: count con lmGroup toma SOLO amount (disponible); sin maxByTier → sin denominador', () => {
    // LM 2026-07-24: totalAccrual es histórico de vida, NO el otorgado → el máximo
    // sale de config (maxByTier). El seed no trae maxByTier → contador sin "de M".
    const vm = toBenefitsCatalogVM(benefitsFx, CFG);
    const upgrades = vm.categories.find((c) => c.key === 'upgrades');
    // Doméstico → PNTGRP62 = amount 12 → solo "12" (totalAccrual ignorado).
    expect(upgrades.subBenefits[0].value).toEqual({ kind: 'count', amount: 12 });
    // Américas → PNTGRP61 = amount 10 → solo "10".
    expect(upgrades.subBenefits[1].value).toEqual({ kind: 'count', amount: 10 });
    // Fila estática sin lmGroup (priority) → conserva el valor de config.
    const priority = vm.categories.find((c) => c.key === 'priority');
    expect(priority.subBenefits[0].value).toEqual({ kind: 'unlimited' });
  });

  it('merge LM Plan B: "de M" sale de maxByTier del tier del socio; totalAccrual se IGNORA', () => {
    const cfg = {
      benefitsCatalog: {
        categories: [{
          key: 'x',
          sortOrder: 1,
          subBenefits: [
            // tiene max para 'gold' (8) → "3 de 8"; totalAccrual (99) se ignora.
            {
              label: 'con max del tier', value: { kind: 'count', amount: 1 }, lmGroup: 'G1', maxByTier: [{ tier: 'gold', max: 8 }, { tier: 'magno', max: 12 }],
            },
            // maxByTier no lista 'gold' (solo magno) → sin denominador, solo disponible.
            {
              label: 'max de otro tier', value: { kind: 'count', amount: 1 }, lmGroup: 'G2', maxByTier: [{ tier: 'magno', max: 12 }],
            },
            // sin maxByTier → sin denominador.
            { label: 'sin max', value: { kind: 'count', amount: 1 }, lmGroup: 'G3' },
            // max (2) < disponible (9) → nunca "N de M" con N>M → sin denominador.
            {
              label: 'max<disp', value: { kind: 'count', amount: 1 }, lmGroup: 'G4', maxByTier: [{ tier: 'gold', max: 2 }],
            },
          ],
        }],
      },
    };
    const raw = {
      summarization: [{
        detail: [
          { grpId: 'G1', amount: 3, totalAccrual: 99 },
          { grpId: 'G2', amount: 5, totalAccrual: 99 },
          { grpId: 'G3', amount: 4, totalAccrual: 99 },
          { grpId: 'G4', amount: 9, totalAccrual: 99 },
        ],
      }],
    };
    const subs = toBenefitsCatalogVM(raw, cfg, 'gold').categories[0].subBenefits;
    expect(subs[0].value).toEqual({ kind: 'count', amount: 3, total: 8 }); // "3 de 8"
    expect(subs[1].value).toEqual({ kind: 'count', amount: 5 }); // gold no en maxByTier → solo "5"
    expect(subs[2].value).toEqual({ kind: 'count', amount: 4 }); // sin maxByTier → solo "4"
    expect(subs[3].value).toEqual({ kind: 'count', amount: 9 }); // max<disp → solo "9"
  });

  it('lmGroup con amount ≥ umbral → unlimited (Static)', () => {
    const vm = toBenefitsCatalogVM(benefitsFx, CFG);
    const lounges = vm.categories.find((c) => c.key === 'lounges');
    // Salas VIP Avianca → PNTGRP59 = 1000 ≥ 50 → unlimited.
    expect(lounges.subBenefits[0].value).toEqual({ kind: 'unlimited' });
  });

  it('conserva los valores estáticos de config (discount / none)', () => {
    const subs = allSubs(toBenefitsCatalogVM(benefitsFx, CFG));
    const discount = subs.find((s) => s.value.kind === 'discount');
    expect(discount.value).toEqual({ kind: 'discount', percent: 10 });
    // Silver Equipaje row 1 → `none` (label-only, sin valor a la derecha).
    const none = subs.find((s) => s.cat === 'baggage' && s.value.kind === 'none');
    expect(none).toBeTruthy();
  });

  it('categoría default (bono): discount estático se conserva (per-tier pendiente Plan B)', () => {
    // El bono de millas NO viene de lmBenefits (es estático de config). Su % varía por
    // tier (60/80/100) → hoy muestra el valor de config; per-tier real con Plan B.
    const vm = toBenefitsCatalogVM(benefitsFx, CFG);
    const def = vm.categories.find((c) => c.key === 'default');
    expect(def.subBenefits[0].value).toEqual({ kind: 'discount', percent: 60 });
  });

  it('expone seeAllUrl / termsUrl + seeAllIcon / termsIcon del catálogo (passthrough)', () => {
    const cfg = {
      benefitsCatalog: {
        ...DEFAULT_BENEFITS_CATALOG,
        seeAllUrl: '/see',
        termsUrl: '/terms',
        seeAllIcon: 'https://pub/dam/see.svg',
        termsIcon: 'navigation/open-in-new',
      },
    };
    const vm = toBenefitsCatalogVM(benefitsFx, cfg);
    expect(vm.seeAllUrl).toBe('/see');
    expect(vm.termsUrl).toBe('/terms');
    expect(vm.seeAllIcon).toBe('https://pub/dam/see.svg'); // URL DAM
    expect(vm.termsIcon).toBe('navigation/open-in-new'); // key
    // sin íconos en config → '' (el organism cae al default).
    const noIconsCfg = { benefitsCatalog: DEFAULT_BENEFITS_CATALOG };
    const vmNoIcons = toBenefitsCatalogVM(benefitsFx, noIconsCfg);
    expect(vmNoIcons.seeAllIcon).toBe('');
    expect(vmNoIcons.termsIcon).toBe('');
  });

  it('sub-beneficio con value inválido → na (nunca rompe)', () => {
    const cfg = {
      benefitsCatalog: {
        categories: [
          {
            key: 'x',
            sortOrder: 1,
            subBenefits: [
              { label: 'kind desconocido', value: { kind: 'weird' } },
              { label: 'count 0', value: { kind: 'count', amount: 0 } },
              { label: 'sin label', value: { kind: 'count', amount: 5 } },
            ],
          },
        ],
      },
    };
    // { label: '' } se filtra: solo quedan las 2 con label.
    const cfg2 = JSON.parse(JSON.stringify(cfg));
    cfg2.benefitsCatalog.categories[0].subBenefits[2].label = '';
    const vm = toBenefitsCatalogVM(benefitsFx, cfg2);
    const cat = vm.categories.find((c) => c.key === 'x');
    expect(cat.subBenefits).toHaveLength(2);
    expect(cat.subBenefits[0].value).toEqual({ kind: 'na' });
    expect(cat.subBenefits[1].value).toEqual({ kind: 'na' });
  });

  it('categoría sin sub-beneficios se omite', () => {
    const cfg = {
      benefitsCatalog: {
        categories: [
          { key: 'a', sortOrder: 1, subBenefits: [{ label: 'x', value: { kind: 'unlimited' } }] },
          { key: 'vacia', sortOrder: 2, subBenefits: [] },
        ],
      },
    };
    const vm = toBenefitsCatalogVM(benefitsFx, cfg);
    expect(vm.categories.map((c) => c.key)).toEqual(['a']);
  });

  it('respuesta malformada (sin summarization) o null → unavailable', () => {
    expect(toBenefitsCatalogVM({ foo: 1 }, CFG).state).toBe('unavailable');
    expect(toBenefitsCatalogVM(null, CFG).state).toBe('unavailable');
    expect(toBenefitsCatalogVM('E.EON.12', CFG).state).toBe('unavailable');
  });

  it('summarization vacío → ready con la estructura de config (sin merge LM)', () => {
    const vm = toBenefitsCatalogVM({ summarization: [] }, CFG);
    expect(vm.state).toBe('ready');
    // Sin amounts de LM: los count con lmGroup conservan su placeholder de config.
    const upgrades = vm.categories.find((c) => c.key === 'upgrades');
    expect(upgrades.subBenefits[0].value).toEqual({ kind: 'count', amount: 2, total: 2 });
  });

  it('count declara total ("N de M") — normaliza y cae a amount si falta', () => {
    const cfg = {
      benefitsCatalog: {
        categories: [{
          key: 'x',
          sortOrder: 1,
          subBenefits: [
            { label: 'con total', value: { kind: 'count', amount: 3, total: 4 } },
            { label: 'sin total', value: { kind: 'count', amount: 7 } },
            { label: 'total < amount', value: { kind: 'count', amount: 9, total: 2 } },
          ],
        }],
      },
    };
    const subs = toBenefitsCatalogVM({ summarization: [] }, cfg).categories[0].subBenefits;
    expect(subs[0].value).toEqual({ kind: 'count', amount: 3, total: 4 });
    expect(subs[1].value).toEqual({ kind: 'count', amount: 7, total: 7 });
    expect(subs[2].value).toEqual({ kind: 'count', amount: 9, total: 9 });
  });

  it('valuesByTier (Plan B, Fase 2): resuelve el valor del TIER; tier ausente → na; lmGroup lo ignora', () => {
    const cfg = {
      benefitsCatalog: {
        categories: [{
          key: 'x',
          sortOrder: 1,
          subBenefits: [
            // estático que varía por tier (bono millas): 60/80/100
            {
              label: 'bono',
              value: { kind: 'na' },
              valuesByTier: [
                { tier: 'gold', kind: 'discount', percent: 60 },
                { tier: 'diamond', kind: 'discount', percent: 80 },
                { tier: 'magno', kind: 'discount', percent: 100 },
              ],
            },
            // disponible solo en un tier: los demás → na
            { label: 'solo-magno', value: { kind: 'na' }, valuesByTier: [{ tier: 'magno', kind: 'unlimited' }] },
            // con lmGroup: valuesByTier se IGNORA (manda LM)
            {
              label: 'con-lmgroup',
              value: { kind: 'na' },
              lmGroup: 'G1',
              valuesByTier: [{ tier: 'gold', kind: 'discount', percent: 5 }],
            },
          ],
        }],
      },
    };
    const raw = { summarization: [{ detail: [{ grpId: 'G1', amount: 7, totalAccrual: 9 }] }] };

    const gold = toBenefitsCatalogVM(raw, cfg, 'gold').categories[0].subBenefits;
    expect(gold[0].value).toEqual({ kind: 'discount', percent: 60 }); // bono @ gold
    expect(gold[1].value).toEqual({ kind: 'na' }); // solo-magno: gold no listado → na
    expect(gold[2].value).toEqual({ kind: 'count', amount: 7 }); // lmGroup gana sobre valuesByTier; sin maxByTier → solo disponible

    const magno = toBenefitsCatalogVM(raw, cfg, 'magno').categories[0].subBenefits;
    expect(magno[0].value).toEqual({ kind: 'discount', percent: 100 }); // bono @ magno
    expect(magno[1].value).toEqual({ kind: 'unlimited' }); // solo-magno @ magno

    // sin tier → los valuesByTier (sin lmGroup) caen a na
    const noTier = toBenefitsCatalogVM(raw, cfg, '').categories[0].subBenefits;
    expect(noTier[0].value).toEqual({ kind: 'na' });
    // el match es case-insensitive
    const upper = toBenefitsCatalogVM(raw, cfg, 'DIAMOND').categories[0].subBenefits;
    expect(upper[0].value).toEqual({ kind: 'discount', percent: 80 });
  });
});

describe('benefits-catalog · loadBenefitsCatalog (fail-soft del wrapper)', () => {
  it('wrapper responde Response ok con datos → VM ready', async () => {
    const fn = vi.fn().mockResolvedValue(makeResponse(benefitsFx));
    const vm = await loadBenefitsCatalog(fn, CFG);
    expect(vm.state).toBe('ready');
    expect(vm.categories.length).toBeGreaterThan(0);
    expect(fn).toHaveBeenCalledWith('lmBenefits', {}, false);
  });

  it('wrapper NO deployado (string E.EON) → unavailable', async () => {
    const fn = vi.fn().mockResolvedValue('E.EON.12');
    expect((await loadBenefitsCatalog(fn, CFG)).state).toBe('unavailable');
  });

  it('wrapper lanza / ausente → unavailable sin crash', async () => {
    const throwing = vi.fn().mockRejectedValue(new Error('network'));
    expect((await loadBenefitsCatalog(throwing, CFG)).state).toBe('unavailable');
    expect((await loadBenefitsCatalog(null, CFG)).state).toBe('unavailable');
  });
});
