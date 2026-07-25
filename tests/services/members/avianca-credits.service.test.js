/* global globalThis */
import {
  describe, it, expect, beforeAll, beforeEach, vi,
} from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Avianca Credits (1279362 paso 4): contrato MOCK para IT. Kill-switch off →
 * unavailable; fixture ok → ready con 3 credits ordenados y mock:true; fetch
 * roto → unavailable. Fail-soft total.
 */
const fixture = JSON.parse(
  readFileSync(new URL('../../fixtures/members/account/avianca-credits.json', import.meta.url), 'utf8'),
);

const servicePath = '../../../scripts/services/members/avianca-credits.service.js';

let loadAviancaCredits;
let toAviancaCreditsVM;

beforeAll(async () => {
  globalThis.window = globalThis.window || {
    location: { origin: 'http://localhost' },
    hlx: { codeBasePath: '' },
  };
  ({ loadAviancaCredits, toAviancaCreditsVM } = await import(servicePath));
});

const makeResponse = (json, ok = true) => new Response(JSON.stringify(json), {
  status: ok ? 200 : 500,
  headers: { 'Content-Type': 'application/json' },
});

describe('avianca-credits · toAviancaCreditsVM', () => {
  it('proyecta y ORDENA por estado (active → no-balance → cancelled)', () => {
    const vm = toAviancaCreditsVM(fixture);
    expect(vm).toHaveLength(3);
    expect(vm.map((c) => c.state)).toEqual(['active', 'no-balance', 'cancelled']);
    expect(vm[0]).toMatchObject({
      maskedNumber: '••••••••8901', type: 'Reembolsable', currency: 'COP', balance: 320000,
    });
  });

  it('normaliza estados alternativos (activo/sin-saldo/cancelado) y desconocido → active', () => {
    const vm = toAviancaCreditsVM({
      credits: [
        { state: 'CANCELADO' }, { state: 'sin saldo' }, { state: 'activo' }, { state: 'weird' },
      ],
    });
    const states = vm.map((c) => c.state);
    // dos 'active' (activo + weird) al frente, luego no-balance, luego cancelled
    expect(states).toEqual(['active', 'active', 'no-balance', 'cancelled']);
  });

  it('shape malformado → []', () => {
    expect(toAviancaCreditsVM(null)).toEqual([]);
    expect(toAviancaCreditsVM({ foo: 1 })).toEqual([]);
  });
});

describe('avianca-credits · loadAviancaCredits (fail-soft)', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('mockFallback:false → unavailable SIN tocar la red', async () => {
    const fetchImpl = vi.fn();
    const vm = await loadAviancaCredits({ mockFallback: false, fetchImpl });
    expect(vm).toEqual({ state: 'unavailable', credits: [], mock: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fixture ok → ready con 3 credits ordenados y mock:true', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(makeResponse(fixture));
    const vm = await loadAviancaCredits({ fetchImpl });
    expect(vm.state).toBe('ready');
    expect(vm.mock).toBe(true);
    expect(vm.credits).toHaveLength(3);
    expect(vm.credits[0].state).toBe('active');
  });

  it('fetch roto (throw) → unavailable sin crash', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'));
    expect(await loadAviancaCredits({ fetchImpl })).toEqual({ state: 'unavailable', credits: [], mock: false });
  });

  it('respuesta no-ok → unavailable', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(makeResponse({}, false));
    expect((await loadAviancaCredits({ fetchImpl })).state).toBe('unavailable');
  });
});
