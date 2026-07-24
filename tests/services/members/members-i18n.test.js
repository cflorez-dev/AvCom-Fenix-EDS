import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const i18nPath = '../../../scripts/services/members/members-i18n.js';
const aemDataPath = '../../../scripts/utils/aem-data.js';
const langPath = '../../../scripts/services/header/language-country-selector.js';

const mockDeps = ({ lang = 'es', data = null, rejects = false } = {}) => {
  vi.doMock(langPath, () => ({ getStoredLanguage: () => lang }));
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: rejects
      ? vi.fn().mockRejectedValue(new Error('down'))
      : vi.fn().mockResolvedValue(data ? { data } : { data: [] }),
  }));
};

describe('members/members-i18n', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('lee los labels autorados del spreadsheet por Key', async () => {
    mockDeps({
      lang: 'es',
      data: [
        { Key: 'members.login.signIn', Text: 'Entrar' },
        { Key: 'members.logout.label', Text: 'Salir' },
        { Key: 'members.header.account', Text: 'Mi perfil LM' },
        { Key: 'members.header.profileTooltip', Text: 'Ver perfil' },
      ],
    });
    const { loadMembersLabels } = await import(i18nPath);
    const labels = await loadMembersLabels();
    expect(labels).toEqual({
      signIn: 'Entrar', logout: 'Salir', account: 'Mi perfil LM', profileTooltip: 'Ver perfil', opensInNewWindow: 'abre en nueva ventana',
    });
  });

  it('cae al fallback por idioma cuando una key falta en el spreadsheet', async () => {
    mockDeps({ lang: 'es', data: [{ Key: 'members.login.signIn', Text: 'Entrar' }] });
    const { loadMembersLabels } = await import(i18nPath);
    const labels = await loadMembersLabels();
    expect(labels.signIn).toBe('Entrar'); // autorado
    expect(labels.logout).toBe('Cerrar sesión'); // fallback es
    expect(labels.account).toBe('Mi cuenta'); // fallback es
  });

  it('cae al fallback del idioma si fetchAEMData falla', async () => {
    mockDeps({ lang: 'pt', rejects: true });
    const { loadMembersLabels } = await import(i18nPath);
    const labels = await loadMembersLabels();
    expect(labels).toEqual({
      signIn: 'Iniciar sessão', logout: 'Sair', account: 'Minha conta', profileTooltip: 'Meu perfil', opensInNewWindow: 'abre em nova janela',
    });
  });

  it('getMembersLabelsSync devuelve el fallback del idioma actual (render inmediato)', async () => {
    mockDeps({ lang: 'en' });
    const { getMembersLabelsSync } = await import(i18nPath);
    expect(getMembersLabelsSync()).toEqual({
      signIn: 'Sign in', logout: 'Log out', account: 'My account', profileTooltip: 'My profile', opensInNewWindow: 'opens in new window',
    });
  });

  it('modal de error: lee los labels autorados del spreadsheet por Key', async () => {
    mockDeps({
      lang: 'es',
      data: [
        { Key: 'members.error.connection.title', Text: 'Sin conexión' },
        { Key: 'members.error.connection.description', Text: 'Reintentá.' },
        { Key: 'members.error.connection.cta', Text: 'Reintentar' },
      ],
    });
    const { loadErrorLabels } = await import(i18nPath);
    expect(await loadErrorLabels()).toEqual({
      connTitle: 'Sin conexión',
      connDescription: 'Reintentá.',
      connCta: 'Reintentar',
      ctaHome: 'Volver al inicio', // no está en el spreadsheet → fallback es
    });
  });

  it('modal de error: cae al fallback por idioma si falta la key o falla el fetch', async () => {
    mockDeps({ lang: 'es', rejects: true });
    const { loadErrorLabels, getErrorLabelsSync } = await import(i18nPath);
    expect((await loadErrorLabels()).connCta).toBe('Recargar página');
    expect(getErrorLabelsSync().connTitle).toBe('Problema de conexión');
  });

  // ---------- Cards del Dashboard (PBI 1263921, Bloque 4) ----------
  it('getCardsLabelsSync devuelve los copies de las 4 cards del idioma actual', async () => {
    mockDeps({ lang: 'es' });
    const { getCardsLabelsSync } = await import(i18nPath);
    const labels = getCardsLabelsSync();
    expect(labels['elite-progress'].title).toBe('Progreso Elite y beneficios');
    expect(labels.account.title).toBe('Gestión de cuenta');
    expect(labels['my-trips'].title).toBe('Mis viajes');
    expect(labels['manage-miles'].description).toContain('Transfiere');
    expect(labels.opensInNewWindow).toBe('abre en nueva ventana');
  });

  it('getCardsLabelsSync traduce por locale (en ≠ es)', async () => {
    mockDeps({ lang: 'en' });
    const { getCardsLabelsSync } = await import(i18nPath);
    expect(getCardsLabelsSync()['elite-progress'].title).toBe('Elite progress and benefits');
  });

  it('getCardsLabelsSync cae a ES cuando el locale es desconocido', async () => {
    mockDeps({ lang: 'xx' });
    const { getCardsLabelsSync } = await import(i18nPath);
    expect(getCardsLabelsSync().account.title).toBe('Gestión de cuenta');
  });

  it('loadCardsLabels lee los copies autorados del spreadsheet por Key (fallback por card)', async () => {
    mockDeps({
      lang: 'es',
      data: [
        { Key: 'members.dashboard.card.elite-progress.title', Text: 'Mi progreso' },
        { Key: 'members.dashboard.card.account.description', Text: 'Gestiona tu cuenta.' },
      ],
    });
    const { loadCardsLabels } = await import(i18nPath);
    const labels = await loadCardsLabels();
    expect(labels['elite-progress'].title).toBe('Mi progreso'); // autorado
    expect(labels['elite-progress'].description).toContain('Consulta tu nivel'); // fallback
    expect(labels.account.description).toBe('Gestiona tu cuenta.'); // autorado
    expect(labels.account.title).toBe('Gestión de cuenta'); // fallback
  });

  it('loadCardsLabels cae al fallback por idioma si falla el fetch', async () => {
    mockDeps({ lang: 'fr', rejects: true });
    const { loadCardsLabels } = await import(i18nPath);
    const labels = await loadCardsLabels();
    expect(labels['my-trips'].title).toBe('Mes voyages');
  });
});
