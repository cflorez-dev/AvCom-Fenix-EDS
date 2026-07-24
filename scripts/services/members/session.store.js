import { signal } from '@dropins/tools/signals.js';

/**
 * Estado de sesión Members (FROZEN contract — store inicial congelado en Etapa 0).
 * La lógica de checkSession/cookie es de 1255354, NO se implementa acá.
 * @typedef {'anonymous'|'authenticated'|'expired'|'error'} SessionStatus
 */
export const session = signal({ status: 'anonymous', user: null, error: null });

/** Lectura síncrona del estado actual (NO es un servicio, es RAM). */
export const getSession = () => session.value;

/** Setter interno — lo usará 1255354. Acá solo para transiciones del login. */
export const setSession = (next) => {
  session.value = { ...session.value, ...next };
};
