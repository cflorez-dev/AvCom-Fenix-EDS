import { describe, it, expect } from 'vitest';
import { isDarksiteStyleActive } from '../../../scripts/services/darksite/darksite-detail.js';

// isDarksiteStyleActive decide si una página debe aplicar el ESTILO darksite
// (multitab estirado, indicador oscuro, etc.). Debe ser true SOLO cuando el
// evento está activo (state.enabled) Y la ruta cuelga del root de detail pages.
// Root NO quemado: llega como argumento (viene de readDetailPagesRoot()/env).
describe('isDarksiteStyleActive', () => {
  const state = { enabled: true };

  it('is true on a darksite detail route when the event is enabled', () => {
    expect(isDarksiteStyleActive('/darksite/es/flight-info', '/darksite/', state)).toBe(true);
  });

  it('is false on a NORMAL page even when the event is enabled (no leak)', () => {
    expect(isDarksiteStyleActive('/es/andrea/entrega-29-de-mayo', '/darksite/', state)).toBe(false);
  });

  it('is false on a darksite route when the event is NOT enabled', () => {
    expect(isDarksiteStyleActive('/darksite/es/flight-info', '/darksite/', { enabled: false })).toBe(false);
  });

  it('is false when state is null/undefined', () => {
    expect(isDarksiteStyleActive('/darksite/es/x', '/darksite/', null)).toBe(false);
    expect(isDarksiteStyleActive('/darksite/es/x', '/darksite/', undefined)).toBe(false);
  });

  it('honors a non-default root from environment (not hardcoded to /darksite/)', () => {
    // Con root reapuntado a /contingencia/, una ruta /contingencia/** aplica...
    expect(isDarksiteStyleActive('/contingencia/es/x', '/contingencia/', state)).toBe(true);
    // ...y la vieja /darksite/** ya NO aplica (prueba de que no está quemado).
    expect(isDarksiteStyleActive('/darksite/es/x', '/contingencia/', state)).toBe(false);
  });

  it('does not match a sibling prefix (tree-safe)', () => {
    expect(isDarksiteStyleActive('/darksite-promociones/es/x', '/darksite/', state)).toBe(false);
  });
});
