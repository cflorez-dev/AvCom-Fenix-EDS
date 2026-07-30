// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  collectModalIllustrations,
  MODAL_ICONS,
} from '../../../design-system/organisms/forms/cabin-upgrade-form/cabin-upgrade-form.js';
import { UPGRADE_RESULT } from '../../../scripts/services/upgrades/upgrades-result.js';

const SPRITES_DEL_REPO = [
  MODAL_ICONS[UPGRADE_RESULT.NO_AVAILABILITY],
  MODAL_ICONS[UPGRADE_RESULT.NOT_FOUND],
  MODAL_ICONS[UPGRADE_RESULT.ERROR],
];

// Las ilustraciones de los modales se descargan en el instante en que el modal se
// abre. Para el modal de ERROR eso es justo cuando la red puede estar caída, y un
// fallo de red deja el icono vacío el resto de la sesión (el cache de fallos del
// atom Icon no se limpia). Precargarlas al montar el formulario, con la página
// recién cargada, evita depender de la red al abrir.
describe('collectModalIllustrations — qué precargar', () => {
  it('sin diccionario devuelve los 3 sprites del repo, que son el fallback garantizado', () => {
    const { sprites, images } = collectModalIllustrations();

    expect(sprites.sort()).toEqual([...SPRITES_DEL_REPO].sort());
    expect(images).toEqual([]);
  });

  it('separa las URLs autoradas de los nombres de sprite', () => {
    const { sprites, images } = collectModalIllustrations({
      highDemandImage: 'https://cdn.example.com/alta-demanda.svg',
      notFoundImage: 'modals/otro-sprite',
      errorImage: '/media_abc123.svg',
    });

    expect(sprites).toEqual(['modals/otro-sprite']);
    expect(images.sort()).toEqual(['/media_abc123.svg', 'https://cdn.example.com/alta-demanda.svg']);
  });

  it('el valor autorado reemplaza al sprite del repo, no se suma', () => {
    const { sprites } = collectModalIllustrations({ errorImage: 'modals/error-propio' });

    expect(sprites).toContain('modals/error-propio');
    expect(sprites).not.toContain(MODAL_ICONS[UPGRADE_RESULT.ERROR]);
    // los otros dos siguen siendo los del repo
    expect(sprites).toContain(MODAL_ICONS[UPGRADE_RESULT.NO_AVAILABILITY]);
    expect(sprites).toContain(MODAL_ICONS[UPGRADE_RESULT.NOT_FOUND]);
  });

  it('respeta el override del bloque cuando no hay valor en el diccionario', () => {
    const { images, sprites } = collectModalIllustrations({}, 'https://cdn.example.com/bloque.png');

    expect(images).toEqual(['https://cdn.example.com/bloque.png']);
    expect(sprites).toEqual([]);
  });

  it('no duplica cuando los tres modales resuelven a lo mismo', () => {
    const { images } = collectModalIllustrations({}, '/media_unica.svg');

    expect(images).toHaveLength(1);
  });

  it('ignora valores vacíos o en blanco del diccionario y cae al sprite del repo', () => {
    const { sprites, images } = collectModalIllustrations({
      highDemandImage: '',
      notFoundImage: '   ',
      errorImage: undefined,
    });

    expect(sprites.sort()).toEqual([...SPRITES_DEL_REPO].sort());
    expect(images).toEqual([]);
  });

  it('no explota con entradas raras', () => {
    expect(() => collectModalIllustrations(null)).not.toThrow();
    expect(() => collectModalIllustrations(undefined, null)).not.toThrow();
    expect(collectModalIllustrations(null).sprites).toHaveLength(3);
  });

  it('cubre exactamente los 3 escenarios con modal, ni más ni menos', () => {
    const { sprites, images } = collectModalIllustrations();

    expect(sprites.length + images.length).toBe(3);
    // ELIGIBLE no tiene modal, así que no aporta ilustración
    expect(sprites).not.toContain(MODAL_ICONS[UPGRADE_RESULT.ELIGIBLE]);
  });
});
