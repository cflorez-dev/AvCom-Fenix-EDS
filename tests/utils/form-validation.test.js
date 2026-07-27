import { describe, it, expect } from 'vitest';
import {
  validateField,
  fieldProps,
} from '../../design-system/helpers/form-validation.js';

describe('form-validation · validateField', () => {
  it('required: vacío/whitespace → error required; con valor → válido', () => {
    expect(validateField('', { required: true })).toEqual({ valid: false, error: 'required' });
    expect(validateField('   ', { required: true })).toEqual({ valid: false, error: 'required' });
    expect(validateField(null, { required: true })).toEqual({ valid: false, error: 'required' });
    expect(validateField('x', { required: true })).toEqual({ valid: true, error: null });
  });

  it('minLength / maxLength solo aplican con valor presente', () => {
    expect(validateField('ab', { minLength: 3 })).toEqual({ valid: false, error: 'minLength' });
    expect(validateField('abc', { minLength: 3 })).toEqual({ valid: true, error: null });
    expect(validateField('abcd', { maxLength: 3 })).toEqual({ valid: false, error: 'maxLength' });
    // vacío no dispara min/max (eso es responsabilidad de `required`)
    expect(validateField('', { minLength: 3 })).toEqual({ valid: true, error: null });
  });

  it('pattern: valida contra la regex provista', () => {
    expect(validateField('AV12345', { pattern: '^[A-Z0-9]+$' })).toEqual({ valid: true, error: null });
    expect(validateField('av-123', { pattern: '^[A-Z0-9]+$' })).toEqual({ valid: false, error: 'pattern' });
  });

  it('email: formato básico', () => {
    expect(validateField('a@b.com', { email: true })).toEqual({ valid: true, error: null });
    expect(validateField('nope', { email: true })).toEqual({ valid: false, error: 'email' });
  });

  it('prioridad: required antes que las demás reglas', () => {
    expect(validateField('', { required: true, minLength: 3 })).toEqual({ valid: false, error: 'required' });
  });
});

describe('form-validation · fieldProps', () => {
  it('válido → state normal + helper vacío', () => {
    expect(fieldProps({ valid: true, error: null })).toEqual({ state: 'normal', helperText: '' });
  });

  it('inválido → state error + mensaje por key', () => {
    expect(fieldProps({ valid: false, error: 'required' }, { required: 'Campo obligatorio' }))
      .toEqual({ state: 'error', helperText: 'Campo obligatorio' });
  });

  it('inválido sin mensaje específico → cae a default', () => {
    expect(fieldProps({ valid: false, error: 'pattern' }, { default: 'Pendiente por completar' }))
      .toEqual({ state: 'error', helperText: 'Pendiente por completar' });
  });

  it('inválido sin mensajes → helper vacío (no rompe)', () => {
    expect(fieldProps({ valid: false, error: 'email' })).toEqual({ state: 'error', helperText: '' });
  });
});
