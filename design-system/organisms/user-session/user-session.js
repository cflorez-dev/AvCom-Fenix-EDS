import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import htm from 'htm';
import { session as sessionStore } from '../../../scripts/services/members/session.store.js';
import { Anonymous } from './states/anonymous.js';
import { Authenticated } from './states/authenticated.js';

const html = htm.bind(h);

/**
 * UserSession - Members session organism (state-driven).
 *
 * El store usa signals-core (`@dropins/tools/signals.js`) SIN la integración
 * `@preact/signals`, así que leer `.value` en el render NO auto-suscribe el
 * componente. Nos suscribimos manualmente: `subscribe()` dispara de inmediato con
 * el valor actual y en cada cambio (login-success / logout) → `setState`
 * re-renderiza. Ese comportamiento reactivo lo consumen 1255338/1255601.
 *
 * Este PBI (1255303) solo implementa el estado `anonymous` (botón sign-in).
 *
 * ## Props
 * - `user`: Object - config del botón de usuario (label, icon) provista por el bloque.
 */
export const UserSession = ({ user }) => {
  const [session, setSessionState] = useState(() => sessionStore.value);
  // subscribe() devuelve la función de baja, que useEffect usa como cleanup.
  useEffect(() => sessionStore.subscribe(setSessionState), []);

  // expired se trata como anonymous a nivel render: botón "Iniciar sesión" en vez de
  // header en blanco (el modal CMS-driven de expiración es 1255601, no acá).
  if (session.status === 'anonymous' || session.status === 'expired') {
    return html`<${Anonymous} label=${user?.label} icon=${user?.icon} />`;
  }

  if (session.status === 'authenticated') {
    // 1255338: nombre + apellido (el VM lo puebla session.service)
    return html`<${Authenticated} user=${session.user} />`;
  }

  // error → 1255601
  return null;
};

export default UserSession;
