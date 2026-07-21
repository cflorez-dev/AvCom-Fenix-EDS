// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach,
} from 'vitest';

import {
  getPoscodeParam,
  syncPoscodeInUrl,
  syncPoscodeInAddressBar,
} from '../../scripts/utils/poscode-url.helper.js';

/**
 * Regression tests for the "?poscode= reverts a manual POS change" bug.
 *
 * `resolvePOSFromURL()` is Level 1 of the POS hierarchy and runs on every page
 * load, so a `poscode` left over from an external system's deep-link wins over
 * the cookie the user just wrote from the header POS form. Changing POS on
 * `/es/?poscode=do` reloads the same path, the param survives, and the old POS
 * is written back — the header snaps back to the previous country.
 *
 * The param must stay in the URL (external systems rely on it) but has to be
 * rewritten to whatever POS is now in effect.
 */
describe('poscode-url.helper', () => {
  const BASE = 'https://www.avianca.com/es/?poscode=do';

  beforeEach(() => {
    window.history.replaceState({}, '', '/es/?poscode=do');
  });

  describe('getPoscodeParam', () => {
    it('reads the param from a query string', () => {
      expect(getPoscodeParam('?poscode=do')).toBe('do');
    });

    it('returns null when absent or empty', () => {
      expect(getPoscodeParam('?utm_source=x')).toBeNull();
      expect(getPoscodeParam('?poscode=')).toBeNull();
      expect(getPoscodeParam('')).toBeNull();
    });

    it('defaults to window.location.search', () => {
      expect(getPoscodeParam()).toBe('do');
    });
  });

  describe('syncPoscodeInUrl', () => {
    it('updates the param when the POS changes on the same path', () => {
      expect(syncPoscodeInUrl('/es/', 'co', { currentUrl: BASE })).toBe('/es/?poscode=co');
    });

    it('carries the updated param across a language change', () => {
      expect(syncPoscodeInUrl('/en/', 'co', { currentUrl: BASE })).toBe('/en/?poscode=co');
    });

    it('preserves other query params and the hash on the target URL', () => {
      const target = '/es/vuelos?utm_source=partner#deals';
      expect(syncPoscodeInUrl(target, 'co', { currentUrl: BASE }))
        .toBe('/es/vuelos?utm_source=partner&poscode=co#deals');
    });

    it('mirrors the casing the incoming URL used', () => {
      const upper = 'https://www.avianca.com/es/?poscode=DO';
      expect(syncPoscodeInUrl('/es/', 'co', { currentUrl: upper })).toBe('/es/?poscode=CO');
    });

    it('does NOT add the param when the current URL has none', () => {
      const clean = 'https://www.avianca.com/es/';
      expect(syncPoscodeInUrl('/en/', 'co', { currentUrl: clean })).toBe('/en/');
    });

    it('adds the param when addIfMissing is set', () => {
      const clean = 'https://www.avianca.com/es/';
      expect(syncPoscodeInUrl('/en/', 'co', { currentUrl: clean, addIfMissing: true }))
        .toBe('/en/?poscode=co');
    });

    it('leaves the URL untouched without a POS code', () => {
      expect(syncPoscodeInUrl('/es/', '', { currentUrl: BASE })).toBe('/es/');
    });

    it('keeps cross-origin targets absolute', () => {
      const target = 'https://booking.avianca.com/es/';
      expect(syncPoscodeInUrl(target, 'co', { currentUrl: BASE }))
        .toBe('https://booking.avianca.com/es/?poscode=co');
    });
  });

  describe('syncPoscodeInAddressBar', () => {
    it('rewrites the address bar in place before a reload', () => {
      expect(syncPoscodeInAddressBar('co')).toBe(true);
      expect(window.location.search).toBe('?poscode=co');
      expect(window.location.pathname).toBe('/es/');
    });

    it('is a no-op when the param is already correct', () => {
      expect(syncPoscodeInAddressBar('do')).toBe(false);
      expect(window.location.search).toBe('?poscode=do');
    });

    it('is a no-op when the URL carries no poscode', () => {
      window.history.replaceState({}, '', '/es/');
      expect(syncPoscodeInAddressBar('co')).toBe(false);
      expect(window.location.search).toBe('');
    });
  });
});
