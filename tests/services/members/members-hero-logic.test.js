import { describe, it, expect } from 'vitest';
import {
  resolveInitialExpanded,
  isEliteConditionComplete,
  isAllEliteComplete,
  eliteVariant,
} from '../../../design-system/helpers/members-hero-logic.js';

describe('members-hero-logic · resolveInitialExpanded (toggle persistence, P2=A)', () => {
  it('valor persistido "true" gana sobre el default', () => {
    expect(resolveInitialExpanded('true', 'collapsed')).toBe(true);
  });
  it('valor persistido "false" gana sobre el default', () => {
    expect(resolveInitialExpanded('false', 'expanded')).toBe(false);
  });
  it('sin persistido → cae al default del CF (expanded)', () => {
    expect(resolveInitialExpanded(null, 'expanded')).toBe(true);
  });
  it('sin persistido → cae al default del CF (collapsed)', () => {
    expect(resolveInitialExpanded(null, 'collapsed')).toBe(false);
  });
  it('sin persistido ni default → collapsed (false)', () => {
    expect(resolveInitialExpanded(undefined, undefined)).toBe(false);
  });
});

describe('members-hero-logic · estados de la barra elite', () => {
  it('condición completa (value ≥ goal, goal > 0) → true', () => {
    expect(isEliteConditionComplete({ value: 8000, goal: 8000 })).toBe(true);
    expect(isEliteConditionComplete({ value: 9000, goal: 8000 })).toBe(true);
  });
  it('condición en progreso → false', () => {
    expect(isEliteConditionComplete({ value: 4000, goal: 8000 })).toBe(false);
  });
  it('goal 0 (sin meta) → false (no se considera completa)', () => {
    expect(isEliteConditionComplete({ value: 0, goal: 0 })).toBe(false);
  });

  it('TODAS completas → true (switch title "Mantener" → "Disfruta")', () => {
    expect(isAllEliteComplete([
      { value: 20000, goal: 20000 },
      { value: 8000, goal: 8000 },
    ])).toBe(true);
  });
  it('alguna en progreso → false (sigue "Mantener")', () => {
    expect(isAllEliteComplete([
      { value: 11460, goal: 20000 },
      { value: 8000, goal: 8000 },
    ])).toBe(false);
  });
  it('Magno (1 sola condición) completa → true', () => {
    expect(isAllEliteComplete([{ value: 60000, goal: 60000 }])).toBe(true);
  });
  it('sin condiciones → false', () => {
    expect(isAllEliteComplete([])).toBe(false);
    expect(isAllEliteComplete(null)).toBe(false);
  });
});

describe('members-hero-logic · eliteVariant (color por condición)', () => {
  it('"avianca-miles" → magenta', () => {
    expect(eliteVariant('avianca-miles')).toBe('magenta');
  });
  it('"qualifying-miles" y cualquier otra → navy', () => {
    expect(eliteVariant('qualifying-miles')).toBe('navy');
    expect(eliteVariant('whatever')).toBe('navy');
  });
});
