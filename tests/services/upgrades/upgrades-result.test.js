import { describe, it, expect } from 'vitest';
import {
  UPGRADE_RESULT, mapValidateResult, buildMmbRedirectUrl, normalizeName, resolveMmbLang,
  resolveMmbBaseUrl,
} from '../../../scripts/services/upgrades/upgrades-result.js';

const BODY_OK = {
  passengers: [{ firstName: 'LINA', lastName: 'MORALES', refNumber: '2' }],
  pnr: 'AYQQQS',
  segments: [
    { refNumber: '1', upgradeStatus: 'not_elegible' },
    { refNumber: '2', upgradeStatus: 'elegible' },
  ],
};

describe('normalizeName', () => {
  it('uppercases, trims, collapses spaces and strips diacritics', () => {
    expect(normalizeName('  Pérez  Gómez ')).toBe('PEREZ GOMEZ');
    expect(normalizeName('morales')).toBe('MORALES');
  });
});

describe('mapValidateResult', () => {
  it('ELIGIBLE cuando el apellido coincide y hay >=1 segmento elegible', () => {
    expect(mapValidateResult({
      ok: true, status: 200, body: BODY_OK, lastName: 'Morales',
    }))
      .toBe(UPGRADE_RESULT.ELIGIBLE);
  });
  it('apellido matchea con acentos/mayúsculas distintas', () => {
    expect(mapValidateResult({
      ok: true, status: 200, body: BODY_OK, lastName: ' moráles ',
    }))
      .toBe(UPGRADE_RESULT.ELIGIBLE);
  });
  it('NO_AVAILABILITY cuando coincide apellido pero 0 elegibles', () => {
    const body = { ...BODY_OK, segments: [{ refNumber: '1', upgradeStatus: 'not_elegible' }] };
    expect(mapValidateResult({
      ok: true, status: 200, body, lastName: 'MORALES',
    }))
      .toBe(UPGRADE_RESULT.NO_AVAILABILITY);
  });
  it('NOT_FOUND con el shape real de PNR inexistente (200, passengers/segments null)', () => {
    const body = { passengers: null, pnr: 'ZZZZZZ', segments: null };
    expect(mapValidateResult({
      ok: true, status: 200, body, lastName: 'MORALES',
    }))
      .toBe(UPGRADE_RESULT.NOT_FOUND);
  });
  it('NOT_FOUND cuando el apellido no coincide con ningún pasajero', () => {
    expect(mapValidateResult({
      ok: true, status: 200, body: BODY_OK, lastName: 'GARCIA',
    }))
      .toBe(UPGRADE_RESULT.NOT_FOUND);
  });
  it('NOT_FOUND defensivo ante HTTP 404', () => {
    expect(mapValidateResult({
      ok: false, status: 404, body: null, lastName: 'X',
    }))
      .toBe(UPGRADE_RESULT.NOT_FOUND);
  });
  it('ERROR ante 5xx, body inválido u otros 4xx', () => {
    expect(mapValidateResult({
      ok: false, status: 500, body: null, lastName: 'X',
    })).toBe(UPGRADE_RESULT.ERROR);
    expect(mapValidateResult({
      ok: false, status: 400, body: null, lastName: 'X',
    })).toBe(UPGRADE_RESULT.ERROR);
    expect(mapValidateResult({
      ok: true, status: 200, body: null, lastName: 'X',
    })).toBe(UPGRADE_RESULT.ERROR);
  });
});

describe('buildMmbRedirectUrl', () => {
  it('reemplaza {lang} y arma query pnr/lastname/flow', () => {
    const url = buildMmbRedirectUrl({
      baseUrl: 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class',
      lang: 'es',
      pnr: 'AYQQQS',
      lastName: 'Morales',
    });
    expect(url).toBe('https://gestiona.avianca.com/es/manage/upgrade-business-class?pnr=AYQQQS&lastname=Morales&flow=mmb');
  });
  it('encodea apellidos con espacios/acentos', () => {
    const url = buildMmbRedirectUrl({
      baseUrl: 'https://x.example/{lang}/p', lang: 'en', pnr: 'ABC123', lastName: 'De la Peña',
    });
    expect(url).toContain('lastname=De+la+Pe%C3%B1a');
    expect(url).toContain('/en/p?');
  });
  it('acepta baseUrl sin placeholder {lang} (se usa tal cual)', () => {
    const url = buildMmbRedirectUrl({
      baseUrl: 'https://x.example/es/p', lang: 'en', pnr: 'ABC123', lastName: 'Perez',
    });
    expect(url.startsWith('https://x.example/es/p?')).toBe(true);
  });
  it('aplica el langMap: fr redirige al sitio en en (VSTS 1301186)', () => {
    const url = buildMmbRedirectUrl({
      baseUrl: 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class',
      lang: 'fr',
      pnr: 'AYQQQS',
      lastName: 'Morales',
      langMap: { fr: 'en' },
    });
    expect(url).toBe('https://gestiona.avianca.com/en/manage/upgrade-business-class?pnr=AYQQQS&lastname=Morales&flow=mmb');
  });
  it('sin langMap se comporta igual que antes (fr queda fr)', () => {
    const url = buildMmbRedirectUrl({
      baseUrl: 'https://x.example/{lang}/p', lang: 'fr', pnr: 'ABC123', lastName: 'Perez',
    });
    expect(url).toContain('/fr/p?');
  });
  it('usa la URL propia del idioma cuando existe, con la query de siempre', () => {
    const url = buildMmbRedirectUrl({
      baseUrl: 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class',
      lang: 'fr',
      pnr: 'AYQQQS',
      lastName: 'Morales',
      langMap: { fr: 'en' },
      urlByLang: { fr: 'https://otrositio.com/fr-upgrades' },
    });
    expect(url).toBe('https://otrositio.com/fr-upgrades?pnr=AYQQQS&lastname=Morales&flow=mmb');
  });
  it('la URL propia también admite {lang}, que se resuelve con el mapa', () => {
    const url = buildMmbRedirectUrl({
      baseUrl: 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class',
      lang: 'fr',
      pnr: 'ABC123',
      lastName: 'Perez',
      langMap: { fr: 'en' },
      urlByLang: { fr: 'https://otrositio.com/{lang}/upgrades' },
    });
    expect(url).toContain('https://otrositio.com/en/upgrades?');
  });
});

describe('resolveMmbBaseUrl', () => {
  const BASE = 'https://gestiona.avianca.com/{lang}/manage/upgrade-business-class';
  const URL_BY_LANG = { fr: 'https://otrositio.com/fr-upgrades' };

  it('el idioma con URL propia gana sobre la URL base', () => {
    expect(resolveMmbBaseUrl('fr', { baseUrl: BASE, urlByLang: URL_BY_LANG }))
      .toBe('https://otrositio.com/fr-upgrades');
  });
  it('los idiomas sin URL propia usan la base', () => {
    expect(resolveMmbBaseUrl('es', { baseUrl: BASE, urlByLang: URL_BY_LANG })).toBe(BASE);
    expect(resolveMmbBaseUrl('en', { baseUrl: BASE, urlByLang: URL_BY_LANG })).toBe(BASE);
  });
  it('busca por el idioma del USUARIO, no por el ya mapeado', () => {
    // Con langMap fr→en, si buscara el override después de mapear iría a parar a
    // la key de inglés, que es justo lo contrario de "para francés usá esta URL".
    expect(resolveMmbBaseUrl('fr', {
      baseUrl: BASE,
      urlByLang: { en: 'https://no-deberia.com/en' },
    })).toBe(BASE);
  });
  it('normaliza espacios y mayúsculas del idioma', () => {
    expect(resolveMmbBaseUrl(' FR ', { baseUrl: BASE, urlByLang: URL_BY_LANG }))
      .toBe('https://otrositio.com/fr-upgrades');
  });
  it('sin overrides devuelve la base', () => {
    expect(resolveMmbBaseUrl('fr', { baseUrl: BASE })).toBe(BASE);
    expect(resolveMmbBaseUrl('fr', { baseUrl: BASE, urlByLang: {} })).toBe(BASE);
  });
  it('no cae en Object.prototype con cookies hostiles', () => {
    expect(resolveMmbBaseUrl('constructor', { baseUrl: BASE, urlByLang: URL_BY_LANG })).toBe(BASE);
    expect(resolveMmbBaseUrl('toString', { baseUrl: BASE, urlByLang: URL_BY_LANG })).toBe(BASE);
  });
});

describe('resolveMmbLang', () => {
  const MAP = { fr: 'en' };

  it('traduce el idioma que está en el mapa', () => {
    expect(resolveMmbLang('fr', MAP)).toBe('en');
  });
  it('deja pasar los idiomas que no están en el mapa', () => {
    expect(resolveMmbLang('es', MAP)).toBe('es');
    expect(resolveMmbLang('en', MAP)).toBe('en');
    expect(resolveMmbLang('pt', MAP)).toBe('pt');
    expect(resolveMmbLang('it', MAP)).toBe('it');
  });
  it('normaliza espacios y mayúsculas antes de buscar', () => {
    expect(resolveMmbLang(' FR ', MAP)).toBe('en');
  });
  it('no cae en Object.prototype con cookies hostiles', () => {
    // El idioma sale de la cookie `selected-language`, que el usuario controla.
    // Sin guarda, langMap['constructor'] devolvía una función y terminaba
    // interpolada en la URL.
    expect(resolveMmbLang('constructor', MAP)).toBe('constructor');
    expect(resolveMmbLang('toString', MAP)).toBe('toString');
    expect(resolveMmbLang('__proto__', MAP)).toBe('__proto__');
  });
  it('sin mapa o con entrada vacía devuelve lo que recibió', () => {
    expect(resolveMmbLang('fr')).toBe('fr');
    expect(resolveMmbLang('fr', {})).toBe('fr');
    expect(resolveMmbLang('', MAP)).toBe('');
    expect(resolveMmbLang(undefined, MAP)).toBe(undefined);
  });
});
