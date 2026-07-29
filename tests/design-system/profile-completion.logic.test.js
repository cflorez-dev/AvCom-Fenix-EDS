import { describe, it, expect } from 'vitest';
import {
  donutBand, donutColor, donutArc,
} from '../../design-system/molecules/profile-completion-alert/profile-completion-alert.logic.js';

/**
 * Lógica del donut de completitud (1279361 · Paso 6, D35). Bordes de banda con
 * umbrales 50/80: rojo < 50, naranja 50–79, verde ≥ 80.
 */

describe('profile-completion · donutBand (D35, umbrales 50/80)', () => {
  it('rojo por debajo de warning', () => {
    expect(donutBand(0, 50, 80)).toBe('error');
    expect(donutBand(49, 50, 80)).toBe('error');
  });
  it('naranja entre warning (incl.) y positive (excl.)', () => {
    expect(donutBand(50, 50, 80)).toBe('warning');
    expect(donutBand(79, 50, 80)).toBe('warning');
  });
  it('verde en positive y por encima', () => {
    expect(donutBand(80, 50, 80)).toBe('positive');
    expect(donutBand(100, 50, 80)).toBe('positive');
  });
  it('umbrales por defecto (50/80)', () => {
    expect(donutBand(40)).toBe('error');
    expect(donutBand(65)).toBe('warning');
    expect(donutBand(90)).toBe('positive');
  });
});

describe('profile-completion · donutColor', () => {
  it('mapea banda → token de color', () => {
    expect(donutColor('error')).toBe('var(--alert-error-icon-bg)');
    expect(donutColor('warning')).toBe('var(--text-accent-warning)');
    expect(donutColor('positive')).toBe('var(--icon-accent-positive)');
  });
});

describe('profile-completion · donutArc', () => {
  it('0% → offset = circunferencia completa; 100% → offset 0', () => {
    const r = 52;
    const c = 2 * Math.PI * r;
    expect(donutArc(0, r).dashOffset).toBeCloseTo(c);
    expect(donutArc(100, r).dashOffset).toBeCloseTo(0);
    expect(donutArc(50, r).dashOffset).toBeCloseTo(c / 2);
  });
  it('clamp fuera de rango', () => {
    expect(donutArc(-10, 52).dashOffset).toBeCloseTo(2 * Math.PI * 52);
    expect(donutArc(150, 52).dashOffset).toBeCloseTo(0);
  });
});
