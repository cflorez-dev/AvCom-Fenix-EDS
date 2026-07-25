import { describe, it, expect } from 'vitest';
import {
  paramToTab,
  tabToParam,
  DEFAULT_TAB,
  TAB_DATA,
  TAB_PAYMENTS,
  TAB_SETTINGS,
  TABS,
} from '../../../design-system/molecules/members-account-tabs/members-account-tabs.logic.js';

describe('members-account-tabs.logic · paramToTab (normalización cross-idioma)', () => {
  it('acepta el param de datos en los 4 idiomas', () => {
    expect(paramToTab('datos')).toBe(TAB_DATA); // es
    expect(paramToTab('data')).toBe(TAB_DATA); // en
    expect(paramToTab('donnees')).toBe(TAB_DATA); // fr
    expect(paramToTab('dados')).toBe(TAB_DATA); // pt
  });

  it('acepta el param de pagos en los 4 idiomas', () => {
    expect(paramToTab('pagos')).toBe(TAB_PAYMENTS); // es
    expect(paramToTab('payments')).toBe(TAB_PAYMENTS); // en
    expect(paramToTab('paiements')).toBe(TAB_PAYMENTS); // fr
    expect(paramToTab('pagamentos')).toBe(TAB_PAYMENTS); // pt
  });

  it('acepta el param de ajustes en los 4 idiomas', () => {
    expect(paramToTab('ajustes')).toBe(TAB_SETTINGS); // es
    expect(paramToTab('settings')).toBe(TAB_SETTINGS); // en
    expect(paramToTab('parametres')).toBe(TAB_SETTINGS); // fr
    expect(paramToTab('configuracoes')).toBe(TAB_SETTINGS); // pt
  });

  it('es case-insensitive (mayúsculas / espacios)', () => {
    expect(paramToTab('PAYMENTS')).toBe(TAB_PAYMENTS);
    expect(paramToTab('  Ajustes  ')).toBe(TAB_SETTINGS);
    expect(paramToTab('Data')).toBe(TAB_DATA);
  });

  it('valor inválido → tab por defecto (data), sin error', () => {
    expect(paramToTab('foobar')).toBe(DEFAULT_TAB);
    expect(paramToTab('datoss')).toBe(DEFAULT_TAB);
  });

  it('vacío / null / undefined / no-string → tab por defecto', () => {
    expect(paramToTab('')).toBe(DEFAULT_TAB);
    expect(paramToTab('   ')).toBe(DEFAULT_TAB);
    expect(paramToTab(null)).toBe(DEFAULT_TAB);
    expect(paramToTab(undefined)).toBe(DEFAULT_TAB);
    expect(paramToTab(42)).toBe(DEFAULT_TAB);
  });

  it('honra el valor de param autorado del locale (labels override)', () => {
    const labels = {
      tabParamData: 'micuenta',
      tabParamPayments: 'billetera',
      tabParamSettings: 'preferencias',
    };
    expect(paramToTab('micuenta', labels)).toBe(TAB_DATA);
    expect(paramToTab('BILLETERA', labels)).toBe(TAB_PAYMENTS);
    expect(paramToTab('preferencias', labels)).toBe(TAB_SETTINGS);
    // los defaults cross-idioma siguen funcionando junto al override
    expect(paramToTab('payments', labels)).toBe(TAB_PAYMENTS);
  });

  it('DEFAULT_TAB es "data" y TABS tiene las 3 keys', () => {
    expect(DEFAULT_TAB).toBe(TAB_DATA);
    expect(TABS).toEqual([TAB_DATA, TAB_PAYMENTS, TAB_SETTINGS]);
  });
});

describe('members-account-tabs.logic · tabToParam (escritura por locale)', () => {
  it('sin labels → canónico es (datos/pagos/ajustes)', () => {
    expect(tabToParam(TAB_DATA)).toBe('datos');
    expect(tabToParam(TAB_PAYMENTS)).toBe('pagos');
    expect(tabToParam(TAB_SETTINGS)).toBe('ajustes');
  });

  it('con labels autorados → usa el valor del locale', () => {
    const en = {
      tabParamData: 'data',
      tabParamPayments: 'payments',
      tabParamSettings: 'settings',
    };
    expect(tabToParam(TAB_DATA, en)).toBe('data');
    expect(tabToParam(TAB_PAYMENTS, en)).toBe('payments');
    expect(tabToParam(TAB_SETTINGS, en)).toBe('settings');
  });

  it('key desconocida → cae a datos (default)', () => {
    expect(tabToParam('whatever')).toBe('datos');
  });

  it('round-trip: tabToParam → paramToTab preserva la key en fr', () => {
    const fr = {
      tabParamData: 'donnees',
      tabParamPayments: 'paiements',
      tabParamSettings: 'parametres',
    };
    expect(paramToTab(tabToParam(TAB_DATA, fr), fr)).toBe(TAB_DATA);
    expect(paramToTab(tabToParam(TAB_PAYMENTS, fr), fr)).toBe(TAB_PAYMENTS);
    expect(paramToTab(tabToParam(TAB_SETTINGS, fr), fr)).toBe(TAB_SETTINGS);
  });
});
