// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach,
} from 'vitest';
import {
  optInsStorageKey, resolveOptIns, readOptIns, writeOptIn,
  verificationMethodOptions, forceBlankLinks, methodLabel,
} from '../../../design-system/organisms/members-account-settings/members-account-settings.logic.js';

/**
 * Lógica pura del tab Ajustes (1279363): opt-ins interinos (config + storage +
 * i18n, SIN PII), opciones de método de verificación y saneo de links.
 */

const LABELS = {
  optInPromotionsTitle: 'Promociones',
  optInPromotionsCopy: 'Recibe promociones de Avianca.',
  optInAccountTitle: 'Cuenta',
  optInAccountCopy: 'Alertas de tu cuenta.',
  optInPartnersTitle: 'Aliados',
  optInPartnersCopy: 'Según la <a href="/legal/privacy-policy">Política</a>.',
  methodSms: 'SMS',
  methodEmail: 'Correo electrónico',
  methodAuthenticator: 'Microsoft Authenticator',
};

const CONFIG_OPTINS = [
  { id: 'promotions', defaultOn: true },
  { id: 'account', defaultOn: true },
  { id: 'partners', defaultOn: true },
];

describe('members-account-settings.logic · optInsStorageKey', () => {
  it('incluye membershipNumber (SIN PII); null → anon', () => {
    expect(optInsStorageKey('99999999901')).toBe('members.account.optins.99999999901');
    expect(optInsStorageKey(null)).toBe('members.account.optins.anon');
  });
});

describe('members-account-settings.logic · resolveOptIns', () => {
  it('usa defaultOn cuando no hay override persistido', () => {
    const res = resolveOptIns(CONFIG_OPTINS, {}, LABELS);
    expect(res.map((o) => o.id)).toEqual(['promotions', 'account', 'partners']);
    expect(res.every((o) => o.checked === true)).toBe(true);
    expect(res[0].title).toBe('Promociones');
  });
  it('el mapa persistido overridea el defaultOn', () => {
    const res = resolveOptIns(CONFIG_OPTINS, { promotions: false, partners: false }, LABELS);
    expect(res.find((o) => o.id === 'promotions').checked).toBe(false);
    expect(res.find((o) => o.id === 'account').checked).toBe(true);
    expect(res.find((o) => o.id === 'partners').checked).toBe(false);
  });
  it('ítem sin label i18n → se omite (defensivo)', () => {
    const res = resolveOptIns([...CONFIG_OPTINS, { id: 'ghost', defaultOn: true }], {}, LABELS);
    expect(res.map((o) => o.id)).toEqual(['promotions', 'account', 'partners']);
  });
  it('el copy con <a> recibe target/rel (forceBlankLinks)', () => {
    const res = resolveOptIns(CONFIG_OPTINS, {}, LABELS);
    const partners = res.find((o) => o.id === 'partners');
    expect(partners.copyHtml).toContain('target="_blank"');
    expect(partners.copyHtml).toContain('rel="noopener noreferrer"');
  });
});

describe('members-account-settings.logic · readOptIns / writeOptIn (INTERINO, SIN PII)', () => {
  beforeEach(() => { localStorage.clear(); });

  it('roundtrip: writeOptIn persiste y readOptIns lee el mapa', () => {
    writeOptIn('123', 'promotions', false);
    writeOptIn('123', 'account', true);
    expect(readOptIns('123')).toEqual({ promotions: false, account: true });
  });
  it('el objeto persistido SOLO tiene ids→boolean (cero PII)', () => {
    writeOptIn('123', 'promotions', true);
    const raw = JSON.parse(localStorage.getItem(optInsStorageKey('123')));
    expect(Object.values(raw).every((v) => typeof v === 'boolean')).toBe(true);
    expect(raw).toEqual({ promotions: true });
  });
  it('readOptIns descarta valores no-boolean (corrupción/PII)', () => {
    localStorage.setItem(optInsStorageKey('123'), JSON.stringify({ promotions: true, leaked: 'ana@x.com' }));
    expect(readOptIns('123')).toEqual({ promotions: true });
  });
  it('sin nada persistido → {}', () => {
    expect(readOptIns('nope')).toEqual({});
  });
});

describe('members-account-settings.logic · verificationMethodOptions / methodLabel', () => {
  it('mapea los 3 métodos a { value, label }', () => {
    const opts = verificationMethodOptions(['sms', 'email', 'authenticator'], LABELS);
    expect(opts).toEqual([
      { value: 'sms', label: 'SMS' },
      { value: 'email', label: 'Correo electrónico' },
      { value: 'authenticator', label: 'Microsoft Authenticator' },
    ]);
  });
  it('método desconocido → se omite', () => {
    expect(verificationMethodOptions(['sms', 'fax'], LABELS).map((o) => o.value)).toEqual(['sms']);
  });
  it('methodLabel resuelve la etiqueta; desconocido → vacío', () => {
    expect(methodLabel('email', LABELS)).toBe('Correo electrónico');
    expect(methodLabel('fax', LABELS)).toBe('');
  });
});

describe('members-account-settings.logic · forceBlankLinks', () => {
  it('agrega target + rel a <a> sin target', () => {
    const out = forceBlankLinks('Ver <a href="/x">link</a>.');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });
  it('no duplica target si ya existe', () => {
    const out = forceBlankLinks('<a href="/x" target="_self">link</a>');
    expect(out).toBe('<a href="/x" target="_self">link</a>');
  });
  it('sin <a> → intacto; vacío → ""', () => {
    expect(forceBlankLinks('solo texto')).toBe('solo texto');
    expect(forceBlankLinks('')).toBe('');
  });
});
