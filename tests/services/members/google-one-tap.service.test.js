/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const servicePath = '../../../scripts/services/members/google-one-tap.service.js';
const aemPath = '../../../scripts/aem.js';
const configPath = '../../../scripts/services/members/members-config.js';
const storePath = '../../../scripts/services/members/session.store.js';
const flagPath = '../../../scripts/services/members/members-flag.js';

const setupDom = ({ cookie = '', pathname = '/' } = {}) => {
  const assign = vi.fn();
  let initOptions = null;
  globalThis.window = {
    location: { origin: 'https://qa--x.aem.live', pathname, assign },
    google: {
      accounts: {
        id: {
          initialize: (opts) => { initOptions = opts; },
          prompt: vi.fn(),
        },
      },
    },
    crypto: globalThis.crypto, // webcrypto de node (getRandomValues + subtle.digest) para PKCE
  };
  globalThis.document = { documentElement: { lang: 'es' }, cookie };
  const store = {};
  globalThis.localStorage = {
    setItem: (k, v) => { store[k] = v; },
    getItem: (k) => (k in store ? store[k] : null),
  };
  return { assign, getInitOptions: () => initOptions, store };
};

const mockDeps = ({
  status = 'anonymous', env = 'uat', oneTap, membersEnabled = true,
} = {}) => {
  const loadScript = vi.fn().mockResolvedValue(undefined);
  vi.doMock(aemPath, () => ({ loadScript }));
  vi.doMock(configPath, () => ({ loadMembersConfig: vi.fn().mockResolvedValue({ env, oneTap }) }));
  vi.doMock(storePath, () => ({ getSession: () => ({ status }) }));
  // Kill-switch maestro ON por default; el caso OFF pasa membersEnabled:false.
  vi.doMock(flagPath, () => ({ isMembersEnabled: vi.fn().mockResolvedValue(membersEnabled) }));
  return { loadScript };
};

describe('members/google-one-tap.service', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.localStorage;
  });

  it('NO inicializa si el usuario no es anónimo', async () => {
    setupDom();
    const { loadScript } = mockDeps({ status: 'authenticated' });
    const { initOneTap } = await import(servicePath);
    await initOneTap();
    expect(loadScript).not.toHaveBeenCalled();
  });

  it('kill-switch OFF (AV_MEMBERS_ENABLED) → NO inyecta el SDK GSI de Google', async () => {
    setupDom();
    const { loadScript } = mockDeps({ membersEnabled: false });
    const { initOneTap } = await import(servicePath);
    await initOneTap();
    expect(loadScript).not.toHaveBeenCalled();
  });

  it('NO inicializa si se mostró hace menos de 24h (frecuencia)', async () => {
    const recent = Date.now() - 3600 * 1000; // hace 1h
    setupDom({ cookie: `members-onetap-shown=${recent}` });
    const { loadScript } = mockDeps();
    const { initOneTap } = await import(servicePath);
    await initOneTap();
    expect(loadScript).not.toHaveBeenCalled();
  });

  it('anónimo + sin cookie → carga el SDK e inicializa el prompt', async () => {
    const { getInitOptions } = setupDom();
    const { loadScript } = mockDeps({ env: 'uat' });
    const { initOneTap } = await import(servicePath);
    await initOneTap();
    expect(loadScript).toHaveBeenCalledWith(
      'https://accounts.google.com/gsi/client',
      expect.any(Object),
    );
    const opts = getInitOptions();
    expect(opts.client_id).toContain('apps.googleusercontent.com');
    expect(opts.login_uri).toContain('lm-uat/broker/google');
    expect(typeof opts.callback).toBe('function');
  });

  // ---------- Gates desde el CF (Paso 7 / CU-282) ----------
  it('NO inicializa si el CF deshabilita One Tap (oneTap.enabled === false)', async () => {
    setupDom();
    const { loadScript } = mockDeps({ oneTap: { enabled: false } });
    const { initOneTap } = await import(servicePath);
    await initOneTap();
    expect(loadScript).not.toHaveBeenCalled();
  });

  it('NO inicializa si la ruta no está en corporatePaths (ej. /es/equipaje con gate solo Home)', async () => {
    setupDom({ pathname: '/es/equipaje' });
    const { loadScript } = mockDeps({ oneTap: { corporatePaths: ['/'] } });
    const { initOneTap } = await import(servicePath);
    await initOneTap();
    expect(loadScript).not.toHaveBeenCalled();
  });

  it('SÍ inicializa en una ruta corporativa permitida por el CF (/corporativo/)', async () => {
    setupDom({ pathname: '/es/corporativo/empresas' });
    const { loadScript } = mockDeps({ oneTap: { corporatePaths: ['/', '/corporativo/'] } });
    const { initOneTap } = await import(servicePath);
    await initOneTap();
    expect(loadScript).toHaveBeenCalled();
  });

  it('respeta frequencyHours del CF: cookie de hace 2h NO bloquea si la frecuencia es 1h', async () => {
    const twoHoursAgo = Date.now() - 2 * 3600 * 1000;
    setupDom({ cookie: `members-onetap-shown=${twoHoursAgo}` });
    const { loadScript } = mockDeps({ oneTap: { frequencyHours: 1 } });
    const { initOneTap } = await import(servicePath);
    await initOneTap();
    expect(loadScript).toHaveBeenCalled(); // 2h > 1h → ya no aplica el cooldown
  });

  it('callback con credential → genera PKCE (S256) y redirige al broker lm-uat con state + verifier guardado', async () => {
    const { assign, getInitOptions, store } = setupDom();
    mockDeps({ env: 'uat' });
    const { initOneTap } = await import(servicePath);
    await initOneTap();
    getInitOptions().callback({ credential: 'fake-jwt' });
    await new Promise((r) => { setTimeout(r, 50); }); // el callback genera el PKCE async (SHA-256)
    expect(assign).toHaveBeenCalledTimes(1);
    const url = assign.mock.calls[0][0];
    expect(url).toContain('lm-uat/protocol/openid-connect/auth');
    expect(url).toContain('kc_idp_hint=google');
    expect(url).toContain('client_id=avianca-web');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('members%2Fauth%2Fcallback');
    // guardó el verifier/state donde lmCompleteLogin los lee
    expect(store['lm-login-code-verifier']).toBeTruthy();
    expect(store['lm-login-state']).toBeTruthy();
  });
});
