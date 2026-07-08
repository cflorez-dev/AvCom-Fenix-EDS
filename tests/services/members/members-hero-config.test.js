import { describe, it, expect } from 'vitest';
import {
  mergeHeroConfig,
  getDefaultHeroQuickActions,
} from '../../../scripts/services/members/members-config.js';
import { normalizeMembersCF } from '../../../scripts/services/members/members-cf.service.js';

const BASE = { defaultState: 'collapsed', borderAccentColor: null, toggleDurationMs: 300 };
const DEFAULTS = [
  { key: 'a', label: 'A', sortOrder: 1 },
  { key: 'b', label: 'B', sortOrder: 2 },
];

describe('members-config · mergeHeroConfig (defaults + CF override)', () => {
  it('sin CF → defaults estructurales + quick actions per-locale', () => {
    const m = mergeHeroConfig(BASE, DEFAULTS, null);
    expect(m.defaultState).toBe('collapsed');
    expect(m.quickActions).toEqual(DEFAULTS);
  });

  it('CF sobrescribe defaultState pero conserva quick actions default', () => {
    const m = mergeHeroConfig(BASE, DEFAULTS, { defaultState: 'expanded' });
    expect(m.defaultState).toBe('expanded');
    expect(m.quickActions).toEqual(DEFAULTS);
  });

  it('CF con quickActions no vacío → ganan las del CF', () => {
    const cfQa = [{ key: 'cf', label: 'CF', sortOrder: 1 }];
    const m = mergeHeroConfig(BASE, DEFAULTS, { quickActions: cfQa });
    expect(m.quickActions).toEqual(cfQa);
  });

  it('CF con quickActions vacío → cae a defaults (fail-soft)', () => {
    const m = mergeHeroConfig(BASE, DEFAULTS, { quickActions: [] });
    expect(m.quickActions).toEqual(DEFAULTS);
  });
});

describe('members-config · getDefaultHeroQuickActions', () => {
  it('es → 4 acciones con keys esperadas', () => {
    const qa = getDefaultHeroQuickActions('es');
    expect(qa).toHaveLength(4);
    expect(qa.map((a) => a.key)).toEqual([
      'book-with-miles', 'upgrade-business', 'lounges', 'lifemiles-plus',
    ]);
  });
  it('idioma desconocido → cae a pt (4 acciones)', () => {
    expect(getDefaultHeroQuickActions('zz')).toHaveLength(4);
  });
  it('devuelve clones (mutar uno no afecta otra llamada)', () => {
    const a = getDefaultHeroQuickActions('es');
    a[0].label = 'mutado';
    expect(getDefaultHeroQuickActions('es')[0].label).toBe('Reserva con millas');
  });
});

describe('members-cf.service · normalizeMembersCF (mapeo hero, gaps #8/#12)', () => {
  it('item sin hero → no emite la clave hero (deja ver el default de APP_CONFIG)', () => {
    expect(normalizeMembersCF({}).hero).toBeUndefined();
  });

  it('item null → null', () => {
    expect(normalizeMembersCF(null)).toBeNull();
  });

  it('hero del CF → proyecta estructurales + quickActions ordenadas por sortOrder', () => {
    const out = normalizeMembersCF({
      hero: {
        defaultState: 'expanded',
        borderAccentColor: '#fff000',
        quickActions: [
          { key: 'b', label: 'B', sortOrder: 2 },
          { key: 'a', label: 'A', sortOrder: 1 },
        ],
      },
    });
    expect(out.hero.defaultState).toBe('expanded');
    expect(out.hero.borderAccentColor).toBe('#fff000');
    expect(out.hero.quickActions.map((q) => q.key)).toEqual(['a', 'b']);
  });
});
