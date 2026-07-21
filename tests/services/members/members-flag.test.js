// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const aemDataPath = '../../../scripts/utils/aem-data.js';
const servicePath = '../../../scripts/services/members/members-flag.js';

const mockEnv = (rows) => {
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: rows }),
  }));
};

const setSearch = (search) => {
  window.history.replaceState({}, '', `/${search}`);
};

describe('members feature flag (AV_MEMBERS_ENABLED)', () => {
  beforeEach(() => {
    vi.resetModules();
    setSearch('');
  });

  afterEach(() => {
    vi.doUnmock(aemDataPath);
    vi.restoreAllMocks();
  });

  it('is enabled when AV_MEMBERS_ENABLED is exactly "true"', async () => {
    mockEnv([{ Key: 'AV_MEMBERS_ENABLED', Text: 'true' }]);
    const { isMembersEnabled } = await import(servicePath);
    expect(await isMembersEnabled()).toBe(true);
  });

  it('DEFAULT OFF: disabled when the key is absent', async () => {
    mockEnv([{ Key: 'AV_OTHER', Text: 'true' }]);
    const { isMembersEnabled } = await import(servicePath);
    expect(await isMembersEnabled()).toBe(false);
  });

  it('DEFAULT OFF: disabled when environment.json is empty', async () => {
    mockEnv([]);
    const { isMembersEnabled } = await import(servicePath);
    expect(await isMembersEnabled()).toBe(false);
  });

  it('fail-safe: only exact "true" enables (not "TRUE"/"1"/"false")', async () => {
    const cases = ['TRUE', '1', 'false', 'yes', ''];
    // eslint-disable-next-line no-restricted-syntax
    for (const text of cases) {
      vi.resetModules();
      vi.doUnmock(aemDataPath);
      mockEnv([{ Key: 'AV_MEMBERS_ENABLED', Text: text }]);
      // eslint-disable-next-line no-await-in-loop
      const { isMembersEnabled } = await import(servicePath);
      // eslint-disable-next-line no-await-in-loop
      expect(await isMembersEnabled()).toBe(false);
    }
  });

  it('trims whitespace around Key and Text', async () => {
    mockEnv([{ Key: '  AV_MEMBERS_ENABLED  ', Text: '  true  ' }]);
    const { isMembersEnabled } = await import(servicePath);
    expect(await isMembersEnabled()).toBe(true);
  });

  it('?members=off overrides an enabled flag (without reading config)', async () => {
    setSearch('?members=off');
    const fetchSpy = vi.fn().mockResolvedValue({
      data: [{ Key: 'AV_MEMBERS_ENABLED', Text: 'true' }],
    });
    vi.doMock(aemDataPath, () => ({ fetchAEMData: fetchSpy }));
    const { isMembersEnabled } = await import(servicePath);
    expect(await isMembersEnabled()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('?members=on overrides a disabled flag (without reading config)', async () => {
    setSearch('?members=on');
    const fetchSpy = vi.fn().mockResolvedValue({ data: [] });
    vi.doMock(aemDataPath, () => ({ fetchAEMData: fetchSpy }));
    const { isMembersEnabled } = await import(servicePath);
    expect(await isMembersEnabled()).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('caches the result: second call does not re-read environment', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      data: [{ Key: 'AV_MEMBERS_ENABLED', Text: 'true' }],
    });
    vi.doMock(aemDataPath, () => ({ fetchAEMData: fetchSpy }));
    const { isMembersEnabled } = await import(servicePath);
    await isMembersEnabled();
    await isMembersEnabled();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('resetMembersFlagCache forces a re-read', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      data: [{ Key: 'AV_MEMBERS_ENABLED', Text: 'true' }],
    });
    vi.doMock(aemDataPath, () => ({ fetchAEMData: fetchSpy }));
    const { isMembersEnabled, resetMembersFlagCache } = await import(servicePath);
    await isMembersEnabled();
    resetMembersFlagCache();
    await isMembersEnabled();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
