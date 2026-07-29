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

    // tiers → dict por key. Subset match (toMatchObject): el tier propaga además
    // ~28 campos de color del Paso 2 (colorGradient*, colorOverlay, pill*, etc.),
    // hoy undefined con este fixture. Se asertan solo los campos legacy mapeados.
    expect(cfg.tiers.gold).toMatchObject({
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

  it('normalizeMembersCF: eliteGoals v1 ELIMINADO (T18) — ya no se proyecta', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    // Aunque el CF trajera el array v1, ya no se normaliza (el hero migró a v2).
    const cfg = normalizeMembersCF({
      ...sampleItem,
      eliteGoals: [{ tierKey: 'gold', metaTotal: 40000, metaAvianca: 16000 }],
    });
    expect(cfg.eliteGoals).toBeUndefined();
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

  // ---------- benefitsCatalog (1271693) ----------
  it('normalizeMembersCF (1271693): benefitsCatalog acepta value ANIDADO y PLANO, pasa lmGroup y ordena por sortOrder', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF({
      authConfig: {},
      benefitsCatalog: {
        unlimitedThreshold: 50,
        seeAllUrl: '/see',
        termsUrl: '/terms',
        categories: [
          {
            key: 'lounges',
            eyebrow: 'Entrada a',
            icon: 'members/quick-lounges',
            sortOrder: 2,
            ctaLabel: 'Conoce más',
            // valor ANIDADO (s.value objeto)
            subBenefits: [{ label: 'Salas VIP Avianca', value: { kind: 'unlimited' }, lmGroup: 'PNTGRP59' }],
          },
          {
            key: 'upgrades',
            eyebrow: 'Ascenso a',
            sortOrder: 1,
            // valor PLANO (kind/amount/total como hermanos de label)
            subBenefits: [{
              label: 'Business Doméstico', kind: 'count', amount: 1, total: 1, lmGroup: 'PNTGRP62',
            }],
          },
        ],
      },
    });
    const bc = cfg.benefitsCatalog;
    expect(bc.unlimitedThreshold).toBe(50);
    expect(bc.seeAllUrl).toBe('/see');
    expect(bc.termsUrl).toBe('/terms');
    // ordenadas por sortOrder
    expect(bc.categories.map((c) => c.key)).toEqual(['upgrades', 'lounges']);
    // PLANO leído bien + lmGroup pasado
    const upg = bc.categories.find((c) => c.key === 'upgrades');
    expect(upg.subBenefits[0]).toEqual({
      label: 'Business Doméstico', value: { kind: 'count', amount: 1, total: 1 }, lmGroup: 'PNTGRP62',
    });
    // ANIDADO leído bien
    const lng = bc.categories.find((c) => c.key === 'lounges');
    expect(lng.subBenefits[0]).toEqual({ label: 'Salas VIP Avianca', value: { kind: 'unlimited' }, lmGroup: 'PNTGRP59' });
  });

  it('normalizeMembersCF (1271693 AC): benefitsCatalog resuelve seeAllIcon/termsIcon (asset DAM _publishUrl o key); ausente → undefined', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF({
      authConfig: {},
      benefitsCatalog: {
        seeAllUrl: '/see',
        // eslint-disable-next-line no-underscore-dangle
        seeAllIcon: { _publishUrl: 'https://pub/dam/see.svg' }, // asset DAM → _publishUrl
        termsIcon: 'navigation/open-in-new', // key string
        categories: [{
          key: 'lounges',
          sortOrder: 1,
          subBenefits: [{ label: 'Salas VIP', value: { kind: 'unlimited' }, lmGroup: 'PNTGRP59' }],
        }],
      },
    });
    expect(cfg.benefitsCatalog.seeAllIcon).toBe('https://pub/dam/see.svg');
    expect(cfg.benefitsCatalog.termsIcon).toBe('navigation/open-in-new');
    // sin íconos → no se proyectan (el organism cae al default 'navigation/open-in-new')
    const cfg2 = normalizeMembersCF({
      authConfig: {},
      benefitsCatalog: { categories: [{ key: 'x', sortOrder: 1, subBenefits: [{ label: 'a', value: { kind: 'na' } }] }] },
    });
    expect(cfg2.benefitsCatalog.seeAllIcon).toBeUndefined();
    expect(cfg2.benefitsCatalog.termsIcon).toBeUndefined();
  });

  it('normalizeMembersCF (1271693 Plan B): benefitsCatalog pasa valuesByTier (tier lowercase, plano o anidado, descarta sin tier)', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF({
      authConfig: {},
      benefitsCatalog: {
        categories: [{
          key: 'default',
          sortOrder: 1,
          subBenefits: [{
            label: 'Millas bono',
            kind: 'na',
            valuesByTier: [
              { tier: 'Gold', kind: 'discount', percent: 60 }, // plano
              { tier: 'MAGNO', value: { kind: 'discount', percent: 100 } }, // anidado
              { tier: '', kind: 'discount', percent: 1 }, // sin tier → se descarta
            ],
          }],
        }],
      },
    });
    const sub = cfg.benefitsCatalog.categories[0].subBenefits[0];
    expect(sub.valuesByTier).toEqual([
      { tier: 'gold', kind: 'discount', percent: 60 },
      { tier: 'magno', kind: 'discount', percent: 100 },
    ]);
  });

  it('normalizeMembersCF (1271693 Plan B): benefitsCatalog pasa maxByTier del contador (tier lowercase, descarta sin tier / max inválido)', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF({
      authConfig: {},
      benefitsCatalog: {
        categories: [{
          key: 'upgrades',
          sortOrder: 1,
          subBenefits: [{
            label: 'Upgrade doméstico',
            kind: 'count',
            lmGroup: 'PNTGRP62',
            maxByTier: [
              { tier: 'Gold', max: 8 },
              { tier: 'MAGNO', max: '12' }, // string numérica → 12
              { tier: 'diamond', max: 0 }, // max inválido (0) → se descarta
              { tier: '', max: 5 }, // sin tier → se descarta
            ],
          }],
        }],
      },
    });
    const sub = cfg.benefitsCatalog.categories[0].subBenefits[0];
    expect(sub.maxByTier).toEqual([
      { tier: 'gold', max: 8 },
      { tier: 'magno', max: 12 },
    ]);
  });

  it('normalizeMembersCF (1271694 Tarea B): lmPlusBanner mapea campos + resuelve _publishUrl de imágenes; backgroundColor null se omite', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF({
      authConfig: {},
      lmPlusBanner: {
        enabled: true,
        title: 'Suscríbete a Lifemiles Plus',
        subtitle: 'Multiplica tus millas',
        imageDesktop: { _publishUrl: 'https://pub/dam/lm-plus-banner/desktop.jpg', mimeType: 'image/jpeg' },
        imageMobile: { _publishUrl: 'https://pub/dam/lm-plus-banner/mob.jpg' },
        imageAlt: 'lm-plus',
        imagePosition: 'left',
        ctaText: 'Suscríbete ya',
        ctaUrl: 'https://sub',
        backgroundType: 'gradient',
        backgroundColor: null,
        gradientColorStart: '#5303B6',
        gradientColorEnd: '#9810FA',
        condorStrokeColor: '#FFFFFF',
        showCondor: true,
      },
    });
    expect(cfg.lmPlusBanner).toEqual({
      enabled: true,
      title: 'Suscríbete a Lifemiles Plus',
      subtitle: 'Multiplica tus millas',
      imageDesktop: 'https://pub/dam/lm-plus-banner/desktop.jpg',
      imageMobile: 'https://pub/dam/lm-plus-banner/mob.jpg',
      imageAlt: 'lm-plus',
      imagePosition: 'left',
      ctaText: 'Suscríbete ya',
      ctaUrl: 'https://sub',
      gradientColorStart: '#5303B6',
      gradientColorEnd: '#9810FA',
      condorStrokeColor: '#FFFFFF',
      showCondor: true,
    });
    // sin lmPlusBanner en el CF → no se proyecta (el front cae al LmPlusBanner simple)
    const cfg2 = normalizeMembersCF({ authConfig: {}, menuItems: [] });
    expect(cfg2.lmPlusBanner).toBeUndefined();
  });

  it('normalizeMembersCF (1271694): lmPlusUrls lee manage/upgrade/activate del sub-fragmento account (con fallback plano); sin campos → undefined', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    // Caso REAL: los 3 campos viven en item.account (sub-fragmento, PBI 1263921).
    const cfg = normalizeMembersCF({
      authConfig: {},
      account: {
        lmPlusManageUrl: 'https://lm/manage',
        lmPlusUpgradeUrl: 'https://lm/upgrade',
        lmPlusActivateUrl: 'https://lm/activate',
      },
    });
    expect(cfg.lmPlusUrls).toEqual({
      manage: 'https://lm/manage',
      upgrade: 'https://lm/upgrade',
      activate: 'https://lm/activate',
    });
    // solo un campo (en account) → solo esa clave (los demás links caen a '#')
    const cfgPartial = normalizeMembersCF({ authConfig: {}, account: { lmPlusUpgradeUrl: 'https://lm/up' } });
    expect(cfgPartial.lmPlusUrls).toEqual({ upgrade: 'https://lm/up' });
    // fallback: si vinieran planos (sin account) también se leen
    const cfgFlat = normalizeMembersCF({ authConfig: {}, lmPlusManageUrl: 'https://lm/m' });
    expect(cfgFlat.lmPlusUrls).toEqual({ manage: 'https://lm/m' });
    // campos null (CF no autorado) → no se proyecta → links caen a '#'
    const cfgNone = normalizeMembersCF({ authConfig: {}, account: { lmPlusManageUrl: null } });
    expect(cfgNone.lmPlusUrls).toBeUndefined();
  });

  // ---------- Sección `account` (Tandas 1+2, espec-cf-lote.md) ----------
  it('normalizeMembersCF (account tandas 1+2): mapea campos FLAT → shape anidado account/wallet', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    const cfg = normalizeMembersCF({
      authConfig: {},
      menuItems: [],
      // Tanda 1 (blockXEnabled eliminados 2026-07-23 — compuerta por constante
      // PANELS_ENABLED en members-account.js; si el CF los mandara, se ignoran)
      accountEnabled: true,
      headerCtaEnabled: true,
      headerCtaUrl: '/es/members/mi-lifemiles',
      blockDataEnabled: true,
      blockPaymentsEnabled: false,
      blockSettingsEnabled: true,
      // Tanda 2 (wallet, 1279362)
      walletPaymentMethodsEnabled: false,
      walletAviancaCreditsEnabled: true,
      walletLmPlusEnabled: true,
      manageCardsUrl: 'https://lifemiles.com/cards',
      requestCardUrl: 'https://lifemiles.com/request',
      avCreditsMovementsUrl: '/es/members/avcredits',
      walletMockFallback: false,
      // Tanda 2 (tab Datos, 1279361)
      maxCompanions: 6,
      completenessThresholdWarning: 40,
      completenessThresholdPositive: 75,
      editMockEnabled: false,
    });
    expect(cfg.account).toEqual({
      accountEnabled: true,
      headerCtaEnabled: true,
      headerCtaUrl: '/es/members/mi-lifemiles',
      maxCompanions: 6,
      completenessThresholdWarning: 40,
      completenessThresholdPositive: 75,
      editMockEnabled: false,
      wallet: {
        paymentMethodsEnabled: false,
        aviancaCreditsEnabled: true,
        lmPlusEnabled: true,
        manageCardsUrl: 'https://lifemiles.com/cards',
        requestCardUrl: 'https://lifemiles.com/request',
        avCreditsMovementsUrl: '/es/members/avcredits',
        mockFallback: false,
      },
    });
  });

  it('normalizeMembersCF (account): solo proyecta lo TIPADO; campos ausentes/mal tipados se omiten', async () => {
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn() }));
    const { normalizeMembersCF } = await import(servicePath);
    // Solo un flag wallet tipado + una URL vacía (ignorada) → account.wallet parcial.
    const cfg = normalizeMembersCF({
      authConfig: {},
      menuItems: [],
      walletAviancaCreditsEnabled: false,
      manageCardsUrl: '',
      accountEnabled: 'true', // string → NO booleano → omitido
    });
    expect(cfg.account).toEqual({ wallet: { aviancaCreditsEnabled: false } });
    expect(cfg.account.accountEnabled).toBeUndefined();
    // Sin ningún campo account → out.account ausente (caller usa defaults).
    const cfg2 = normalizeMembersCF({ authConfig: {}, menuItems: [] });
    expect(cfg2.account).toBeUndefined();
  });
});
