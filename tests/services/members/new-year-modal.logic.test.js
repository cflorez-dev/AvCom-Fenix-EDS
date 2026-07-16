/* global globalThis */
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import {
  shouldShowNewYearModal,
  markNewYearModalSeen,
} from '../../../scripts/services/members/new-year-modal.logic.js';

/**
 * Trigger + persistencia del NewYearStatusModal (1271694, A3): "primer login
 * del año", baseline en primera visita, escopado por member, fail-closed sin
 * localStorage.
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

describe('new-year-modal.logic · trigger primer login del año', () => {
  it('primera visita EVER (sin last-seen) → NO muestra pero registra baseline', () => {
    expect(shouldShowNewYearModal({ year: 2026 })).toBe(false);
    expect(storage.store.get('av-members-newyear-seen')).toBe('2026');
  });

  it('mismo año que el last-seen → NO muestra', () => {
    markNewYearModalSeen({ year: 2026 });
    expect(shouldShowNewYearModal({ year: 2026 })).toBe(false);
  });

  it('año nuevo respecto del last-seen → SÍ muestra', () => {
    markNewYearModalSeen({ year: 2026 });
    expect(shouldShowNewYearModal({ year: 2027 })).toBe(true);
  });

  it('tras marcar como visto el año nuevo → ya no reaparece ese año', () => {
    markNewYearModalSeen({ year: 2026 });
    expect(shouldShowNewYearModal({ year: 2027 })).toBe(true);
    markNewYearModalSeen({ year: 2027 });
    expect(shouldShowNewYearModal({ year: 2027 })).toBe(false);
  });

  it('last-seen posterior (reloj hacia atrás) → NO muestra', () => {
    markNewYearModalSeen({ year: 2027 });
    expect(shouldShowNewYearModal({ year: 2026 })).toBe(false);
  });

  it('escopa por member: la cuenta B no hereda el baseline de A', () => {
    // A registra baseline 2026
    expect(shouldShowNewYearModal({ year: 2026, member: 'A' })).toBe(false);
    // B es primera visita → baseline propio, NO muestra
    expect(shouldShowNewYearModal({ year: 2027, member: 'B' })).toBe(false);
    expect(storage.store.get('av-members-newyear-seen:A')).toBe('2026');
    expect(storage.store.get('av-members-newyear-seen:B')).toBe('2027');
    // A en 2027 SÍ muestra (su last-seen es 2026)
    expect(shouldShowNewYearModal({ year: 2027, member: 'A' })).toBe(true);
  });

  it('localStorage inaccesible → fail-closed (no muestra, no crashea)', () => {
    Object.defineProperty(globalThis.window, 'localStorage', {
      value: {
        getItem: () => { throw new Error('denied'); },
        setItem: () => { throw new Error('denied'); },
      },
      configurable: true,
      writable: true,
    });
    expect(() => shouldShowNewYearModal({ year: 2027 })).not.toThrow();
    expect(shouldShowNewYearModal({ year: 2027 })).toBe(false);
  });
});
