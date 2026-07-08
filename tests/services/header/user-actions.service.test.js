import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const servicePath = '../../../scripts/services/header/user-actions.service.js';
const targetPath = '../../../scripts/utils/target-filter.js';

// Mockea las deps pesadas (preact/Actions/…) para importar el módulo, y `shouldShowByTargeting`
// para controlar qué bloque "matchea" en cada caso.
const mockDeps = (shouldShow) => {
  vi.doMock('@dropins/tools/preact.js', () => ({ h: () => {}, render: () => {} }));
  vi.doMock('htm', () => ({ default: { bind: () => () => null } }));
  vi.doMock('../../../design-system/organisms/header/actions/actions.js', () => ({ Actions: () => null }));
  vi.doMock('../../../scripts/services/members/session.store.js', () => ({ getSession: () => ({ status: 'anonymous' }) }));
  vi.doMock('../../../scripts/services/header/language-country-selector.js', () => ({ getStoredLanguage: () => 'pt' }));
  vi.doMock('../../../scripts/utils/aem-data.js', () => ({ fetchAEMData: vi.fn().mockResolvedValue({ data: [] }) }));
  vi.doMock(targetPath, () => ({ shouldShowByTargeting: shouldShow }));
};

describe('header/user-actions.service', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('specificity: país=4, idioma=2, ambos=6, sin targeting=0', async () => {
    mockDeps(() => true);
    const { specificity } = await import(servicePath);
    expect(specificity({ targetCountries: 'br', targetLanguages: 'pt' })).toBe(6);
    expect(specificity({ targetCountries: 'br', targetLanguages: '' })).toBe(4);
    expect(specificity({ targetCountries: '', targetLanguages: 'pt' })).toBe(2);
    expect(specificity({ targetCountries: '', targetLanguages: '' })).toBe(0);
  });

  it('pickWinner: gana el MÁS específico entre los que matchean (BR sobre general)', async () => {
    // En BR: matchean el general (sin targeting) Y el bloque br.
    mockDeps((tc) => !tc || tc === 'br');
    const { pickWinner } = await import(servicePath);
    const general = { targetCountries: '', targetLanguages: '', tag: 'general' };
    const br = { targetCountries: 'br', targetLanguages: 'pt', tag: 'br' };
    expect(pickWinner([general, br]).tag).toBe('br'); // br=6 gana sobre general=0
  });

  it('pickWinner: si el específico NO matchea, gana el general (caso CO)', async () => {
    // En CO: el bloque br NO matchea; solo el general.
    mockDeps((tc) => !tc);
    const { pickWinner } = await import(servicePath);
    const general = { targetCountries: '', targetLanguages: '', tag: 'general' };
    const br = { targetCountries: 'br', targetLanguages: 'pt', tag: 'br' };
    expect(pickWinner([general, br]).tag).toBe('general');
  });

  it('pickWinner: null si ninguno matchea', async () => {
    mockDeps(() => false);
    const { pickWinner } = await import(servicePath);
    expect(pickWinner([{ targetCountries: 'br', targetLanguages: '' }])).toBeNull();
  });

  it('pickWinner: empate → gana el primero registrado (orden DOM)', async () => {
    mockDeps(() => true); // ambos matchean, misma especificidad (ambos solo país)
    const { pickWinner } = await import(servicePath);
    const a = { targetCountries: 'co', targetLanguages: '', tag: 'a' };
    const b = { targetCountries: 'ar', targetLanguages: '', tag: 'b' };
    expect(pickWinner([a, b]).tag).toBe('a');
  });
});
