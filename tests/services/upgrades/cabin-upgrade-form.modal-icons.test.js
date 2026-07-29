// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  resolveModalIcon, MODAL_ICONS, MODAL_ICON_FALLBACK, MODAL_IMAGE_KEYS,
} from '../../../design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js';
import { isImageSource } from '../../../design-system/molecules/modal/modal-avianca-layout.js';
import { UPGRADE_RESULT } from '../../../scripts/services/upgrades/upgrades-result.js';

describe('resolveModalIcon', () => {
  it('da una ilustración distinta a cada escenario (Figma 77-6794)', () => {
    const icons = [
      resolveModalIcon(UPGRADE_RESULT.NO_AVAILABILITY),
      resolveModalIcon(UPGRADE_RESULT.NOT_FOUND),
      resolveModalIcon(UPGRADE_RESULT.ERROR),
    ];
    expect(icons).toEqual([
      'modals/upgrade-no-availability',
      'modals/upgrade-not-found',
      'modals/upgrade-error',
    ]);
    expect(new Set(icons).size).toBe(3);
  });

  it('el valor del diccionario gana sobre la ilustración del repo', () => {
    expect(resolveModalIcon(UPGRADE_RESULT.ERROR, '/media_abc123.svg')).toBe('/media_abc123.svg');
    expect(resolveModalIcon(UPGRADE_RESULT.NOT_FOUND, 'modals/otro-icono')).toBe('modals/otro-icono');
  });

  it('el diccionario gana también sobre el override del bloque', () => {
    const fromCms = '/media_cms.svg';
    const fromBlock = 'https://cdn.example.com/bloque.png';
    expect(resolveModalIcon(UPGRADE_RESULT.ERROR, fromCms, fromBlock)).toBe(fromCms);
  });

  it('sin diccionario cae al override del bloque y luego al repo', () => {
    const fromBlock = 'https://cdn.example.com/bloque.png';
    expect(resolveModalIcon(UPGRADE_RESULT.ERROR, '', fromBlock)).toBe(fromBlock);
    expect(resolveModalIcon(UPGRADE_RESULT.ERROR, '  ', fromBlock)).toBe(fromBlock);
    expect(resolveModalIcon(UPGRADE_RESULT.ERROR, '')).toBe(MODAL_ICONS[UPGRADE_RESULT.ERROR]);
  });

  it('recorta el valor del diccionario (celdas con espacios)', () => {
    expect(resolveModalIcon(UPGRADE_RESULT.ERROR, '  /media_x.svg  ')).toBe('/media_x.svg');
  });

  it('ignora overrides vacíos y cae al icono del escenario', () => {
    const errorIcon = MODAL_ICONS[UPGRADE_RESULT.ERROR];
    expect(resolveModalIcon(UPGRADE_RESULT.ERROR, undefined, undefined)).toBe(errorIcon);
    expect(resolveModalIcon(UPGRADE_RESULT.ERROR, null, null)).toBe(errorIcon);
  });

  it('usa el icono heredado ante un resultado desconocido', () => {
    expect(resolveModalIcon('ALGO_NUEVO')).toBe(MODAL_ICON_FALLBACK);
    expect(resolveModalIcon(undefined)).toBe(MODAL_ICON_FALLBACK);
  });

  it('ELIGIBLE no tiene modal: no mapea a ilustración ni a key', () => {
    expect(MODAL_ICONS[UPGRADE_RESULT.ELIGIBLE]).toBeUndefined();
    expect(MODAL_IMAGE_KEYS[UPGRADE_RESULT.ELIGIBLE]).toBeUndefined();
  });

  it('cada escenario con modal tiene su key de diccionario', () => {
    expect(MODAL_IMAGE_KEYS).toEqual({
      [UPGRADE_RESULT.NO_AVAILABILITY]: 'cabinUpgradeForm.modalHighDemand.image',
      [UPGRADE_RESULT.NOT_FOUND]: 'cabinUpgradeForm.modalNotFound.image',
      [UPGRADE_RESULT.ERROR]: 'cabinUpgradeForm.modalError.image',
    });
  });
});

describe('isImageSource', () => {
  it('trata como imagen las rutas del sitio y las URLs', () => {
    expect(isImageSource('/media_abc123.svg')).toBe(true);
    expect(isImageSource('https://cdn.example.com/a.svg')).toBe(true);
    expect(isImageSource('http://cdn.example.com/a.png')).toBe(true);
    expect(isImageSource('//cdn.example.com/a.svg')).toBe(true);
    expect(isImageSource('data:image/svg+xml;base64,AAA')).toBe(true);
  });

  it('trata como sprite los nombres de icono', () => {
    expect(isImageSource('modals/upgrade-error')).toBe(false);
    expect(isImageSource('alert/success')).toBe(false);
    expect(isImageSource('person-icon')).toBe(false);
  });

  it('no explota con valores no-string', () => {
    expect(isImageSource(undefined)).toBe(false);
    expect(isImageSource(null)).toBe(false);
    expect(isImageSource(42)).toBe(false);
  });

  it('los defaults del repo se renderizan como sprite, no como <img>', () => {
    Object.values(MODAL_ICONS).forEach((name) => {
      expect(isImageSource(name)).toBe(false);
    });
    expect(isImageSource(MODAL_ICON_FALLBACK)).toBe(false);
  });
});
