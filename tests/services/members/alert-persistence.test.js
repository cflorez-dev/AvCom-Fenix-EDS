/* global globalThis */
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import {
  shouldShowAlert,
  dismissAlert,
  detectTierChange,
  detectCenitCross,
} from '../../../scripts/services/members/alert-persistence.js';

/**
 * Persistencia de alertas del tab Progreso (1271699 paso 13, T10):
 * dismiss persistido por key `{tipo}:{hito}:{año}` + last-seen para disparo
 * por CAMBIO + flag `alertsPersistDismiss` + fail-open sin localStorage.
 */

const makeStorage = () => {
  const store = new Map();
  return {
    getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
    setItem: vi.fn((k, v) => { store.set(k, String(v)); }),
    removeItem: vi.fn((k) => { store.delete(k); }),
    clear: () => store.clear(),
    store,
  };
};

let storage;

beforeEach(() => {
  storage = makeStorage();
  globalThis.window = globalThis.window || {};
  Object.defineProperty(globalThis.window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
});

describe('alert-persistence · dismiss persistente', () => {
  it('alerta sin dismiss previo → se muestra; tras dismissAlert → no reaparece', () => {
    const key = 'status:gold:2026';
    expect(shouldShowAlert(key)).toBe(true);
    dismissAlert(key);
    expect(shouldShowAlert(key)).toBe(false);
    expect(storage.store.has('av-elite-alert:status:gold:2026')).toBe(true);
  });

  it('flag persist:false (alertsPersistDismiss off) → no escribe y siempre muestra', () => {
    const key = 'cenit-1m:1m:2026';
    dismissAlert(key, { persist: false });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(shouldShowAlert(key, { persist: false })).toBe(true);
    // Incluso con un dismiss persistido previo, persist:false ignora el storage.
    dismissAlert(key, { persist: true });
    expect(shouldShowAlert(key, { persist: false })).toBe(true);
  });

  it('keys escopadas por membershipNumber (cambio de cuenta en la misma máquina)', () => {
    const key = 'status:gold:2026';
    dismissAlert(key, { member: '111' });
    expect(shouldShowAlert(key, { member: '111' })).toBe(false);
    expect(shouldShowAlert(key, { member: '222' })).toBe(true);
    expect(shouldShowAlert(key)).toBe(true);
  });

  it('key vacía → no se muestra ni escribe (guard)', () => {
    expect(shouldShowAlert('')).toBe(false);
    dismissAlert('');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe('alert-persistence · detectTierChange (last-seen)', () => {
  it('primera visita → baseline sin alerta; cambio de tier → true una sola vez', () => {
    expect(detectTierChange('gold')).toBe(false); // baseline
    expect(detectTierChange('gold')).toBe(false); // sin cambio
    expect(detectTierChange('diamond')).toBe(true); // ¡ascendió!
    expect(detectTierChange('diamond')).toBe(false); // ya visto
  });

  it('last-seen escopado por member', () => {
    detectTierChange('gold', { member: '111' });
    expect(detectTierChange('diamond', { member: '111' })).toBe(true);
    // Otra cuenta en la misma máquina: baseline propio.
    expect(detectTierChange('diamond', { member: '222' })).toBe(false);
  });

  it('tier vacío → false sin escribir', () => {
    expect(detectTierChange('')).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe('alert-persistence · detectCenitCross (umbrales 1M/2M)', () => {
  const GOALS = { oneGoal: 1000000, twoGoal: 2000000 };

  it('primera visita → baseline sin cruces', () => {
    expect(detectCenitCross(1200000, GOALS)).toEqual({ crossed1M: false, crossed2M: false });
  });

  it('cruce de 1M: last < 1M y current ≥ 1M', () => {
    detectCenitCross(900000, GOALS); // baseline
    expect(detectCenitCross(1000000, GOALS)).toEqual({ crossed1M: true, crossed2M: false });
    // Ya por encima: no vuelve a disparar.
    expect(detectCenitCross(1100000, GOALS)).toEqual({ crossed1M: false, crossed2M: false });
  });

  it('cruce de 2M (puede cruzar 1M y 2M en la misma visita)', () => {
    detectCenitCross(900000, GOALS);
    expect(detectCenitCross(2100000, GOALS)).toEqual({ crossed1M: true, crossed2M: true });
  });

  it('umbrales configurables (config Cenit del CF)', () => {
    const custom = { oneGoal: 500000, twoGoal: 800000 };
    detectCenitCross(400000, custom);
    expect(detectCenitCross(600000, custom)).toEqual({ crossed1M: true, crossed2M: false });
  });
});

describe('alert-persistence · localStorage inaccesible (Safari private)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.window, 'localStorage', {
      get() { throw new Error('SecurityError'); },
      configurable: true,
    });
  });

  it('las alertas se muestran siempre y nada crashea (fail-open, §7.3)', () => {
    expect(() => dismissAlert('status:gold:2026')).not.toThrow();
    expect(shouldShowAlert('status:gold:2026')).toBe(true);
    expect(detectTierChange('gold')).toBe(false);
    expect(detectCenitCross(1200000)).toEqual({ crossed1M: false, crossed2M: false });
  });
});
