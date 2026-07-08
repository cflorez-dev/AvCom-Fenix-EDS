/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const servicePath = '../../../scripts/services/members/members-cf.service.js';
const aemDataPath = '../../../scripts/utils/aem-data.js';

// Item representativo del CF (subset fiel a members-config.json — el contrato).
const sampleItem = {
  authConfig: {
    loginMode: 'redirect',
    loginReturnTo: 'home',
    redirectAfterLogout: '/',
    ssoEnabled: true,
    sessionDurationSource: 'lifemiles',
    sessionMinutesOverride: 0,
    oneTapEnabled: true,
    oneTapFrequencyHours: 24,
    oneTapCorporatePaths: ['/', '/corporativo/'],
    oneTapTcRequired: true,
    oneTapTcText: { html: '<p>T&C <a href="/es/legal">link</a></p>', plaintext: 'T&C link' },
    portalRoutes: ['/es/members'],
    portalExclude: ['/es/members/auth'],
  },
  tiers: [
    {
      key: 'gold', displayName: 'LifeMiles Gold', colorStart: '#D4AF37', colorEnd: '#A8841A', textColor: '#1A1A1A', icon: 'loyalty/gold', sortOrder: 4,
    },
    {
      key: 'lifemiles', displayName: 'LifeMiles', colorStart: '#E30613', colorEnd: '#B3050F', textColor: '#FFFFFF', icon: 'loyalty/lifemiles', sortOrder: 1,
    },
  ],
  menuItems: [
    {
      key: 'cards', label: 'Mis tarjetas', icon: 'navigation/chevron-right', link: '/es/members/tarjetas', linkType: 'internal', visible: true, isLogout: false, sortOrder: 3,
    },
    {
      key: 'book', label: 'Reservar', icon: 'navigation/chevron-right', link: '/es/reserva', linkType: 'internal', visible: true, isLogout: false, sortOrder: 1,
    },
    {
      key: 'logout', label: 'Cerrar sesion', icon: 'action/exit-to-app', link: null, linkType: 'internal', visible: true, isLogout: true, sortOrder: 99,
    },
  ],
  modals: [
    {
      key: 'connection-error', icon: 'alert/Error', title: 'Problema de conexion', body: { html: '<p>No pudimos conectar con <b>LifeMiles</b>.</p>', plaintext: 'No pudimos conectar.' }, primaryCtaLabel: 'Recargar', primaryCtaAction: 'reload', dismissible: true, maxRetries: 3,
    },
  ],
};

describe('members/members-cf.service', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.fetch;
  });

  // ---------- fetchMembersCF ----------
  it('fetchMembersCF: ok → devuelve el item y arma el path por locale (fallback publish)', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn().mockResolvedValue({ data: [] }) }));
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { membersConfigByPath: { item: sampleItem } } }),
    });
    const { fetchMembersCF } = await import(servicePath);
    const res = await fetchMembersCF('es');
    expect(res).toEqual(sampleItem);
    const url = globalThis.fetch.mock.calls[0][0];
    expect(url).toContain('publish-p34631-e1321407.adobeaemcloud.com');
    expect(url).toContain(';path=/content/dam/avianca/content-fragments/members/es/members-config');
  });

  it('fetchMembersCF: usa AV_MEMBERS_CF_URL de environment.json si existe', async () => {
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({
        data: [{ Key: 'AV_MEMBERS_CF_URL', Text: 'https://custom.example/graphql/execute.json/avianca/getMembersConfig' }],
      }),
    }));
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { membersConfigByPath: { item: {} } } }),
    });
    const { fetchMembersCF } = await import(servicePath);
    await fetchMembersCF('pt');
    const url = globalThis.fetch.mock.calls[0][0];
    expect(url).toContain('https://custom.example/graphql/execute.json/avianca/getMembersConfig;path=');
    expect(url).toContain('/members/pt/members-config');
  });

  it('fetchMembersCF: respuesta no-ok (404 locale sin fragmento) → null', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn().mockResolvedValue({ data: [] }) }));
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const { fetchMembersCF } = await import(servicePath);
    expect(await fetchMembersCF('en')).toBeNull();
  });

  it('fetchMembersCF: error de red (throw) → null (fail-soft)', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn().mockResolvedValue({ data: [] }) }));
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down'));
    const { fetchMembersCF } = await import(servicePath);
    expect(await fetchMembersCF('es')).toBeNull();
  });

  // ---------- normalizeMembersCF ----------
  it('normalizeMembersCF: item null → null', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    expect(normalizeMembersCF(null)).toBeNull();
  });

  it('normalizeMembersCF: mapea authConfig, portalRoutes, oneTap, tiers, menuItems, modals', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF(sampleItem);

    // authConfig
    expect(cfg.loginMode).toBe('redirect');
    expect(cfg.loginReturnTo).toBe('home');
    expect(cfg.redirectAfterLogout).toBe('/');
    expect(cfg.ssoEnabled).toBe(true);
    expect(cfg.sessionDurationSource).toBe('lifemiles');
    expect(cfg.portalRoutes).toEqual(['/es/members']);
    expect(cfg.portalExclude).toEqual(['/es/members/auth']);

    // oneTap
    expect(cfg.oneTap).toEqual({
      enabled: true,
      frequencyHours: 24,
      corporatePaths: ['/', '/corporativo/'],
      tcRequired: true,
      tcText: '<p>T&C <a href="/es/legal">link</a></p>',
    });

    // tiers → dict por key
    expect(cfg.tiers.gold).toEqual({
      displayName: 'LifeMiles Gold', colorStart: '#D4AF37', colorEnd: '#A8841A', textColor: '#1A1A1A', icon: 'loyalty/gold',
    });

    // menuItems → no-logout, ordenados por sortOrder
    expect(cfg.menuItems.map((m) => m.key)).toEqual(['book', 'cards']);

    // modals → dict por key
    expect(cfg.modals['connection-error'].title).toBe('Problema de conexion');
    // body.html se pasa CRUDO (la sanitización ocurre al render, no acá)
    expect(cfg.modals['connection-error'].body.html).toContain('<b>LifeMiles</b>');
  });

  it('normalizeMembersCF (1263924 — quickActions TOP-LEVEL): ordena, resuelve imagen DAM, string fallback y ref vacía → ""', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const item = {
      ...sampleItem,
      // El modelo del CF tiene `quickActions` a NIVEL TOP (no anidadas en `hero`).
      quickActions: [
        {
          key: 'b', label: 'Segundo', icon: 'members/icon-name', url: '/b', visible: true, sortOrder: 2,
        },
        {
          key: 'a',
          label: 'Primero',
          // icon como content-reference de imagen del DAM
          // eslint-disable-next-line no-underscore-dangle
          icon: { _publishUrl: 'https://dam.example/icon.png' },
          iconAlt: 'alt A',
          url: '/a',
          visible: true,
          sortOrder: 1,
        },
        {
          key: 'c', label: 'Tercero', icon: {}, url: '/c', visible: true, sortOrder: 3,
        },
      ],
    };
    const cfg = normalizeMembersCF(item);
    // ordena por sortOrder
    expect(cfg.hero.quickActions.map((q) => q.key)).toEqual(['a', 'b', 'c']);
    // imagen del DAM → resuelve _publishUrl + conserva iconAlt
    expect(cfg.hero.quickActions[0].icon).toBe('https://dam.example/icon.png');
    expect(cfg.hero.quickActions[0].iconAlt).toBe('alt A');
    // icon string (key del átomo Icon) → pasa tal cual (fallback)
    expect(cfg.hero.quickActions[1].icon).toBe('members/icon-name');
    // icon ref vacía {} (sin imagen aún) → '' (el átomo degrada sin romper)
    expect(cfg.hero.quickActions[2].icon).toBe('');
  });

  it('normalizeMembersCF (1263924 — eliteGoals): proyecta el array top-level a dict por tierKey (lowercase)', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const item = {
      ...sampleItem,
      eliteGoals: [
        {
          tierKey: 'gold', metaTotal: 40000, metaAvianca: 16000, metricTotal: 'av-miles', metricAvianca: 'avstar',
        },
        {
          tierKey: 'Silver', metaTotal: 20000, metaAvianca: 8000, metricTotal: 'av-miles', metricAvianca: 'avstar',
        },
      ],
    };
    const cfg = normalizeMembersCF(item);
    expect(Object.keys(cfg.eliteGoals).sort()).toEqual(['gold', 'silver']);
    expect(cfg.eliteGoals.gold).toEqual({
      metaTotal: 40000, metaAvianca: 16000, metricTotal: 'av-miles', metricAvianca: 'avstar',
    });
    // tierKey 'Silver' → key lowercase 'silver'
    expect(cfg.eliteGoals.silver.metaTotal).toBe(20000);
  });

  it('normalizeMembersCF (Paso 5 — logout): sale del menuItem isLogout → {show,icon,redirectTo}', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF(sampleItem);
    // link null → redirectTo '' (= home del POS)
    expect(cfg.logout).toEqual({ show: true, icon: 'action/exit-to-app', redirectTo: '' });
  });

  it('normalizeMembersCF (Paso 5 — logout): visible:false oculta el item; link custom → redirectTo', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const item = {
      authConfig: {},
      menuItems: [{
        key: 'logout', label: 'Salir', icon: 'action/exit-to-app', link: '/es/adios', linkType: 'internal', visible: false, isLogout: true, sortOrder: 99,
      }],
    };
    const cfg = normalizeMembersCF(item);
    expect(cfg.logout).toEqual({ show: false, icon: 'action/exit-to-app', redirectTo: '/es/adios' });
  });

  it('normalizeMembersCF: omite claves ausentes (deja ver el fallback APP_CONFIG en el merge)', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF({
      authConfig: {}, menuItems: [], tiers: [], modals: [],
    });
    expect(cfg.loginMode).toBeUndefined(); // no estaba en el CF → no se emite
    expect(cfg.logout).toBeUndefined(); // sin menuItem isLogout → APP_CONFIG.logout
    expect(cfg.tiers).toBeUndefined();
    expect(cfg.menuItems).toEqual([]);
  });

  // ---------- dashboardCards (PBI 1263921, Bloque 4) ----------
  it('normalizeMembersCF (1263921): proyecta dashboardCards → cards ordenadas por sortOrder', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF({
      authConfig: {},
      dashboardCards: [
        {
          key: 'manage-miles', icon: 'm/miles', title: 'Millas', description: 'desc', link: '/es/members/millas', linkType: 'internal', visible: true, sortOrder: 4,
        },
        {
          key: 'elite-progress', icon: 'a/assessment', title: 'Elite', description: 'desc', link: '/es/members/elite', linkType: 'internal', visible: true, sortOrder: 1,
        },
      ],
    });
    expect(cfg.cards.map((c) => c.key)).toEqual(['elite-progress', 'manage-miles']);
    expect(cfg.cards[0]).toEqual({
      key: 'elite-progress', icon: 'a/assessment', title: 'Elite', description: 'desc', link: '/es/members/elite', linkType: 'internal', visible: true, sortOrder: 1,
    });
  });

  it('normalizeMembersCF (1263921): acepta `cards` como fallback del nombre del campo', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF({
      authConfig: {},
      cards: [{
        key: 'account', icon: 'a/data-setting', title: 'Cuenta', description: 'd', link: '/es/members/profile', linkType: 'internal', visible: true, sortOrder: 2,
      }],
    });
    expect(cfg.cards).toHaveLength(1);
    expect(cfg.cards[0].key).toBe('account');
  });

  it('normalizeMembersCF (1263921): sin dashboardCards → out.cards ausente (caller usa defaults)', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF({ authConfig: {}, menuItems: [] });
    expect(cfg.cards).toBeUndefined();
  });
});
