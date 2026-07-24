import { describe, it, expect } from 'vitest';
import { computeLoginButtonVariation } from '../../../design-system/organisms/user-session/use-login-button-variation.js';

describe('computeLoginButtonVariation (breakpoints Figma 14:31462 / 9:16935)', () => {
  it('≤767px → chip', () => {
    expect(computeLoginButtonVariation(320)).toBe('chip');
    expect(computeLoginButtonVariation(767)).toBe('chip');
  });

  it('768–1023px → full-button', () => {
    expect(computeLoginButtonVariation(768)).toBe('full-button');
    expect(computeLoginButtonVariation(900)).toBe('full-button');
    expect(computeLoginButtonVariation(1023)).toBe('full-button');
  });

  it('1024–1149px → chip (vuelve a chip: entra el nav)', () => {
    expect(computeLoginButtonVariation(1024)).toBe('chip');
    expect(computeLoginButtonVariation(1149)).toBe('chip');
  });

  it('≥1150px → full-button', () => {
    expect(computeLoginButtonVariation(1150)).toBe('full-button');
    expect(computeLoginButtonVariation(1440)).toBe('full-button');
  });
});
