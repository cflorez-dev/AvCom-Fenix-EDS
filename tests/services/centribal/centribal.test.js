// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const aemDataPath = '../../../scripts/utils/aem-data.js';
const aemPath = '../../../scripts/aem.js';
const servicePath = '../../../scripts/services/centribal/centribal.js';

const mockEnv = (rows) => {
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: rows }),
  }));
};

const mockAem = () => {
  vi.doMock(aemPath, () => ({
    loadCSS: vi.fn().mockResolvedValue(undefined),
    loadScript: vi.fn().mockResolvedValue(undefined),
  }));
};

const setSearch = (search) => {
  window.history.replaceState({}, '', `/${search}`);
};

describe('centribal feature flag', () => {
  beforeEach(() => {
    vi.resetModules();
    setSearch('');
    mockAem();
  });

  afterEach(() => {
    vi.doUnmock(aemDataPath);
    vi.doUnmock(aemPath);
    vi.restoreAllMocks();
  });

  it('is enabled when AV_CENTRIBAL_CHAT_ENABLED is "true"', async () => {
    mockEnv([{ Key: 'AV_CENTRIBAL_CHAT_ENABLED', Text: 'true' }]);
    const { isCentribalChatEnabled } = await import(servicePath);

    expect(await isCentribalChatEnabled()).toBe(true);
  });

  it('is disabled when the flag is "false"', async () => {
    mockEnv([{ Key: 'AV_CENTRIBAL_CHAT_ENABLED', Text: 'false' }]);
    const { isCentribalChatEnabled } = await import(servicePath);

    expect(await isCentribalChatEnabled()).toBe(false);
  });

  it('is disabled when the flag is missing (default off)', async () => {
    mockEnv([{ Key: 'OTHER_KEY', Text: 'true' }]);
    const { isCentribalChatEnabled } = await import(servicePath);

    expect(await isCentribalChatEnabled()).toBe(false);
  });

  it('trims whitespace around Key and Text', async () => {
    mockEnv([{ Key: '  AV_CENTRIBAL_CHAT_ENABLED  ', Text: '  true  ' }]);
    const { isCentribalChatEnabled } = await import(servicePath);

    expect(await isCentribalChatEnabled()).toBe(true);
  });

  it('?chat=off overrides an enabled flag (without reading config)', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      data: [{ Key: 'AV_CENTRIBAL_CHAT_ENABLED', Text: 'true' }],
    });
    vi.doMock(aemDataPath, () => ({ fetchAEMData: fetchSpy }));
    setSearch('?chat=off');
    const { isCentribalChatEnabled } = await import(servicePath);

    expect(await isCentribalChatEnabled()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('?chat=on overrides a disabled/missing flag (without reading config)', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ data: [] });
    vi.doMock(aemDataPath, () => ({ fetchAEMData: fetchSpy }));
    setSearch('?chat=on');
    const { isCentribalChatEnabled } = await import(servicePath);

    expect(await isCentribalChatEnabled()).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('caches the result: second call does not re-read environment', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      data: [{ Key: 'AV_CENTRIBAL_CHAT_ENABLED', Text: 'true' }],
    });
    vi.doMock(aemDataPath, () => ({ fetchAEMData: fetchSpy }));
    const { isCentribalChatEnabled } = await import(servicePath);

    await isCentribalChatEnabled();
    await isCentribalChatEnabled();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('loadCentribalChat injects CSS + JS only when enabled', async () => {
    mockEnv([{ Key: 'AV_CENTRIBAL_CHAT_ENABLED', Text: 'true' }]);
    const loadCSS = vi.fn().mockResolvedValue(undefined);
    const loadScript = vi.fn().mockResolvedValue(undefined);
    vi.doMock(aemPath, () => ({ loadCSS, loadScript }));
    const { loadCentribalChat } = await import(servicePath);

    await loadCentribalChat();

    expect(loadCSS).toHaveBeenCalledTimes(1);
    expect(loadScript).toHaveBeenCalledWith(
      'https://avianca-help.centribal.com/api/v1/recaptcha-jsx/',
      { nonce: 'aem' },
    );
  });

  it('loadCentribalChat injects nothing when disabled', async () => {
    mockEnv([{ Key: 'AV_CENTRIBAL_CHAT_ENABLED', Text: 'false' }]);
    const loadCSS = vi.fn().mockResolvedValue(undefined);
    const loadScript = vi.fn().mockResolvedValue(undefined);
    vi.doMock(aemPath, () => ({ loadCSS, loadScript }));
    const { loadCentribalChat } = await import(servicePath);

    await loadCentribalChat();

    expect(loadCSS).not.toHaveBeenCalled();
    expect(loadScript).not.toHaveBeenCalled();
  });

  it('loadCentribalChat is idempotent (injects at most once)', async () => {
    mockEnv([{ Key: 'AV_CENTRIBAL_CHAT_ENABLED', Text: 'true' }]);
    const loadCSS = vi.fn().mockResolvedValue(undefined);
    const loadScript = vi.fn().mockResolvedValue(undefined);
    vi.doMock(aemPath, () => ({ loadCSS, loadScript }));
    const { loadCentribalChat } = await import(servicePath);

    await loadCentribalChat();
    await loadCentribalChat();

    expect(loadScript).toHaveBeenCalledTimes(1);
  });
});
