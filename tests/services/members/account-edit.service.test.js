import { describe, it, expect } from 'vitest';
import {
  updatePersonal, updateContact, updateEmergency, saveDocument,
} from '../../../scripts/services/members/account-edit.service.js';

/**
 * account-edit.service (1279361 · Paso 4): edición MOCK optimistic. Verifica que
 * actualiza el VM, marca `mock:true`, respeta el kill-switch `enabled:false` y
 * cumple máx 1 documento por tipo (R2). Latencia 0 en tests.
 */

const OPTS = { latencyMs: 0 };

const baseVm = () => ({
  personal: {
    gender: 'F', givenName: 'Ana', familyName: 'García', fullName: 'Ana García', city: 'Bogotá', country: '', addressLine: '',
  },
  contact: {
    email: 'a@b.com', prefix: '57', phone: '3001234567', hadValue: { email: true, prefix: true, phone: true },
  },
  emergency: { name: '', prefix: '', phone: '' },
  documents: [{
    type: 'I', number: '111', nationality: '7710', expiry: null,
  }],
});

describe('account-edit · updatePersonal', () => {
  it('mergea changes + marca mock; no muta el VM original', async () => {
    const vm = baseVm();
    const res = await updatePersonal(vm, { city: 'Medellín', country: 'col' }, OPTS);
    expect(res.ok).toBe(true);
    expect(res.mock).toBe(true);
    expect(res.vm.personal.city).toBe('Medellín');
    expect(res.vm.personal.country).toBe('col');
    expect(vm.personal.city).toBe('Bogotá'); // original intacto
  });

  it('enabled:false → { ok:false, reason:disabled }', async () => {
    const res = await updatePersonal(baseVm(), { city: 'X' }, { enabled: false });
    expect(res).toEqual({ ok: false, reason: 'disabled' });
  });
});

describe('account-edit · updateContact / updateEmergency', () => {
  it('updateContact mergea email/prefijo/teléfono', async () => {
    const res = await updateContact(baseVm(), { email: 'nuevo@x.com', phone: '3110000000' }, OPTS);
    expect(res.ok).toBe(true);
    expect(res.vm.contact.email).toBe('nuevo@x.com');
    expect(res.vm.contact.phone).toBe('3110000000');
    expect(res.vm.contact.prefix).toBe('57');
  });

  it('updateEmergency setea nombre (D33) + prefijo + teléfono', async () => {
    const res = await updateEmergency(baseVm(), { name: 'Pedro García', prefix: '57', phone: '3009998877' }, OPTS);
    expect(res.ok).toBe(true);
    expect(res.vm.emergency).toEqual({ name: 'Pedro García', prefix: '57', phone: '3009998877' });
  });

  it('enabled:false en cualquier módulo → disabled', async () => {
    expect((await updateContact(baseVm(), {}, { enabled: false })).reason).toBe('disabled');
    expect((await updateEmergency(baseVm(), {}, { enabled: false })).reason).toBe('disabled');
  });
});

describe('account-edit · saveDocument (máx 1 por tipo, R2)', () => {
  it('agrega un pasaporte nuevo → 2 docs, ordenados P → I', async () => {
    const res = await saveDocument(baseVm(), {
      type: 'P', number: 'AV999', nationality: '7710', expiry: '20-Aug-2030',
    }, OPTS);
    expect(res.ok).toBe(true);
    expect(res.vm.documents.map((d) => d.type)).toEqual(['P', 'I']);
    expect(res.vm.documents[0].number).toBe('AV999');
  });

  it('editar el documento existente (mismo tipo) → REEMPLAZA, no duplica', async () => {
    const res = await saveDocument(baseVm(), { type: 'I', number: '222', nationality: 'col' }, OPTS);
    expect(res.ok).toBe(true);
    expect(res.vm.documents).toHaveLength(1);
    expect(res.vm.documents[0].number).toBe('222');
  });

  it('sin type → invalid; enabled:false → disabled', async () => {
    expect((await saveDocument(baseVm(), { number: 'x' }, OPTS)).reason).toBe('invalid');
    expect((await saveDocument(baseVm(), { type: 'P' }, { enabled: false })).reason).toBe('disabled');
  });
});
