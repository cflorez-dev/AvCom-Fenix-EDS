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
    // 1 del CF + la card seed de account (default ON 2026-07-20)
    expect(cfg.cards).toHaveLength(2);
    expect(cfg.cards[0].key).toBe('cf-card');
    expect(cfg.cards.some((c) => c.key === 'account-management')).toBe(true);
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
    // 5 defaults + la card seed de account (default ON 2026-07-20)
    expect(cfg.cards).toHaveLength(6);
    expect(cfg.cards[0].link).toBe('/pt/members/profile/elite');
    expect(cfg.cards.some((c) => c.key === 'account-management')).toBe(true);
  });

  // ---------- Página "Gestión de mi cuenta" (1279360, account flag + seed) ----------
  it('account: default ON (2026-07-20) y headerCtaEnabled off sin CF', async () => {
    const { getMembersConfigSync } = await import(configPath);
    const cfg = getMembersConfigSync('es');
    expect(cfg.account).toBeDefined();
    expect(cfg.account.accountEnabled).toBe(true);
    expect(cfg.account.headerCtaEnabled).toBe(false);
    // (blocks eliminado 2026-07-23 — compuerta por constante PANELS_ENABLED)
    expect(cfg.account.blocks).toBeUndefined();
    // Con el flag OFF NO se siembra ninguna entrada nueva (menú/cards).
    expect(cfg.cards.some((c) => c.key === 'account-management')).toBe(false);
    expect(cfg.menuItems.some((item) => item.key === 'account-management')).toBe(false);
  });

  // ---------- Tab Datos (1279361, Tanda 2: maxCompanions + umbrales torta) ----------
  it('account: defaults tab Datos (maxCompanions 4, umbrales 50/80, editMockEnabled true)', async () => {
    const { getMembersConfigSync } = await import(configPath);
    const cfg = getMembersConfigSync('es');
    expect(cfg.account.maxCompanions).toBe(4);
    expect(cfg.account.completenessThresholdWarning).toBe(50);
    expect(cfg.account.completenessThresholdPositive).toBe(80);
    expect(cfg.account.editMockEnabled).toBe(true);
  });

  it('account: CF override de maxCompanions/umbrales/editMockEnabled (loadMembersConfig)', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'uat' }] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({
        account: {
          maxCompanions: 6,
          completenessThresholdWarning: 40,
          completenessThresholdPositive: 75,
          editMockEnabled: false,
        },
      }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');
    expect(cfg.account.maxCompanions).toBe(6);
    expect(cfg.account.completenessThresholdWarning).toBe(40);
    expect(cfg.account.completenessThresholdPositive).toBe(75);
    expect(cfg.account.editMockEnabled).toBe(false);
    // subclaves no enviadas siguen en default
    expect(cfg.account.wallet.paymentMethodsEnabled).toBe(true);
  });

  it('account: default ON → loadMembersConfig siembra card + ítem sin CF', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'uat' }] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({ loginMode: 'redirect' }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');
    // Default ON (2026-07-20): sin CF, el seed SÍ se siembra.
    expect(cfg.account.accountEnabled).toBe(true);
    expect(cfg.cards.some((c) => c.key === 'account-management')).toBe(true);
    expect(cfg.menuItems.some((item) => item.key === 'account-management')).toBe(true);
  });

  it('account: guard anti-duplicado — card autorada YA apunta a account → NO siembra card, SÍ ítem', async () => {
    // QA interno 2026-07-22: en qa la card legacy `account` (1263921) fue re-apuntada
    // por autoría a /members/profile/account → el seed agregaba una SEGUNDA card con
    // el mismo label y destino. El guard detecta el link y omite solo la card.
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'uat' }] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({
        cards: [{
          key: 'account', icon: 'action/data-setting', title: 'Gestión de cuenta', link: '/es/members/profile/account', linkType: 'internal', visible: true, sortOrder: 2,
        }],
      }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');
    expect(cfg.cards.filter((c) => String(c.link || '').includes('/members/profile/account'))).toHaveLength(1);
    expect(cfg.cards.some((c) => c.key === 'account-management')).toBe(false);
    expect(cfg.menuItems.some((item) => item.key === 'account-management')).toBe(true);
  });

  it('account: kill-switch CF accountEnabled=false → NO siembra card ni ítem', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'uat' }] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({ account: { accountEnabled: false } }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');
    expect(cfg.account.accountEnabled).toBe(false);
    expect(cfg.cards.some((c) => c.key === 'account-management')).toBe(false);
    expect(cfg.menuItems.some((item) => item.key === 'account-management')).toBe(false);
  });

  it('account: CF con accountEnabled=true → siembra card + ítem de drawer (antes del logout)', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'uat' }] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      normalizeMembersCF: vi.fn().mockReturnValue({
        account: { accountEnabled: true },
      }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');
    expect(cfg.account.accountEnabled).toBe(true);
    const card = cfg.cards.find((c) => c.key === 'account-management');
    expect(card).toBeDefined();
    expect(card.link).toBe('/es/members/profile/account');
    expect(card.title).toBe('Gestión de cuenta');
    const menuIdx = cfg.menuItems.findIndex((item) => item.key === 'account-management');
    expect(menuIdx).toBeGreaterThanOrEqual(0);
    const logoutIdx = cfg.menuItems.findIndex((item) => item.isLogout);
    // el seed va ANTES del logout (contrato UX: logout último)
    if (logoutIdx >= 0) expect(menuIdx).toBeLessThan(logoutIdx);
  });

  // ---------- Wallet (1279362, tab Pagos) ----------
  it('account.wallet: defaults (flags on + URLs vacías + mockFallback on) sin CF', async () => {
    const { getMembersConfigSync } = await import(configPath);
    const cfg = getMembersConfigSync('es');
    expect(cfg.account.wallet).toEqual({
      paymentMethodsEnabled: true,
      aviancaCreditsEnabled: true,
      lmPlusEnabled: true,
      manageCardsUrl: '',
      requestCardUrl: '',
      avCreditsMovementsUrl: '',
      lmPlusEditPaymentUrl: '',
      lmPlusCancelUrl: '',
      lmPlusUpgradeUrl: '',
      mockFallback: true,
    });
  });

  it('account.wallet: CF parcial → deep-merge (mantiene defaults de las subclaves no enviadas)', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({ data: [{ Key: 'AV_MEMBERS_ENV', Text: 'uat' }] }),
    }));
    vi.doMock(cfPath, () => ({
      fetchMembersCF: vi.fn().mockResolvedValue({ raw: true }),
      // El normalizer ya entrega el shape anidado (flat→nested se testea en cf.service).
      normalizeMembersCF: vi.fn().mockReturnValue({
        account: {
          wallet: { paymentMethodsEnabled: false, manageCardsUrl: 'https://lm/cards' },
        },
      }),
    }));
    const { loadMembersConfig } = await import(configPath);
    const cfg = await loadMembersConfig('es');
    expect(cfg.account.wallet).toEqual({
      paymentMethodsEnabled: false, // override del CF
      aviancaCreditsEnabled: true, // default preservado
      lmPlusEnabled: true, // default preservado
      manageCardsUrl: 'https://lm/cards', // override del CF
      requestCardUrl: '', // default preservado
      avCreditsMovementsUrl: '', // default preservado
      lmPlusEditPaymentUrl: '', // default preservado
      lmPlusCancelUrl: '', // default preservado
      lmPlusUpgradeUrl: '', // default preservado
      mockFallback: true, // default preservado
    });
  });
});
