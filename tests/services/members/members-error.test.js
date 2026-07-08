import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import {
  classifyMembersError, getRetries, incRetries, resetRetries,
} from '../../../scripts/services/members/members-error.js';

describe('members/members-error classifyMembersError', () => {
  it('HTTP 400 → http_400', () => {
    expect(classifyMembersError({ status: 400 })).toBe('http_400');
  });

  it('HTTP 500 → http_500', () => {
    expect(classifyMembersError({ status: 500 })).toBe('http_500');
  });

  it('PD007 → pd007 (string o code)', () => {
    expect(classifyMembersError('PD007 member Id invalid format')).toBe('pd007');
    expect(classifyMembersError({ code: 'pd007' })).toBe('pd007');
  });

  it('invalid_grant "Session not active" → invalid_grant_session', () => {
    expect(classifyMembersError({ code: 'invalid_grant: Session not active' }))
      .toBe('invalid_grant_session');
  });

  it('invalid_grant "Code not valid" → invalid_grant_code (muestra modal, ya no silencioso)', () => {
    expect(classifyMembersError('invalid_grant — Code not valid')).toBe('invalid_grant_code');
  });

  it('state mismatch → state_mismatch (muestra modal, ya no silencioso)', () => {
    expect(classifyMembersError('State mismatch detected')).toBe('state_mismatch');
  });

  it('redirect_uri no registrada → redirect_uri', () => {
    expect(classifyMembersError('redirect_uri not registered')).toBe('redirect_uri');
  });

  it('E.EON.* desde la callback → connection-error', () => {
    expect(classifyMembersError('E.EON.6')).toBe('connection-error');
    expect(classifyMembersError({ code: 'E.EON.exception' })).toBe('connection-error');
  });

  it('input vacío o no reconocido → null (sin modal)', () => {
    expect(classifyMembersError()).toBeNull();
    expect(classifyMembersError({})).toBeNull();
    expect(classifyMembersError('algo random')).toBeNull();
  });

  it('HTTP gana sobre el code cuando ambos vienen', () => {
    expect(classifyMembersError({ status: 500, code: 'pd007' })).toBe('http_500');
  });
});

describe('members/members-error retry counter (localStorage)', () => {
  beforeEach(() => {
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    });
  });

  it('empieza en 0, incrementa y resetea', () => {
    expect(getRetries()).toBe(0);
    incRetries();
    incRetries();
    expect(getRetries()).toBe(2);
    resetRetries();
    expect(getRetries()).toBe(0);
  });

  it('degradación segura si localStorage lanza (modo privado) → 0, sin romper', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    });
    expect(getRetries()).toBe(0);
    expect(() => incRetries()).not.toThrow();
    expect(() => resetRetries()).not.toThrow();
  });
});
