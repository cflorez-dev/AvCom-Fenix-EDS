/* global globalThis */
import {
  describe, it, expect, afterEach,
} from 'vitest';
import {
  getMockMemberMetrics,
  getEmptyMemberMetrics,
  getMembersDataMockState,
  isMembersDataMockEnabled,
  MEMBERS_DATA_STATES,
} from '../../../scripts/services/members/members-data.mock.js';

describe('members-data.mock · fixtures (shape del VM de métricas)', () => {
  it('gold → 2 condiciones elite + millas/fechas pobladas', () => {
    const m = getMockMemberMetrics(MEMBERS_DATA_STATES.GOLD);
    expect(m.totalMiles).toBe(18056);
    expect(m.milesExpiryDate).toBe('2026-12-31');
    expect(m.elite.conditions).toHaveLength(2);
    expect(m.elite.tierTarget).toBe('gold');
  });

  it('magno (tier máximo) → UNA sola condición ("avianca-miles")', () => {
    const m = getMockMemberMetrics(MEMBERS_DATA_STATES.MAGNO);
    expect(m.elite.conditions).toHaveLength(1);
    expect(m.elite.conditions[0].key).toBe('avianca-miles');
  });

  it('empty → todos los campos null (empty state por campo)', () => {
    const m = getMockMemberMetrics(MEMBERS_DATA_STATES.EMPTY);
    expect(m).toEqual({
      totalMiles: null, milesExpiryDate: null, statusExpiry: null, elite: null,
    });
  });

  it('partial → millas sí, elite ausente', () => {
    const m = getMockMemberMetrics(MEMBERS_DATA_STATES.PARTIAL);
    expect(m.totalMiles).toBe(18056);
    expect(m.elite).toBeNull();
  });

  it('estado desconocido → cae al happy-path (gold)', () => {
    expect(getMockMemberMetrics('no-existe').elite.conditions).toHaveLength(2);
  });

  it('devuelve un clon profundo (mutar el resultado no afecta llamadas siguientes)', () => {
    const a = getMockMemberMetrics(MEMBERS_DATA_STATES.GOLD);
    a.totalMiles = 1;
    a.elite.conditions.pop();
    const b = getMockMemberMetrics(MEMBERS_DATA_STATES.GOLD);
    expect(b.totalMiles).toBe(18056);
    expect(b.elite.conditions).toHaveLength(2);
  });

  it('getEmptyMemberMetrics → todos null, objeto nuevo cada vez', () => {
    const e1 = getEmptyMemberMetrics();
    const e2 = getEmptyMemberMetrics();
    expect(e1).toEqual({
      totalMiles: null, milesExpiryDate: null, statusExpiry: null, elite: null,
    });
    expect(e1).not.toBe(e2);
  });
});

describe('members-data.mock · flag de activación', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('sin window → null (producción, sin mock)', () => {
    expect(getMembersDataMockState()).toBeNull();
    expect(isMembersDataMockEnabled()).toBe(false);
  });

  it('?membersMock=silver en la URL → "silver"', () => {
    globalThis.window = { location: { search: '?membersMock=silver' } };
    expect(getMembersDataMockState()).toBe('silver');
    expect(isMembersDataMockEnabled()).toBe(true);
  });

  it('window.__MEMBERS_DATA_MOCK__ → ese estado', () => {
    globalThis.window = { location: { search: '' }, __MEMBERS_DATA_MOCK__: 'magno' };
    expect(getMembersDataMockState()).toBe('magno');
  });
});
