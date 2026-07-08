/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const loaderPath = '../../../scripts/services/members/lm-script.loader.js';
const aemPath = '../../../scripts/aem.js';
const aemDataPath = '../../../scripts/utils/aem-data.js';
const configPath = '../../../scripts/services/members/members-config.js';

describe('members/lm-script.loader', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
  });

  it('injects el script LM de PROD por default (sin AV_LM_SCRIPT_URL) y dedupea', async () => {
    const loadScript = vi.fn().mockResolvedValue(undefined);
    vi.doMock(aemPath, () => ({ loadScript }));
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn().mockResolvedValue({ data: [] }) }));
    vi.doMock(configPath, () => ({
      loadMembersConfig: vi.fn().mockResolvedValue({ env: 'uat' }),
    }));
    const { loadLmScript } = await import(loaderPath);
    await loadLmScript();
    await loadLmScript();
    expect(loadScript).toHaveBeenCalledTimes(1);
    expect(loadScript).toHaveBeenCalledWith(
      'https://log-in.lifemiles.com/lm-login.umd.js?env=uat',
    );
  });

  it('usa AV_LM_SCRIPT_URL del environment.json cuando está (URL de pruebas de LM)', async () => {
    const loadScript = vi.fn().mockResolvedValue(undefined);
    vi.doMock(aemPath, () => ({ loadScript }));
    vi.doMock(aemDataPath, () => ({
      fetchAEMData: vi.fn().mockResolvedValue({
        data: [{ Key: 'AV_LM_SCRIPT_URL', Text: 'https://log-in-nprod.lifemiles.net/qa/lm-login.umd.js' }],
      }),
    }));
    vi.doMock(configPath, () => ({
      loadMembersConfig: vi.fn().mockResolvedValue({ env: 'uat' }),
    }));
    const { loadLmScript } = await import(loaderPath);
    await loadLmScript();
    expect(loadScript).toHaveBeenCalledWith(
      'https://log-in-nprod.lifemiles.net/qa/lm-login.umd.js?env=uat',
    );
  });

  it('AV_LM_SCRIPT_URL ausente/fetch falla → fallback a la URL de prod', async () => {
    const loadScript = vi.fn().mockResolvedValue(undefined);
    vi.doMock(aemPath, () => ({ loadScript }));
    vi.doMock(aemDataPath, () => ({ fetchAEMData: vi.fn().mockRejectedValue(new Error('down')) }));
    vi.doMock(configPath, () => ({
      loadMembersConfig: vi.fn().mockResolvedValue({ env: 'prd' }),
    }));
    const { loadLmScript } = await import(loaderPath);
    await loadLmScript();
    expect(loadScript).toHaveBeenCalledWith(
      'https://log-in.lifemiles.com/lm-login.umd.js?env=prd',
    );
  });

  it('whenLmReady: resuelve de inmediato si la función ya existe', async () => {
    vi.doMock(aemPath, () => ({ loadScript: vi.fn() }));
    vi.doMock(configPath, () => ({ loadMembersConfig: vi.fn() }));
    globalThis.window = { lmFetchWrapper: () => 'ya' };
    const { whenLmReady } = await import(loaderPath);
    const fn = await whenLmReady('lmFetchWrapper');
    expect(fn()).toBe('ya');
  });

  it('whenLmReady: event-driven (sin timer) — resuelve cuando el script ASIGNA la función', async () => {
    vi.doMock(aemPath, () => ({ loadScript: vi.fn() }));
    vi.doMock(configPath, () => ({ loadMembersConfig: vi.fn() }));
    globalThis.window = {};
    const { whenLmReady } = await import(loaderPath);
    const p = whenLmReady('lmCompleteLogin');
    // el script LM asigna la función más tarde (simula red lenta)
    const impl = vi.fn();
    globalThis.window.lmCompleteLogin = impl;
    await expect(p).resolves.toBe(impl);
    // tras el trap, queda como propiedad normal
    expect(globalThis.window.lmCompleteLogin).toBe(impl);
  });
});
