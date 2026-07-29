import {
  describe, it, expect, beforeAll,
} from 'vitest';

// `computeLoginButtonVariation` ahora decide por `matchMedia` (no por ancho): las
// MediaQueryList se memoizan al IMPORTAR el módulo. Por eso mockeamos
// `window.matchMedia` ANTES del import dinámico, con `matches` como getter que
// evalúa la query contra un ancho virtual `vw` mutable → cambiamos `vw` y
// llamamos la función sin re-importar. (El impl viejo tomaba el ancho por
// parámetro; se refactorizó a matchMedia para eliminar el off-by-one de DPR
// fraccional en Windows — ver doc del módulo.)
const implPath = '../../../design-system/organisms/user-session/use-login-button-variation.js';

let vw = 0;

// Evalúa una media query CSS simple ("(max-width: Npx)" y/o "(min-width: Npx)")
// contra el ancho virtual `vw`.
const matchesQuery = (q, w) => {
  let ok = true;
  const min = q.match(/min-width:\s*([\d.]+)px/);
  const max = q.match(/max-width:\s*([\d.]+)px/);
  if (min) ok = ok && w >= parseFloat(min[1]);
  if (max) ok = ok && w <= parseFloat(max[1]);
  return ok;
};

let computeLoginButtonVariation;

beforeAll(async () => {
  globalThis.window = globalThis.window || {};
  globalThis.window.matchMedia = (query) => ({
    media: query,
    get matches() { return matchesQuery(query, vw); },
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  ({ computeLoginButtonVariation } = await import(implPath));
});

// Helper: fija el ancho virtual y devuelve la variante calculada.
const at = (w) => { vw = w; return computeLoginButtonVariation(); };

describe('computeLoginButtonVariation (breakpoints Figma 14:31462 / 9:16935)', () => {
  it('≤767px → chip', () => {
    expect(at(320)).toBe('chip');
    expect(at(767)).toBe('chip');
  });

  it('768–1023px → full-button', () => {
    expect(at(768)).toBe('full-button');
    expect(at(900)).toBe('full-button');
    expect(at(1023)).toBe('full-button');
  });

  it('1024–1149px → chip (vuelve a chip: entra el nav)', () => {
    expect(at(1024)).toBe('chip');
    expect(at(1149)).toBe('chip');
  });

  it('≥1150px → full-button', () => {
    expect(at(1150)).toBe('full-button');
    expect(at(1440)).toBe('full-button');
  });
});
