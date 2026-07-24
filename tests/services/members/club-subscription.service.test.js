/* global globalThis */
import {
  describe, it, expect, beforeAll, vi,
} from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Lifemiles Plus (1271694 paso 7): VM desde el CONTRATO REAL capturado
 * (gold.json: "Plan Lite" activo con planId sin match en plans[] — edge §7.3)
 * + estados none/suspended-gated/unavailable + fail-soft del wrapper.
 */

const goldFx = JSON.parse(
  readFileSync(new URL('../../fixtures/members/elite/gold.json', import.meta.url), 'utf8'),
);
const magnoFx = JSON.parse(
  readFileSync(new URL('../../fixtures/members/elite/magno.json', import.meta.url), 'utf8'),
);

const servicePath = '../../../scripts/services/members/club-subscription.service.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';

let loadClubSubscription;
let toClubSubscriptionVM;
let deriveSubscriptionState;

beforeAll(async () => {
  // Mismo idiom que session-cenit.test.js: cortar la cadena loader → aem.js.
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
    loadClubSubscription,
    toClubSubscriptionVM,
    deriveSubscriptionState,
  } = await import(servicePath));
});

// `instanceof Response` del servicio → Response REAL (node 18+ la trae global).
const makeResponse = (json) => new Response(JSON.stringify(json), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

describe('club-subscription · toClubSubscriptionVM (contrato real)', () => {
  it('gold (Plan Lite activo): state active; planId sin match → monthlyMiles null y sin upsell (§7.3)', () => {
    const vm = toClubSubscriptionVM(goldFx.lmClubSubscription);
    expect(vm.state).toBe('active');
    expect(vm.plan).toEqual({ name: 'Plan Lite', monthlyMiles: null, planId: '33' });
    // planId "33" no está en plans[] (29/38/39/40) → sin upsell derivable.
    expect(vm.upsell).toBeNull();
    expect(vm.plans).toHaveLength(4);
  });

  it('activeSuscriptions [] → state none (banner "Suscríbete") — cuentas UAT reales', () => {
    const vm = toClubSubscriptionVM(magnoFx.lmClubSubscription);
    expect(vm.state).toBe('none');
    expect(vm.plan).toBeNull();
  });

  it('plan activo CON match en plans[] → millas/mes + upsell del siguiente planOrder', () => {
    const raw = {
      activeSuscriptions: [{ planName: 'Plan 2', planId: '38' }],
      plans: goldFx.lmClubSubscription.plans,
    };
    const vm = toClubSubscriptionVM(raw);
    expect(vm.plan).toEqual({ name: 'Plan 2', monthlyMiles: 1250, planId: '38' });
    expect(vm.upsell).toEqual({ name: 'Plan 3', priceDelta: 180160 });
  });

  it('suspendida GATEADA: solo con indicador explícito; default active', () => {
    expect(deriveSubscriptionState({ planName: 'Plan Lite', hasPendingCharge: true })).toBe('active');
    expect(deriveSubscriptionState({ status: 'SUSPENDED' })).toBe('suspended');
    expect(deriveSubscriptionState({ suspended: true })).toBe('suspended');
    const vm = toClubSubscriptionVM({
      activeSuscriptions: [{ planName: 'Plan Lite', planId: '33', status: 'suspended' }],
      plans: [],
    });
    expect(vm.state).toBe('suspended');
  });

  it('respuesta malformada (sin activeSuscriptions) o null → unavailable', () => {
    expect(toClubSubscriptionVM({ foo: 1 }).state).toBe('unavailable');
    expect(toClubSubscriptionVM(null).state).toBe('unavailable');
    expect(toClubSubscriptionVM('E.EON.12').state).toBe('unavailable');
  });
});

describe('club-subscription · loadClubSubscription (fail-soft del wrapper)', () => {
  it('wrapper responde Response ok → VM del contrato', async () => {
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue(
      makeResponse(goldFx.lmClubSubscription),
    );
    const vm = await loadClubSubscription();
    expect(vm.state).toBe('active');
    expect(globalThis.window.lmFetchWrapper).toHaveBeenCalledWith(
      'lmClubSubscription',
      expect.objectContaining({ country: expect.any(String), language: expect.any(String) }),
      false,
    );
  });

  it('wrapper NO deployado (string E.EON) → unavailable (prod hoy)', async () => {
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue('E.EON.12');
    expect((await loadClubSubscription()).state).toBe('unavailable');
  });

  it('wrapper lanza / ausente → unavailable sin crash', async () => {
    globalThis.window.lmFetchWrapper = vi.fn().mockRejectedValue(new Error('network'));
    expect((await loadClubSubscription()).state).toBe('unavailable');
    delete globalThis.window.lmFetchWrapper;
    expect((await loadClubSubscription()).state).toBe('unavailable');
  });
});
