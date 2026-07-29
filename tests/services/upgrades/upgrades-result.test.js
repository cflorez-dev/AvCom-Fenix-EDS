import { describe, it, expect } from 'vitest';
import {
  UPGRADE_RESULT, mapValidateResult, buildMmbRedirectUrl, normalizeName,
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
});
