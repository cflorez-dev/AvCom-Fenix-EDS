import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const configPath = '../../../scripts/services/members/members-config.js';
const aemDataPath = '../../../scripts/utils/aem-data.js';
const cfPath = '../../../scripts/services/members/members-cf.service.js';

describe('members/members-config', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns env (leído del spreadsheet environment.json por Key), loginMode y redirects', async () => {
    vi.doMock(aemDataPath, () => ({
      // environment.json es un spreadsheet: {data:[{Key,Text}]}.
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'prd' }] }),
    }));
    // CF mockeado (hermético): el test NO depende del valor en vivo de loginMode/loginReturnTo
    // del CF (antes pegaba al CF real y se rompía al cambiar `loginReturnTo` a 'origin').
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({ loginMode: 'redirect', loginReturnTo: 'home' }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig();
    expect(cfg.env).toBe('prd');
    expect(cfg.loginMode).toBe('redirect');
    expect(cfg.loginReturnTo).toBe('home');
    // La config OAuth de Lifemiles NO la armamos nosotros (la inyecta el script por host).
    expect(cfg.lmLoginConfig).toBeUndefined();
  });

  it('cae a uat si la key AV_MEMBERS_ENV no está en el spreadsheet', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'OTRA_KEY', Text: 'x' }] }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig();
    expect(cfg.env).toBe('uat');
  });

  it('falls back to uat when environment fetch rejects', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockRejectedValue(new Error('network down')),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig();
    expect(cfg.env).toBe('uat');
  });

  it('is async (Promise-returning) and caches the result per locale on subsequent calls', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'uat' }] });
    vi.doMock(aemDataPath, () => ({ fetchAEMData: fetchSpy }));
    const { loadMembersConfig } = await import(configPath);
    const first = loadMembersConfig();
    expect(first).toBeInstanceOf(Promise);
    const a = await first;
    const callsAfterFirst = fetchSpy.mock.calls.length;
    const b = await loadMembersConfig();
    expect(a).toBe(b); // same cached object reference (por locale)
    // 2da carga del mismo locale = cache hit → no dispara más fetches de environment.
    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst);
  });

  // ---------- Integración del CF (Paso 3) ----------
  it('mergea el CF sobre APP_CONFIG (loginMode/portalRoutes/logout/tiers/oneTap del CF)', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'uat' }] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({
        loginMode: 'popup',
        portalRoutes: ['/es/members'],
        logout: { show: false, icon: 'x', redirectTo: '/es' },
        oneTap: { frequencyHours: 12 }, // override parcial
        tiers: { gold: { colorStart: '#D4AF37' } },
        menuItems: [],
      }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');
    expect(cfg.loginMode).toBe('popup'); // del CF
    expect(cfg.portalRoutes).toEqual(['/es/members']); // del CF (locale-prefixed)
    expect(cfg.logout).toEqual({ show: false, icon: 'x', redirectTo: '/es' });
    expect(cfg.tiers.gold.colorStart).toBe('#D4AF37');
    expect(cfg.oneTap.frequencyHours).toBe(12); // override del CF
    expect(cfg.oneTap.enabled).toBe(true); // default conservado (deep-merge)
    expect(cfg.env).toBe('uat');
  });

  it('CF caído (fetchMembersCF→null) → cae a APP_CONFIG sin romper', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'prd' }] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue(null),
      normalizeMembersCF: vi.fn().mockReturnValue(null),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('pt');
    expect(cfg.loginMode).toBe('redirect'); // default
    expect(cfg.portalRoutes).toEqual(['/members']); // default
    expect(cfg.logout.show).toBe(true); // default
    expect(cfg.oneTap.frequencyHours).toBe(24); // default
    expect(cfg.env).toBe('prd');
  });

  // ---------- Dashboard cards (PBI 1263921, Bloque 4) ----------
  it('getMembersConfigSync().cards trae las 5 cards con key/sortOrder/visible (sync defaults)', async () => {
    const { getMembersConfigSync } = await import(configPath);
    const { cards } = getMembersConfigSync('es');
    expect(Array.isArray(cards)).toBe(true);
    expect(cards.map((c) => c.key)).toEqual([
      'elite-progress', 'account', 'my-trips', 'manage-miles', 'activity',
    ]);
    cards.forEach((c, i) => {
      expect(c.visible).toBe(true);
      expect(c.sortOrder).toBe(i + 1);
      expect(c.linkType).toBe('internal');
      expect(typeof c.icon).toBe('string');
    });
    // copies (title/description) NO viven en la config — los pone el organism desde i18n.
    expect(cards[0].title).toBeUndefined();
  });

  it('resuelve el placeholder {lang} del link por locale', async () => {
    const { getMembersConfigSync } = await import(configPath);
    expect(getMembersConfigSync('es').cards[0].link).toBe('/es/members/profile/elite');
    expect(getMembersConfigSync('pt').cards[0].link).toBe('/pt/members/profile/elite');
    expect(getMembersConfigSync('fr').cards[2].link).toBe('/fr/members/viajes');
  });

  it('el CF (normalized.cards) sobrescribe los defaults de cards cuando viene', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'uat' }] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({
        cards: [{
          key: 'cf-card', icon: 'x', title: 'CF', link: '/es/cf', linkType: 'internal', visible: true, sortOrder: 1,
        }],
      }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');
    expect(cfg.cards).toHaveLength(1);
    expect(cfg.cards[0].key).toBe('cf-card');
  });

  it('CF sin cards → cfg.cards cae a los 5 defaults (link resuelto por locale)', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'uat' }] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({ loginMode: 'redirect' }), // sin cards
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('pt');
    expect(cfg.cards).toHaveLength(5);
    expect(cfg.cards[0].link).toBe('/pt/members/profile/elite');
  });
});
