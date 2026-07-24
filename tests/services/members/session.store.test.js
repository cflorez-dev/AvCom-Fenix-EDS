import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';

const storePath = '../../../scripts/services/members/session.store.js';

describe('members/session.store', () => {
  beforeEach(() => {
    // Fresh module so the signal resets between tests (frozen contract).
    vi.resetModules();
  });

  it('initial state is anonymous (frozen contract)', async () => {
    const { getSession } = await import(storePath);
    expect(getSession()).toEqual({ status: 'anonymous', user: null, error: null });
  });

  it('setSession merges a partial state without dropping other keys', async () => {
    const { getSession, setSession } = await import(storePath);
    setSession({ status: 'authenticated' });
    expect(getSession().status).toBe('authenticated');
    expect(getSession().user).toBeNull();
    expect(getSession().error).toBeNull();
  });
});
