import { describe, it, expect } from 'vitest';
import { isBookingBoxCabinEnabled } from '../../../scripts/services/cabin/cabin-options.service.js';

describe('isBookingBoxCabinEnabled', () => {
  it('returns true when key is exactly "true"', () => {
    const env = [{ Key: 'AV_BOOKINGBOX_CABIN_ENABLED', Text: 'true' }];
    expect(isBookingBoxCabinEnabled(env)).toBe(true);
  });

  it('trims key and value before comparing', () => {
    const env = [{ Key: ' AV_BOOKINGBOX_CABIN_ENABLED ', Text: ' true ' }];
    expect(isBookingBoxCabinEnabled(env)).toBe(true);
  });

  it('returns false when key is absent (fail-safe)', () => {
    expect(isBookingBoxCabinEnabled([{ Key: 'OTHER', Text: 'true' }])).toBe(false);
  });

  it('returns false when value is not exactly "true"', () => {
    expect(isBookingBoxCabinEnabled([{ Key: 'AV_BOOKINGBOX_CABIN_ENABLED', Text: 'false' }])).toBe(false);
    expect(isBookingBoxCabinEnabled([{ Key: 'AV_BOOKINGBOX_CABIN_ENABLED', Text: 'TRUE' }])).toBe(false);
    expect(isBookingBoxCabinEnabled([{ Key: 'AV_BOOKINGBOX_CABIN_ENABLED', Text: '1' }])).toBe(false);
  });

  it('returns false for undefined / non-array input (fail-safe)', () => {
    expect(isBookingBoxCabinEnabled(undefined)).toBe(false);
    expect(isBookingBoxCabinEnabled(null)).toBe(false);
    expect(isBookingBoxCabinEnabled({})).toBe(false);
  });
});
