import { describe, it, expect } from 'vitest';
import {
  savePassword, savePin, saveVerificationMethod,
} from '../../../scripts/services/members/account-security.service.js';

/**
 * account-security.service (1279363 · Paso 4): escrituras MOCK optimistic de
 * seguridad (contraseña / PIN / método de verificación). Verifica el éxito mock,
 * el kill-switch `enabled:false` y el shape mínimo. Latencia 0 en tests.
 * PII: las funciones NO persisten nada fuera del retorno.
 */

const OPTS = { latencyMs: 0 };

describe('account-security · savePassword', () => {
  it('current + next → { ok:true, mock:true }', async () => {
    const res = await savePassword({ current: 'old-pass', next: 'new-pass-1' }, OPTS);
    expect(res).toEqual({ ok: true, mock: true });
  });
  it('falta current o next → invalid', async () => {
    expect((await savePassword({ next: 'x' }, OPTS)).reason).toBe('invalid');
    expect((await savePassword({ current: 'x' }, OPTS)).reason).toBe('invalid');
    expect((await savePassword({}, OPTS)).reason).toBe('invalid');
  });
  it('enabled:false → disabled', async () => {
    expect(await savePassword({ current: 'a', next: 'b' }, { enabled: false }))
      .toEqual({ ok: false, reason: 'disabled' });
  });
});

describe('account-security · savePin', () => {
  it('pin → { ok:true, mock:true, hasPin:true }', async () => {
    const res = await savePin({ pin: '1234' }, OPTS);
    expect(res).toEqual({ ok: true, mock: true, hasPin: true });
  });
  it('sin pin → invalid; enabled:false → disabled', async () => {
    expect((await savePin({}, OPTS)).reason).toBe('invalid');
    expect((await savePin({ pin: '1234' }, { enabled: false })).reason).toBe('disabled');
  });
});

describe('account-security · saveVerificationMethod', () => {
  it('method → { ok:true, mock:true, method }', async () => {
    const res = await saveVerificationMethod({ method: 'sms' }, OPTS);
    expect(res).toEqual({ ok: true, mock: true, method: 'sms' });
  });
  it('sin method → invalid; enabled:false → disabled', async () => {
    expect((await saveVerificationMethod({}, OPTS)).reason).toBe('invalid');
    expect((await saveVerificationMethod({ method: 'email' }, { enabled: false })).reason).toBe('disabled');
  });
});
