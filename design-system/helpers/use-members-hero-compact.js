import { useState, useEffect } from '@dropins/tools/preact-hooks.js';

/**
 * Hook: layout compacto del HeroHeader Members (Figma 111:10075).
 *
 * Activa el modo compact ≤319px → balance card vertical + "Ver perfil" en su
 * propia fila debajo del status. El breakpoint 320px coincide con el ancho de
 * la frame mobile chica del Figma.
 *
 * Mismo idiom que `useLoginButtonVariation`: lectura síncrona en SSR-safe +
 * listener `resize` con cleanup.
 *
 * @returns {boolean} true si el viewport es ≤319px (mobile chico).
 */
export function useMembersHeroCompact() {
  const compute = () => (typeof window !== 'undefined' ? window.innerWidth <= 319 : false);
  const [isCompact, setCompact] = useState(compute);

  useEffect(() => {
    const onResize = () => {
      const next = compute();
      setCompact((prev) => (prev !== next ? next : prev));
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isCompact;
}

export default useMembersHeroCompact;
