import { useState, useEffect } from '@dropins/tools/preact-hooks.js';

/**
 * Decide la variante responsive del botón de Members en el header según el ancho,
 * siguiendo los breakpoints de Figma (14:31462 logueado / 9:16935 anónimo):
 *
 *   ≤767px        → chip   (iniciales / icono persona)
 *   768–1023px    → full   (nombre / "Iniciar sesión")
 *   1024–1149px   → chip   (vuelve a chip: entra el nav y no hay espacio)
 *   ≥1150px       → full
 *
 * IMPORTANTE: Usamos `matchMedia` (no `window.innerWidth`) para que la decisión
 * coincida EXACTAMENTE con las media queries CSS (`min-[1150px]:` en Tailwind,
 * `(max-width: 1023.98px)` en header.js).
 *
 * En Windows con DPR fraccional (1.25× / 1.5× — común en laptops) y/o con
 * scrollbars clásicos no-overlay, `window.innerWidth` redondea distinto al
 * valor que usa el motor de media queries → off-by-one visible: el JS cambia
 * a 1148/1149 mientras el CSS lo hace a 1149/1150. `matchMedia` usa el mismo
 * motor que las media queries CSS y elimina el desfase.
 *
 * Usamos el sufijo `.98` (patrón Bootstrap) en los `max-width` para evitar
 * ambigüedad en el valor límite exacto (ej.: 1023.98px < 1024px < 1150px).
 */

// Queries memoizadas — se construyen una sola vez por módulo.
// `null` en SSR / entornos sin `matchMedia`.
const MQ_CHIP_SMALL = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(max-width: 767.98px)')
  : null;
const MQ_CHIP_LARGE = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(min-width: 1024px) and (max-width: 1149.98px)')
  : null;

/**
 * @returns {('full-button'|'chip')}
 */
export const computeLoginButtonVariation = () => {
  if (!MQ_CHIP_SMALL || !MQ_CHIP_LARGE) return 'full-button';
  if (MQ_CHIP_SMALL.matches || MQ_CHIP_LARGE.matches) return 'chip';
  return 'full-button';
};

/**
 * Hook: variante actual del LoginButton, reactiva a cambios de breakpoint.
 * Escucha las MediaQueryList directamente (más barato y preciso que `resize`).
 */
export function useLoginButtonVariation() {
  const [variation, setVariation] = useState(computeLoginButtonVariation);

  useEffect(() => {
    if (!MQ_CHIP_SMALL || !MQ_CHIP_LARGE) return undefined;
    const update = () => {
      const next = computeLoginButtonVariation();
      setVariation((prev) => (prev !== next ? next : prev));
    };
    MQ_CHIP_SMALL.addEventListener('change', update);
    MQ_CHIP_LARGE.addEventListener('change', update);
    return () => {
      MQ_CHIP_SMALL.removeEventListener('change', update);
      MQ_CHIP_LARGE.removeEventListener('change', update);
    };
  }, []);

  return variation;
}

export default useLoginButtonVariation;
