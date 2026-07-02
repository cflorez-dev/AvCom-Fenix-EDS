import { describe, it, expect } from 'vitest';
import { resolveActiveStep } from '../../design-system/molecules/date-range-picker/date-range-picker.js';

// Regression coverage for the RT → OW break:
// In round-trip the modal auto-advances to the 'return' sub-step after the
// departure date is picked. Switching the trip-type toggle to One Way collapses
// `mode` to 'single', which unmounts the return DateSelector. If the resolved
// step stayed 'return', NO selector would be open, leaving the mobile date modal
// blank while BookingBox still marks the dates step active (header hidden but its
// layout slot reserved → big white gap). The fix coerces 'return' → 'departure'.
describe('resolveActiveStep', () => {
  it('coerces a lingering "return" step to "departure" when mode is single (RT → OW bug)', () => {
    // departureDate already chosen, modal had auto-advanced to return, then OW toggled
    expect(resolveActiveStep('single', 'return', 'return')).toBe('departure');
    // even if BookingBox still passes 'return' but internal step is unset
    expect(resolveActiveStep('single', 'return', null)).toBe('departure');
  });

  it('keeps "return" open while still in range (round-trip) mode', () => {
    expect(resolveActiveStep('range', 'return', 'return')).toBe('return');
    expect(resolveActiveStep('range', 'departure', 'return')).toBe('return');
  });

  it('prefers the internal sub-step over the prop when set', () => {
    expect(resolveActiveStep('range', 'departure', 'return')).toBe('return');
    expect(resolveActiveStep('single', 'departure', null)).toBe('departure');
  });

  it('returns null when the dates step is closed (prop is null), regardless of mode', () => {
    expect(resolveActiveStep('range', null, 'return')).toBeNull();
    expect(resolveActiveStep('single', null, 'return')).toBeNull();
  });

  it('leaves a "departure" step untouched in single mode', () => {
    expect(resolveActiveStep('single', 'departure', 'departure')).toBe('departure');
  });
});
