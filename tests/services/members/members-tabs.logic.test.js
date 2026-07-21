import { describe, it, expect } from 'vitest';
import {
  paramToTab,
  tabToParam,
  DEFAULT_TAB,
  TAB_PROGRESS,
  TAB_BENEFITS,
} from '../../../design-system/molecules/members-tabs/members-tabs.logic.js';

describe('members-tabs.logic · paramToTab (normalización cross-idioma, T3)', () => {
  it('acepta el param de progreso en los 4 idiomas', () => {
    expect(paramToTab('progreso')).toBe(TAB_PROGRESS); // es
    expect(paramToTab('progress')).toBe(TAB_PROGRESS); // en
    expect(paramToTab('progresso')).toBe(TAB_PROGRESS); // pt
    expect(paramToTab('progres')).toBe(TAB_PROGRESS); // fr
  });

  it('acepta el param de beneficios en los 4 idiomas', () => {
    expect(paramToTab('beneficios')).toBe(TAB_BENEFITS); // es / pt
    expect(paramToTab('benefits')).toBe(TAB_BENEFITS); // en
    expect(paramToTab('avantages')).toBe(TAB_BENEFITS); // fr
  });

  it('es case-insensitive (mayúsculas / mixto)', () => {
    expect(paramToTab('BENEFITS')).toBe(TAB_BENEFITS);
    expect(paramToTab('Progreso')).toBe(TAB_PROGRESS);
    expect(paramToTab('  Avantages  ')).toBe(TAB_BENEFITS);
  });

  it('valor inválido → tab por defecto (progress), sin error', () => {
    expect(paramToTab('foobar')).toBe(DEFAULT_TAB);
    expect(paramToTab('progresooo')).toBe(DEFAULT_TAB);
  });

  it('vacío / null / undefined / no-string → tab por defecto', () => {
    expect(paramToTab('')).toBe(DEFAULT_TAB);
    expect(paramToTab('   ')).toBe(DEFAULT_TAB);
    expect(paramToTab(null)).toBe(DEFAULT_TAB);
    expect(paramToTab(undefined)).toBe(DEFAULT_TAB);
    expect(paramToTab(42)).toBe(DEFAULT_TAB);
  });

  it('honra el valor de param autorado del locale (labels override)', () => {
    const labels = { tabParamProgress: 'avance', tabParamBenefits: 'ventajas' };
    expect(paramToTab('avance', labels)).toBe(TAB_PROGRESS);
    expect(paramToTab('VENTAJAS', labels)).toBe(TAB_BENEFITS);
    // los defaults cross-idioma siguen funcionando junto al override
    expect(paramToTab('benefits', labels)).toBe(TAB_BENEFITS);
  });
});

describe('members-tabs.logic · tabToParam (escritura por locale)', () => {
  it('sin labels → canónico es (progreso/beneficios)', () => {
    expect(tabToParam(TAB_PROGRESS)).toBe('progreso');
    expect(tabToParam(TAB_BENEFITS)).toBe('beneficios');
  });

  it('con labels autorados → usa el valor del locale', () => {
    const en = { tabParamProgress: 'progress', tabParamBenefits: 'benefits' };
    expect(tabToParam(TAB_PROGRESS, en)).toBe('progress');
    expect(tabToParam(TAB_BENEFITS, en)).toBe('benefits');
  });

  it('key desconocida → cae a progreso (default)', () => {
    expect(tabToParam('whatever')).toBe('progreso');
  });

  it('round-trip: tabToParam → paramToTab preserva la key', () => {
    const fr = { tabParamProgress: 'progres', tabParamBenefits: 'avantages' };
    expect(paramToTab(tabToParam(TAB_PROGRESS, fr), fr)).toBe(TAB_PROGRESS);
    expect(paramToTab(tabToParam(TAB_BENEFITS, fr), fr)).toBe(TAB_BENEFITS);
  });
});
